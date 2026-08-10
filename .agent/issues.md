# Agent Issues

## AGENT-001

- Severity: Low
- Source: Build
- Affected file: `dist/assets/index-BKV_m1p7.js`
- Problem description: Vite reports that the generated main JavaScript chunk is approximately 2.85 MB, above its 500 kB warning threshold.
- Expected behavior: Production bundles should use intentional code splitting or an explicitly justified warning threshold so initial asset size remains controlled.
- Status: Open

## AGENT-002

- Severity: High
- Source: Visual QA
- Affected file: `src/utils/radarDeckLayers.ts`
- Problem description: The generated radar bitmap merges dense seeds into a broad severe-rain magenta field across much of central and eastern Shenzhen, masking district boundaries and making the overlay look like a smooth blob instead of weather radar.
- Expected behavior: Low-intensity blue/cyan fields should remain broad, while yellow/orange/magenta cores stay localized and echo edges retain deterministic fragmented gaps without becoming isolated administrative blocks or dots.
- Status: Verified

## AGENT-003

- Severity: High
- Source: Test
- Affected file: `src/utils/radarDeckLayers.ts`
- Problem description: The first visual tuning pass reduced a 36 mm/h radar core to a sampled popup value of 14.1 mm/h, failing the existing severe-core threshold test.
- Expected behavior: A 36 mm/h seed must still sample above 16 mm/h at its center while its warm-color footprint remains localized.
- Status: Verified

## AGENT-004

- Severity: Medium
- Source: Visual QA
- Affected file: `src/styles.css`
- Problem description: The dashboard used a generic glossy circular logo, equally elevated panels, pill-shaped telemetry, and no explicit keyboard focus or reduced-motion treatment; the full header could also overflow between 1201px and 1320px.
- Expected behavior: RainScope should read as a distinctive rainfall-monitoring instrument, keep the map visually dominant through quieter surrounding surfaces, expose visible keyboard focus, respect reduced motion, and preserve the full desktop header down to the tablet breakpoint.
- Status: Verified

## AGENT-005

- Severity: High
- Source: Review
- Affected file: `src/styles.css`
- Problem description: The first design pass added a repeating 96px vertical background line, creating a decorative grid pattern that conflicts with RainScope's restrained visual direction.
- Expected behavior: The page background should remain calm and atmospheric, with the radar observation badge as the single signature element and no decorative grid.
- Status: Verified

## AGENT-006

- Severity: High
- Source: Review
- Affected file: `.agent/state.json`
- Problem description: `reviewResult` contained two identical `status` keys, making the execution state ambiguous for strict JSON consumers.
- Expected behavior: Every state field must have exactly one unambiguous value.
- Status: Verified

## AGENT-007

- Severity: Medium
- Source: Review
- Affected file: `src/styles.css`
- Problem description: The design pass introduced `--color-surface-deep` and `--color-surface-raised` without using them, adding misleading design-system surface levels.
- Expected behavior: Every design token should have a concrete consumer or be omitted until needed.
- Status: Verified

## AGENT-008

- Severity: Medium
- Source: Visual QA
- Affected file: `src/styles.css`
- Problem description: At 1440×900, the fixed compact right-column row heights clip the humidity/wind metric values at the bottom, fully hide the metric panel's `查看详情` action, and clip the second alert card's `查看详情` action.
- Expected behavior: Every visible metric and interactive action must remain fully inside its panel at the supported 1440px desktop width without being hidden by `overflow: hidden`.
- Status: Verified

## AGENT-009

- Severity: Medium
- Source: Visual QA
- Affected file: `src/styles.css`
- Problem description: The timeline playback-speed button shrinks its chevron SVG to 1.5px wide at 1920×1080, 1536×1024, and 1440×900, making the icon nearly invisible.
- Expected behavior: The speed dropdown chevron should retain its declared 13×13px size and remain clearly recognizable at every supported desktop size.
- Status: Verified

