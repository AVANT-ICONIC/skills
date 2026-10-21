import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import cobalt_fallback as cobalt


class Response:
    def __init__(self, body, kind):
        self.payload = io.BytesIO(body)
        self.headers = {"content-type": kind, "Content-Length": str(len(body))}
        self.status = 200

    def read(self, size=-1):
        return self.payload.read(size)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class CobaltTests(unittest.TestCase):
    def test_only_local_service(self):
        for bad in ("https://api.cobalt.tools", "http://10.0.0.1:9000",
                    "http://localhost:8080", "http://evil.test:9000",
                    "http://user:password@localhost:9000"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                cobalt.base_origin(bad)
        self.assertEqual(cobalt.base_origin("http://cobalt:9000"), "http://cobalt:9000")

    def test_media_must_return_to_same_origin(self):
        for bad in ("https://cdn.example.test/video.mp4",
                    "http://127.0.0.1:80/private",
                    "http://localhost:9000/file",
                    "file:///etc/passwd"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                cobalt.local_media_url(bad, "http://cobalt:9000")
        self.assertEqual(cobalt.local_media_url("http://cobalt:9000/tunnel/123",
                                                "http://cobalt:9000"),
                         "http://cobalt:9000/tunnel/123")

    def test_tunnel_image_stream(self):
        reply = json.dumps({"status": "tunnel",
                            "url": "http://cobalt:9000/tunnel/123"}).encode()
        bytes_ = b"\xff\xd8" + b"\x00" * 500
        with tempfile.TemporaryDirectory() as td:
            def opener(req, timeout):
                if req.get_method() == "POST":
                    return Response(reply, "application/json")
                return Response(bytes_, "image/jpeg")
            with patch.object(cobalt.OPENER, "open", side_effect=opener):
                output = cobalt.attempt("https://instagram.com/p/ABC/", Path(td),
                                        "http://cobalt:9000")
            self.assertEqual(len(output),1)
            self.assertTrue(output[0].endswith(".jpg"))
            self.assertEqual(Path(output[0]).read_bytes(), bytes_)

    def test_redirects_rejected(self):
        self.assertIsNone(cobalt.RejectRedirect().redirect_request(
            object(), None, 302, "", {}, "http://169.254.169.254/latest/meta-data"))


if __name__ == "__main__":
    unittest.main()
