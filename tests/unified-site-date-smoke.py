#!/usr/bin/env python3
"""User-site PDCA C gate: date selection is shared by Trip, Transport, Places."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv("TRAVEL_LITE_TEST_URL","http://127.0.0.1:8114/").rstrip("/")+"/"
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs"/"ui-proof"
OUT.mkdir(parents=True,exist_ok=True)
CHROME=Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
STYLES=["editorial","storybook","candy","risograph","paper-collage","naive-city",
        "taiwan-poster","field-stamp","quiet-linocut","doodle-memory-grid",
        "crayon-journal","painterly-editorial","geometric-print","quiet-acrylic","vintage-watercolor"]
errors=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({"executable_path":str(CHROME)} if CHROME.exists() else {}))
  for style in STYLES:
    for width,height in [(320,568),(390,844),(1100,900)]:
      p=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
      p.on("pageerror",lambda e:errors.append(str(e)))
      p.goto(BASE+"?previewStyle="+style+"#trip/overview",wait_until="domcontentloaded")
      p.wait_for_selector(".unified-date-nav",state="attached",timeout=15000)
      assert p.locator(".trip-overview-day").count()==11
      if width<900:
        assert p.locator(".unified-date-nav").is_visible()
        assert not p.locator(".long-trip-nav").is_visible()
        assert not p.locator(".trip-v2-tabs").is_visible()
      else:
        assert p.locator(".shell-context-left").is_visible()
        assert not p.locator(".unified-date-nav").is_visible()
      if width<900:
        p.locator("[data-unified-date-select]").select_option("2026-11-05")
      else:
        p.locator(".shell-context-left [data-shell-day='2026-11-05']").click()
      p.wait_for_selector(".tl-board")
      assert p.locator(".tl-leg").count()==14
      if width<900:
        assert p.locator("[data-unified-date-select]").input_value()=="2026-11-05"
      if width==390 and style=="vintage-watercolor":
        p.screenshot(path=str(OUT/"phone-unified-ise-trip.png"))
      p.locator("#bottom-nav button").filter(has_text="交通").click()
      p.wait_for_selector(".tl-board")
      assert p.locator(".tl-leg").count()==14
      assert p.locator(".unified-date-nav").is_visible()
      assert p.locator("[data-unified-date-select]").input_value()=="2026-11-05"
      assert not p.locator(".map-day-tabs").is_visible()
      if width==390 and style=="vintage-watercolor":
        p.screenshot(path=str(OUT/"phone-unified-ise-transport.png"))
      p.locator("#bottom-nav button").filter(has_text="景點").click()
      p.wait_for_selector(".unified-date-nav")
      assert not p.locator(".places-date-picker").is_visible()
      # Independent Places All mode must not erase shared 11/05 date.
      assert p.evaluate("state.selectedDate")=="2026-11-05"
      assert p.locator("[data-unified-date-select]").input_value()=="overview"
      p.locator("[data-unified-date-select]").select_option("2026-11-05")
      p.wait_for_selector(".places-card")
      assert p.locator(".places-card").count()>=4
      if width==390 and style=="vintage-watercolor":
        p.screenshot(path=str(OUT/"phone-unified-ise-places.png"))
      # New Places date handoff must affect Transport day; Trip retains Day mode.
      p.locator("[data-unified-date-select]").select_option("2026-11-11")
      p.locator("#bottom-nav button").filter(has_text="交通").click()
      p.wait_for_selector(".tl-board")
      assert p.locator("[data-unified-date-select]").input_value()=="2026-11-11"
      assert "熊野古道" in p.locator(".tl-board-title h2").inner_text()
      p.locator("#bottom-nav button").filter(has_text="行程").click()
      assert "熊野古道" in p.locator(".tl-board-title h2").inner_text()
      assert p.evaluate("state.selectedDate")=="2026-11-11"
      dims=p.evaluate("({screen:innerWidth,scroll:document.documentElement.scrollWidth})")
      assert dims["scroll"]<=width+3,(style,width,dims)
      if width==320 and style=="vintage-watercolor":
        p.evaluate("document.documentElement.style.fontSize='200%'")
        dims=p.evaluate("({screen:innerWidth,scroll:document.documentElement.scrollWidth})")
        assert dims["scroll"]<=width+3,("200pct",dims)
      p.close()
    print("PASS",style,"320/390/1100")
  # Hash/Back, refresh, legacy date route and Overview independently.
  p=browser.new_page(viewport={"width":390,"height":844})
  p.goto(BASE+"#trip/overview",wait_until="domcontentloaded")
  p.wait_for_selector(".unified-date-nav")
  p.locator("[data-unified-date-select]").select_option("2026-11-05")
  p.locator("[data-unified-date-select]").select_option("2026-11-11")
  p.go_back()
  p.wait_for_function("document.querySelector('[data-unified-date-select]')?.value === '2026-11-05'")
  assert p.locator("[data-unified-date-select]").input_value()=="2026-11-05"
  p.reload()
  p.wait_for_selector(".unified-date-nav")
  assert p.locator("[data-unified-date-select]").input_value()=="2026-11-05"
  p.goto(BASE+"#map/day/2026-11-11",wait_until="domcontentloaded")
  p.wait_for_selector(".unified-date-nav")
  assert p.locator("[data-unified-date-select]").input_value()=="2026-11-11"
  p.goto(BASE+"#places",wait_until="domcontentloaded")
  p.wait_for_selector(".unified-date-nav")
  assert p.locator("[data-unified-date-select]").input_value()=="overview"
  assert p.evaluate("state.selectedDate")=="2026-11-11"
  p.close()
  browser.close()
assert not errors,errors
print("PASS: 15 styles x 3 viewport widths, shared date, overview, history, refresh")
