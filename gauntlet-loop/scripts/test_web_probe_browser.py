#!/usr/bin/env python3
"""Optional real-browser regression tests. Skip if free Playwright/Chromium absent.

Running these DOES NOT mean a human/agent inspected screenshots or that a
separate coding agent followed the Gauntlet skill.
"""
from __future__ import annotations

import argparse
import tempfile
import unittest
from pathlib import Path

from web_probe import run, tool_candidates


TEMPLATE = '''<!doctype html><html><head><style>
*{box-sizing:border-box}body{margin:0;font:16px sans-serif}
.frame{width:100%;overflow:hidden;padding:12px}.panel{width:100%;padding:12px;background:#143344;color:white}
#pulse{width:40px;height:40px;background:turquoise;animation:pulse DURATION linear infinite}
@keyframes pulse{from{opacity:1}to{opacity:.2}}
@media(max-width:550px){.panel{width:MOBILE_WIDTH}}
</style></head><body><main class="frame"><section class="panel" id="panel">
<strong id="state">0</strong><button id="act" BUTTON_STYLE onclick="setTimeout(()=>{document.querySelector('#state').textContent='1'},200)">Go</button>
<div id="pulse"></div></section></main></body></html>'''


def make_html(duration="2s", width="100%", style=""):
    return (TEMPLATE.replace("DURATION", duration)
            .replace("MOBILE_WIDTH", width)
            .replace("BUTTON_STYLE", style))


class RealBrowserProbeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise unittest.SkipTest("optional Python Playwright absent") from None
        paths = tool_candidates(None)
        if not paths:
            raise unittest.SkipTest("optional Chromium unavailable")
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch(executable_path=paths[0], headless=True, timeout=5000)
                browser.close()
            except Exception:
                raise unittest.SkipTest("no suitable Chromium launched") from None

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="gauntlet-browser-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def probe(self, html, target="#panel", action="#act", state="#state", motion="#pulse", browser="/missing/chromium", keyboard=False):
        fixture = self.root / "case.html"
        fixture.write_text(html, encoding="utf-8")
        out = self.root / "evidence"
        out.mkdir()
        args = argparse.Namespace(html=fixture, out=out,
            viewport=[{"width":390,"height":844}], target=target, action=action,
            state=state, motion=motion, expected_duration=2000, browser=browser, keyboard=keyboard)
        return run(args)

    def test_broken_fixture_fails_layout_and_motion_and_recovers_binary(self):
        report = self.probe(make_html(duration=".5s", width="540px"))
        self.assertEqual(report["status"], "CHECKS_FAIL")
        self.assertEqual(["layout@390x844", "motion-duration@390x844"], report["failed_checks"])
        self.assertEqual("FAILED", report["browser_attempts"][0]["result"])
        self.assertEqual("LAUNCHED", report["browser_attempts"][-1]["result"])
        shot = Path(report["viewports"][0]["screenshot"])
        self.assertTrue(shot.is_file())
        self.assertTrue(Path(report["viewports"][0]["interaction"]["screenshot"]).is_file())

    def test_delayed_state_eventually_changes_and_has_postclick_capture(self):
        report = self.probe(make_html())
        self.assertEqual(report["status"], "CHECKS_PASS_REVIEW_PIXELS")
        interaction = report["viewports"][0]["interaction"]
        self.assertEqual(("0", "1"), (interaction["before"], interaction["after"]))
        self.assertTrue(Path(interaction["screenshot"]).is_file())
        self.assertIsNone(interaction["error"])

    def test_hidden_control_not_treated_as_visible(self):
        report = self.probe(make_html(style='style="visibility:hidden"'), target="#act", action=None, state=None)
        self.assertIn("layout@390x844", report["failed_checks"])
        self.assertTrue(report["viewports"][0]["target"]["styleHidden"])

    def test_missing_state_is_failing_check_not_browser_blocker(self):
        report = self.probe(make_html(), state="#nonexistent")
        self.assertEqual(report["status"], "CHECKS_FAIL")
        self.assertIn("interaction@390x844", report["failed_checks"])
        self.assertIn("state selector absent", report["viewports"][0]["interaction"]["error"])

    def test_native_button_keyboard_enter_changes_state(self):
        report = self.probe(make_html(), keyboard=True)
        self.assertEqual("CHECKS_PASS_REVIEW_PIXELS", report["status"])
        record = report["viewports"][0]["keyboard"]
        self.assertTrue(record["tab_reachable"])
        self.assertTrue(record["enter_changed"])
        self.assertTrue(Path(record["focus_screenshot"]).is_file())
        self.assertTrue(Path(record["after_screenshot"]).is_file())

    def test_role_button_without_keyboard_handler_fails(self):
        html = make_html().replace('<button id="act"', '<div role="button" tabindex="0" id="act"').replace('>Go</button>', '>Go</div>')
        report = self.probe(html, keyboard=True)
        self.assertEqual("CHECKS_FAIL", report["status"])
        self.assertIn("keyboard@390x844", report["failed_checks"])
        record = report["viewports"][0]["keyboard"]
        self.assertTrue(record["tab_reachable"])
        self.assertFalse(record["enter_changed"])

    def test_missing_motion_target_is_failing_check(self):
        report = self.probe(make_html(), motion="#nonexistent")
        self.assertEqual(report["status"], "CHECKS_FAIL")
        self.assertIn("motion-duration@390x844", report["failed_checks"])


if __name__ == "__main__":
    unittest.main()
