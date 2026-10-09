"""Synthetic real-Chromium evidence for the experimental alpha. No paid APIs."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {16: 12.944272, 32: 25.888544}
with tempfile.TemporaryDirectory(prefix="geometry-browser-") as temp:
    html = Path(temp, "preview.html")
    subprocess.run(["node", str(ROOT / "scripts/s5/cli.mjs"), "preview",
                    str(ROOT / "examples/brief.json"), "--out", str(html)],
                   check=True, capture_output=True, text=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            for width in (320, 390, 768, 1280, 1920):
                page.set_viewport_size({"width": width, "height": 960})
                for root in (16, 32):
                    page.goto(html.as_uri())
                    page.evaluate("(root) => document.documentElement.style.fontSize = root + 'px'", root)
                    measurements = page.evaluate("""() => ({
                        gap: parseFloat(getComputedStyle(document.querySelector('.collection')).gap),
                        count: document.querySelectorAll('.collection > article').length,
                        overflow: document.documentElement.scrollWidth > innerWidth + 2,
                        cta: !!document.querySelector('#launch').getBoundingClientRect().width
                    })""")
                    assert abs(measurements["gap"] - EXPECTED[root]) < 0.05, (width,root,measurements)
                    assert measurements["count"] == 12 and measurements["cta"], (width, root, measurements)
                    assert not measurements["overflow"], (width, root, measurements)
                    page.locator("#launch").click()
                    assert page.locator("#modal").evaluate("(e) => e.open")
                    page.keyboard.press("Escape")
                    assert not page.locator("#modal").evaluate("(e) => e.open")
                    assert page.locator("#launch").evaluate("(e) => document.activeElement === e")
                    screenshot = page.screenshot(full_page=True)
                    print(json.dumps({"viewport":width,"rootFontPx":root,
                        "gapCssPx":round(measurements["gap"],4),
                        "screenshotSha256":hashlib.sha256(screenshot).hexdigest()}))
        finally:
            browser.close()
print("Real Chromium 10/10 responsive, modal and screenshot cases PASS")
