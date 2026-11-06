import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const trip = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const byDate = (date) => trip.days.find((day) => day.date === date);

test("keeps all eleven travel dates and unique stable item IDs", () => {
  assert.equal(trip.days.length, 11);
  assert.equal(trip.days[0].date, "2026-11-04");
  assert.equal(trip.days.at(-1).date, "2026-11-14");
  const ids = trip.days.flatMap((d) => d.items.map((item) => item.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(trip.trip.publication.state, "draft");
  assert.equal(trip.trip.publication.humanGate, "not-run");
});

test("puts Osaka/Ikoma on Nov 5 and the actually visited Ise attractions on Nov 6", () => {
  const d5 = byDate("2026-11-05");
  const d6 = byDate("2026-11-06");
  assert.match(d5.title, /大阪天滿宮/);
  assert.ok(!d5.items.some((item) => item.title.includes("伊勢")));
  assert.match(d6.title, /伊勢/);
  for (const id of ["ise-naiku", "ise-futami", "ise-pearl", "d03-midosuji", "d03-kitamido"]) {
    assert.ok(d6.items.some((item) => item.id === id), id);
  }
});

test("preserves the Kintetsu 16:35 actual express and next 17:32 direct service", () => {
  const day = byDate("2026-11-06");
  const train = day.items.find((item) => item.id === "ise-toba-vista");
  assert.equal(train.start, "16:35");
  assert.equal(train.end, "18:42");
  assert.match(train.note, /17:32/);
  assert.match(train.note, /57/);
  assert.ok(day.mobility.alternatives.some((a) => a.time === "16:30" && a.arrival === "18:21"));
  assert.ok(day.mobility.alternatives.some((a) => a.time === "17:32" && a.arrival === "19:36"));
  const pearl = day.items.find((item) => item.id === "ise-pearl");
  assert.equal(pearl.start, "15:20");
  assert.equal(pearl.end, "16:20");
  assert.match(day.items.find((i) => i.id === "d03-kitamido").note, /兩輪多/);
});

test("has one licensed representative image per seven attractions across the two days", () => {
  const places = [byDate("2026-11-05"), byDate("2026-11-06")]
    .flatMap((d) => d.items.filter((item) => item.type === "place"));
  assert.equal(places.length, 7);
  for (const place of places) {
    const info = place.infoCard;
    assert.ok(info.image.startsWith("https://commons.wikimedia.org/wiki/Special:FilePath/"), place.title);
    assert.ok(info.imageAlt, place.title);
    assert.match(info.imageCredit, /Wikimedia Commons/);
    assert.ok(info.sourceLinks.some((link) => link.url.startsWith("https://creativecommons.org/") || link.url.includes("commons.wikimedia.org/wiki/File:")), place.title);
  }
});

test("Nov 13 train options retain booking uncertainty", () => {
  const day = byDate("2026-11-13");
  const train = day.items.find((i) => i.start === "11:49");
  assert.equal(train.end, "15:08");
  assert.ok(day.mobility.alternatives.some((a) => a.time === "13:46" && a.arrival === "17:07"));
  assert.match(day.reminders.join(" "), /尚未購票/);
});
