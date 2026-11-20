# Kansai / Osaka — Trip-specific UI/UX extension

> This file adds **only trip-specific presentation details** to [UIUX.md](./UIUX.md). It cannot relax P0/P1. If conflicts arise, follow `docs/UIUX.md` and fix this file.


## Page-by-page applicability / 關西版頁面規範映射

在此 Repo 修改 UI 前必須先閱讀 [通用 P0/P1/P2 契約](./UIUX.md) 與 [SHARED](./uiux/SHARED.md)，依頁面再讀下列規範。這些規範與 Template **共用同一份內容**；本檔只記錄關西資料特殊處理，不建立另一套 UX 原則。

| 關西站頁面／元件 | 強制參考 | 這趟旅程特別應驗證的場景 |
| --- | --- | --- |
| 現在 / Now | [NOW.md](./uiux/NOW.md) | 依已發布時間的上一站／排定此刻／下一站；不把已走過日期當成 GPS 當下 |
| 行程 / Trip | [TRIP.md](./uiux/TRIP.md) | 大阪→伊勢→京都→白濱→熊野→和歌山，步行與鐵路轉乘合併成完整 A→B Journey；活動與等候保留 Timeline |
| 交通 / Transport | [TRANSPORT.md](./uiux/TRANSPORT.md) | 近鐵直通線、熊野巴士／JR、纜車、船與機場交通的原始 Leg，精確起終點 Google Maps；desktop Map Workspace 不能切邊 |
| 景點 / Places | [PLACES.md](./uiux/PLACES.md) | 只納真正有介紹價值的神社、古道、寺院、景觀／博物館；**豬名川看書候場 ≠ 景點、煙火 ≠ 景點**；提供介紹／官方來源／合法授權照片 |
| 更多 / More | [MORE.md](./uiux/MORE.md) | 相關旅行準備、原始票券／參拜資訊及樣式偏好，保持 read-only 和本機狀態 |
| 日期與天氣 / shared | [WEATHER.md](./uiux/WEATHER.md) | 2026/11/04–11/14 按**每一天地區**取得過去模型天氣，不以大阪代表熊野／伊勢／京都，資料缺失時只保留日期卡 |
| 全站 Shell / responsive | [SHARED.md](./uiux/SHARED.md) | 手機 320/390、桌面 1024/1280/1440/1920 與 200% 字體，長日文站名及 map/transfer 卡安全內距 |

**關西資料細節（不得覆蓋上游契約）：**

- 這是 **11 天**的來源行程。只有明確發布的時間與地點可顯示為事實；已確認的班表與「約／班表參考」需區分，不可因整理版面將估計值升級成實搭證據。
- D4「豬名川河岸看書、等待花火」屬 **break**，D4 煙火屬 **event**。其他市集、演出、照明活動、飯店日常泡湯與表演間休息亦須依 Schema 分類，不得因有座標和 Maps URL 就進 Places。真正景點要有 venue-specific `infoCard.summary`、可驗證官方來源；圖片需合法授權及署名。
- 日本境內使用 **Asia/Tokyo**，台灣起降航班要正確使用 **Asia/Taipei** 的起／迄顯示。時序以絕對時刻比較；不要把兩地 HH:MM 字面直接排序，也不要憑時區計算杜撰航班資訊。
- 天氣依當日明確 `days[].weatherLocation` 或既有來源座標選地區；例如大阪、京都、伊勢／鳥羽、田邊／白濱、熊野本宮、勝浦／那智與和歌山之間可能移動，不能顯示首日大阪天氣當作全程。**過去 92 天**可使用 Forecast API `past_days`，更早使用 Historical Weather API/reanalysis；歷史是模式估計而非現場觀測。沒有可信地點／資料時不顯示假溫度或假雲。
- Trip Day 的完整 timeline 必須始終可見；Transport 整趟轉乘是可展開的同一次 Journey。Google Maps 直接帶 A→B；地鐵、JR、纜車、步行使用不同的語意 SVG（步行雙腳印）。不以 `overflow:hidden`、縮字或負 margin 掩飾桌面切邊。
- **不要在行程卡補上「依實走順序串起交通與遊覽…」等碎碎念小標。** 保留真正會影響選車、到站、入場、天候與安全的關鍵資訊。

