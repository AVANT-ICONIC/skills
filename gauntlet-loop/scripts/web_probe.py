#!/usr/bin/env python3
"""Optional Playwright pixel-and-interaction probe for self-contained HTML fixtures.

Not an AI reviewer, not a deployment/browser-origin check, not proof the
screenshots were visually inspected. Requires local Python Playwright and
an actual Chromium binary. Writes screenshots only to an explicit output path.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path


def parse_viewport(raw: str) -> dict[str, int]:
    try:
        parts = raw.lower().split("x")
        if len(parts) != 2:
            raise ValueError
        w, h = map(int, parts)
        if not (240 <= w <= 8192 and 240 <= h <= 8192):
            raise ValueError
        return {"width": w, "height": h}
    except ValueError:
        raise argparse.ArgumentTypeError("viewport must be WxH between 240 and 8192") from None


def tool_candidates(first: str | None) -> list[str]:
    paths = [first] if first else []
    # Chromium's Playwright browser type must not launch Firefox executables.
    for name in ("chromium", "google-chrome", "google-chrome-stable"):
        path = shutil.which(name)
        if path and path not in paths:
            paths.append(path)
    return paths


LAYOUT_JS = r"""selector => {
  const el = document.querySelector(selector);
  if (!el) return {found:false, clipped:true, reason:"selector missing"};
  const r=el.getBoundingClientRect();
  const own=getComputedStyle(el);
  let opacity=1;
  for (let n=el;n;n=n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
  const styleHidden = own.visibility==="hidden" || own.display==="none" ||
                      own.contentVisibility==="hidden" || opacity<0.01;
  let clipped = styleHidden || r.width<=0 || r.height<=0 || r.left<0 || r.right>innerWidth;
  const ancestors=[];
  for (let a=el.parentElement;a;a=a.parentElement) {
    const css=getComputedStyle(a), q=a.getBoundingClientRect();
    if (["hidden","clip"].includes(css.overflowX) ||
        ["hidden","clip"].includes(css.overflowY)) {
      const outsideX=r.left<q.left-1 || r.right>q.right+1;
      const outsideY=r.top<q.top-1 || r.bottom>q.bottom+1;
      if (outsideX || outsideY) {
        clipped=true;
        ancestors.push({tag:a.tagName.toLowerCase(),outsideX,outsideY});
      }
    }
  }
  return {found:true,clipped,styleHidden,compositedOpacity:opacity,ancestors,
          naive_scroll_check:document.documentElement.scrollWidth<=innerWidth,
          rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
}"""


def run(args: argparse.Namespace) -> dict:
    report = {
        "method": "Chromium page.set_content (isolated self-contained HTML)",
        "limitations": [
            "Not evidence of a deployed app origin, CSP, service worker, network or external assets.",
            "Saved screenshots must be opened and reviewed by an agent/human.",
            "No independent coding agent or real-player enjoyment is established by this probe.",
        ],
        "source": str(args.html),
        "browser_attempts": [],
        "viewports": [],
        "status": "BLOCKED_ENV",
    }
    try:
        from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
    except ImportError:
        report["error"] = "Python Playwright is unavailable (optional free local dependency)"
        return report

    html = args.html.read_text(encoding="utf-8")
    with sync_playwright() as playwright:
        browser = None
        for binary in tool_candidates(args.browser):
            try:
                browser = playwright.chromium.launch(
                    executable_path=binary, headless=True, timeout=8000
                )
                report["browser_attempts"].append(
                    {"binary": binary, "result": "LAUNCHED"}
                )
                break
            except Exception as exc:
                report["browser_attempts"].append({
                    "binary": binary, "result": "FAILED",
                    "error": str(exc).splitlines()[0][:250],
                })
        if browser is None:
            report["error"] = "No authorized suitable Chromium binary launched"
            return report

        try:
            for viewport in args.viewport:
                page = browser.new_page(viewport=viewport, device_scale_factor=1)
                try:
                    page.set_content(html, wait_until="load", timeout=10000)
                    name = f'captured_{viewport["width"]}x{viewport["height"]}.png'
                    screenshot = args.out / name
                    page.screenshot(path=str(screenshot), full_page=True)
                    record = {
                        "viewport": viewport, "screenshot": str(screenshot),
                        "sha256": hashlib.sha256(screenshot.read_bytes()).hexdigest(),
                        "target": page.evaluate(LAYOUT_JS, args.target),
                        "interaction": None, "motion": None, "keyboard": None, "dialog": None,
                    }
                    if args.action and args.state:
                        state = page.locator(args.state).first
                        action = page.locator(args.action).first
                        if state.count() == 0 or action.count() == 0:
                            missing = []
                            if state.count() == 0:
                                missing.append("state selector absent")
                            if action.count() == 0:
                                missing.append("action selector absent")
                            record["interaction"] = {
                                "before": None, "after": None, "changed": False,
                                "error": ", ".join(missing),
                            }
                        else:
                            before = state.inner_text(timeout=1500)
                            click_error = None
                            try:
                                action.click(timeout=2000)
                                try:
                                    page.wait_for_function(
                                        "({selector,before}) => {const e=document.querySelector(selector); return e && e.textContent.trim() !== before;}",
                                        arg={"selector": args.state, "before": before},
                                        timeout=1500,
                                    )
                                except PlaywrightTimeoutError:
                                    pass  # An unchanged state is recorded as a QA failure below.
                            except Exception as exc:
                                click_error = str(exc).splitlines()[0][:280]
                            after = state.inner_text(timeout=1500)
                            capture = args.out / f'interaction_{viewport["width"]}x{viewport["height"]}.png'
                            page.screenshot(path=str(capture), full_page=True)
                            record["interaction"] = {
                                "before": before, "after": after,
                                "changed": before != after, "error": click_error,
                                "screenshot": str(capture),
                                "sha256": hashlib.sha256(capture.read_bytes()).hexdigest(),
                            }
                    if args.keyboard:
                        keyboard_page = browser.new_page(viewport=viewport, device_scale_factor=1)
                        try:
                            keyboard_page.set_content(html, wait_until="load", timeout=10000)
                            kb_state = keyboard_page.locator(args.state).first
                            kb_action = keyboard_page.locator(args.action).first
                            found = kb_state.count() > 0 and kb_action.count() > 0
                            before = kb_state.inner_text(timeout=1500) if found else None
                            reached = False
                            focus_shot = None
                            after_shot = None
                            after = None
                            if found:
                                for _ in range(30):
                                    keyboard_page.keyboard.press("Tab")
                                    reached = keyboard_page.evaluate(
                                        "selector => document.activeElement === document.querySelector(selector)",
                                        args.action,
                                    )
                                    if reached:
                                        break
                                if reached:
                                    focus_shot = args.out / f'keyboard_focus_{viewport["width"]}x{viewport["height"]}.png'
                                    keyboard_page.screenshot(path=str(focus_shot), full_page=True)
                                    keyboard_page.keyboard.press("Enter")
                                    try:
                                        keyboard_page.wait_for_function(
                                            "({selector,before}) => {const e=document.querySelector(selector); return e && e.textContent.trim() !== before;}",
                                            arg={"selector": args.state, "before": before},
                                            timeout=1500,
                                        )
                                    except PlaywrightTimeoutError:
                                        pass
                                    after = kb_state.inner_text(timeout=1500)
                                    after_shot = args.out / f'keyboard_after_{viewport["width"]}x{viewport["height"]}.png'
                                    keyboard_page.screenshot(path=str(after_shot), full_page=True)
                            record["keyboard"] = {
                                "tab_reachable": reached,
                                "before": before,
                                "after": after,
                                "enter_changed": bool(reached and before != after),
                                "focus_screenshot": str(focus_shot) if focus_shot else None,
                                "after_screenshot": str(after_shot) if after_shot else None,
                                "reason": "action/state selector missing" if not found else
                                          "action cannot be reached by Tab" if not reached else
                                          None if before != after else "Enter did not change visible state",
                            }
                        finally:
                            keyboard_page.close()
                    if args.dialog:
                        dialog_page = browser.new_page(viewport=viewport, device_scale_factor=1)
                        try:
                            dialog_page.set_content(html, wait_until="load", timeout=10000)
                            trigger = dialog_page.locator(args.action).first
                            modal = dialog_page.locator(args.dialog).first
                            if trigger.count() == 0 or modal.count() == 0:
                                record["dialog"] = {"opened": False, "focus_inside": False,
                                    "tabs_trapped": False, "escape_closed": False,
                                    "focus_restored": False, "reason": "trigger/dialog selector missing"}
                            else:
                                trigger.click(timeout=2000)
                                opened = modal.is_visible()
                                open_shot = args.out / f'dialog_open_{viewport["width"]}x{viewport["height"]}.png'
                                dialog_page.screenshot(path=str(open_shot), full_page=True)
                                inside = dialog_page.evaluate(
                                    "sel => document.querySelector(sel).contains(document.activeElement)",
                                    args.dialog) if opened else False
                                tabs = []
                                if opened:
                                    for _ in range(6):
                                        dialog_page.keyboard.press("Tab")
                                        tabs.append(dialog_page.evaluate(
                                            "sel => document.querySelector(sel).contains(document.activeElement)",
                                            args.dialog))
                                    dialog_page.keyboard.press("Escape")
                                closed = not modal.is_visible()
                                restored = dialog_page.evaluate(
                                    "sel => document.querySelector(sel)===document.activeElement",
                                    args.action) if closed else False
                                close_shot = args.out / f'dialog_after_escape_{viewport["width"]}x{viewport["height"]}.png'
                                dialog_page.screenshot(path=str(close_shot), full_page=True)
                                record["dialog"] = {
                                    "opened": opened,
                                    "focus_inside": inside,
                                    "tabs_trapped": bool(tabs and all(tabs)),
                                    "tab_results": tabs,
                                    "escape_closed": closed,
                                    "focus_restored": restored,
                                    "open_screenshot": str(open_shot),
                                    "after_escape_screenshot": str(close_shot),
                                    "open_sha256": hashlib.sha256(open_shot.read_bytes()).hexdigest(),
                                    "after_escape_sha256": hashlib.sha256(close_shot.read_bytes()).hexdigest(),
                                }
                        finally:
                            dialog_page.close()
                    if args.motion:
                        duration = page.evaluate("""selector => {
                           const node=document.querySelector(selector);
                           if (!node) return [];
                           return node.getAnimations({subtree:true}).map(a =>
                               ({duration:a.effect.getTiming().duration,
                                 pseudo:a.effect.pseudoElement}));
                        }""", args.motion)
                        record["motion"] = {
                            "animations": duration,
                            "expected_duration_ms": args.expected_duration,
                            "duration_matches": (
                                any(a["duration"] == args.expected_duration for a in duration)
                                if args.expected_duration is not None else None
                            ),
                        }
                        for ms in ((0, 250, 500) if page.locator(args.motion).count() else ()):
                            page.evaluate("""arg => {
                                const node=document.querySelector(arg.selector);
                                if (!node) return;
                                for (const a of node.getAnimations({subtree:true})) {
                                    a.pause(); a.currentTime=arg.ms;
                                }
                            }""", {"selector": args.motion, "ms": ms})
                            dest = args.out / f'motion_{viewport["width"]}_{ms}.png'
                            page.locator(args.motion).screenshot(path=str(dest))
                    report["viewports"].append(record)
                finally:
                    page.close()
        finally:
            browser.close()

    failures = []
    for record in report["viewports"]:
        location = f'{record["viewport"]["width"]}x{record["viewport"]["height"]}'
        target = record["target"]
        if not target.get("found") or target.get("clipped"):
            failures.append(f"layout@{location}")
        interaction = record["interaction"]
        if interaction and (not interaction["changed"] or interaction["error"]):
            failures.append(f"interaction@{location}")
        keyboard = record["keyboard"]
        if keyboard and (not keyboard["tab_reachable"] or not keyboard["enter_changed"]):
            failures.append(f"keyboard@{location}")
        dialog = record["dialog"]
        if dialog and not all(dialog.get(key) for key in (
            "opened", "focus_inside", "tabs_trapped", "escape_closed", "focus_restored"
        )):
            failures.append(f"dialog@{location}")
        motion = record["motion"]
        if motion and (not motion["animations"] or motion["duration_matches"] is False):
            failures.append(f"motion-duration@{location}")
    report["failed_checks"] = failures
    report["status"] = "CHECKS_FAIL" if failures else "CHECKS_PASS_REVIEW_PIXELS"
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--viewport", type=parse_viewport, action="append", default=[])
    parser.add_argument("--target", default="body",
                        help="CSS selector for a critical visible element")
    parser.add_argument("--action", help="CSS selector to click")
    parser.add_argument("--state", help="CSS selector whose visible text must change")
    parser.add_argument("--keyboard", action="store_true",
                        help="also require Tab reachability and Enter-triggered visible state change")
    parser.add_argument("--dialog", help="CSS selector for an expected modal dialog; verify focus trap, Escape and restoration")
    parser.add_argument("--motion", help="CSS selector with animation(s) to sample")
    parser.add_argument("--expected-duration", type=int,
                        help="required animation duration in milliseconds")
    parser.add_argument("--browser", help="initial Chromium executable to try")
    args = parser.parse_args(argv)
    if bool(args.action) != bool(args.state):
        parser.error("--action and --state must be used together")
    if args.expected_duration is not None and not args.motion:
        parser.error("--expected-duration requires --motion")
    if args.keyboard and not (args.action and args.state):
        parser.error("--keyboard requires --action and --state")
    if args.dialog and not (args.action and args.state):
        parser.error("--dialog requires --action and --state")
    if not args.viewport:
        args.viewport = [{"width": 1280, "height": 800},
                         {"width": 390, "height": 844}]
    if not args.html.is_file():
        parser.error(f"fixture does not exist: {args.html}")

    args.out.mkdir(parents=True, exist_ok=True)
    try:
        report = run(args)
    except Exception as exc:
        (args.out / "probe.json").write_text(
            json.dumps({"status": "BLOCKED_ENV", "error": str(exc)[:500]}, indent=2),
            encoding="utf-8",
        )
        print(f"BLOCKED_ENV: {exc}", file=sys.stderr)
        return 2
    (args.out / "probe.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps({
        "status": report["status"],
        "browser_attempts": report["browser_attempts"],
        "failed_checks": report.get("failed_checks", []),
        "evidence_dir": str(args.out),
    }, indent=2))
    return (2 if report["status"] == "BLOCKED_ENV"
            else 1 if report["status"] == "CHECKS_FAIL" else 0)


if __name__ == "__main__":
    raise SystemExit(main())
