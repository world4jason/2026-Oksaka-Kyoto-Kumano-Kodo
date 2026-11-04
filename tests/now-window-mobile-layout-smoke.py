#!/usr/bin/env python3
"""Now window-card alignment regression at 21:14 JST on 2026-11-04."""
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright

BASE=os.environ.get("TRAVEL_LITE_TEST_URL","http://127.0.0.1:8111/").rstrip("/")+"/"
OUT=Path(__file__).resolve().parents[1]/"docs"/"ui-proof"
OUT.mkdir(parents=True,exist_ok=True)
CHROME=Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
STYLES=[
  "editorial","storybook","candy","risograph","paper-collage","naive-city",
  "taiwan-poster","field-stamp","quiet-linocut","doodle-memory-grid","crayon-journal",
  "painterly-editorial","geometric-print","quiet-acrylic","vintage-watercolor"
]
errors=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({"executable_path":str(CHROME)} if CHROME.exists() else {}))
  for style in STYLES:
    for width in (320,360,390,1100):
      page=browser.new_page(viewport={"width":width,"height":844})
      page.on("pageerror",lambda e:errors.append(str(e)))
      page.clock.install(time=datetime(2026,11,4,21,14,tzinfo=ZoneInfo("Asia/Tokyo")))
      page.goto(BASE+"?previewStyle="+style+"#now",wait_until="domcontentloaded")
      page.wait_for_selector(".companion-window-card.current",timeout=15000)
      data=page.evaluate("""() => {
        const cards=[...document.querySelectorAll('.companion-window-card')];
        return {
          theme:document.documentElement.dataset.visualStyle,
          vw:window.innerWidth,scroll:document.documentElement.scrollWidth,
          cards:cards.map(el=>{const box=el.getBoundingClientRect(),text=el.querySelector('strong')?.getBoundingClientRect(),style=getComputedStyle(el);return{
            cls:el.className, left:box.left, right:box.right, top:box.top, bottom:box.bottom,
            inset:(text?.left??0)-box.left, paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),
            title:el.querySelector('strong')?.textContent,
          }})
        }
      }""")
      assert len(data["cards"])==3,(style,width,data)
      assert data["scroll"]<=width+3,(style,width,"overflow",data["scroll"])
      if width<=390:
        assert all(c["inset"]>=12 for c in data["cards"]),(style,width,data)
        assert max(c["paddingLeft"] for c in data["cards"])-min(c["paddingLeft"] for c in data["cards"])<=1,(style,width,data)
        assert all(data["cards"][i+1]["top"]-data["cards"][i]["bottom"]>=5 for i in range(2)),(style,width,data)
      if width==360 and style=="vintage-watercolor":
        page.locator(".companion-window").screenshot(path=str(OUT/"now-window-360-after.png"))
      if width==390 and style=="vintage-watercolor":
        page.locator(".companion-window").screenshot(path=str(OUT/"now-window-390-after.png"))
      if width==320 and style=="vintage-watercolor":
        page.evaluate("document.documentElement.style.fontSize='200%'")
        z=page.evaluate("({vw:innerWidth,doc:document.documentElement.scrollWidth})")
        assert z["doc"]<=z["vw"]+3,("200% zoom overflow",z)
        pg=page.locator(".companion-window-card").all()
        assert all(el.evaluate("(e)=>e.querySelector('strong').getBoundingClientRect().left-e.getBoundingClientRect().left>=12") for el in pg)
      page.close()
    print("PASS",style,"320/360/390/1100")
  browser.close()
assert not errors,errors
print("PASS: 15 style packs, 4 viewport widths, freeze-time 21:14 JST, 200% text zoom, zero JS errors")
