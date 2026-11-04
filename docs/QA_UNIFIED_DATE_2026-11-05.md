# Kansai Trip — Shared Date Navigation / PDCA

**Date:** 2026-11-05 · **Source:** Travel-lite-template [Issue #129](https://github.com/world4jason/Travel-lite-Template/issues/129) / [merged PR #130](https://github.com/world4jason/Travel-lite-Template/pull/130).

## P — Plan

Port the *same* shared Date Navigator to this independently published trip fork, rather than adding a fourth date picker. Preserve the fork's `journey-board.js`, its 11-day overview, current 11/05 Ise Naiku/CAN route, 11/11 Kumano transport, 11/09 APA booking and all other reservations. The Trip / Transport / Places date is one `state.selectedDate`, with Trip Overview and Places All modes independent. Transport remains day-only.

Risk: template `companion-ux.js` differs from this fork due to localized Now labels, so **apply only the upstream diff**; don't overwrite the fork with the entire source file.

## D — Do

- Applied the upstream runtime patch to `trip-view.js`, `companion-ux.js` and `places-view.js`; the 3-way patch applied cleanly.
- Copied upstream `date-navigation.js` and `date-navigation.css` as-is and loaded them in `index.html`.
- Added the two files to the PWA pre-cache; shell cache version changed to `shell-v59-unified-date-navigation`.
- Preserved `trip.json`, `journey-board.js`, every travel-leg reference, previously fixed Now category labels and all five bottom tabs.

## C — Check

| Check | Result |
|---|---|
| Template full Playwright suite / date tests | **PASS**: 340/340 browser tests (16 original SKIP), dedicated 23/23 prior to upstream merge |
| Fork cross-tab Chromium test | **PASS**: 15 Style Packs × 320/390/1100 = 45 viewport/style runs, 3 pages each |
| Trip, Transport, Places date handoff | **PASS**: Trip 11/05 → Transport 11/05 → Places All (shared date unchanged) → Places 11/11 → Transport 11/11 → Trip 11/11 |
| Trip/Places independent Overview, no Transport Overview | **PASS** |
| Browser Back/Forward, refresh, legacy deep links | **PASS**; test waits for the asynchronous router observer to settle |
| 320px 200% root font, no horizontal scroll | **PASS** |
| Site booking, Ise, Kumano, ID integrity | **PASS**: 18/18 Node tests and globally unique IDs |
| PWA offline reload after SW activation | **PASS**: preserves the 11/05 picker and 14 Ise transport legs |
| External Codex/Claude Extra High review | **NOT RUN/BLOCKED**: model access/permissions did not yield a review; cannot count as independent reviewer |
| Three distinct human rounds / Owner Android visual audit | **PENDING** (Owner explicitly authorized merge before recruiting reviewers) |

Visuals in `docs/ui-proof/phone-unified-ise-trip.png`, `phone-unified-ise-transport.png`, `phone-unified-ise-places.png`.

## A — Act / Release condition

Owner explicitly authorized merging after best-effort automated review, with independent human reviewers recruited later. Proceed with a separate fork PR after these PASS checks. Do not claim three human reviews complete; track actual reviewer identities, defects and follow-up fixes in upstream [Issue #129](https://github.com/world4jason/Travel-lite-Template/issues/129). Live GitHub Pages deployment is verified separately after merge, not inferred from local tests.