**驗收：** 通用 `npm run test:uiux`、`npm run test:timeline`、`npm run lint:uiux`、`npm run test:journey`、`npm run test:places-curation`、`npm run test:trip-widgets`；更動 UI/CSS 時加跑 `npm run test:uiux:geometry`、`npm run test:journey:browser`、`npm run test:map-insets:browser`、`npm run test:trip-layout:browser`、`npm run test:places-curation:browser`。必須報告 PASS / FAIL / NOT RUN，不得以文件更新或 CSS 靜態存在宣稱已修好畫面。

## Existing Kansai reading patterns

- This repo contains an 11-day Osaka / Kyoto / Kumano itinerary with interleaved transport, places, food, stays and events in `days[].items[]`. **The complete Chronological Time-blocked Timeline stays visible on Trip Day.**
- The Kansai `journey-board.js` / `.css` adds critical transfer steps, alternatives and source-backed day callouts only. The **shared Template owns the Compact Overview DOM and layout**; Kansai may not overwrite its hero or day cards. The transport board is a secondary projection and must never replace or collapse the source timeline.
- Transport may show a travel-step board first and let users expand maps / stop details. Keep historical deep links and station search links, and never treat a static reference time as live transit.
- Kumano stamp/credential cards are special-purpose optional components, shown only with valid trip source data and relevant dates. They do not create a new primary tab or alter itinerary item order.
- Japan/Taiwan flights require correct IANA timezones for local labels and actual chronological comparisons; do not compare local HH:MM strings across zones.
- Keep the existing five-tab shell, shared date navigation and source-backed timetable references. Preserve existing trip-specific styles and assets unless a concrete regression warrants changes.

## Acceptance when changing Kansai UI

Run `npm run test:uiux` and `npm run test:timeline`, then the relevant Kansai chronology/transport/pilgrimage/visual tests, and record PASS / FAIL / NOT RUN. A change to the generic product rules belongs in Template `docs/UIUX.md` first and should be synchronized to this copy; do not fork the invariant silently.

## Date / weather / flights (P1)

Inherit the universal horizontal Weather Date Strip. No fabricated weather for past dates. The canonical IT212 and IT211 flight items project to overview and Transport cards. Preserve cross-zone Tokyo/Taipei arrival times and omit private PNR data.

## Historical weather in day cards (P1)

Kansai's November 2026 dates must display source-backed **historical weather** (recent Forecast API `past_days`, older journeys Historical Weather API), never an invented forecast or uniform weather glyph. If API data is unavailable, preserve a polished date/day/title-only card; itinerary and navigation remain usable. Historical weather is a model estimate, not exact observed conditions.

## Semantic transport icons and card text safe insets (P1.7)

Use the upstream `docs/UIUX.md` P1.7 across both the generic Trip UI and Kansai Journey Board. Train, subway, funicular, map links and tickets must use the shared allowlisted `ui-icons.js` semantic SVGs, not missing-font glyphs. Every framed card must maintain at least 12 CSS px of actual rendered text-to-border inset at 320, 390 and 1100px and 200% zoom. For Kansai road/rail stops the inline Google Maps link uses a map-pin SVG. Run `npm run lint:uiux` and `npm run test:uiux:geometry`; tests are not a substitute for actual visual acceptance.

## Combined Journeys / direct Maps directions (P0)

The source 11-day itinerary retains every individual, timed `type:transport` Leg. Consecutive walking/rail/metro/boat transfer Legs in one door-to-door move are projected into a single Trip Timeline Journey. The Journey title links to Google Maps directions when both endpoint names are explicit; all original IDs, clock times and transfer details remain in `<details>`. UI does not rewrite source data or infer live schedules. Walking uses footprints. Include desktop horizontal clipping/long Japanese station names in the browser geometry gate.

