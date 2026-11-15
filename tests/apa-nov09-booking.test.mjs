import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const trip = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const reference = readFileSync(new URL("../reference.html", import.meta.url), "utf8");

test("APA has two separately confirmed bookings, with no invented price", () => {
  const stays = trip.reservations.filter(item => item.id === "apa" || item.id === "apa-additional-night");
  assert.equal(stays.length, 2);
  assert.deepEqual(stays.map(item => item.date), ["2026-11-04", "2026-11-09"]);
  assert.ok(stays.every(item => item.status === "confirmed"));
  assert.ok(stays[1].title.includes("新增1晚"));
  assert.ok(!JSON.stringify(stays[1]).includes("NT$"));
});

test("Nov 9 completed Kyoto route returns to the booked APA", () => {
  const day = trip.days.find(item => item.date === "2026-11-09");
  assert.ok(day);
  assert.match(day.routeSummary.at(-1), /大阪/);
  assert.ok(day.items.some(item => item.location.includes("APA 大阪肥後橋站前 TOWER")));
  assert.ok(!JSON.stringify(day).includes("大阪住宿尚未訂"));
  assert.match(day.routeSummary.join(" → "), /中之島.*京都御苑.*紅葉隧道.*貴船/);
  assert.doesNotMatch(JSON.stringify(day), /確定同一房間|已保證不換房/);
});

test("Completed Osaka stays do not retain obsolete booking or check-in tasks", () => {
  assert.ok(!trip.todos.some(item => item.id === "osaka-extra-stay"));
  assert.ok(!trip.todos.some(item => item.id === "apa-two-bookings-checkin"));
  const firstStay = trip.reservations.find(item => item.id === "apa");
  const extraStay = trip.reservations.find(item => item.id === "apa-additional-night");
  assert.match(JSON.stringify(firstStay), /(?:5\s*|五)晚/);
  assert.match(JSON.stringify(extraStay), /(?:1\s*|一)晚/);
});

test("Public reference retains the six Osaka nights without an unresolved booking claim", () => {
  assert.match(reference, /APA/);
  assert.match(reference, /6晚|6 晚/);
  assert.ok(!reference.includes("11/09大阪住宿仍待訂"));
  assert.ok(!reference.includes("11/09晚住宿仍待訂"));
});
