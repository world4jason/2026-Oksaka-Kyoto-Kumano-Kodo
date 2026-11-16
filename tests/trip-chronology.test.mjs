/* Published chronology and transport labels. Browser layout is a separate gate.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const escape = value => String(value ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fixture = () => ({
  date: "2026-11-05", label: "D2", title: "大阪與生駒", note: "交通與停留時間為約略安排。",
  routeSummary: ["APA", "露天神社", "大阪天滿宮", "寶山寺"],
  items: [
    { id: "walk-to-tsuyu", type: "transport", transportMode: "walk", start: "09:00", end: "09:30", title: "APA → 露天神社" },
    { id: "d04-s0-r41", type: "place", start: "09:30", end: "10:00", title: "露天神社" },
    { id: "walk-to-tenmangu", type: "transport", transportMode: "walk", start: "10:00", end: "10:30", title: "露天神社 → 大阪天滿宮" },
    { id: "d02-osaka-tenmangu", type: "place", start: "10:30", end: "11:30", title: "大阪天滿宮" },
    { id: "metro-to-ikoma", type: "transport", transportMode: "subway", start: "12:15", end: "13:00", title: "地鐵前往生駒" },
    { id: "cable-to-hozanji", type: "transport", transportMode: "cable", start: "13:10", end: "13:20", title: "鳥居前 → 寶山寺站" },
  ],
  mobility: { label: "大阪與生駒", from: "APA", to: "寶山寺", legs: [
    { id: "walk", mode: "walk", depart: "約09:00", arrive: "約09:30", from: "APA", to: "露天神社", service: "步行" },
    { id: "metro", mode: "subway", depart: "約12:15", arrive: "約13:00", from: "南森町", to: "生駒", service: "地鐵" },
    { id: "cable", mode: "cable", depart: "約13:10", arrive: "約13:20", from: "鳥居前", to: "寶山寺站", service: "生駒纜車" },
  ] },
});

function renderDay(day, locale = "zh-TW") {
  const buttons = [{ dataset: { tripDay: day.date }, addEventListener(name, callback) { this[name] = callback; } }];
  const root = { innerHTML: "", querySelectorAll: selector => selector === "[data-trip-day]" ? buttons : [], querySelector: () => null };
  const context = vm.createContext({
    URL, root, state: { data: { trip: { title: "旅程", timezone: "Asia/Tokyo" }, ui: { locale }, days: [day] },
      selectedDate: day.date, itemIdentity: { isUnique: () => true } },
    renderTrip() {}, escapeHtml: escape, escapeAttr: escape, prettyDate: value => value,
    dateRangeLabel: () => "2026-11-04 – 2026-11-14", zonedNow: () => ({ date: "2026-11-16", minuteOfDay: 0 }),
    toMinutes: value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3)),
    googleMapsOpenUrl: item => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(item.title),
    itemActions: () => "", TravelLitePlaces: { isPlace: item => item.type === "place" },
    TravelLiteStorage: { set() {} }, tripKey: value => value, location: { href: "https://example.org/trip/" },
    document: { createElement: () => ({ content: { querySelectorAll: () => [] } }) },
  });
  context.window = context;
  vm.runInContext(source("trip-view.js"), context);
  context.renderTrip();
  buttons[0].click();
  return root.innerHTML;
}

test("Trip renders walking, visits, metro and cable travel in published order without losing place actions", () => {
  const day = fixture();
  const html = renderDay(day);
  const timeline = html.match(/<ol class="timeline[^>]+>([\s\S]*?)<\/ol>/)[1];
  const rows = timeline.split('<li class="trip-stop-wrap">').slice(1);
  assert.equal(rows.length, day.items.length, "every source item remains one timeline row");
  assert.deepEqual(rows.map(row => row.match(/<h3>(.*?)<\/h3>/)[1]), day.items.map(item => escape(item.title)));
  for (const [index, mode, label] of [[0, "walk", "步行"], [2, "walk", "步行"], [4, "subway", "地鐵"], [5, "cable", "纜車"]]) {
    assert.match(rows[index], new RegExp(`transport-tag--${mode}[^>]+aria-label="${label}"`));
    assert.match(rows[index], /https:\/\/www\.google\.com\/maps\/search/);
  }
  for (const index of [1, 3]) {
    assert.doesNotMatch(rows[index], /transport-tag--/);
    assert.ok(rows[index].includes(`data-open-place="${day.items[index].id}"`), "visit identity and place action survive interleaving");
  }
  const english = renderDay(day, "en");
  for (const name of ["Walk", "Metro", "Cable car"]) assert.ok(english.includes(`aria-label="${name}"`));
});

test("Trip keeps its full timeline visible and places the collapsed transport reference afterwards", () => {
  const day = fixture(), created = [];
  const layout = { children: [] };
  const makeNode = tag => ({ tagName: tag, open: false, innerHTML: "", parentElement: null,
    remove() { if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1); this.parentElement = null; },
    appendChild(child) { child.remove(); (this.children ||= []).push(child); child.parentElement = this; },
    after(node) { const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this) + 1, 0, node); node.parentElement = parent; },
    before(node) { const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this), 0, node); node.parentElement = parent; },
    insertAdjacentHTML() { throw new Error("transport board must not precede the visible timeline"); },
  });
  const nav = makeNode("nav"), summary = makeNode("summary"), route = makeNode("route"), timeline = makeNode("section"), itemAlternative = makeNode("details");
  for (const node of [nav, summary, route, timeline]) { layout.children.push(node); node.parentElement = layout; }
  timeline.children = [itemAlternative]; itemAlternative.parentElement = timeline;
  layout.querySelector = selector => ({
    ".tl-board": created.find(node => node.innerHTML.includes('class="tl-board"')) || null,
    "[data-trip-day].active": { dataset: { tripDay: day.date } }, ".trip-v2-tabs": nav,
    ".day-summary": summary, ".trip-route-summary": route, ".trip-timeline-section": timeline,
  })[selector] || null;
  layout.querySelectorAll = selector => selector === ".trip-alternatives" ? [itemAlternative] : [];
  const root = { querySelector: selector => selector === ".trip-day-view" ? layout : null };
  const context = vm.createContext({
    state: { data: { days: [day] }, selectedDate: day.date, view: "trip" },
    renderTrip() {}, renderMap() {}, renderNow() {}, render() {},
    location: { hash: "#trip/day/2026-11-05" }, scrollTo() {},
    document: { querySelector: () => root,
      createElement: tag => { const node = makeNode(tag); created.push(node); return node; },
      body: { classList: { toggle() {} } } },
  });
  context.window = context;
  vm.runInContext(source("journey-board.js"), context);
  context.renderTrip();
  assert.equal(created.length, 1);
  const reference = created[0];
  assert.equal(reference.tagName, "details");
  assert.equal(reference.open, false, "extra transport detail is opt-in");
  assert.deepEqual(layout.children, [nav, summary, route, timeline, reference]);
  assert.equal(timeline.parentElement, layout, "timeline is not hidden inside the disclosure");
  assert.equal(itemAlternative.parentElement, timeline, "item alternatives remain attached to their own itinerary context");
  assert.match(reference.innerHTML, /交通班次與備選/);
  assert.match(reference.innerHTML, /class="tl-board"/);
  assert.match(reference.innerHTML, /title="地鐵"/);
  assert.match(reference.innerHTML, /title="纜車"/);
});
