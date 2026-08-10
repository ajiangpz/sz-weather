# Issue #18 Completion Report

## Summary

Adjusted only the mock rainfall storm-core geometry so the Luohu/Yantian and Pingshan/eastern warm echoes render as uneven clustered weather cells instead of regular bead-like chains. The Issue #15 radar bitmap renderer, deterministic value-noise texture, rainfall palette, opacity, BitmapLayer ordering, popup sampling, and wind renderer were not changed.

## Files changed

- `src/mock/weather.ts`
- `src/mock/weather.test.ts`
- `.agent/issues.md`
- `.agent/state.json`
- `.agent/issue18-completion-report.md`

Temporary GitHub Actions workflows, visual helper scripts, and trigger markers used during validation were removed before PR creation.

## Tests added or updated

Updated the mock-radar regression coverage to require strong echoes in the Luohu/Yantian and Pingshan/eastern regions to have sufficient two-dimensional spread, non-uniform adjacent spacing, and multiple intensity bands instead of collapsing back into a regular one-dimensional bead chain.

## Commands and validation

- `pnpm lint`: Unavailable; `package.json` has no lint script.
- `pnpm typecheck`: Covered by `pnpm verify`/the existing build gate (`vue-tsc --noEmit`).
- `pnpm test`: Passed as part of `pnpm verify`; 7 test files / 27 tests.
- `pnpm test:integration`: Unavailable; `package.json` has no `test:integration` script.
- `pnpm build`: Passed as part of `pnpm verify`; the pre-existing unrelated AGENT-001 large-chunk warning remains.
- `pnpm verify`: Passed in both final committed-geometry clean cycles.
- Existing Playwright Chromium E2E: Passed in both final clean cycles.
- Real Chromium Visual QA: Passed in runs `31386087042` and `31386466832`.

## Issues found and verified

- `AGENT-018` Medium / Visual QA: Issue #18 strong-core mock geometry needed real-browser verification. Verified after the final geometry repair.
- `AGENT-019` High / Visual QA: the original runtime could not reach the Vercel Preview. Resolved by moving the visual loop to GitHub-hosted Ubuntu with local production preview + real Playwright Chromium, then verified in repeated successful runs.
- `AGENT-020` Medium / Visual QA: the first real Chromium evidence still showed rhythmic warm-core beads. Fixed by consolidating repeated centers into fewer uneven two-dimensional clusters and varying peak positions/intensities; verified in the two final committed-geometry clean cycles.
- `AGENT-021` Medium / Test: temporary Issue #18 validation workflows had YAML/heredoc/quoting and final comment-step failures during harness development. The harness was simplified to external helper scripts and a robust `gh issue comment` command; the final two cycles completed successfully end-to-end.

## Visual QA evidence

Final clean cycle 1: GitHub Actions run `31386087042`, artifact `9061804741` (`issue-18-visual-evidence-31386087042`).

Final clean cycle 2: GitHub Actions run `31386466832`, artifact `9061950059` (`issue-18-visual-evidence-31386466832`).

Both cycles used real headless Playwright Chromium and captured full-page/map evidence at:

- 1920×1080
- 1536×1024
- 1440×900

Manual conclusions in both cycles:

- The Luohu/Yantian warm echoes read as a small number of uneven overlapping clumps with visible gaps rather than an equally spaced chain.
- The Pingshan/eastern warm echoes read as a compact irregular cluster with a broader green/blue continuation rather than repeated same-size beads.
- Broad blue/cyan rainfall remains continuous, semi-transparent, and dominant over the subdued basemap.
- The Issue #15 fixed-direction stripe/cross-hatch texture does not reappear.
- District labels, station markers, boundaries, scale, and map controls remain readable at all three supported desktop sizes.
- Wind remains an auxiliary short-particle layer and does not obscure the rainfall radar.

## Dynamic radar and wind playback

At 1536×1024, both final cycles sampled timeline-driven radar + enabled wind at 0 / 600 / 1200 / 2400 / 3600 ms.

- Run `31386087042`: 5 distinct screenshot hashes and 5 distinct frame times; no page errors.
- Run `31386466832`: 5 distinct screenshot hashes and 5 distinct frame times; no page errors.

Manual multi-frame review found no obvious freeze, flicker, hard reset, abrupt clipping, fixed directional radar texture, or recurrence of the regular warm-core bead pattern. Warm-core shapes change naturally as the timeline shifts the deterministic radar frame, while wind particles remain short and visually subordinate.

## Code review

Reviewed the full related call chain rather than only the diff:

`src/mock/weather.ts` → `src/stores/weather.ts` → `WeatherMapPanel.createRadarFrame()` → `createRadarBitmap()` / `sampleRadarIntensity()` → deck.gl `BitmapLayer`.

The weather store continues to expose the same radar collections. `WeatherMapPanel` still derives both the rendered bitmap and clicked-point popup rainfall from the same timeline-shifted radar frame. `radarDeckLayers.ts` is unchanged from the Issue #15 renderer and retains shared scalar-field calculation for bitmap output and popup sampling. No new dependencies, renderer branches, timers, listeners, or layer-order changes were introduced by Issue #18.

Two consecutive final validation + Visual QA + code-review cycles produced no new Issue #18 Critical/High/Medium finding.

## Remaining limitations

- `AGENT-001` is a pre-existing Low Vite chunk-size warning unrelated to Issue #18.
- `AGENT-014` belongs to the separate Issue #10 district-label task and is unrelated to Issue #18.
- The mock scenario intentionally keeps two main precipitation bands. The repair makes their strong cores irregular and clustered; it does not attempt to redesign the entire synthetic storm system.

## Acceptance criteria evidence

- No obvious equal-spacing/equal-size warm-core bead chain at 1920×1080, 1536×1024, or 1440×900: Verified in both final real-Chromium cycles.
- Warm cores retain meaningful yellow/orange/severe peaks with varied spacing, local overlap, and gaps: Verified visually and by the updated mock-radar regression test.
- Broad blue/cyan echoes remain continuous and soft: Verified visually in both cycles.
- Issue #15 stripe/cross-hatch/tile-seam regression absent: Verified visually across static and dynamic frames.
- Radar remains above the basemap while labels, stations, boundaries, controls, and wind remain readable: Verified at all three desktop sizes.
- Multiple timeline frames do not restore the bead pattern: Verified at five sampled timepoints per cycle.
- `pnpm verify`: Passed in both final clean cycles.
- Playwright Chromium E2E and real Chromium Visual QA: Passed in both final clean cycles.
