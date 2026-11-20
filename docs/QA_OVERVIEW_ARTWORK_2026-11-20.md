# Overview Artwork pilot QA — 2026-11-20

Branch: `feat/osaka-curated-overview-artwork-20261120`; Draft PR #22. This is a scoped evidence record, **not full release approval**.

## PASS — source-/contract-level execution

- Actual GitHub connector files were fetched on this branch. Isolated JavaScript runtime checks with safe URL mocks: **15/15 PASS** (selected source IDs, visual-style matching, neutral/no-image fallback, URL schemes and alt escaping, 1–3 image cap, asset/PWA references, compact styling).
- Source syntax parsing and static composition checks: **12/12 PASS** (JS renderer compiles, authoring picker inline script compiles, `trip.json` parses, script load order, size cap and no `:has()` dependency).
- Publisher picker includes real `event` and `break` items (never a Places-only ranking); it exports a brief and never calls the image API in a public browser.
- Local generated AVIF: `480×270` px, 3,907 bytes, Git object SHA `6633a49d12f2a98e4b70e86ea8a3e77b0348c12b`. The GitHub blob SHA matches the source file via local `git hash-object`.
- 5 source item IDs verified from Osaka `trip.json` and representing 4 owner preferences (fireworks, Hyakki Yagyo, Kumano Kodo, both cave baths).

## FAIL / BLOCKED — GitHub Actions

- The `Chronological Timeline Contract` workflow on this PR is **FAIL**. The Actions connector shows the job failed; job-step summaries are empty and logs are unavailable/404. We cannot determine from that evidence whether this is infrastructure, a pre-existing failure, or caused by this PR.
- This issue blocks release. Do not mark CI PASS or merge based solely on the source-level checks.

## NOT RUN / PENDING

- The repository's full Node `npm run test:contracts` command: **NOT RUN** in an installed repo working tree.
- Playwright full cross-pack browser matrix, 320/390/1100/1920px and 200% text: **NOT RUN**. A local Chromium screenshot attempt could not start in the current container environment.
- Real GitHub Pages preview/deployment inspection: **NOT RUN** (draft PR not merged/deployed).
- Human visual/subject acceptance: **PENDING**; generated art is a creative journey montage rather than a photograph.

## Gate

Required before merge: diagnose CI, run the actual Node + Playwright suites in a working browser environment, check offline image loading/asset paths, review the owner's subject fit and responsive layout, then explicitly sign off. The original `main` remains unchanged.

## Follow-up — owner removed GH Actions and requested all Style Pack illustrations

- The sole tracked `.github/workflows/chronological-timeline.yml` has been deleted from `main` in Template, Osaka and Xinjiang, and from the active Template/Osaka artwork PR branches. Old failed workflow runs remain historical entries; **there is no active tracked repository workflow** for these branches.
- Osaka now has 15 bound Style Pack variants: one original full watercolor image plus 14 atlas cells. Local atlas Git blob SHA 3023bc0c1a94b21db828eedd1686f3394a79fa16 matched exported binary exactly. Direct runtime/style/source checks 13/13 passed.
- The complete generated artwork ZIP and 15-style visual contact sheet were delivered in the ChatGPT conversation; the repo stores a compressed AVIF atlas for web use. The atlas is a derived raster preview, not fifteen independent source-photo edits.
- Required manual Node/Chromium/browser and human visual acceptance remain **NOT RUN/PENDING**, not PASS. Removing CI is not equivalent to passing QA; direct source checks are a narrower gate.
