import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const trip = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const byDate = (date) => trip.days.find((day) => day.date === date);
const render = readFileSync(new URL("../trip-view.js", import.meta.url), "utf8");
const board = readFileSync(new URL("../journey-board.js", import.meta.url), "utf8");

test("Trip is itinerary-first: mixed visits and connections are not hidden in a details element", () => {
  const enhance = board.slice(board.indexOf("function enhanceDay()"), board.indexOf("renderTrip = function visualTripRender"));
  assert.ok(enhance.includes('layout.classList.add("tl-itinerary-first")'));
  assert.ok(enhance.includes('(section || nav).after(details)'));
  assert.ok(!enhance.includes("deep.appendChild(section)"));
  assert.ok(enhance.includes('details.className = "tl-transport-details"'));
  assert.ok(render.includes("景點停留與交通銜接"));
  assert.ok(render.includes("timeline-time-end"));
  assert.ok(render.includes('item.type === "transport" ? "trip-v2-item--transport"'));
});

test("Nov 8 fixed-time rituals, show times and connecting transfers appear as separate timeline steps", () => {
  const items = byDate("2026-11-08").items;
  const at = (start, phrase) => items.find(x => x.start === start && x.title.includes(phrase));
  assert.ok(at("07:45", "APA"));
  assert.ok(at("09:00", "下鴨神社"));
  assert.ok(at("13:00", "本殿祭")?.mustGo);
  assert.ok(at("14:00", "火焚神事")?.mustGo);
  assert.ok(at("15:30", "伏見稻荷→京都"));
  assert.ok(at("17:30", "KAIKAI")?.mustGo);
  assert.ok(at("19:30", "百鬼夜行")?.mustGo);
  assert.ok(items.some(x => x.type === "transport" && x.start === "20:00"));
});

test("Nov 9 shows visit window and separates lodging tasks from actual transportation", () => {
  const day=byDate("2026-11-09");
  assert.ok(day.items.some(x => x.start === "08:00" && x.title.includes("寄大行李")));
  assert.ok(day.items.some(x => x.start === "09:30" && x.title.includes("APA")));
  assert.ok(day.items.some(x => x.start === "15:00" && x.type === "transport"));
  assert.ok(day.items.some(x => x.start === "17:30" && x.end === "20:30" && x.type === "place"));
  assert.ok(day.reminders.some(x => x.includes("兩筆APA訂單")));
  assert.ok(day.mobility.attention.includes("未核實") && day.mobility.attention.includes("23:00"));
});

test("Nov 10 exposes all three Shirahama visits and critical credential pickup, while train choice remains unresolved", () => {
  const items=byDate("2026-11-10").items;
  const named = (term) => items.find(x => x.type === "place" && x.title.includes(term));
  const selectedTrain = items.find(x => x.title.includes("黑潮3號"));
  assert.deepEqual(["三段壁","千疊敷","白良濱"].map(t => [named(t).start,named(t).end]), [
    ["13:00","14:00"],["14:15","15:00"],["15:15","16:00"]
  ]);
  const credential=named("Dual Pilgrim");
  assert.equal(credential.start,"17:30");
  assert.equal(credential.mustGo,true);
  assert.ok(credential.note.includes("18:00"));
  assert.equal(selectedTrain.mustGo, false);
  assert.deepEqual(byDate("2026-11-10").mobility.alternatives.slice(0,2).map(x => x.time), ["09:04","09:33"]);
});

test("Nov 8–10 time windows preserve monotonic order, stable IDs and public-safe notes", () => {
  assert.ok(!JSON.stringify(trip).includes("1793645892"));
  assert.ok(!JSON.stringify(trip).includes("1793665543"));
  const seen=new Set();
  for(const day of trip.days) for(const item of day.items){
    assert.ok(item.id && !seen.has(item.id), item.id);
    seen.add(item.id);
  }
  for(const date of ["2026-11-08","2026-11-09","2026-11-10"]) {
    const starts=byDate(date).items.map(item => item.start).filter(x => /^\d{2}:\d{2}$/.test(x));
    assert.deepEqual(starts,[...starts].sort(), date);
  }
});
