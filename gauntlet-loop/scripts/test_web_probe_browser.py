#!/usr/bin/env python3
"""Optional real-browser regression tests. Skip if free Playwright/Chromium absent.

Running these DOES NOT mean a human/agent inspected screenshots or that a
separate coding agent followed the Gauntlet skill.
"""
from __future__ import annotations

import argparse
import http.server
import threading
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


DIALOG_HTML = """<!doctype html><html lang="en"><style>
#modal[hidden]{display:none}#modal{position:fixed;inset:25%;background:#173b4b;color:white;padding:20px}
</style><main id="main"><button id="act">Open</button><span id="state">Closed</span>
<button id="behind">Behind</button></main>
<section id="modal" role="dialog" aria-modal="true" hidden>
<button id="cancel">Cancel</button><button id="confirm">Confirm</button>
</section><script>
const good=GOOD;
const action=document.querySelector('#act'), modal=document.querySelector('#modal'), main=document.querySelector('#main');
action.onclick=()=>{modal.hidden=false;document.querySelector('#state').textContent='Open';if(good){main.inert=true;document.querySelector('#cancel').focus()}};
function close(){modal.hidden=true;main.inert=false;action.focus()}
document.querySelector('#cancel').onclick=close;
if(good)document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape'){close();}
if(e.key==='Tab'){e.preventDefault();const els=Array.from(modal.querySelectorAll('button'));els[(els.indexOf(document.activeElement)+(e.shiftKey?-1:1)+els.length)%els.length].focus()}});
</script></html>"""


def make_dialog_html(good=False):
    return DIALOG_HTML.replace("const good=GOOD;", f"const good={'true' if good else 'false'};")


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

    def probe(self, html, target="#panel", action="#act", state="#state", motion="#pulse", browser="/missing/chromium", keyboard=False, dialog=None, canvas2d=None, canvas_min_colors=2):
        fixture = self.root / "case.html"
        fixture.write_text(html, encoding="utf-8")
        out = self.root / "evidence"
        out.mkdir()
        args = argparse.Namespace(html=fixture, out=out,
            viewport=[{"width":390,"height":844}], target=target, action=action,
            state=state, motion=motion, expected_duration=2000, browser=browser, keyboard=keyboard, dialog=dialog, canvas2d=canvas2d, canvas_min_colors=canvas_min_colors)
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

    def test_dialog_negative_focus_escape_restore_fail(self):
        html = make_dialog_html(good=False)
        report = self.probe(html, target="#act", action="#act", state="#state", motion=None, dialog="#modal")
        self.assertEqual("CHECKS_FAIL", report["status"])
        self.assertIn("dialog@390x844", report["failed_checks"])
        modal = report["viewports"][0]["dialog"]
        self.assertTrue(modal["opened"])
        self.assertFalse(modal["focus_inside"])
        self.assertFalse(modal["tabs_trapped"])
        self.assertFalse(modal["escape_closed"])
        self.assertFalse(modal["focus_restored"])
        self.assertTrue(Path(modal["open_screenshot"]).is_file())

    def test_dialog_positive_focus_escape_restore_pass(self):
        html = make_dialog_html(good=True)
        report = self.probe(html, target="#act", action="#act", state="#state", motion=None, dialog="#modal")
        self.assertEqual("CHECKS_PASS_REVIEW_PIXELS", report["status"])
        modal = report["viewports"][0]["dialog"]
        for name in ("opened", "focus_inside", "tabs_trapped", "escape_closed", "focus_restored"):
            self.assertTrue(modal[name], name)
        self.assertTrue(Path(modal["after_escape_screenshot"]).is_file())

    def test_dialog_missing_selector_fails_not_blocked(self):
        html = make_dialog_html(good=True)
        report = self.probe(html, target="#act", action="#act", state="#state", motion=None, dialog="#missing-dialog")
        self.assertEqual("CHECKS_FAIL", report["status"])
        self.assertIn("dialog@390x844", report["failed_checks"])

    def test_blank_canvas_2d_content_fails_even_when_styled(self):
        html = '<style>canvas{background:radial-gradient(circle,cyan,navy);width:300px;height:200px}</style><canvas id="scene" width="300" height="200"></canvas>'
        result = self.probe(html, target="#scene", action=None, state=None, motion=None, canvas2d="#scene")
        self.assertEqual(result["status"], "CHECKS_FAIL")
        self.assertIn("canvas2d@390x844", result["failed_checks"])
        self.assertTrue(result["viewports"][0]["canvas2d"]["verified"])
        self.assertEqual(result["viewports"][0]["canvas2d"]["drawn_pixels"], 0)

    def test_drawn_canvas_2d_content_passes_pixel_presence(self):
        html = '<canvas id="scene" width="300" height="200"></canvas><script>const x=document.querySelector("#scene").getContext("2d"); x.fillStyle="cyan"; x.fillRect(0,0,140,200); x.fillStyle="red";x.fillRect(140,0,160,200);</script>'
        result = self.probe(html, target="#scene", action=None, state=None, motion=None, canvas2d="#scene")
        self.assertEqual(result["status"], "CHECKS_PASS_REVIEW_PIXELS")
        canvas=result["viewports"][0]["canvas2d"]
        self.assertTrue(canvas["has_content"])
        self.assertGreaterEqual(canvas["unique_colors"], 2)

    def test_noncavas_selector_does_not_falsely_pass_canvas_2d(self):
        html = '<main id="scene" style="width:300px;height:200px;background:teal">Paint</main>'
        result = self.probe(html, target="#scene", action=None, state=None, motion=None, canvas2d="#scene")
        self.assertEqual(result["status"], "CHECKS_FAIL")
        self.assertIn("canvas2d@390x844", result["failed_checks"])
        self.assertFalse(result["viewports"][0]["canvas2d"]["verified"])

    def test_unavailable_2d_context_reports_unverified_not_blank_artifact(self):
        html = '<canvas id="scene" width="300" height="200"></canvas><script>document.querySelector("#scene").getContext("bitmaprenderer")</script>'
        report = self.probe(html, target="#scene", action=None, state=None, motion=None, canvas2d="#scene")
        self.assertEqual(report["status"], "BLOCKED_ENV")
        self.assertEqual([], report["failed_checks"])
        self.assertTrue(report["unverified_checks"])
        self.assertIn("context unavailable", report["unverified_checks"][0])

    def test_untrusted_html_cannot_load_external_resource(self):
        requests_seen = []

        class LocalMonitor(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                requests_seen.append(self.path)
                self.send_response(204)
                self.end_headers()

            def log_message(self, *_args):
                pass

        server = http.server.HTTPServer(("127.0.0.1", 0), LocalMonitor)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            html = (f'<img src="http://127.0.0.1:{server.server_port}/external">'
                    '<div id="scene" style="width:40px;height:40px">Test</div>')
            report = self.probe(html, target="#scene", action=None, state=None, motion=None)
            self.assertEqual("CHECKS_PASS_REVIEW_PIXELS", report["status"])
            self.assertEqual([], requests_seen, "untrusted HTML made an HTTP request")
            self.assertIn("offline", report["network_policy"])
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_missing_motion_target_is_failing_check(self):
        report = self.probe(make_html(), motion="#nonexistent")
        self.assertEqual(report["status"], "CHECKS_FAIL")
        self.assertIn("motion-duration@390x844", report["failed_checks"])


if __name__ == "__main__":
    unittest.main()
