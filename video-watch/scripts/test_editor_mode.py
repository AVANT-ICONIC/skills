import datetime as dt
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import vw_editor as ed  # noqa: E402
import vw_whisper as ww  # noqa: E402

SCRIPT = HERE / 'video_watch.py'


def make_cut_video(path: Path):
    """4s clip: 2s red, 2s blue, with a tone, so there is exactly one hard cut at 2s."""
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                    '-f', 'lavfi', '-i', 'color=c=red:s=160x120:r=10:d=2',
                    '-f', 'lavfi', '-i', 'color=c=blue:s=160x120:r=10:d=2',
                    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
                    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]', '-map', '[v]', '-map', '2:a',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', str(path)], check=True)


class PacingTests(unittest.TestCase):
    def test_basic_metrics(self):
        r = ed.compute_pacing([5.0, 13.0, 25.0, 35.0, 50.0], 60.0)
        self.assertEqual(r['shot_count'], 6)
        self.assertEqual(r['cuts_per_minute'], 5.0)
        self.assertEqual(r['mean_shot_length'], 10.0)
        self.assertEqual(r['shots'][0], {'start_seconds': 0.0, 'duration_seconds': 5.0})
        self.assertEqual(r['shots'][-1], {'start_seconds': 50.0, 'duration_seconds': 10.0})

    def test_no_cuts_is_one_shot(self):
        r = ed.compute_pacing([], 120.0)
        self.assertEqual((r['shot_count'], r['cuts_per_minute'], r['mean_shot_length']), (1, 0.0, 120.0))

    def test_zero_duration(self):
        self.assertEqual(ed.compute_pacing([1.0], 0)['shot_count'], 0)

    def test_offset_focus_range(self):
        r = ed.compute_pacing([12.0, 99.0], 10.0, start=10.0)  # 99 is outside 10..20
        self.assertEqual(r['shot_count'], 2)
        self.assertEqual(r['shots'][0]['start_seconds'], 10.0)
        self.assertEqual(r['shots'][1]['duration_seconds'], 8.0)

    def test_detect_scene_times_finds_cut(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d) / 'v.mp4'
            make_cut_video(v)
            cuts = ed.detect_scene_times(v, 0.3)
            self.assertEqual(len(cuts), 1)
            self.assertAlmostEqual(cuts[0], 2.0, delta=0.25)
            self.assertAlmostEqual(ed.detect_scene_times(v, 0.3, offset=10)[0], cuts[0] + 10, places=2)


class FramePickTests(unittest.TestCase):
    def test_hero_prefers_scene_and_thins(self):
        frames = [{'path': f's{i}', 'timestamp_seconds': float(i), 'kind': 'scene'} for i in range(30)]
        frames += [{'path': 'c', 'timestamp_seconds': 1.5, 'kind': 'coverage'}]
        hero = ed.pick_hero_frames(frames, 5)
        self.assertEqual(len(hero), 5)
        self.assertTrue(all(f['kind'] == 'scene' for f in hero))
        self.assertEqual(hero, sorted(hero, key=lambda f: f['timestamp_seconds']))

    def test_hero_falls_back_without_scene(self):
        frames = [{'path': 'c', 'timestamp_seconds': 1.0, 'kind': 'coverage'}]
        self.assertEqual(ed.pick_hero_frames(frames), frames)


