import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import core


class BridgeTests(unittest.TestCase):
    def test_unsupported_url_does_not_create_job(self):
        with tempfile.TemporaryDirectory() as scratch:
            bridge = core.SocialWatchBridge(Path(scratch))
            with self.assertRaises(ValueError):
                bridge.resolve("http://127.0.0.1/internal")
            self.assertEqual(len(bridge.jobs), 0)

    def test_captions_and_cache_do_not_claim_watched(self):
        with tempfile.TemporaryDirectory() as scratch:
            bridge = core.SocialWatchBridge(Path(scratch))
            def fake_ingest(url, folder, acquire_media, timeout):
                folder.mkdir(parents=True, exist_ok=True)
                caption = folder / "caption-transcript.txt"
                caption.write_text("[00:00:01] Source caption\n", encoding="utf-8")
                return {"status": "metadata_only", "media_files": [],
                        "caption_files": [],
                        "caption_transcript_file": str(caption),
                        "metadata": {"title": "Fixture"}, "attempts": [], "warnings": []}
            with patch.object(core, "ingest", side_effect=fake_ingest):
                result = bridge.resolve("https://x.com/SpaceX/status/12345")
            job_id = result["job_id"]
            self.assertTrue(result["caption_available"])
            self.assertFalse(result["visuals_inspected"])
            self.assertEqual(result["state"], "metadata_only")
            self.assertEqual(bridge.captions(job_id), "[00:00:01] Source caption\n")
            self.assertTrue(bridge.delete(job_id))
            with self.assertRaises(KeyError):
                bridge.summary(job_id)

    def test_partial_media_never_runs_frame_extraction(self):
        with tempfile.TemporaryDirectory() as scratch:
            bridge = core.SocialWatchBridge(Path(scratch))
            def mock_ingest(url, folder, acquire_media, timeout):
                folder.mkdir(parents=True, exist_ok=True)
                clip = folder / "video.mp4"
                clip.write_bytes(b"partial")
                return {"status": "partial_media_unverified",
                        "media_files": [str(clip)], "caption_files": [],
                        "metadata": {}, "attempts": [], "warnings": ["partial"]}
            with patch.object(core, "ingest", side_effect=mock_ingest), \
                 patch.object(core, "_run") as video_watch:
                result = bridge.resolve("https://www.facebook.com/reel/123")
            self.assertEqual(result["state"], "partial_media_unverified")
            self.assertEqual(result["contact_sheets"], 0)
            video_watch.assert_not_called()

    def test_media_escape_rejected(self):
        with tempfile.TemporaryDirectory() as scratch, tempfile.TemporaryDirectory() as outer:
            bridge = core.SocialWatchBridge(Path(scratch))
            other = Path(outer) / "outside.mp4"
            other.write_bytes(b"media")
            with self.assertRaises(ValueError):
                bridge._validate_media(str(other), Path(scratch))

    def test_expiry_enforced(self):
        with tempfile.TemporaryDirectory() as scratch:
            bridge = core.SocialWatchBridge(Path(scratch), ttl=1)
            name = "old"
            (Path(scratch) / name).mkdir()
            bridge.jobs[name] = {"created": 0, "url": "", "platform": "x",
                                 "sheets": [], "manifest": {}, "transcript": ""}
            with self.assertRaises(KeyError):
                bridge.summary(name)
            self.assertFalse((Path(scratch) / name).exists())

    def test_actual_contact_sheet_bytes_are_returned_not_paths(self):
        with tempfile.TemporaryDirectory() as scratch:
            bridge = core.SocialWatchBridge(Path(scratch))
            name = "a1"
            folder = Path(scratch) / name
            folder.mkdir()
            picture = folder / "sheet_01.jpg"
            picture.write_bytes(b"\xff\xd8\xff\xd9")
            bridge.jobs[name] = {"created": core.time.time(), "url": "", "platform": "x",
                                "sheets": [str(picture)], "manifest": {}, "transcript": "",
                                "state": "frames_prepared_uninspected"}
            self.assertEqual(bridge.sheet(name,0), b"\xff\xd8\xff\xd9")
            with self.assertRaises(IndexError):
                bridge.sheet(name,1)


if __name__ == "__main__":
    unittest.main()
