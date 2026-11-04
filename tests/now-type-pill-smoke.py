#!/usr/bin/env python3
"""QA: Now's flexible items must render readable category tags in Style Packs.

Reproduce at Nov 4, 2026, when the trip has floating transport / stay items.
"""
from datetime import datetime
from pathlib import Path
import os

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "ui-proof"
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv("TRAVEL_LITE_TEST_URL", "http://127.0.0.1:8123/").rstrip("/") + "/"
STYLES = [
    "editorial", "storybook", "candy", "paper-collage", "naive-city",
    "risograph", "taiwan-poster", "field-stamp", "quiet-linocut",
    "doodle-memory-grid", "crayon-journal", "painterly-editorial",
    "geometric-print", "quiet-acrylic", "vintage-watercolor",
]

def inspect(page):
    return page.evaluate("""() => ({
       scroll: document.documentElement.scrollWidth,
       viewport: innerWidth,
       tags: [...document.querySelectorAll(".companion-floating-list .type-pill")].map(el => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          ctx.font = style.font;
          return {
            text: el.textContent.trim(),
            width: rect.width,
            height: rect.height,
            contentMinWidth: ctx.measureText(el.textContent.trim()).width
                + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
                + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            paddingLeft: parseFloat(style.paddingLeft),
            paddingRight: parseFloat(style.paddingRight),
            radius: style.borderRadius,
            whiteSpace: style.whiteSpace
          };
       })
    })""")

with sync_playwright() as pw:
    browser_executable = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    browser = pw.chromium.launch(
        headless=True,
        **({"executable_path": str(browser_executable)} if browser_executable.exists() else {})
    )
    for width, height in [(320, 780), (390, 844)]:
        for style in STYLES:
            page = browser.new_page(
                viewport={"width": width, "height": height},
                device_scale_factor=1
            )
            errors = []
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.clock.install(time=datetime.fromisoformat("2026-11-04T09:29:00+00:00"))
            page.goto(BASE + "?previewStyle=" + style + "#now", wait_until="domcontentloaded")
            page.wait_for_selector(".companion-floating-list .type-pill", timeout=15000)
            page.evaluate("document.fonts.ready")
            before = inspect(page)
            assert [tag["text"] for tag in before["tags"]] == ["transport", "stay"], (width, style, before)
            assert before["scroll"] <= width + 3, (width, style, before)
            for tag in before["tags"]:
                assert tag["width"] + 2 >= tag["contentMinWidth"], (width, style, tag)
                assert tag["scrollWidth"] <= tag["clientWidth"] + 2, (width, style, tag)
                assert tag["whiteSpace"] == "nowrap", (width, style, tag)
            if style == "vintage-watercolor":
                assert all(t["paddingLeft"] >= 8 and t["paddingRight"] >= 8 for t in before["tags"])
                assert all(t["radius"] == "8px" for t in before["tags"])
                if width == 390:
                    page.locator(".companion-floating-list").screenshot(
                        path=str(OUT / "now-type-pill-vintage-after.png"))
            # Android may apply large text via accessibility settings.
            page.evaluate("document.documentElement.style.fontSize='200%'")
            after = inspect(page)
            assert after["scroll"] <= width + 3, (width, style, after)
            assert all(t["scrollWidth"] <= t["clientWidth"] + 2 for t in after["tags"]), (width, style, after)
            assert not errors, (width, style, errors)
            page.close()
        print(f"PASS {width}px, {len(STYLES)} visual styles: intrinsic tags and 200% font scaling")
    browser.close()
print("PASS: template category tags remain readable on narrow mobile")
