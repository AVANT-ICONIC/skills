import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import reddit_authorized as ra
import social_ingest as ingest


def reddit_fixture(removed=False):
    post = {"id":"abc123","title":"Test video","author":"author1",
            "subreddit":"videos","selftext":"An interesting post",
            "score":120,"is_video":True,"permalink":"/r/videos/comments/abc123/",
            "secure_media":{"reddit_video":{"fallback_url":
                "https://v.redd.it/xyz123/DASH_720.mp4?source=fallback"}}}
    if removed:
        post["removed_by_category"] = "moderator"
    return [
        {"data":{"children":[{"kind":"t3","data":post}]}},
        {"data":{"after":None, "children":[
            {"kind":"t1","data":{"id":"aa1","author":"person","body":"Nice clip",
                                  "score":3, "created_utc":123}},
            {"kind":"t1","data":{"id":"aa2","author":"person2","body":"[removed]"}},
            {"kind":"more","data":{"count":20}}
        ]}}
    ]


class RedditOAuthTests(unittest.TestCase):
    def test_reddit_post_url_validation(self):
        self.assertEqual(ra.post_id("https://www.reddit.com/r/videos/comments/abc123/name"),
                         "abc123")
        self.assertEqual(ra.post_id("https://redd.it/abc123"),"abc123")
        for bad in ("http://reddit.com/r/videos/comments/abc123",
                    "https://reddit.com.evil.test/r/videos/comments/abc123",
                    "https://www.reddit.com/r/videos",
                    "https://v.redd.it/xyz123"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                ra.post_id(bad)

    def test_reddit_oauth_settings_require_approved_token_and_honest_agent(self):
        names=["SOCIAL_WATCH_REDDIT_OAUTH_TOKEN","SOCIAL_WATCH_REDDIT_USER_AGENT"]
        with patch.dict(os.environ,{k:"" for k in names}):
            self.assertIsNone(ra.approved_settings())
            os.environ[names[0]]="approved-token-secret"
            with self.assertRaises(ValueError):
                ra.approved_settings()
            os.environ[names[1]]="web:com.example.socialwatch:0.1 (by /u/example)"
            self.assertIsNotNone(ra.approved_settings())

    def test_api_post_and_top_level_comments_are_bounded(self):
        response=json.dumps(reddit_fixture()).encode()
        with patch.object(ra, "_fetch", return_value=(response,"application/json")) as fn:
            post=ra.read_post("https://www.reddit.com/r/videos/comments/abc123/","token",
                              "web:com.example.socialwatch:0.1 (by /u/example)")
        self.assertEqual(post["title"],"Test video")
        self.assertEqual(post["comments_count"],1)
        self.assertTrue(post["comments_partial"])
        self.assertEqual(post["comments"][0]["text"],"Nice clip")
        self.assertTrue(post["video_mp4"].startswith("https://v.redd.it/"))
        self.assertTrue(fn.call_args.args[0].startswith("https://oauth.reddit.com/comments/abc123.json?"))

    def test_removed_post_is_not_read(self):
        response=json.dumps(reddit_fixture(removed=True)).encode()
        with patch.object(ra, "_fetch", return_value=(response,"application/json")):
            with self.assertRaisesRegex(RuntimeError,"removed"):
                ra.read_post("https://reddit.com/r/videos/comments/abc123/","token","user-agent")

    def test_untrusted_video_host_filtered(self):
        data=reddit_fixture()
        data[0]["data"]["children"][0]["data"]["secure_media"]["reddit_video"]["fallback_url"] = "http://127.0.0.1/private"
        with patch.object(ra, "_fetch", return_value=(json.dumps(data).encode(),"application/json")):
            post=ra.read_post("https://reddit.com/r/videos/comments/abc123/","token","user-agent")
            self.assertIsNone(post["video_mp4"])

    def test_native_video_download_is_exact_vreddit_only(self):
        with tempfile.TemporaryDirectory() as td:
            for bad in ("https://evil.test/test.mp4", "http://v.redd.it/video.mp4",
                        "https://v.redd.it:8080/video.mp4"):
                with self.subTest(bad=bad), self.assertRaises(ValueError):
                    ra.download_native_video({"video_mp4":bad},"token","ua",Path(td))
            with patch.object(ra, "_fetch",return_value=(b"0"*1024,"video/mp4")):
                path=ra.download_native_video({"video_mp4":"https://v.redd.it/abc123/DASH_720.mp4"},
                                              "token","ua",Path(td))
                self.assertTrue(Path(path).is_file())

    def test_manifest_only_when_approved_access_returns_real_text(self):
        data = {
           "id":"abc123","title":"Video","author":"u","description":"some text",
           "subreddit":"videos","score":3,"comments":[{"id":"1","text":"comment"}],
           "comments_partial":False,"comments_scope":"top-level, max 100",
           "video_mp4":None,
        }
        with tempfile.TemporaryDirectory() as td, \
             patch.object(ra, "approved_settings", return_value=("token","ua")), \
             patch.object(ra, "read_post", return_value=data), \
             patch.object(ingest.shutil, "which", return_value=None):
            manifest=ingest.ingest("https://www.reddit.com/r/videos/comments/abc123/",
                                    Path(td),acquire_media=True)
        self.assertEqual(manifest["status"],"metadata_only")
        self.assertTrue(manifest["comments_retrieved"])
        self.assertEqual(manifest["text_evidence"][-1]["comments"][0]["text"],"comment")
        self.assertEqual(manifest["attempts"][0]["extractor"],"reddit-approved-oauth")


    def test_approved_refresh_token_is_cached_and_requires_read_grant(self):
        class Response:
            status = 200
            headers = {"Content-Type": "application/json"}
            def read(self, n=-1):
                return json.dumps({"access_token": "approved-very-long-token",
                                   "expires_in": 3600, "scope": "identity read"}).encode()
            def __enter__(self): return self
            def __exit__(self, *a): return False
        with patch.object(ra.OPENER, "open", return_value=Response()) as op:
            ra._TOKEN_CACHE = None
            token = ra.refresh_approved_token("client-id", "client-secret",
                                              "refresh-secret", "web:app:v1 (by /u/example)")
            token2 = ra.refresh_approved_token("client-id", "client-secret",
                                               "refresh-secret", "web:app:v1 (by /u/example)")
            self.assertEqual(token, "approved-very-long-token")
            self.assertEqual(token2, token)
            self.assertEqual(op.call_count, 1)
            req = op.call_args.args[0]
            self.assertEqual(req.full_url, "https://www.reddit.com/api/v1/access_token")
            self.assertNotIn("refresh-secret", req.full_url)
            self.assertIn(b"grant_type=refresh_token", req.data)
            ra._TOKEN_CACHE = None

    def test_reddit_refresh_without_read_scope_refused(self):
        class Response:
            status=200
            headers={"Content-Type":"application/json"}
            def read(self, n=-1):
                return json.dumps({"access_token":"approved-very-long-token",
                                   "expires_in":3600,"scope":"identity"}).encode()
            def __enter__(self): return self
            def __exit__(self,*a): return False
        with patch.object(ra.OPENER,"open",return_value=Response()):
            ra._TOKEN_CACHE = None
            with self.assertRaisesRegex(RuntimeError,"read grant"):
                ra.refresh_approved_token("client","secret","refresh","web:app:v1 (by /u/example)")

if __name__ == "__main__":
    unittest.main()