class WhisperTests(unittest.TestCase):
    def test_key_precedence_and_dotenv(self):
        with tempfile.TemporaryDirectory() as d:
            env = Path(d) / '.env'
            env.write_text('# c\nGROQ_API_KEY="gk"\nOPENAI_API_KEY=ok\n')
            with mock.patch.dict(os.environ, {}, clear=True):
                self.assertEqual(ww.load_api_key(dotenv_paths=[env]), ('groq', 'gk'))
                self.assertEqual(ww.load_api_key('openai', [env]), ('openai', 'ok'))
                self.assertEqual(ww.load_api_key(dotenv_paths=[Path(d) / 'missing']), (None, None))
            with mock.patch.dict(os.environ, {'OPENAI_API_KEY': ' envk '}, clear=True):
                self.assertEqual(ww.load_api_key(dotenv_paths=[]), ('openai', 'envk'))

    def test_segments_and_words(self):
        data = {'segments': [{'start': 0, 'end': 1.234, 'text': ' hi ', 'words': [{'word': 'hi', 'start': 0, 'end': 0.5}]},
                             {'start': 1, 'end': 2, 'text': '  '}],
                'words': [{'word': 'top', 'start': 0.1, 'end': 0.2}]}
        self.assertEqual(ww.segments_from_response(data), [{'start': 0.0, 'end': 1.23, 'text': 'hi'}])
        self.assertEqual([w['word'] for w in ww.words_from_response(data)], ['top', 'hi'])
        self.assertEqual(ww.segments_from_response({'text': 'whole'})[0]['text'], 'whole')
        self.assertEqual(ww.segments_from_response({}), [])

    def test_multipart_contains_fields_and_file(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / 'a.mp3'
            f.write_bytes(b'AUDIO')
            body, boundary = ww._build_multipart({'model': 'm', 'timestamp_granularities[]': 'word'}, f)
            self.assertIn(boundary.encode(), body)
            for needle in (b'name="model"', b'timestamp_granularities[]', b'filename="a.mp3"', b'AUDIO'):
                self.assertIn(needle, body)

    def test_transcribe_audio_routes_to_groq(self):
        resp = {'segments': [{'start': 0, 'end': 1, 'text': 'x'}], 'words': [{'word': 'x', 'start': 0, 'end': 1}]}
        with mock.patch.object(ww, '_post_whisper', return_value=resp) as post:
            segs, backend, words = ww.transcribe_audio(Path('a.mp3'), 'groq', 'k', word_timestamps=True)
        self.assertEqual((backend, len(segs), len(words)), ('groq', 1, 1))
        self.assertEqual(post.call_args[0][0], ww.GROQ_ENDPOINT)

    def test_transcribe_audio_without_backend_raises(self):
        with mock.patch.dict(os.environ, {}, clear=True), \
                mock.patch.object(ww, 'load_api_key', return_value=(None, None)), \
                mock.patch.object(ww, 'local_whisper_available', return_value=False):
            with self.assertRaises(ww.WhisperError):
                ww.transcribe_audio(Path('a.mp3'))

    def test_extract_audio_real(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d) / 'v.mp4'
            make_cut_video(v)
            out = ww.extract_audio(v, Path(d) / 'a.mp3', seconds=1)
            self.assertGreater(out.stat().st_size, 0)

    def test_extract_audio_without_track_raises(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d) / 'silent.mp4'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
                            'color=c=red:s=64x64:d=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(v)], check=True)
            with self.assertRaises(ww.WhisperError):
                ww.extract_audio(v, Path(d) / 'a.mp3')


class HookAndTranscribeTests(unittest.TestCase):
    def test_hook_words_skipped_without_key(self):
        with mock.patch.object(ww, 'load_api_key', return_value=(None, None)), \
                mock.patch.object(ww, 'local_whisper_available', return_value=False):
            r = ed.hook_words(Path('x.mp4'), Path('.'))
        self.assertFalse(r['ran'])
        self.assertIn('no Whisper key', r['note'])

    def test_local_whisper_is_opt_in(self):
        with mock.patch.object(ww, 'load_api_key', return_value=(None, None)), \
                mock.patch.object(ww, 'local_whisper_available', return_value=True):
            self.assertEqual(ed._resolve_backend(None, None, False), (None, None))
            self.assertEqual(ed._resolve_backend(None, None, True), ('local', None))
            self.assertEqual(ed.transcribe_full(Path('v.mp4'), Path('.'))[1:], (None, 'no captions and no Whisper key (GROQ_API_KEY / OPENAI_API_KEY)'))
        with mock.patch.object(ww, 'local_whisper_available', return_value=False):
            with self.assertRaises(ww.WhisperError):
                ww.transcribe_audio(Path('a.mp3'), 'local')

    def test_hook_words_offset_applied(self):
        words = [{'word': 'hey', 'start': 0.5, 'end': 0.9}]
        with tempfile.TemporaryDirectory() as d, \
                mock.patch.object(ww, 'extract_audio', return_value=Path(d) / 'a.mp3'), \
                mock.patch.object(ww, 'transcribe_audio', return_value=([], 'groq', words)):
            r = ed.hook_words(Path('x.mp4'), Path(d), offset=30.0, backend='groq', api_key='k')
        self.assertTrue(r['ran'])
        self.assertEqual(r['words'][0]['start'], 30.5)

    def test_hook_words_failure_is_not_fatal(self):
        with mock.patch.object(ww, 'extract_audio', side_effect=ww.WhisperError('boom')):
            r = ed.hook_words(Path('x.mp4'), Path('.'), backend='groq', api_key='k')
        self.assertFalse(r['ran'])
        self.assertIn('boom', r['note'])

    def test_transcribe_full_offsets_and_errors(self):
        segs = [{'start': 1.0, 'end': 2.0, 'text': 'a'}]
        with mock.patch.object(ww, 'extract_audio', return_value=Path('a.mp3')), \
                mock.patch.object(ww, 'transcribe_audio', return_value=(segs, 'openai', [])):
            out, backend, err = ed.transcribe_full(Path('v.mp4'), Path('.'), offset=10, backend='openai', api_key='k')
        self.assertEqual((out[0]['start'], backend, err), (11.0, 'openai', None))
        with mock.patch.object(ww, 'load_api_key', return_value=(None, None)), \
                mock.patch.object(ww, 'local_whisper_available', return_value=False):
            out, backend, err = ed.transcribe_full(Path('v.mp4'), Path('.'))
        self.assertEqual(out, [])
        self.assertIn('no captions', err)


class ReportTests(unittest.TestCase):
    def _report(self, tmp: Path, **over):
        frames = [{'timestamp_seconds': 0.0, 'path': str(tmp / 'f1.jpg'), 'kind': 'scene'},
                  {'timestamp_seconds': 65.0, 'path': str(tmp / 'f2.jpg'), 'kind': 'coverage'}]
        for f in frames:
            Path(f['path']).write_bytes(b'jpg')
        kw = dict(out_path=tmp / 'report.md', source='https://example.test/v', title='Test Video',
                  duration_seconds=125.0, intent='studying hooks',
                  transcript_segments=[{'start': 0, 'end': 2, 'text': 'Hello world.'}],
                  transcript_source='captions', all_frames=frames, hero_frames=frames[:1],
                  pacing={'shot_count': 6, 'cuts_per_minute': 2.88, 'mean_shot_length': 20.83,
                          'median_shot_length': 18.5, 'shots': []},
                  hook={'frame_count': 20, 'words': [{'word': 'Hello', 'start': 0.2, 'end': 0.5}], 'note': None},
                  watched_at=dt.datetime(2026, 1, 2, 3, 4, 5, tzinfo=dt.timezone.utc))
        kw.update(over)
        return ed.write_report(**kw), frames

    def test_sections_and_values(self):
        with tempfile.TemporaryDirectory() as d:
            out, _ = self._report(Path(d))
            t = out.read_text()
        self.assertTrue(t.startswith('---\n'))
        for h in ('# Test Video', '## TL;DR', '## Key moments', '## Hook microscope', '## Editorial profile',
                  '## Quotable moments', '## Entities mentioned', '## Concepts surfaced', '## Transcript',
                  '## All frames'):
            self.assertIn(h, t)
        for needle in ('intent: studying hooks', 'duration: 02:05', 'Cuts/min: 2.88', 'Hello world.',
                       '[  0.20s] Hello', 'pending agent fill', 'transcript_source: captions', 'hero_frames: [f1.jpg]'):
            self.assertIn(needle, t)

    def test_missing_pieces_are_stated(self):
        with tempfile.TemporaryDirectory() as d:
            out, _ = self._report(Path(d), transcript_segments=[], transcript_source=None,
                                  pacing={'shot_count': 0}, hook={'frame_count': 4, 'words': [], 'note': 'no key'})
            t = out.read_text()
        for needle in ('_No transcript available._', '_No pacing data._', 'not available (no key)', 'transcript_source: none'):
            self.assertIn(needle, t)

    def test_slug_and_export(self):
        self.assertEqual(ed.slugify('Hello, World! / 2026'), 'hello-world-2026')
        self.assertEqual(ed.slugify('???'), 'video')
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d) / 'work'
            tmp.mkdir()
            out, frames = self._report(tmp)
            dest = ed.export_report(out, Path(d) / 'vault', 'Test Video', frames[:1])
            t = dest.read_text()
            self.assertEqual(dest.parent.name, 'test-video')
            self.assertTrue((dest.parent / 'frames' / 'f1.jpg').exists())
            self.assertIn('frames/f1.jpg', t)
            self.assertNotIn(str(tmp / 'f1.jpg'), t)


