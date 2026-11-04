import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const t = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url),"utf8"));
const d = t.days.find(x=>x.date==="2026-11-05");
const src = readFileSync(new URL("../reference.html", import.meta.url),"utf8");

test("11/05 primary route is Naiku-only, preserves full two-shrine variant", () => {
 assert.ok(d);
 assert.ok(d.title.includes("內宮")&&d.title.includes("鳥羽"));
 assert.ok(d.items.some(x=>x.title.includes("伊勢神宮・內宮")&&x.start==="10:10"));
 assert.ok(!d.items.some(x=>x.title.includes("外宮")));
 assert.ok(d.planB.some(x=>x.title.includes("外宮")));
 assert.ok(src.includes("id=\"ise-legacy\""));
 assert.ok(src.includes("id=\"ise-primary\"")&&src.includes("id=\"ise-transit\""));
 assert.ok(d.routeSummary.includes("夫婦岩")&&d.routeSummary.includes("御木本珍珠島"));
 assert.deepEqual(d.mobility.stageLegIds,["leg-2","leg-4","leg-6","leg-8","leg-11"]);
});
test("non-reserved Kintetsu connections and 51 bus distinguish express bus from rail", () => {
 const l=d.mobility.legs;
 const k=(f,to,depart,arrive)=>l.find(x=>x.from===f&&x.to===to&&x.depart===depart&&x.arrive===arrive);
 assert.ok(k("大阪難波","大阪上本町","06:54","06:57"));
 assert.ok(k("大阪上本町","伊勢市","07:06","09:27"));
 assert.ok(k("伊勢市駅前10番のりば","內宮前","09:40","10:02"));
 assert.ok(d.reminders.some(x=>x.includes("公車")&&x.includes("指定席")));
 assert.ok(!d.items.some(x=>x.title.includes("近鐵特急")||x.start==="07:05"));
 assert.ok(t.essentials.some(x=>x.title.includes("免指定席")));
 assert.ok(!t.todos.some(x=>x.id==="ise-tickets"));
});
test("critical CAN legs, after-noon plan and late return are all visible", () => {
 const l=d.mobility.legs;
 assert.ok(l.some(x=>x.service==="CAN巴士"&&x.depart==="13:34"&&x.arrive==="14:02"&&x.critical));
 assert.ok(l.some(x=>x.service==="CAN巴士"&&x.depart==="14:42"&&x.arrive==="15:00"&&x.critical));
 const a=d.mobility.alternatives;
 for(const time of ["06:07","07:09","09:54","12:34","14:14","16:02","17:22"])
  assert.ok(a.some(x=>x.time===time),time);
 assert.ok(a.find(x=>x.time==="14:14").text.includes("二擇一"));
 assert.ok(a.find(x=>x.time==="16:02").text.includes("16:00"));
 assert.ok(a.find(x=>x.time==="17:22").text.includes("20:43"));
 assert.ok(d.items.some(x=>x.title.includes("御木本珍珠島")&&x.start==="15:00"));
 assert.ok(d.planB.some(x=>x.title.includes("鳥羽水族館")));
});
test("one place per real stop, no reserved ticket, costs source-based", () => {
 const places=d.items.filter(x=>x.type==="place");
 assert.equal(places.length,4);
 assert.equal(new Set(places.map(x=>x.id)).size,4);
 assert.ok(d.reminders.some(x=>x.includes("¥1,300")&&x.includes("¥7,500")));
 assert.ok(t.todos.some(x=>x.id==="ise-bus-daypass"));
 assert.ok(t.essentials.some(x=>x.dayDate==="2026-11-05"&&x.body.includes("¥5,930")));
 assert.ok(!JSON.stringify(d).includes("07:05"));
 assert.ok(!JSON.stringify(t.essentials.filter(x=>x.dayDate==="2026-11-05")).includes("07:05"));
 assert.equal(t.days.length,11);
 assert.equal(t.reservations.find(x=>x.id==="apa-additional-night").status,"confirmed");
 assert.ok(!/\b1793645892\b|\b1793665543\b/.test(src));
});
