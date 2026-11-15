/* Map regression contracts. DOM/map libraries are stubbed; browser rendering is a separate acceptance check.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const flush = () => new Promise(resolve => setImmediate(resolve));
const escape = value => String(value ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function harness({ board = false } = {}) {
  const maps = [], markers = [], rasterMaps = [], rasterMarkers = [], tileLayers = [], saved = [], observers = [];
  let leafletLoads = 0;
  let current = {};
  class Element {
    constructor(tag = "div") {
      this.tagName = tag; this.style = {}; this.dataset = {}; this.events = {};
      this.attributes = {}; this.open = false; this.classList = { toggle() {}, add() {} };
    }
    set innerHTML(value) {
      this.html = value; this.children = {};
      for (const name of ["map-raster-frame", "map-raster-status"]) {
        if (value.includes(`class="${name}"`)) this.children["." + name] = new Element();
      }
    }
    get innerHTML() { return this.html || ""; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, callback) { this.events[name] = callback; }
    appendChild(child) { this.child = child; }
    before(element) { if (this === current.panel) current.disclosure = element; }
    insertAdjacentHTML(position, html) { this.inserted = (this.inserted || "") + html; }
    querySelector(selector) { return this.children?.[selector] || null; }
    querySelectorAll() { return []; }
  }
  const root = new Element();
  Object.defineProperty(root, "innerHTML", {
    get() { return this.html || ""; },
    set(value) {
      this.html = value;
      current = { panel: new Element(), tabs: new Element(), container: new Element(), disclosure: null };
    },
  });
  root.querySelector = selector => ({
    ".runtime-map-panel": current.panel, ".map-day-tabs": current.tabs,
    ".tl-map-optional": current.disclosure,
  })[selector] || null;
  class FakeMap {
    constructor(options) { this.options = options; this.events = {}; maps.push(this); }
    once(name, fn) { this.events[name] = fn; }
    on(name, fn) { this.events[name] = fn; }
    addControl() {}
    fitBounds(bounds) { this.bounds = bounds.points; }
    remove() { this.removed = true; }
    resize() { this.resizes = (this.resizes || 0) + 1; }
    emit(name, event = {}) { this.events[name]?.(event); }
  }
  const library = {
    Map: FakeMap, NavigationControl: class {},
    LngLatBounds: class { constructor() { this.points = []; } extend(point) { this.points.push(point); } },
    Marker: class {
      constructor(options) { this.element = options.element; }
      setLngLat(point) { this.point = point; return this; }
      addTo(map) { this.map = map; markers.push(this); return this; }
    },
  };
  const leaflet = {
    map(frame, options) {
      const map = { frame, options, remove() { this.removed = true; },
        invalidateSize(options) { this.invalidations = (this.invalidations || 0) + 1; this.resizeOptions = options; } };
      rasterMaps.push(map); return map;
    },
    tileLayer(url, options) {
      const tiles = { url, options, events: {},
        addTo(map) { this.map = map; return this; },
        on(name, fn) { this.events[name] = fn; return this; },
        emit(name) { this.events[name]?.(); } };
      tileLayers.push(tiles); return tiles;
    },
    marker(point, options) {
      const marker = { point, options, addTo(map) { this.map = map; return this; } };
      rasterMarkers.push(marker); return marker;
    },
    divIcon: options => options,
  };
  const items = [
    { id: "shrine", title: "參拜神社", location: "大阪天滿宮", lat: 34.696, lng: 135.513,
      mapPointLabel: "大阪天満宮", mapQuery: "大阪天満宮 大阪市北区", start: "10:30" },
    { id: "unknown", title: "休息", location: "大阪", lat: null, lng: null },
    { id: "pier", title: "搭船前往飯店", location: "勝浦港 → 浦島", lat: "33.626", lng: "135.944",
      mapPointLabel: "勝浦観光桟橋", mapQuery: "勝浦観光桟橋 那智勝浦町", start: "17:50" },
  ];
  const day = { id: "d01", date: "2026-11-04", label: "第1天", title: "測試路線", items,
    mobility: { label: "路線", from: "大阪", to: "勝浦", legs: [
      { id: "leg-1", mode: "flight", depart: "16:25", arrive: "19:40", from: "桃園 TPE", to: "關西 KIX", service: "IT212" },
    ] } };
  const context = vm.createContext({
    URL, URLSearchParams, console: { warn() {} }, __mapLibrary: library,
    __loadLeaflet: () => { leafletLoads++; return Promise.resolve(leaflet); },
    state: { data: { trip: { center: { lat: 34, lng: 135 } }, ui: { locale: "zh-TW" }, providers: {}, days: [day] },
      selectedDate: day.date, selectedMapItemId: null, view: "map",
      itemIdentity: { isUnique: id => items.filter(item => item.id === id).length === 1 } },
    root, renderNow() {}, renderTrip() {}, renderMap() {}, render() {}, itemActions() {},
    googleMapsOpenUrl() { return ""; }, googleMapsEmbedUrl() { return ""; },
    escapeHtml: escape, escapeAttr: escape, prettyDate: value => value,
    itemIdentityWarningHtml: () => "", tripKey: key => key,
    TravelLiteStorage: { set: (key, value) => saved.push([key, value]) },
    TravelLiteProviders: { config: () => ({ mapStyle: "https://example.org/style.json" }) },
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} }, requestAnimationFrame: fn => fn(),
    addEventListener() {}, scrollTo() {}, location: { hash: "", href: "https://example.org/trip/" },
    document: { querySelector: selector => selector === "#view-root" ? root :
      selector === "#runtime-map" ? current.container : null,
      createElement: tag => new Element(tag), head: { appendChild() {} }, body: { classList: { toggle() {} } } },
  });
  context.window = context;
  // Replace only the external module boundary. The real rendering, filtering,
  // failure handling and disclosure code execute unchanged below.
  const runtime = source("runtime-features.js");
  const externalImport = 'import("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/+esm")';
  const rasterImport = 'import("https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js")';
  assert.equal(runtime.split(externalImport).length, 2);
  assert.equal(runtime.split(rasterImport).length, 2);
  vm.runInContext(runtime.replace(externalImport, "Promise.resolve(__mapLibrary)").replace(rasterImport, "__loadLeaflet()"), context);
  vm.runInContext(source("runtime-google.js"), context);
  if (board) vm.runInContext(source("journey-board.js"), context);
  return { context, day, items, maps, markers, rasterMaps, rasterMarkers, tileLayers, leaflet,
    saved, root, current: () => current, leafletLoads: () => leafletLoads,
    leaveMap() { current = {}; observers.forEach(observer => observer.callback()); } };
}

test("Map coordinates reject empty/coerced values and out-of-range points", () => {
  const { context } = harness();
  const point = context.TravelLiteMap.coordinates;
  for (const invalid of [undefined, {}, { lat: null, lng: null }, { lat: "", lng: " " },
    { lat: false, lng: true }, { lat: [], lng: [] }, { lat: 91, lng: 135 },
    { lat: 34, lng: -181 }, { lat: Infinity, lng: 135 }, { lat: "bad", lng: 135 }]) {
    assert.equal(point(invalid), null, JSON.stringify(invalid));
  }
  assert.equal(point({ lat: 0, lng: 0 }).lat, 0, "explicit zero remains valid");
  assert.equal(point({ lat: "34.5", lng: "135.5" }).lng, 135.5);
});

test("Google Maps uses the precise destination, safe supplied directions and coordinate fallback", () => {
  const { context } = harness();
  const query = item => new URL(context.googleMapsOpenUrl(item)).searchParams.get("query");
  assert.equal(query({ title: "下午參拜及散步", location: "大阪天滿宮" }), "大阪天滿宮");
  assert.equal(query({ title: "搭船", location: "A → B", mapPointLabel: "勝浦観光桟橋" }), "勝浦観光桟橋");
  assert.equal(query({ mapQuery: "大阪天満宮 大阪市北区", title: "參拜" }), "大阪天満宮 大阪市北区");
  assert.equal(query({ googleQuery: "正式名稱", mapQuery: "次選名稱" }), "正式名稱");
  assert.equal(query({ lat: 34.5, lng: 135.5 }), "34.5,135.5");
  assert.equal(context.googleMapsOpenUrl({ lat: null, lng: null }), "");
  const directions = "https://www.google.com/maps/dir/?api=1&origin=A&destination=B";
  assert.equal(context.googleMapsOpenUrl({ mapsUrl: directions }), directions);
  assert.equal(query({ mapsUrl: "javascript:alert(1)", location: "大阪" }), "大阪");
  assert.equal(query({ mapsUrl: "https://user:password@example.org/", location: "京都" }), "京都");
  assert.equal(context.googleMapsEmbedUrl({ mapEmbedUrl: "javascript:alert(1)", location: "大阪" }), "");
});

test("Only known points get numbered markers and initial style failure keeps the map handoff", async () => {
  const h = harness();
  h.context.renderMap(); await flush();
  assert.equal(h.maps.length, 1);
  assert.equal(h.markers.length, 2, "null coordinates must not become an ocean marker");
  assert.deepEqual(h.markers.map(marker => marker.element.textContent), ["1", "3"]);
  assert.equal(h.markers[1].element.title, "3. 勝浦観光桟橋");
  assert.equal(h.markers[0].element.style.zIndex, "2");
  assert.equal(h.leafletLoads(), 0, "MapLibre remains primary and does not load the raster library");
  h.maps[0].emit("error", { error: new Error("Style request returned403") });
  await flush();
  assert.equal(h.maps[0].removed, true);
  assert.equal(h.rasterMaps.length, 1);
  assert.match(h.current().container.innerHTML, /class="map-raster-frame"/);
  assert.match(h.current().container.innerHTML, /https:\/\/www\.google\.com\/maps\/search/);

  h.context.renderMap(); await flush();
  assert.equal(h.rasterMaps[0].removed, true, "returning to MapLibre removes the prior raster instance");
  h.maps[1].emit("load");
  h.maps[1].emit("error", { error: new Error("One later tile unavailable") });
  assert.notEqual(h.maps[1].removed, true, "a loaded map survives a later tile error");
});

test("WebGL failure renders only the selected known point with raster tiles and keeps handoffs on tile errors", async () => {
  const h = harness();
  const selected = h.items[2];
  selected.mapPointLabel = '勝浦観光桟橋 <船> "入口"';
  h.context.state.selectedMapItemId = selected.id;
  h.context.__mapLibrary.Map = class { constructor() { throw new Error("GPUInitializationError: WebGL2 unavailable"); } };
  h.context.renderMap(); await flush();
  const html = h.current().container.innerHTML;
  assert.equal(h.rasterMaps.length, 1, "constructor failure must provide a map that does not require WebGL");
  assert.doesNotMatch(html, /<iframe\b|export\/embed/);
  assert.deepEqual(Array.from(h.rasterMaps[0].options.center), [33.626, 135.944]);
  assert.equal(h.rasterMaps[0].options.attributionControl, true);
  assert.equal(h.rasterMarkers.length, 1, "fallback marks one selected stop without inventing a route");
  assert.deepEqual(Array.from(h.rasterMarkers[0].point), [33.626, 135.944]);
  assert.equal(h.rasterMarkers[0].options.title, selected.mapPointLabel);
  assert.equal(h.tileLayers[0].url, "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  assert.equal(h.tileLayers[0].options.keepBuffer, 0);
  assert.equal(h.tileLayers[0].options.updateWhenIdle, true);
  assert.match(h.tileLayers[0].options.attribution, /©.*https:\/\/www\.openstreetmap\.org\/copyright.*OpenStreetMap/);
  assert.match(html, /aria-label="OpenStreetMap · 勝浦観光桟橋 &lt;船&gt; &quot;入口&quot;"/);
  assert.match(html, /勝浦観光桟橋 &lt;船&gt; &quot;入口&quot;/);
  assert.ok(html.includes(escape(h.context.googleMapsOpenUrl(selected))), "external link remains outside the raster map");
  h.tileLayers[0].emit("tileerror");
  assert.match(h.current().container.querySelector(".map-raster-status").textContent, /Google Maps/);
  assert.ok(h.current().container.innerHTML.includes(escape(h.context.googleMapsOpenUrl(selected))));
  const invalidations = h.rasterMaps[0].invalidations;
  h.context.TravelLiteMap.resize();
  assert.equal(h.rasterMaps[0].invalidations, invalidations + 1, "revealing the disclosure resizes the raster map");
  assert.equal(h.rasterMaps[0].resizeOptions.pan, false);

  h.context.state.selectedMapItemId = "unknown";
  h.context.renderMap(); await flush();
  assert.equal(h.rasterMaps[0].removed, true);
  assert.equal(h.rasterMaps.length, 1,
    "a selected stop without coordinates must not inherit a different stop's map");
  assert.match(h.current().container.innerHTML, /在 Google Maps 開啟/);
});

test("A delayed raster import creates only the newest selected map and leaving removes it", async () => {
  const h = harness();
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  h.context.__loadLeaflet = () => pending;
  h.context.__mapLibrary.Map = class { constructor() { throw new Error("WebGL unavailable"); } };
  h.context.renderMap(); await flush();
  h.context.state.selectedMapItemId = "pier";
  h.context.renderMap(); await flush();
  resolve(h.leaflet); await flush();
  assert.equal(h.rasterMaps.length, 1, "stale selection must not initialize a map in a replaced container");
  assert.deepEqual(Array.from(h.rasterMaps[0].options.center), [33.626, 135.944]);
  h.leaveMap();
  assert.equal(h.rasterMaps[0].removed, true, "leaving the map removes event listeners and tile layers");
});

test("Navigating away during raster loading discards its asynchronous result", async () => {
  const h = harness();
  let resolve;
  h.context.__loadLeaflet = () => new Promise(done => { resolve = done; });
  h.context.__mapLibrary.Map = class { constructor() { throw new Error("WebGL unavailable"); } };
  h.context.renderMap(); await flush();
  h.context.state.view = "trip";
  h.leaveMap();
  resolve(h.leaflet); await flush();
  assert.equal(h.rasterMaps.length, 0);
  assert.equal(h.tileLayers.length, 0);
});

test("Raster-library failure retains the selected place's external map link", async () => {
  const h = harness();
  h.context.__loadLeaflet = () => Promise.reject(new Error("CDN unavailable"));
  h.context.__mapLibrary.Map = class { constructor() { throw new Error("WebGL unavailable"); } };
  h.context.renderMap(); await flush();
  assert.equal(h.rasterMaps.length, 0);
  assert.match(h.current().container.innerHTML, /互動地圖暫時無法載入/);
  assert.ok(h.current().container.innerHTML.includes(escape(h.context.googleMapsOpenUrl(h.items[0]))));
});

test("No-coordinate days keep a usable external map link without loading MapLibre", async () => {
  const h = harness();
  h.day.items = [h.items[1]];
  h.context.renderMap(); await flush();
  assert.equal(h.maps.length, 0);
  assert.equal(h.leafletLoads(), 0);
  assert.match(h.current().container.innerHTML, /在 Google Maps 開啟/);
  assert.doesNotMatch(h.current().container.innerHTML, /<iframe\b/);
});

test("Map disclosure stays open after marker selection and opens for an explicit place handoff", async () => {
  const h = harness({ board: true });
  h.context.renderMap(); await flush();
  assert.equal(h.current().disclosure.open, false, "transport overview starts compact");
  assert.doesNotMatch(h.current().tabs.inserted, /TPE%20%E6%97%A5%E6%9C%AC/, "Taiwan airport is not searched in Japan");
  h.current().disclosure.open = true;
  h.markers[1].element.events.click(); await flush();
  assert.equal(h.context.state.selectedMapItemId, "pier");
  assert.equal(h.current().disclosure.open, true, "selecting a marker must not hide its map");
  h.current().disclosure.events.toggle();
  assert.equal(h.maps.at(-1).resizes, 1);
  h.current().disclosure.open = false;
  h.context.renderMap(); await flush();
  assert.equal(h.current().disclosure.open, false, "an explicit collapse is respected");
  h.leaveMap();
  h.context.state.selectedMapItemId = "shrine";
  h.context.renderMap(); await flush();
  assert.equal(h.current().disclosure.open, true, "Places handoff shows the selected location");
});

test("Initial explicit stop links open before stored-view hydration and respect a later manual collapse", async () => {
  for (const route of ["map", "transport"]) {
    const h = harness({ board: true });
    h.context.location.hash = `#${route}/day/${h.day.date}/stop/pier`;
    assert.equal(h.context.state.selectedMapItemId, null, "the incoming hash has not been applied yet");
    h.context.renderMap(); await flush();
    assert.equal(h.current().disclosure.open, true, "the first stored Transport render must not create a closed disclosure");
    h.context.state.selectedMapItemId = "pier";
    h.context.renderMap(); await flush();
    assert.equal(h.current().disclosure.open, true, "applying the incoming stop keeps the map visible");
    h.current().disclosure.open = false;
    h.context.renderMap(); await flush();
    assert.equal(h.current().disclosure.open, false, "the unchanged stop hash must not override a manual collapse");
  }
});

test("Mobility rows preserve an explicit directions URL and reject unsafe schemes", async () => {
  const h = harness({ board: true });
  const link = "https://www.google.com/maps/dir/?api=1&origin=A&destination=B";
  h.day.mobility.legs[0].mapsUrl = link;
  h.context.renderMap(); await flush();
  assert.ok(h.current().tabs.inserted.includes(escape(link)));
  assert.match(h.current().tabs.inserted, /在 Google Maps 開啟 桃園 TPE → 關西 KIX；非即時班表/);
  h.day.mobility.legs[0].mapsUrl = "javascript:alert(1)";
  h.context.renderMap(); await flush();
  assert.doesNotMatch(h.current().tabs.inserted, /javascript:/);
  assert.match(h.current().tabs.inserted, /maps\/search/);
});

test("Opening an item map follows its uniquely resolved day", () => {
  const app = source("app.js");
  const start = app.indexOf("function openMapFor(item) {");
  const end = app.indexOf("\nfunction itemActions", start);
  assert.ok(start >= 0 && end > start);
  const stored = [], state = { selectedDate: "2026-11-04", selectedMapItemId: null,
    itemIdentity: { resolveUnique: id => id === "next-day-stop" ? { day: { date: "2026-11-05" } } : null } };
  const context = vm.createContext({ state, tripKey: key => key,
    TravelLiteStorage: { set: (...values) => stored.push(values) }, setView: view => { state.view = view; } });
  vm.runInContext(app.slice(start, end), context);
  context.openMapFor({ id: "next-day-stop" });
  assert.equal(state.selectedDate, "2026-11-05");
  assert.equal(state.selectedMapItemId, "next-day-stop");
  assert.equal(state.view, "map");
  assert.deepEqual(stored, [["ui:selectedDate", "2026-11-05"]]);
});
