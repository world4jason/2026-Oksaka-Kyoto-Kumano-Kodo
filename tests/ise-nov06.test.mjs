import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const t = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url),"utf8"));
const d = t.days.find(x=>x.date==="2026-11-06");
const src = readFileSync(new URL("../reference.html", import.meta.url),"utf8");

test("11/06 follows the actual Naiku, Futami and Mikimoto route", () => {
 assert.ok(d);
 assert.ok(d.items.some(x=>/伊勢神宮.*內宮/.test(x.title)));
 assert.ok(!d.items.some(x=>x.title.includes("外宮")));
 assert.ok(src.includes("id=\"ise-primary\"")&&src.includes("id=\"ise-transit\""));
 assert.match(d.routeSummary.join(" → "), /內宮.*夫婦岩.*御木本珍珠島/);
 assert.ok(!d.items.some(x=>x.title.includes("鳥羽水族館")));
});
test("Mikimoto entry, 15:30 ama performance and departure retain their distinct times", () => {
 const pearl = d.items.find(x=>x.title.includes("御木本珍珠島"));
 assert.ok(pearl);
 assert.equal(pearl.start,"15:20");
 assert.equal(pearl.end,"16:20");
 assert.match(JSON.stringify(pearl), /15:30/);
 assert.match(JSON.stringify(pearl), /海女/);
});
test("The actual 16:35 Vista Car return reaches Osaka-Namba at 18:42 before both light displays", () => {
 const express=d.mobility.legs.find(x=>x.mode==="train"&&x.depart==="16:35");
 assert.ok(express);
 assert.equal(express.arrive,"18:42");
 assert.match(express.to,/大阪難波/);
 assert.match(JSON.stringify(express),/Vista Car/i);
 const route = d.routeSummary.join(" → ");
 assert.match(route,/御堂筋.*北御堂/);
 assert.ok(!d.items.some(x=>x.start==="07:05"));
});
test("Ise has one stable stop record per visit and links to the correct reference section", () => {
 for (const name of ["伊勢神宮", "二見興玉神社", "御木本珍珠島"]) {
  assert.equal(d.items.filter(x=>x.type==="place"&&x.title.includes(name)).length,1,name);
 }
 assert.equal(new Set(d.items.map(x=>x.id)).size,d.items.length);
 const board = readFileSync(new URL("../journey-board.js", import.meta.url),"utf8");
 assert.match(board,/day\.date === '2026-11-06' \? 'ise-primary'/);
 assert.equal(t.days.length,11);
 assert.equal(t.reservations.find(x=>x.id==="apa-additional-night").status,"confirmed");
});
