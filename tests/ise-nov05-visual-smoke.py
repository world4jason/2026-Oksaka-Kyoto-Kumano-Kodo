#!/usr/bin/env python3
"""Browser test of 2026-11-05 Ise new itinerary, transport and places."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parents[1]
OUT=HERE/"docs"/"ui-proof";OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv("TRAVEL_LITE_TEST_URL","http://127.0.0.1:8113/").rstrip("/")+"/"
CHROME=Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
errors=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({"executable_path":str(CHROME)} if CHROME.exists() else {}))
  for width,height,label in [(320,568,"narrow"),(390,844,"phone"),(1100,900,"desktop")]:
    page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
    page.on("pageerror",lambda err:errors.append(str(err)))
    page.goto(BASE+"#trip/day/2026-11-05",wait_until="domcontentloaded")
    page.wait_for_selector(".trip-day-view .tl-board")
    assert "伊勢內宮" in page.locator(".tl-board-title").inner_text()
    assert page.locator(".tl-leg").count()==14
    assert page.locator(".tl-board").inner_text().count("13:34")>0
    assert "14:42" in page.locator(".tl-board").inner_text()
    assert not page.locator(".tl-board").inner_text().find("07:05")>=0
    page.screenshot(path=str(OUT/f"{label}-ise-trip.png"),full_page=False)
    page.locator(".tl-branches summary").first.click()
    assert page.locator(".tl-branch").count()==7
    assert "17:22" in page.locator(".tl-branches").inner_text()
    page.screenshot(path=str(OUT/f"{label}-ise-options.png"),full_page=False)
    if width<900:
      assert page.locator(".long-trip-nav").is_visible()
      assert page.locator("[data-long-trip-select]").input_value()=="2026-11-05"
    page.goto(BASE+"#map/day/2026-11-05",wait_until="domcontentloaded")
    page.wait_for_selector(".tl-board")
    assert page.locator(".tl-leg").count()==14
    page.screenshot(path=str(OUT/f"{label}-ise-transport.png"),full_page=False)
    page.goto(BASE+"#places/day/2026-11-05",wait_until="domcontentloaded")
    page.wait_for_selector(".places-card")
    assert page.locator(".places-card").count()>=4
    page.screenshot(path=str(OUT/f"{label}-ise-places.png"),full_page=False)
    widthCheck=page.evaluate("({vw:innerWidth,sw:document.documentElement.scrollWidth})")
    assert widthCheck["sw"]<=width+3,(label,widthCheck)
    print("PASS",label,"trip 14 segments/7 backups, transport and 4 places")
    page.close()
  browser.close()
assert not errors,errors
print("PASS: Ise 3 viewports, no JS errors or horizontal overflow")
