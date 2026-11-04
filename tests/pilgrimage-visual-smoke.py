#!/usr/bin/env python3
"""Browser QA for the Kumano credential pickup and pilgrimage stamps."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = root / "docs" / "ui-proof"
out.mkdir(parents=True, exist_ok=True)
base = os.getenv("TRAVEL_LITE_TEST_URL", "http://127.0.0.1:8109/").rstrip("/") + "/"
chrome = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True, **({"executable_path": str(chrome)} if chrome.exists() else {}))
    failures = []
    for width, height, name in [(320, 780, "narrow"), (390, 844, "mobile"), (1100, 900, "desktop")]:
        page = browser.new_page(viewport={"width": width, "height": height})
        page.on("pageerror", lambda error: failures.append(str(error)))

        page.goto(base + "#trip/day/2026-11-10", wait_until="domcontentloaded")
        page.wait_for_selector(".tl-credential-card", timeout=15000)
        assert page.locator(".tl-credential-free").inner_text() == "免費"
        assert page.locator(".tl-credential-main").inner_text().count("18:00") >= 1
        assert not page.locator(".tl-credential-details").evaluate("(el) => el.open")
        page.locator(".tl-credential-card").screenshot(
            path=str(out / f"{name}-credential-pickup.png"))
        page.locator(".tl-credential-details summary").click()
        assert page.locator(".tl-credential-kind").count() == 2
        assert page.locator(".tl-pickup-sites li").count() == 5
        assert "41" in page.locator(".tl-credential-kind").nth(1).inner_text()
        assert "田邊市觀光中心" in page.locator(".tl-pickup-sites").inner_text()
        page.locator(".tl-credential-card").screenshot(
            path=str(out / f"{name}-credential-options.png"))

        page.goto(base + "#trip/day/2026-11-11", wait_until="domcontentloaded")
        page.wait_for_selector(".tl-stamp-card")
        assert page.locator(".tl-stamp-heading").inner_text().count("7 處") == 1
        assert page.locator(".tl-board .tl-leg").count() == 7
        assert not page.locator(".tl-stamp-card").evaluate("(el) => el.open")
        page.locator(".tl-stamp-card summary").click()
        assert page.locator(".tl-stamp-stop").count() == 7
        assert "完成章" in page.locator(".tl-stamp-guide-tip").inner_text()
        page.locator(".tl-stamp-card").screenshot(
            path=str(out / f"{name}-kumano-stamp-stops.png"))

        page.goto(base + "#trip/day/2026-11-12", wait_until="domcontentloaded")
        page.wait_for_selector(".tl-stamp-card")
        page.locator(".tl-stamp-card summary").click()
        assert page.locator(".tl-stamp-stop").count() == 3
        assert "飛瀧神社" in page.locator(".tl-stamp-stops").inner_text()
        assert "青岸渡寺" in page.locator(".tl-stamp-stops").inner_text()

        dims = page.evaluate("""() => ({
          viewport: innerWidth, scroll: document.documentElement.scrollWidth
        })""")
        if dims["scroll"] > dims["viewport"] + 3:
            failures.append(f"{name}: horizontal overflow {dims}")
        page.evaluate("document.documentElement.style.fontSize = '200%'")
        dims = page.evaluate("""() => ({
          viewport: innerWidth, scroll: document.documentElement.scrollWidth
        })""")
        if dims["scroll"] > dims["viewport"] + 3:
            failures.append(f"{name}: 200% zoom horizontal overflow {dims}")
        print(f"PASS {name} {width}px: pickup 2 credentials / 5 locations; stamps 7+3")
        page.close()
    browser.close()
    assert not failures, failures
    print("PASS: browser QA, no JavaScript errors or horizontal overflow")