## AGENT-010

- Severity: Low
- Source: Review
- Affected file: `.gitignore`
- Problem description: Daily optimization logs and reports would appear as untracked files after every scheduled run.
- Expected behavior: Generated daily-run artifacts should remain available locally without polluting the repository working tree.
- Status: Verified

## AGENT-011

- Severity: Medium
- Source: Visual QA
- Affected file: `src/utils/windDeckLayers.ts`, `src/components/weather/WeatherMapPanel.vue`
- Problem description: Real Chromium screenshots at 1920×1080, 1536×1024, and 1440×900 show the post-PR #5 wind field as very sparse isolated cyan dashes. Across 0.9-second frame intervals the marks move, but the field does not read as a coherent flowing vector field; direction and speed are difficult to perceive and the fixed short segments resemble scratches/noise more than weather particles.
- Expected behavior: Preserve rainfall as the primary visual layer while rendering a clearly readable low-density wind field with natural non-grid particle distribution, visibly continuous data-driven motion, short fading tails, and unobtrusive respawn at lifecycle boundaries.
- Status: Verified

## AGENT-012

- Severity: Medium
- Source: Visual QA
- Affected file: `src/styles.css`
- Problem description: Issue #4 reports that baked CARTO/OSM labels and road detail remain too prominent relative to rainfall and custom district labels. The first repair pass reduces the MapLibre canvas brightness, saturation, contrast, and opacity while leaving deck.gl weather overlays and DOM labels outside that filter.
- Expected behavior: At 1920×1080, 1536×1024, and 1440×900 the basemap should read as quiet geographic context; rainfall and custom Shenzhen district labels should clearly dominate while water/major-road context remains usable.
- Status: Verified

## AGENT-013

- Severity: High
- Source: Visual QA
- Affected file: `index.html`
- Problem description: The current execution environment cannot capture or inspect the required real Chromium screenshots for the Issue #4 Vercel Preview, so the visual result of the first basemap repair cannot be verified safely in this run.
- Expected behavior: Run the branch preview in Chromium at 1920×1080, 1536×1024, and 1440×900, compare against Issue #4 and the design references, and only mark the repair Verified when the rendered hierarchy is correct.
- Status: Verified

## AGENT-014

- Severity: High
- Source: Visual QA
- Affected file: `src/district-labels.css`, `tests/e2e/dashboard.spec.mjs`
- Problem description: Issue #10 implementation and `pnpm verify` pass on the Vercel branch build, but this automation runtime has no usable Chromium/agent-browser executable and cannot inspect the authenticated branch Preview at 1920×1080, 1536×1024, and 1440×900. Therefore label overlap, strong-rain readability, and restrained halo appearance cannot be visually verified in the required two clean cycles.
- Expected behavior: Render the `fix/issue-10-district-labels` branch in real Chromium at all three desktop viewports, inspect all ten district labels against rainfall/stations/boundaries, confirm no distracting glow or overlap, and complete two clean validation + visual QA + review cycles before creating the PR.
- Status: Open

## AGENT-015

- Severity: High
- Source: Visual QA
- Affected file: `src/mock/windField.ts`, `src/utils/windDeckLayers.ts`
- Problem description: Issue #14 was previously blocked because Vercel could not provide a stable real-Chromium visual loop. The blocker was resolved by running the unchanged Issue #14 product implementation in GitHub-hosted Ubuntu with real Playwright Chromium. Two consecutive clean runs (`31360266446` and `31360448871`) each passed `pnpm verify`, opened the wind-field control, captured 1920×1080, 1536×1024, and 1440×900 full-page screenshots, and captured 0/120/240/600/1800 ms dynamic frames. Manual visual review found no Issue-related Critical/High/Medium problem: rainfall remains dominant, wind particles remain short and auxiliary, density has no large desktop holes or small-viewport line wall, labels/stations stay readable, and the sampled motion shows no obvious freeze, flicker, jump, reset, or hard boundary cutoff. All five dynamic frame hashes were distinct in both runs.
- Expected behavior: Run `fix/issue-14-wind-density` in a stable real Chromium environment, execute Playwright Chromium validation, capture all three required desktop viewports plus the five requested wind timepoints, compare against Issue #14 and the design references, and complete two consecutive clean validation + Visual QA + Review cycles before creating a PR.
- Status: Verified