class CliEditorTests(unittest.TestCase):
    def run_cli(self, *args, env_extra=None):
        env = {k: v for k, v in os.environ.items() if k not in ('GROQ_API_KEY', 'OPENAI_API_KEY')}
        env['HOME'] = tempfile.mkdtemp()  # no ~/.config/watch/.env
        # A fresh HOME hides a pip --user site (CI installs Pillow there); keep the parent's module path.
        env['PYTHONPATH'] = os.pathsep.join(p for p in sys.path if p)
        env.update(env_extra or {})
        return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=env, cwd=env['HOME'])

    def test_evidence_mode_is_unchanged(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d) / 'v.mp4'
            make_cut_video(v)
            p = self.run_cli(str(v), '--max-frames', '12')
            self.assertEqual(p.returncode, 0, p.stderr + p.stdout)
            r = json.loads(p.stdout)
            try:
                self.assertEqual(r['mode'], 'evidence')
                self.assertNotIn('report', r)
                self.assertFalse((Path(r['workdir']) / 'report.md').exists())
            finally:
                shutil.rmtree(r['workdir'])

    def test_editor_mode_end_to_end_without_keys(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d) / 'v.mp4'
            make_cut_video(v)
            export = Path(d) / 'vault'
            p = self.run_cli(str(v), '--mode', 'editor', '--intent', 'pacing check', '--max-frames', '12',
                             '--export-dir', str(export))
            self.assertEqual(p.returncode, 0, p.stderr + p.stdout)
            r = json.loads(p.stdout)
            try:
                self.assertEqual(r['mode'], 'editor')
                self.assertEqual(r['pacing']['shot_count'], 2)
                self.assertIsNone(r['transcript_source'])
                self.assertTrue(any('no transcript' in n for n in r['notes']))
                text = Path(r['report']).read_text()
                self.assertIn('intent: pacing check', text)
                self.assertIn('Cuts/min: 15.0', text)
                self.assertTrue(Path(r['exported_report']).exists())
                self.assertTrue(list((Path(r['exported_report']).parent / 'frames').glob('*.jpg')))
                self.assertTrue((Path(r['workdir']) / 'pacing.json').exists())
            finally:
                shutil.rmtree(r['workdir'])

    def test_editor_mode_uses_captions_and_focus(self):
        # Exercise caption path through run_editor_mode with a fake transcript file.
        spec = importlib.util.spec_from_file_location('vw_main', SCRIPT)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / 'transcript.txt').write_text('[00:01.000] Hello there\n[01:02:03.500] Late\n')
            segs = m._read_transcript_lines(Path(d) / 'transcript.txt')
            self.assertEqual([round(s['start'], 1) for s in segs], [1.0, 3723.5])
            self.assertEqual(segs[0]['text'], 'Hello there')
            self.assertEqual(m._read_transcript_lines(Path(d) / 'nope.txt'), [])
            n, out = m.write_segments([{'start': 1, 'end': 2, 'text': 'A'}, {'start': 9, 'end': 10, 'text': 'B'}],
                                      Path(d) / 'w.txt', 5, 12)
            self.assertEqual(n, 1)
            self.assertEqual(m.write_segments([], Path(d) / 'e.txt'), (0, None))

    def test_run_editor_mode_whisper_fallback(self):
        spec = importlib.util.spec_from_file_location('vw_main2', SCRIPT)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        with tempfile.TemporaryDirectory() as d:
            v = Path(d) / 'v.mp4'
            make_cut_video(v)
            work = Path(d) / 'w'
            work.mkdir()
            frame = work / 'f.jpg'
            frame.write_bytes(b'x')
            frames = [{'path': str(frame), 'timestamp_seconds': 0.0, 'kind': 'hook'}]
            args = mock.Mock(source=str(v), intent='q', transcribe='auto', export_dir=None)
            segs = [{'start': 1.0, 'end': 2.0, 'text': 'spoken'}]
            with mock.patch.object(m.vw_editor, 'transcribe_full', return_value=(segs, 'groq', None)), \
                    mock.patch.object(m.vw_editor, 'hook_words',
                                      return_value={'ran': False, 'words': [], 'backend': None, 'note': 'x'}):
                res = m.run_editor_mode(args, work, v, 0.0, 4.0, frames, {'title': 'T'}, v, caption_found=False)
            self.assertEqual(res['transcript_source'], 'whisper:groq')
            self.assertIn('spoken', Path(res['report']).read_text())
            args.transcribe = 'off'
            with mock.patch.object(m.vw_editor, 'transcribe_full') as tf, \
                    mock.patch.object(m.vw_editor, 'hook_words',
                                      return_value={'ran': False, 'words': [], 'backend': None, 'note': None}):
                res = m.run_editor_mode(args, work, v, 0.0, 4.0, frames, {'title': 'T'}, v, caption_found=False)
            tf.assert_not_called()
            self.assertIsNone(res['transcript_source'])


if __name__ == '__main__':
    unittest.main()
