# Kansai / Osaka — Trip-specific UI/UX extension

> This file adds **only trip-specific presentation details** to [UIUX.md](./UIUX.md). It cannot relax P0/P1. If conflicts arise, follow `docs/UIUX.md` and fix this file.

## Existing Kansai reading patterns

- This repo contains an 11-day Osaka / Kyoto / Kumano itinerary with interleaved transport, places, food, stays and events in `days[].items[]`. **The complete Chronological Time-blocked Timeline stays visible on Trip Day.**
- The Kansai `journey-board.js` / `.css` adds a compact itinerary summary, critical transfer steps, alternatives and day overview; it is a **secondary projection** of the published trip and must never replace or collapse the source timeline.
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