## AGENT-016

- Severity: Medium
- Source: Test
- Affected file: `.github/workflows/issue-15-visual-qa.yml`
- Problem description: The first Issue #15 real-Chromium validation run passed `pnpm verify`, installed Chromium, started the production preview, and captured all three static desktop screenshots, but the dynamic radar playback step failed because `getByRole('button', { name: '播放' })` also matched the `播放速度` button under Playwright strict mode.
- Expected behavior: The temporary visual harness should target the exact play/pause control so timeline-driven radar frame sampling can complete without selector ambiguity.
- Status: Verified

## AGENT-017

- Severity: Medium
- Source: Visual QA
- Affected file: `src/utils/radarDeckLayers.ts`
- Problem description: Issue #15 identified a repeated diagonal/cross-hatch texture in the generated rainfall bitmap, most visible through the Luohu-Yantian and northeastern strong-echo bands. The repair replaces fixed-direction trigonometric texture terms with deterministic multi-scale value noise sampled at varied rotations. Manual inspection of real Chromium evidence from runs `31361983116` and `31362190638` at 1920×1080, 1536×1024, and 1440×900 found the repeating diagonal stripe/mesh pattern removed while broad blue/cyan echo fields, localized warm cores, irregular edge breakup, district labels, and station markers remained readable. Timeline-driven frames changed naturally without obvious texture flicker, hard reset, or newly introduced directional repetition.
- Expected behavior: Radar echoes should retain continuous weather-field structure and localized strong cores without repeated diagonal bands, cross-hatch mesh, tile seams, or overly dominant texture; the result must remain stable across all supported desktop viewports and timeline-driven frame changes.
- Status: Verified

## AGENT-018

- Severity: Medium
- Source: Visual QA
- Affected file: `src/mock/weather.ts`
- Problem description: Issue #18 identifies warm severe-rain cores whose mock seed centers and intensities form visually regular bead-like chains. The implementation changes only mock storm-core seed geometry to uneven deterministic two-dimensional clusters, with varied offsets and intensity peaks; `pnpm verify` passes with regression coverage, but the rendered visual result has not yet been verified in the required real Chromium viewports and timeline/wind frames.
- Expected behavior: At 1920×1080, 1536×1024, and 1440×900, the Luohu/Yantian and Pingshan/eastern warm cores should read as irregular clustered weather echoes with merges and gaps rather than equally spaced beads, while broad blue/cyan fields, labels, stations, the Issue #15 value-noise texture, and auxiliary wind motion remain intact across timeline frames.
- Status: In Progress

## AGENT-019

- Severity: High
- Source: Visual QA
- Affected file: `src/mock/weather.ts`, `src/components/weather/WeatherMapPanel.vue`
- Problem description: The branch Preview is READY and `pnpm verify` passed in Vercel, but this automation runtime cannot perform the user-required real Playwright Chromium visual loop: local Chromium exists, yet the runtime has no network/DNS path to the Vercel Preview, and the connected Vercel tools can fetch deployment content but cannot drive or screenshot a real browser. A temporary branch GitHub Actions visual harness also did not produce a run/comment in this execution.
- Expected behavior: Run the current `fix/issue-18-radar-seed` branch in network-capable Playwright Chromium, capture full-page and map screenshots at 1920×1080, 1536×1024, and 1440×900, enable wind, sample timeline playback at multiple timepoints, compare with Issue #18 and the design references, and complete two consecutive clean validation + Visual QA + full call-chain review cycles before creating or declaring the PR complete.
- Status: Open
