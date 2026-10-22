"""Offline deterministic tests; never access any social network."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import social_ingest as s
import youtube_captions as yc


class SocialIngestTests(unittest.TestCase):
    def test_five_hosts(self):
        examples = (
            ("https://youtu.be/abc", "youtube"),
            ("https://www.instagram.com/reel/abc/", "instagram"),
            ("https://vm.tiktok.com/abc/", "tiktok"),
            ("https://www.tiktok.com/t/ZTRxyz/", "tiktok"),
            ("https://www.instagram.com/reels/DbAqmKPIaY5/", "instagram"),
            ("https://www.facebook.com/NASASCaN/videos/example/8368792419872400/", "facebook"),
            ("https://www.facebook.com/reel/123456789/", "facebook"),
            ("https://www.facebook.com/ISS/posts/nasa-photo/1194948136005111/", "facebook"),
            ("https://www.facebook.com/watch/?v=8368792419872400", "facebook"),
            ("https://fb.watch/abc123/", "facebook"),
            ("https://x.com/user/status/123", "x"),
            ("https://old.reddit.com/r/test/comments/abc", "reddit"),
        )
        for url, platform in examples:
            with self.subTest(platform=platform):
                self.assertEqual(s.identify(url)[0], platform)

    def test_bad_hosts_rejected(self):
        urls = (
            "https://www.instagram.com.evil.example/reel/abc",
            "https://localhost/", "file:///etc/passwd",
            "https://127.0.0.1/", "https://x.com:8080/user/status/1",
            "https://attacker@x.com/foo", "https://tiktok.com@evil.example/video",
            "https://example.com/", "https://instagram.com/any_profile",
        )
        for url in urls:
            with self.subTest(url=url), self.assertRaises(ValueError):
                s.identify(url)

    def test_tracking_removed_video_id_preserved(self):
        _, url = s.identify("http://www.youtube.com/watch?v=abc&t=23&si=secret&utm_source=spam")
        self.assertEqual(url, "https://www.youtube.com/watch?v=abc&t=23")

    def test_missing_tools_is_not_watching(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(s.shutil, "which", return_value=None):
            result = s.ingest("https://www.instagram.com/reel/abc", Path(temp), acquire_media=True)
            self.assertEqual(result["status"], "unavailable")
            self.assertFalse(result["visuals_inspected"])
            self.assertFalse(result["audio_transcribed"])
            self.assertEqual(result["media_files"], [])
            self.assertTrue((Path(temp) / "manifest.json").exists())

    def test_reddit_plain_text_not_faked(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(s.shutil, "which", return_value=None):
            result = s.ingest("https://reddit.com/r/test/comments/1", Path(temp))
            self.assertEqual(result["text_evidence"], [])
            self.assertTrue(any("Reddit" in w for w in result["warnings"]))

    def test_safe_metadata_filters_urls(self):
        data = s.clean_meta({"description": "hello", "url": "https://signed.invalid/secret", "id": "abc"})
        self.assertEqual(data, {"id": "abc", "description": "hello"})

    def test_ytdlp_command_is_argv_not_shell(self):
        response = s.subprocess.CompletedProcess(args=[], returncode=0,
            stdout=json.dumps({"id": "abc", "title": "Clip", "description": "Caption", "duration": 60}),
            stderr="")
        with tempfile.TemporaryDirectory() as temp, \
            patch.object(s.shutil, "which", side_effect=lambda x: "/usr/bin/yt-dlp" if x == "yt-dlp" else None), \
            patch.object(s, "command", return_value=response) as cmd:
            result = s.ingest("https://www.youtube.com/watch?v=abc", Path(temp))
            self.assertEqual(result["status"], "metadata_only")
            self.assertEqual(result["text_evidence"][0]["text"], "Caption")
            self.assertFalse(result["visuals_inspected"])
            argv = cmd.call_args.args[0]
            self.assertIsInstance(argv, list)
            self.assertIn("--no-playlist", argv)
            self.assertIn("--skip-download", argv)

    def test_gallery_failure_is_honest(self):
        fail = s.subprocess.CompletedProcess([], 1, "", "blocked")
        with tempfile.TemporaryDirectory() as temp, \
            patch.object(s.shutil, "which", side_effect=lambda x: "/bin/" + x), \
            patch.object(s, "command", return_value=fail):
            result = s.ingest("https://www.instagram.com/p/abc", Path(temp), acquire_media=True)
            self.assertEqual(result["status"], "unavailable")
            self.assertEqual(len(result["attempts"]), 2)
            self.assertFalse(result["visuals_inspected"])


    def test_failed_download_with_partial_file_is_not_success(self):
        metadata = s.subprocess.CompletedProcess([], 0,
            json.dumps({"id": "abc", "title": "Video"}), "")
        failure = s.subprocess.CompletedProcess([], 1, "", "ffmpeg unavailable")
        def fake_run(argv, timeout):
            if "--dump-single-json" in argv:
                return metadata
            Path(argv[argv.index("-o") + 1].replace("%(ext)s", "mp4")).write_bytes(b"incomplete")
            return failure
        with tempfile.TemporaryDirectory() as temp, \
             patch.object(s.shutil, "which", side_effect=lambda x: "/usr/bin/yt-dlp" if x == "yt-dlp" else None), \
             patch.object(s, "command", side_effect=fake_run):
            j = s.ingest("https://www.youtube.com/watch?v=abc", Path(temp), acquire_media=True)
            self.assertEqual(j["status"], "partial_media_unverified")
            self.assertEqual(len(j["media_files"]), 1)
            self.assertFalse(j["visuals_inspected"])



    def test_caption_track_creates_timestamped_transcript(self):
        with tempfile.TemporaryDirectory() as td:
            cue = Path(td) / "video.en.vtt"
            cue.write_text(
                "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<v narrator>Hello &amp; welcome</v>\n"
                "\n00:00:03.000 --> 00:00:04.000\nGravity is amazing\n",
                encoding="utf-8")
            parts = s.parse_caption_file(cue)
            self.assertEqual(parts, [
                {"at": "00:00:01.000", "text": "Hello & welcome"},
                {"at": "00:00:03.000", "text": "Gravity is amazing"},
            ])

    def test_missing_speech_dependency_does_not_invent_transcript(self):
        with tempfile.TemporaryDirectory() as td, \
             patch.object(s.shutil, "which", return_value=None):
            result = s.ingest("https://www.facebook.com/reel/123", Path(td), acquire_media=True)
            self.assertFalse(result["audio_transcribed"])
            self.assertIsNone(result["caption_transcript_file"])



    def test_gallery_media_and_caption_kept(self):
        success = s.subprocess.CompletedProcess([], 0, "", "")
        def fake_gallery(argv, timeout):
            out = Path(argv[argv.index("--directory") + 1])
            out.mkdir(parents=True, exist_ok=True)
            (out / "clip.mp4").write_bytes(b"mock media")
            (out / "info.json").write_text(
                json.dumps({"id": "123", "content": "A sample post description"}))
            return success
        with tempfile.TemporaryDirectory() as td, \
             patch.object(s.shutil, "which",
                side_effect=lambda name: "/usr/bin/gallery-dl" if name=="gallery-dl" else None), \
             patch.object(s, "command", side_effect=fake_gallery):
            j = s.ingest("https://www.tiktok.com/@creator/video/123", Path(td),
                         acquire_media=True)
            self.assertEqual(j["status"], "media_acquired_uninspected")
            self.assertEqual(j["metadata"]["description"], "A sample post description")
            self.assertEqual(j["text_evidence"][0]["type"], "gallery_post_caption")



    def test_youtube_captions_validate_video_ids(self):
        self.assertEqual(yc.video_id("https://www.youtube.com/watch?v=LHUvedAssyE"), "LHUvedAssyE")
        self.assertEqual(yc.video_id("https://youtu.be/LHUvedAssyE"), "LHUvedAssyE")
        self.assertEqual(yc.video_id("https://youtube.com/shorts/LHUvedAssyE"), "LHUvedAssyE")
        with self.assertRaises(ValueError):
            yc.video_id("https://youtube.com.evil.test/watch?v=LHUvedAssyE")


if __name__ == "__main__":
    unittest.main()
