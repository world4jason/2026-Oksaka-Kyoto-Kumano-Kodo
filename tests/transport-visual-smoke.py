#!/usr/bin/env python3
"""Local browser acceptance for the Kansai transport board."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
OUT = Path(__file__).resolve().parents[1] / "docs" / "ui-proof"
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    chrome = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    browser=pw.chromium.launch(headless=True,**({"executable_path":str(chrome)} if chrome.exists() else {}))
    errors=[]
    for width,height,name in [(390,844,"mobile"),(1100,900,"desktop"),(320,780,"narrow")]:
        page=browser.new_page(viewport={"width":width,"height":height})
        page.on("pageerror",lambda e: errors.append(str(e)))
        page.goto(os.getenv("TRAVEL_LITE_TEST_URL","http://127.0.0.1:8107/"),wait_until="domcontentloaded")
        page.wait_for_selector(".tl-overview-card",timeout=15000)
        assert page.locator(".tl-overview-card").count()==11
        page.screenshot(path=str(OUT / f"{name}-overview.png"))
        page.locator(".tl-overview-card[data-trip-day='2026-11-11']").click()
        page.wait_for_selector(".trip-day-view .tl-board")
        assert page.locator(".trip-day-view .tl-leg").count()==7
        assert page.locator(".tl-complete-itinerary").count()==1
        assert not page.locator(".tl-complete-itinerary").evaluate("(e)=>e.open")
        page.screenshot(path=str(OUT / f"{name}-kumano-trip.png"))
        page.locator(".tl-branches summary").click()
        assert page.locator(".tl-branch").count()==5
        page.screenshot(path=str(OUT / f"{name}-kumano-alternatives.png"))
        maps=page.locator("#bottom-nav button").filter(has_text="交通")
        assert maps.count()>0,page.locator("#bottom-nav").inner_text()
        maps.first.click()
        page.wait_for_selector(".tl-map-optional")
        assert page.locator(".tl-board").count()==1
        assert page.locator(".tl-leg").count()==7
        page.screenshot(path=str(OUT / f"{name}-kumano-transport.png"))
        sizes=page.evaluate("() => ({width:document.documentElement.scrollWidth,viewport:window.innerWidth})")
        print(name,sizes)
        if sizes["width"]>width+3:errors.append(f"{name} overflow {sizes}")
        page.close()
    browser.close()
    assert not errors,errors
    print("PASS: 11 days, 7 Kumano transport stages, 5 alternatives, 3 breakpoints")
