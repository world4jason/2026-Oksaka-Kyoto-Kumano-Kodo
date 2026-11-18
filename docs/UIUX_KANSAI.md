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
