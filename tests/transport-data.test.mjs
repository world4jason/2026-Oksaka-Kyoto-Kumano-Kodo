import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const days = data.days;
const byDate = (date) => days.find((day) => day.date === date);
const allLegs = days.flatMap((day) => day.mobility?.legs || []);
const allowedModes = new Set(["train", "subway", "bus", "walk", "boat", "flight", "stay", "task", "event"]);
const allowedStatuses = new Set(["confirmed", "estimate", "reference", "unconfirmed"]);
test("Published trip is eleven-day, transport-first, unique and public-safe", () => {
  assert.equal(days.length, 11);
  assert.equal(days[0].date, "2026-11-04");
  assert.equal(days.at(-1).date, "2026-11-14");
  assert.equal(data.ui.locale, "zh-TW");
  assert.equal(data.ui.defaultView, "trip");
  assert.equal(allLegs.length, 56); // 11/05 Ise split into actual local/express/CAN transfers.
  assert.equal(new Set(days.flatMap((day) => day.items.map((item) => item.id))).size,
    days.flatMap((day) => day.items).length);
  assert.ok(!JSON.stringify(data).includes("1793645892"));
  for (const day of days) {
    assert.ok(day.mobility);
    assert.ok(day.mobility.label && day.mobility.from && day.mobility.to);
    assert.ok(day.mobility.attention);
    assert.ok(day.mobility.legs.length || day.mobility.options?.length);
    for (const leg of day.mobility.legs) {
      assert.ok(allowedModes.has(leg.mode), day.date + " / mode " + leg.mode);
      assert.ok(allowedStatuses.has(leg.status), day.date + " / status " + leg.status);
      assert.ok(leg.from && leg.to && leg.depart && leg.arrive && leg.service);
    }
  }
});
test("11/11 key connections and the two previous + one next #52 buses", () => {
  const day = byDate("2026-11-11");
  const buses = day.mobility.legs.filter((leg) => leg.mode === "bus");
  assert.deepEqual(buses.map(({ depart, arrive }) => [depart, arrive]), [
    ["06:55", "08:54"], ["14:46", "15:40"], ["17:04", "17:48"]
  ]);
  assert.equal(buses[1].from, "大斎原前");
  assert.equal(buses[1].to, "速玉大社前");
  assert.equal(buses[2].to, "紀伊勝浦駅");
  const departureOptions = day.mobility.alternatives.map((entry) => entry.time);
  for (const time of ["12:16", "13:26", "14:46", "16:11"]) assert.ok(departureOptions.includes(time));
  assert.ok(day.mobility.alternatives.find((entry) => entry.time === "16:11").text.includes("速玉已關"));
  assert.ok(day.mobility.alternatives.find((entry) => entry.time === "17:36").text.includes("飯店需先聯絡"));
});
test("11/09 after-dark last mile and 11/13 transfers remain unresolved", () => {
  const kifune = byDate("2026-11-09").mobility;
  assert.equal(kifune.attentionLevel, "danger");
  assert.ok(kifune.legs.some((leg) => leg.mode === "bus" && leg.status === "unconfirmed"));
  assert.ok(kifune.attention.includes("未核實"));
  const rinku = byDate("2026-11-13").mobility;
  assert.equal(rinku.attentionLevel, "danger");
  assert.ok(rinku.legs.every((leg) => leg.status === "unconfirmed"));
});
test("11/06 selection and 11/12 backup are explicit, not promoted", () => {
  assert.equal(byDate("2026-11-06").mobility.options.length, 5);
  assert.equal(byDate("2026-11-06").mobility.legs.length, 0);
  const back = byDate("2026-11-12").mobility.alternatives[0];
  assert.ok(back.text.includes("只有11/11錯過速玉"));
});
test("Offline shell includes the two new files and keeps source visible", () => {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const path of ["journey-board.css", "journey-board.js"]) {
    assert.ok(html.includes(path));
    assert.ok(sw.includes(path));
  }
  assert.ok(data.links.some((entry) => entry.url.endsWith("/2026-Oksaka-Kyoto-Kumano-Kodo")));
  assert.ok(data.links.some((entry) => entry.url === "./reference.html"));
});
