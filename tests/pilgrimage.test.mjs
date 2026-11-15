import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const itinerary = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const p = itinerary.pilgrimage;
const day = date => itinerary.days.find(d => d.date === date);

test("Two credential systems remain distinct and source backed", () => {
  assert.equal(p.credentials.length, 2);
  assert.deepEqual(p.credentials.map(x => x.price), ["免費", "¥100"]);
  assert.ok(p.credentials[0].requirement.includes("西班牙"));
  assert.ok(p.credentials[1].requirement.includes("41"));
  assert.equal(p.pickups.length, 5);
  assert.ok(p.sources.every(x => /^https:\/\//.test(x.url)));
  assert.ok(p.sources.some(x => x.url.includes("/credential-2/")));
});
test("Tanabe credential pickup remains a reference and not a completed collection claim", () => {
  const pickup = p.pickups.find(site => site.id === "tanabe");
  assert.equal(pickup.hours, "09:00–18:00");
  assert.equal(pickup.dual, true);
  assert.equal(pickup.nakahechi, false);
  assert.doesNotMatch(JSON.stringify(p), /已集齊(?:全部|十|10)|十枚章全數完成|10枚章全數完成/);
  assert.ok(!itinerary.todos.some(x => x.id === "dual-credential-pickup"));
});
test("Stamp passport follows official ten sites and published 7km route without invented times", () => {
  const stampNames = p.route.stamps.map(x => x.local);
  assert.deepEqual(stampNames, [
    "発心門王子", "水吞王子", "伏拝王子", "祓殿王子",
    "熊野本宮大社", "旧社地大斎原", "熊野速玉大社",
    "熊野那智大社", "青岸渡寺", "飛瀧神社"
  ]);
  assert.equal(p.route.stamps.filter(s => s.date === "2026-11-11").length, 7);
  assert.equal(p.route.stamps.filter(s => s.date === "2026-11-12").length, 3);
  assert.ok(p.route.caveat.includes("西班牙"));
  assert.ok(p.route.caveat.includes("41"));
  assert.ok(p.route.stamps.every(x => x.id && x.name && x.phase && x.date));
  assert.match(JSON.stringify(day("2026-11-11").items), /發心門王子/);
  assert.match(JSON.stringify(day("2026-11-12").items), /青岸渡寺/);
});
test("Device-only local checklist retains the ten reference stamp stops and stable IDs", () => {
  const c = itinerary.checklists.find(x => x.id === "dual-pilgrim-stamps");
  assert.ok(c);
  assert.equal(c.items.length, 10);
  assert.equal(new Set(c.items.map(x => x.id)).size, 10);
  assert.ok(c.items.every(x => x.label.startsWith("11/11") || x.label.startsWith("11/12")));
});
test("Actual Kumano transportation includes JR to Katsuura and the confirmed Urashima stay", () => {
  assert.equal(itinerary.days.length, 11);
  const legs = day("2026-11-11").mobility.legs;
  assert.ok(legs.some(x => x.mode === "bus" && x.depart === "06:55"));
  assert.ok(legs.some(x => x.mode === "train" && x.from.includes("新宮") && x.to.includes("紀伊勝浦")));
  assert.ok(!legs.some(x => x.service === "15 新勝線" && x.depart === "17:04"));
  assert.ok(itinerary.reservations.some(x => x.id === "urashima" && x.status === "confirmed"));
});
