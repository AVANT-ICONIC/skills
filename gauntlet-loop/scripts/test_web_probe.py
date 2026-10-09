#!/usr/bin/env python3
"""Standard-library tests for optional browser probe parsing and fallback."""
import argparse
import unittest
from unittest.mock import patch

from web_probe import parse_viewport, tool_candidates


class BrowserProbeTests(unittest.TestCase):
    def test_accepted_viewport(self):
        self.assertEqual({"width": 390, "height": 844}, parse_viewport("390x844"))

    def test_uppercase_viewport(self):
        self.assertEqual({"width": 1280, "height": 800}, parse_viewport("1280X800"))

    def test_missing_separator_is_rejected(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            parse_viewport("390")

    def test_too_small_or_large_rejected(self):
        for value in ("100x400", "400x99", "9000x800", "-1x400"):
            with self.subTest(value=value):
                with self.assertRaises(argparse.ArgumentTypeError):
                    parse_viewport(value)

    def test_extra_dimension_is_rejected(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            parse_viewport("390x844x200")

    @patch("web_probe.shutil.which")
    def test_browser_candidate_recovery(self, which):
        which.side_effect = lambda name: {
            "chromium": "/usr/bin/chromium",
            "google-chrome": None,
            "google-chrome-stable": None,
        }.get(name)
        self.assertEqual(
            ["/missing/chromium", "/usr/bin/chromium"],
            tool_candidates("/missing/chromium"),
        )

    @patch("web_probe.shutil.which")
    def test_no_duplicate_candidates(self, which):
        which.side_effect = lambda name: {
            "chromium": "/usr/bin/chromium",
            "google-chrome": "/usr/bin/chromium",
            "google-chrome-stable": None,
        }.get(name)
        self.assertEqual(
            ["/usr/bin/chromium"], tool_candidates("/usr/bin/chromium")
        )

    @patch("web_probe.shutil.which", return_value=None)
    def test_no_installed_browser_reports_empty_candidate_list(self, _):
        self.assertEqual([], tool_candidates(None))

    @patch("web_probe.shutil.which")
    def test_no_accidental_firefox_in_chromium_candidates(self, which):
        which.side_effect = lambda name: (
            "/usr/bin/firefox" if name == "firefox" else None
        )
        self.assertEqual([], tool_candidates(None))


if __name__ == "__main__":
    unittest.main()
