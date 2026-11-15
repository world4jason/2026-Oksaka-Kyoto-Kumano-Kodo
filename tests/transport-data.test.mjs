import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
  assert.ok(allLegs.length > 0);
  assert.equal(new Set(days.flatMap((day) => day.items.map((item) => item.id))).size,
    days.flatMap((day) => day.items).length);
  // Keep the original credential regression guard without publishing the codes
  // themselves in the test source. Phone numbers and other public digits remain valid.
  const forbiddenBookingHashes = new Set([
    "16ca70128093dfcb1e0d3518bd1f4ff4cd09bebe5eaa5666d504271b5077f637",
    "7e903fb82013571b25e37ba4add8632f75aebe9634ac1f897b5596eb0c83e3c9"
  ]);
  for (const file of ["trip.json", "reference.html", "README.md"]) {
    const content = readFileSync(new URL("../" + file, import.meta.url), "utf8");
    for (const value of content.match(/\b\d{10}\b/g) || []) {
      const digest = createHash("sha256").update(value).digest("hex");
      assert.ok(!forbiddenBookingHashes.has(digest), file + ": private booking code");
    }
    assert.doesNotMatch(content, /訂單(?:編號|號碼)\s*[:：]?\s*\d{6,}/, file);
  }
  for (const day of days) {
    assert.ok(day.mobility);
    assert.ok(day.mobility.label && day.mobility.from && day.mobility.to);
    assert.equal(typeof day.mobility.attention, "string");
    if (["caution", "danger"].includes(day.mobility.attentionLevel)) {
      assert.ok(day.mobility.attention, day.date + ": warning requires explanatory text");
    }
    assert.ok(day.mobility.legs.length || day.mobility.options?.length);
    assert.equal(new Set(day.mobility.legs.map((leg) => leg.id)).size,
      day.mobility.legs.length, day.date + ": duplicate transport leg ID");
    for (const leg of day.mobility.legs) {
      assert.ok(allowedModes.has(leg.mode), day.date + " / mode " + leg.mode);
      assert.ok(allowedStatuses.has(leg.status), day.date + " / status " + leg.status);
      assert.ok(leg.from && leg.to && leg.depart && leg.arrive && leg.service);
    }
  }
});
test("11/11 starts with the 06:55 bus and reaches Katsuura by JR after the actual visits", () => {
  const day = byDate("2026-11-11");
  assert.ok(day.mobility.legs.some((leg) => leg.mode === "bus" && leg.depart === "06:55"));
  assert.ok(day.mobility.legs.some((leg) => leg.mode === "train" &&
    leg.from.includes("新宮") && leg.to.includes("紀伊勝浦")));
  assert.ok(!day.mobility.legs.some((leg) => leg.mode === "bus" && leg.depart === "17:04"));
  const route = day.routeSummary.join(" → ");
  assert.match(route, /發心門.*本宮.*大[齋斎]原.*速玉.*新宮城.*紀伊勝浦/);
  assert.match(JSON.stringify(day.items), /玄武洞/);
});
test("11/09 Kyoto and 11/13 Wakayama routes include the confirmed final hotel stay", () => {
  const kifune = byDate("2026-11-09");
  assert.match(kifune.routeSummary.join(" → "), /中之島.*京都御苑.*紅葉隧道.*貴船.*大阪/);
  assert.doesNotMatch(JSON.stringify(kifune), /交通未核實|大阪住宿尚未訂/);
  const wakayama = byDate("2026-11-13");
  assert.match(wakayama.routeSummary.join(" → "), /狼煙山.*和歌山.*泉佐野/);
  assert.match(JSON.stringify(wakayama.items), /和歌山城.*(?:外圍|外面|外觀)/);
  assert.ok(wakayama.mobility.legs.some((leg) => leg.depart === "13:46" && leg.arrive === "16:48"));
  assert.ok(!wakayama.items.some((item) => /臨空城|Rinku|Outlet/i.test(item.title)));
  const rHotel = data.reservations.find((stay) => /R Hotel/i.test(stay.title));
  assert.ok(rHotel);
  assert.equal(rHotel.status, "confirmed");
});
test("11/05 and 11/12 show the actual Osaka and afternoon Nachi itineraries", () => {
  const osaka = byDate("2026-11-05");
  assert.match(osaka.routeSummary.join(" → "), /露天神社.*大阪天滿宮.*寶山寺/);
  assert.ok(!osaka.items.some((item) => /伊勢神宮|御木本珍珠島/.test(item.title)));
  const nachi = byDate("2026-11-12");
  const content = JSON.stringify(nachi);
  assert.match(content, /Lawson/i);
  assert.match(content, /泡湯|溫泉/);
  assert.ok(nachi.mobility.legs.some((leg) => leg.mode === "bus" && leg.depart === "13:50"));
  assert.ok(nachi.mobility.legs.some((leg) => leg.mode === "bus" && /16:32/.test(leg.depart)));
  assert.doesNotMatch(content, /只有11\/11錯過速玉/);
});
test("Offline shell keeps the transport board and published sources available", () => {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const path of ["journey-board.css", "journey-board.js"]) {
    assert.ok(html.includes(path));
    assert.ok(sw.includes(path));
  }
  assert.ok(data.links.some((entry) => entry.url.endsWith("/2026-Oksaka-Kyoto-Kumano-Kodo")));
  assert.ok(data.links.some((entry) => entry.url === "./reference.html"));
  assert.ok(data.links.some((entry) => entry.url.includes("gid=202611160")));
});
