import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('video_watch.py')
spec = importlib.util.spec_from_file_location('watch', SCRIPT)
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)

class UnitTests(unittest.TestCase):
    def test_time_formats(self):
        self.assertEqual(v.parse_time('02:15'), 135)
        self.assertEqual(v.parse_time('1:02:03.5'), 3723.5)
        with self.assertRaises(ValueError): v.parse_time('no')
    def test_budget_and_order(self):
        frames=[{'path':str(i), 'timestamp_seconds':float(i), 'kind':'coverage'} for i in range(120)]
        out=v.enforce_budget(frames,100)
        self.assertEqual(len(out),100)
        self.assertEqual(out,sorted(out,key=lambda x:x['timestamp_seconds']))
    def test_dedupe_prefers_scene(self):
        out=v.dedupe_by_time([{'path':'a','timestamp_seconds':1,'kind':'coverage'}, {'path':'b','timestamp_seconds':1.1,'kind':'scene'}])
        self.assertEqual([x['path'] for x in out],['b'])
    def test_caption_range(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'captions.vtt';p.write_text('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<b>Hello</b> &amp; world\n\n00:00:04.000 --> 00:00:05.000\nLater\n')
            n,out=v.write_transcript(p,Path(d)/'out.txt',3,6)
            self.assertEqual(n,1);self.assertIn('Later',Path(out).read_text());self.assertNotIn('Hello',Path(out).read_text())
    def test_invalid_budget(self):
        p=subprocess.run([sys.executable,str(SCRIPT),'missing.mp4','--max-frames','0'],capture_output=True,text=True)
        self.assertEqual(p.returncode,2);self.assertIn('must be positive',p.stderr)
    def test_hook_timestamps_from_source(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);src=root/'source.mp4'
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=160x120:rate=12','-t','4','-c:v','libx264',str(src)],check=True)
            frames=v.extract_hook_frames(src,root/'hook',4,160)
            self.assertEqual(len(frames),8)
            self.assertEqual([f['timestamp_seconds'] for f in frames],[i/2 for i in range(8)])
    def test_real_local_video_and_focus(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);src=root/'source.mp4'
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=160x120:rate=8','-t','4','-c:v','libx264','-pix_fmt','yuv420p',str(src)],check=True)
            for focus in ([],['--start','1','--end','3']):
                p=subprocess.run([sys.executable,str(SCRIPT),str(src),'--max-frames','12',*focus],capture_output=True,text=True)
                self.assertEqual(p.returncode,0,p.stderr+p.stdout)
                r=json.loads(p.stdout);work=Path(r['workdir'])
                try:
                    m=json.loads(Path(r['manifest']).read_text());self.assertGreater(len(m['frames']),0);self.assertLessEqual(len(m['frames']),12)
                    self.assertTrue(all(Path(x['path']).exists() for x in m['frames']))
                    self.assertTrue(all(Path(x).exists() for x in r['contact_sheets']))
                    if focus:self.assertTrue(all(1 <= x['timestamp_seconds'] <= 3 for x in m['frames']))
                finally:
                    import shutil;shutil.rmtree(work)
