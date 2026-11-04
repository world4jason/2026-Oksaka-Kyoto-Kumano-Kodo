#!/usr/bin/env python3
"""Regression: long trips must retain the template mobile date chooser.
Serve via python3 -m http.server 8112, then run this script.
"""
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright

BASE = os.getenv("TRAVEL_LITE_TEST_URL", "http://127.0.0.1:8112/").rstrip("/") + "/"
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
STYLES = [
  "editorial", "storybook", "candy", "risograph", "paper-collage",
  "naive-city", "taiwan-poster", "field-stamp", "quiet-linocut",
  "doodle-memory-grid", "crayon-journal", "painterly-editorial",
  "geometric-print", "quiet-acrylic", "vintage-watercolor",
]
errors = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(
        headless=True, **({"executable_path": str(CHROME)} if CHROME.exists() else {})
    )
    for style in STYLES:
        for width in [320, 360, 390, 1100]:
            page = browser.new_page(viewport={"width": width, "height": 844})
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.clock.install(time=datetime(2026, 11, 4, 12, 0, tzinfo=ZoneInfo("Asia/Tokyo")))
            page.goto(BASE + "?previewStyle=" + style + "#trip/overview", wait_until="domcontentloaded")
            page.wait_for_selector(".long-trip-nav", state="attached", timeout=12000)
            page.wait_for_function("document.querySelector('.trip-v2')?.dataset.longTrip === 'true'")
            select = page.locator("[data-long-trip-select]")
            nav = page.locator(".long-trip-nav")
            tabs = page.locator(".trip-v2-tabs")
            assert select.locator("option").count() == 12, (style, width, "missing days")
            assert select.input_value() == "overview"
            if width < 900:
                assert nav.is_visible(), (style, width, "mobile selector hidden")
                assert not tabs.is_visible(), (style, width, "duplicate mobile selector")
                assert page.locator("[data-long-trip-prev]").is_disabled()
                assert page.locator("[data-long-trip-next]").is_enabled()
                select.select_option("2026-11-11")
                page.wait_for_selector(".trip-day-view .tl-board", timeout=12000)
                assert page.locator(".tl-board-title h2").inner_text() == "熊野古道・三社同日"
                assert page.locator("[data-long-trip-select]").input_value() == "2026-11-11"
                assert page.locator(".trip-day-view .tl-leg").count() == 7
                page.locator("[data-long-trip-next]").click()
                assert page.locator("[data-long-trip-select]").input_value() == "2026-11-12"
                page.locator("[data-long-trip-prev]").click()
                assert page.locator("[data-long-trip-select]").input_value() == "2026-11-11"
                page.locator("[data-long-trip-select]").select_option("2026-11-14")
                assert page.locator("[data-long-trip-next]").is_disabled(), "last day should end list"
                page.locator("[data-long-trip-overview]").click()
                assert page.locator("[data-long-trip-select]").input_value() == "overview"
                assert page.locator(".trip-overview-day").count() == 11
            else:
                assert not nav.is_visible(), (style, width, "desktop must use tabs")
                # Desktop uses the left sidebar for date selection, not the mobile strip.
                assert page.locator(".shell-context-left").is_visible(), (style, width, "desktop sidebar missing")
                assert page.locator(".shell-context-left [data-shell-day]").count() == 11
            size = page.evaluate("({viewport:innerWidth,scroll:document.documentElement.scrollWidth})")
            assert size["scroll"] <= width + 3, (style, width, size)
            if width == 320 and style == "vintage-watercolor":
                page.evaluate("document.documentElement.style.fontSize = '200%'")
                size = page.evaluate("({viewport:innerWidth,scroll:document.documentElement.scrollWidth})")
                assert size["scroll"] <= width + 3, ("zoom", size)
            page.close()
        print("PASS", style, "320/360/390/1100")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(BASE + "#trip/day/2026-11-13", wait_until="domcontentloaded")
    page.wait_for_selector(".long-trip-nav:visible", timeout=12000)
    assert page.locator("[data-long-trip-select]").input_value() == "2026-11-13"
    assert "紀伊勝浦" in page.locator(".tl-board-title h2").inner_text()
    page.goto(BASE + "#map/day/2026-11-11", wait_until="domcontentloaded")
    page.wait_for_selector(".tl-board", timeout=12000)
    assert page.locator(".long-trip-nav").count() == 0
    browser.close()
assert not errors, errors
print("PASS: 15 styles x 4 widths, day selector, arrows, overview, deep links, transport unaffected")