## Map Workspace role geometry (P1.9)

Kansai follows the identical `docs/UIUX.md` P1.9 frame/inset contract as Template. Each framed Style Pack declares its own nonzero `--ui-map-workspace-padding` (>=12px, preferably clamp(16px,1.5vw,24px)) next to its border; the source-independent `surface-contract.css` consumes both with border-box sizing. Editorial/Risograph/Vintage remain deliberately unframed. Agent MUST run `npm run lint:map-insets` and `npm run test:map-insets:browser` before claiming the desktop Transport map card no longer clips.

## Quiet day summaries and readable Storybook cards (P1.10)

For the Kansai source, all repeated generic day notes about itinerary chronology have been removed. The 173 original source items, times, IDs, trip reminders, research and practical cautions remain intact; two untimed return baths were added as new entries, bringing the schedule to 175. Storybook's mobile time-over-content cards must remain a single-column layout with full-width text. A Journey style stylesheet must never override the active Style Pack's grid tracks. See `docs/UIUX.md` P1.10.

## Curated sightseeing directory (P1.11)

The 11-day Osaka/Kyoto/Kumano source keeps every one of its 173 original chronological items plus two untimed cave-bath entries (175 items total). Seven incorrectly venue-typed source items (waiting on the Inagawa riverbank, a film-park rest, ordinary morning baths, and event-only light shows/market) are now `break` or `event`. They remain in Trip but are not attractions. All 28 true venue `place` items (including distinct Hotel Urashima 忘歸洞) have concise venue-specific `infoCard.summary` and source links; 26 place photos have Wikimedia Commons source pages, author/credit and verifiable rights. No unauthorised hotel photo should be substituted for 玄武洞 or 狼煙山. Never copy unauthorised official-site photos or turn every mapped activity into a Place.

## Hotel Urashima cave-bath exception / 浦島洞窟溫泉

The named and researched **忘歸洞（ホテル浦島）** is a curated visitor destination in Places, separately identified from **玄武洞（ホテル浦島）**. The daily visits remain in Trip's source-ordered Timeline. Repeated personal bathing is a `break` and does not create duplicate Places cards.

- **11/11 evening:** 玄武洞 (source item `d08-genbudo`).
- **11/12 morning:** 忘歸洞 (`d09-morning-onsen`, a curated venue with independent guide and license-backed photo); **evening:** 玄武洞 (`d09-evening-genbudo`, untimed).
- **11/13 morning:** 忘歸洞 (`d10-morning-onsen`) → breakfast (`d10-breakfast`) → 玄武洞 (`d10-post-breakfast-genbudo`, untimed) → checkout (`d10-checkout`).

The two new repeated-bath entries have `start: TBD`, never fabricated clock times. For Places, use the venue's name rather than action verbs such as 參拜、散步、等候、泡湯; actions and timestamps belong in Trip. Use correctly attributed, licensed venue photography only. Run `npm run test:places-curation`, `npm run test:timeline`, `npm run test:overview` and the relevant browser suites before claiming visual acceptance.


## Owner-curated Osaka Overview art pilot (2026-11-20)

The five source IDs cover four user-selected representative experiences: `d04-s0-r46` (Inagawa fireworks, event), `d05-s0-r54` (Uzumasa Hyakki Yagyo, event), `d08-s2-r46` (Kumano Kodo Nakahechi, place), , `d08-genbudo` (Urashima Genbudo cave bath, place), and `d09-morning-onsen` (Urashima Bokido cave bath, place). These are **cover artwork subjects**, not extra Places items, route changes or proof the four scenes occurred simultaneously. Vintage Watercolor art is a memory montage, not a faithful photograph. The artwork must remain hidden in other themes without compatible variants. Run the shared Overview + PWA tests and owner visual QA before merging.
