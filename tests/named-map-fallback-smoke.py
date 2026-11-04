#!/usr/bin/env python3
"""Browser checks: map fallback uses place-name directions without coordinates."""
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "ui-proof"
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv("TRAVEL_LITE_TEST_URL", "http://127.0.0.1:8107/").rstrip("/") + "/"
chrome = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, **({"executable_path": str(chrome)} if chrome.exists() else {}))
    failures = []
    for width, height, name in [(320, 780, "narrow"), (390, 844, "mobile"), (1100, 900, "desktop")]:
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        page.on("pageerror", lambda e: failures.append(str(e)))
        page.goto(BASE + "#map/day/2026-11-11", wait_until="domcontentloaded")
        page.wait_for_selector(".tl-map-named", timeout=15000)
        assert page.locator(".runtime-map-panel").count() == 0, "Blank map must be replaced"
        assert page.locator(".tl-board .tl-leg").count() == 7
        assert page.locator(".tl-map-named .tl-named-link").count() == 7
        assert not page.locator(".tl-map-named").evaluate("(e) => e.open")
        page.locator(".tl-map-named summary").click()
        source = page.locator(".tl-named-link").filter(has_text="52 川丈線").locator("a").first
        url = urlparse(source.get_attribute("href"))
        args = parse_qs(url.query)
        assert url.path == "/maps/dir/" and url.netloc == "www.google.com", url
        assert args["api"] == ["1"] and args["travelmode"] == ["transit"], args
        assert "大斎原前" in args["origin"][0] and "速玉大社前" in args["destination"][0], args
        walk = page.locator(".tl-named-link").filter(has_text="中邊路 7km").locator("a").first
        walk_args = parse_qs(urlparse(walk.get_attribute("href")).query)
        assert walk_args["travelmode"] == ["walking"], walk_args
        route = page.locator(".tl-leg").filter(has_text="52 川丈線").locator(".tl-map-link").first
        assert route.get_attribute("href") == source.get_attribute("href")
        # Focused component proof: suppress only the fixed bottom navigation overlay during capture.
        page.locator("#bottom-nav").evaluate("(el) => { el.style.visibility = 'hidden'; }")
        page.locator(".tl-map-named").screenshot(path=str(OUT / f"{name}-named-map-routes.png"))
        page.locator("#bottom-nav").evaluate("(el) => { el.style.visibility = ''; }")
        size = page.evaluate("() => ({width:document.documentElement.scrollWidth,viewport:innerWidth})")
        assert size["width"] <= size["viewport"] + 3, size
        page.goto(BASE + "#map/day/2026-11-06", wait_until="domcontentloaded")
        page.wait_for_selector(".tl-map-named")
        page.locator(".tl-map-named summary").click()
        assert page.locator(".tl-named-link").count() == 5
        assert "/maps/search/" in page.locator(".tl-named-link a").first.get_attribute("href")
        page.goto(BASE + "#map/day/2026-11-04", wait_until="domcontentloaded")
        page.wait_for_selector(".tl-map-named")
        assert "/maps/search/" in page.locator(".tl-leg").first.locator(".tl-map-link").get_attribute("href"), "Flight is not street directions"
        print(f"PASS {name} {width}px: named stop routes, 52 bus, hiking, 5 alternatives, flight search")
        page.close()
    browser.close()
    assert not failures, failures
    print("PASS: no blank maps, no JS errors, no horizontal overflow")
