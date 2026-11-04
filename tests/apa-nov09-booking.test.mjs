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

test("Nov 9 route returns to the booked APA without assuming the same room", () => {
  const day = trip.days.find(item => item.date === "2026-11-09");
  assert.ok(day);
  assert.ok(day.routeLabel.includes("APA"));
  assert.equal(day.routeSummary.at(-1), "APA大阪肥後橋");
  assert.ok(day.items.some(item => item.location.includes("APA 大阪肥後橋站前 TOWER")));
  assert.ok(!JSON.stringify(day).includes("大阪住宿尚未訂"));
  assert.ok(day.reminders.some(text => text.includes("兩筆APA訂單")));
  assert.equal(day.mobility.attentionLevel, "danger");
  assert.equal(day.mobility.legs.find(item => item.id === "leg-5").status, "unconfirmed");
  assert.ok(day.mobility.attention.includes("23:00"));
});

test("Old booking todo is gone; new check-in coordination is still pending", () => {
  assert.ok(!trip.todos.some(item => item.id === "osaka-extra-stay"));
  assert.ok(trip.todos.some(item => item.id === "apa-two-bookings-checkin" && item.priority === "high"));
  assert.ok(trip.days.find(item => item.date === "2026-11-10").reminders.some(t => t.includes("APA")));
});

test("Public reference is current and private booking codes are not visible", () => {
  assert.ok(reference.includes("11/09–11/10 同一間 APA"));
  assert.ok(reference.includes("已訂（11/09–11/10另筆訂單"));
  for (const code of ["1793645892", "1793665543"]) assert.ok(!reference.includes(code));
  assert.ok(!reference.includes("11/09大阪住宿仍待訂"));
  assert.ok(!reference.includes("11/09晚住宿仍待訂"));
});
