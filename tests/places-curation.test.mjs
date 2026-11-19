/* Places ≠ personal activity; licensed site-backed guide contract.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const placesSource=source("places-view.js");
function directory(){
  const window={location:{href:"https://example.org/"}};
  const context={window,location:{hash:"",pathname:"/",search:""},
    root:{addEventListener(){}},
    state:{data:{days:[]}},
    TravelLiteStorage:{get:async()=>null,set(){}},tripKey:x=>x};
  vm.runInNewContext(placesSource,context);
  return context.window.TravelLitePlaces;
}
const isPlace=directory().isPlace;
test("published activity, rest and ceremony never become Places merely from coordinates",()=>{
  const basic={id:"x",title:"豬名川河岸看書、等待花火",location:"豬名川河岸",
    lat:34.82,lng:135.41,mapQuery:"豬名川河川敷",infoCard:{summary:"Has a map"}};
  for(const type of ["break","rest","wait","event","activity","transport","stay","food","procedure"]){
    assert.equal(isPlace({...basic,type}),false,"misclassified "+type);
  }
  assert.equal(isPlace({...basic,type:"place"}),true);
  assert.equal(isPlace({...basic,type:"restaurant",venueName:"Named cafe"}),true);
  assert.equal(isPlace({...basic,type:"restaurant",venueName:""}),false);
});
test("only real curated places are in the source index; visits retain identity and schedule",()=>{
 const data=JSON.parse(source("trip.json"));
 const items=data.days.flatMap(day=>day.items||[]);
 const placeItems=items.filter(x=>isPlace(x));
 const excluded=items.filter(x=>["break","event"].includes(x.type));
 assert.ok(placeItems.length>0);
 assert.ok(excluded.every(x=>!isPlace(x)));
 const ids=new Set(items.map(x=>x.id));
 assert.equal(ids.size,items.length,"source IDs must remain unique");
 for(const item of placeItems)assert.equal(item.type==="place"||item.type==="restaurant",true);
 if(data.days.length>5){
   assert.equal(placeItems.length,28,"Kansai curated actual destinations, including Hotel Urashima Bokido");
   assert.equal(items.length,175,"173 original schedule blocks plus two untimed return baths");
   assert.equal(items.find(x=>x.id==="d04-s0-r45")?.type,"break");
   assert.equal(items.find(x=>x.id==="d04-s0-r46")?.type,"event");
   assert.ok(placeItems.every(x=>x.infoCard?.summary && x.infoCard?.sourceLinks?.length),
     "each public real attraction has an intro and a traceable source");
 }
});
test("rights-cleared photos have explicit image identity, author, license and source page",()=>{
 const data=JSON.parse(source("trip.json"));
 const photos=data.days.flatMap(x=>x.items||[]).filter(x=>x.infoCard?.image);
 for(const item of photos){
  const info=item.infoCard;
  assert.match(info.image,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  assert.match(info.imageSource,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(info.imageAlt?.length>4);
  assert.ok(info.imageCredit?.includes("Wikimedia Commons"));
  assert.match(info.imageLicense,/^(?:CC(?:0| BY)|Public domain)/);
 }
 if(data.days.length>5)assert.ok(photos.length>=26,"most Kansai researched venues should have licensed photos");
});
test("published Place detail uses source-backed guide and never uses schedule note as an excerpt",()=>{
 assert.match(placesSource,/const excerpt = info\.summary \|\| label/);
 assert.doesNotMatch(placesSource,/info\.summary \|\| item\.note \|\|/);
 assert.match(placesSource,/places-photo-figure/);
 assert.match(placesSource,/imageCredit/);
 assert.match(placesSource,/imageLicense/);
 assert.match(placesSource,/addEventListener\("error"/);
});

test("named cave baths follow the actual three-day Hotel Urashima sequence without invented times",()=>{
 const data=JSON.parse(source("trip.json"));
 const day=date=>data.days.find(d=>d.date===date).items;
 const first=day("2026-11-11"), second=day("2026-11-12"), third=day("2026-11-13");
 const idx=(items,id)=>items.findIndex(x=>x.id===id);
 assert.equal(first.find(x=>x.id==="d08-genbudo")?.title,"玄武洞（ホテル浦島）");
 assert.equal(first.find(x=>x.id==="d08-genbudo")?.type,"place");
 const bokido=second.find(x=>x.id==="d09-morning-onsen");
 assert.equal(bokido?.type,"place");
 assert.match(bokido.title,/忘歸洞/);
 assert.match(bokido.infoCard?.officialSite||"",/bohkido/);
 assert.ok(bokido.infoCard?.image && bokido.infoCard?.imageLicense);
 assert.ok(idx(second,"d09-morning-onsen")<idx(second,"d09-evening-genbudo"));
 assert.equal(second.find(x=>x.id==="d09-evening-genbudo")?.start,"TBD");
 assert.match(third.find(x=>x.id==="d10-morning-onsen")?.title||"",/忘歸洞/);
 assert.ok(idx(third,"d10-morning-onsen")<idx(third,"d10-breakfast"));
 assert.ok(idx(third,"d10-breakfast")<idx(third,"d10-post-breakfast-genbudo"));
 assert.ok(idx(third,"d10-post-breakfast-genbudo")<idx(third,"d10-checkout"));
 assert.equal(third.find(x=>x.id==="d10-post-breakfast-genbudo")?.start,"TBD");
});
test("Places cards use place nouns rather than scheduled-action descriptions",()=>{
 const data=JSON.parse(source("trip.json"));
 const places=data.days.flatMap(d=>d.items||[]).filter(isPlace);
 for(const place of places){
   assert.doesNotMatch(place.title,/參拜|散步|看夕陽|夜間點燈|入村|梳洗|泡湯|等候祭事|步行上山/,place.id);
 }
});
