# AGENTS.md

## Project

RainScope is a portfolio-level weather visualization dashboard for Shenzhen.

Primary product goals:

- weather map visualization;
- rainfall radar as the primary map overlay;
- weather alerts;
- timeline playback;
- trend charts;
- layer controls;
- responsive dashboard layout.

This is not a generic weather-query application.

## Tech stack

Use the existing stack unless the active Issue explicitly requires an architectural change:

- Vue 3
- TypeScript
- Vite
- Pinia
- ECharts
- MapLibre GL
- deck.gl
- SCSS / CSS variables
- mock weather data for the current MVP

Do not introduce a live weather API for the MVP unless the Issue explicitly requires it.
Do not introduce Three.js unless the Issue explicitly changes the current map architecture.

## Source of truth

For an implementation task, read these sources in this order:

1. the active GitHub Issue and its acceptance criteria;
2. this file;
3. `docs/AUTONOMOUS_DEVELOPMENT.md`;
4. required product/design documents below;
5. unresolved review comments on the active pull request.

Do not silently replace current Issue requirements with stale chat context, temporary notes, or earlier implementation assumptions.

## Required project reading

Before coding, read the documents relevant to the active Issue. For broad UI or architecture work, read all of them:

1. `docs/PRODUCT_REQUIREMENTS.md`
2. `docs/UI_DESIGN_SPEC.md`
3. `docs/VISUAL_STYLE_GUIDE.md`
4. `docs/COMPONENT_ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/INTERACTION_SPEC.md`
7. `docs/RESPONSIVE_SPEC.md`
8. `docs/CODEX_TASKS.md`

`chatGPT.md` is a seed/reference document only. Current project documents and the active Issue take precedence.

## Scope discipline

One Issue should produce one focused implementation branch and one pull request.

Before editing:

1. read the complete Issue;
2. inspect the relevant implementation and directly affected call chain;
3. identify allowed and protected scope;
4. continue an existing branch/PR for the Issue when one already exists;
5. implement the smallest complete change that satisfies the acceptance criteria.

Do not:

- rewrite unrelated modules;
- add unnecessary dependencies;
- weaken assertions to make tests pass;
- suppress failures;
- globally disable lint/type checks;
- use `any` merely to bypass type errors;
- create no-op/marker commits only to trigger QA when workflow dispatch or rerun is available;
- create duplicate PRs for the same active Issue.

## Architecture and lifecycle rules

- Keep components small and focused.
- Use TypeScript interfaces for core weather data.
- Use Pinia for shared dashboard state.
- Use ECharts through reusable chart components.
- Preserve the existing MapLibre + deck.gl architecture unless the Issue explicitly changes it.
- Clean up ECharts instances, MapLibre/deck.gl resources, animation frames, timers, resize handlers, and manually registered listeners when affected lifecycle code is changed.
- Keep rendered radar data and related sampling/popup logic consistent when they share a data source.

## Visual principles

- The map remains the visual center.
- Rainfall radar remains the primary weather overlay.
- The basemap should be visually quiet.
- Use continuous rainfall fields, not administrative-area blocks.
- Keep wind visualization subordinate to rainfall radar and labels.
- Preserve readable district labels, stations, alerts, and controls.
- Use a dark professional dashboard style with compact, data-forward panels.
- Avoid excessive glow, decorative sci-fi effects, and visual elements that compete with weather data.

## Autonomous workflow

Follow `docs/AUTONOMOUS_DEVELOPMENT.md` for the full state machine, repair budget, QA report contract, branch policy, Vercel policy, and completion contract.

At a minimum, execute:

```text
PLAN
-> DEVELOP
-> TEST
-> BROWSER / VISUAL QA when applicable
-> REVIEW
-> FIX when required
-> DONE or BLOCKED
```

Writing code is never sufficient evidence for `DONE`.

## Execution state

For an active autonomous task, maintain `.agent/state.json` when the workflow uses repository state files.

Recommended fields:

- `issueNumber`
- `branch`
- `status`: `PLAN | DEVELOP | TEST | QA | REVIEW | FIX | DONE | BLOCKED`
- `iteration`
- `lastCompletedAction`
- `pendingIssueCount`
- `testResult`
- `qaResult`
- `reviewResult`

Do not store credentials, tokens, cookies, or secret environment-variable values in agent state, logs, reports, screenshots, or commits.

## Finding log

When `.agent/issues.md` is used, every finding must include:

- ID
- severity: `Critical | High | Medium | Low`
- source: `Test | Build | Browser | Visual QA | Review`
- affected file/component
- problem
- expected behavior
- evidence when available
- status: `Open | In Progress | Resolved | Verified`

A finding is only `Verified` after the relevant validation is rerun successfully.

Do not enter `DONE` while an active-Issue Critical or High finding remains unverified. For user-visible work, active-Issue Medium visual findings must also be verified before completion.

## Deterministic validation

Inspect `package.json` and the lockfile before running commands. This repository currently uses pnpm.

Current primary deterministic gate:

```powershell
pnpm verify
```

Run additional scripts when they exist and are relevant, for example:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

A command passes only when its exit code is 0.

If a required script does not exist, record it as `Unavailable` with the reason. Do not invent a script and do not count absence as a pass.

## Browser and visual QA

User-visible changes require real browser validation. Unit tests and a green build are necessary but not sufficient.

For current desktop-focused Issues, capture and inspect:

- 1920x1080
- 1536x1024
- 1440x900

When the active Issue affects tablet or mobile behavior, also validate the relevant breakpoints from `docs/RESPONSIVE_SPEC.md`.

Check at minimum:

- functional interaction;
- disabled/enabled states when relevant;
- loading/empty/error states when relevant;
- overlap and clipping;
- horizontal overflow;
- visual hierarchy and spacing;
- map/radar/label/control layer priority;
- browser page/console errors.

### Dynamic visual behavior

For wind particles, radar playback, timeline playback, chart animation, or other animated behavior, one static screenshot is not enough.

Inspect multiple time points and check:

- natural motion direction;
- data-driven speed where applicable;
- appropriate density/trail length;
- no obvious jump, blink, flicker, freeze, or unnatural reset;
- no distracting hard boundary cutoff;
- no obstruction of higher-priority weather information;
- a random static frame still reads correctly.

## Repair budget

Automatic repair must be bounded.

Default maximum attempts per Issue:

- deterministic CI repair: 2;
- browser/visual repair: 3;
- deployment retry: 1.

Do not run an unbounded 10-iteration repair loop.

When the relevant limit is reached, set the task to `BLOCKED` and report:

- failing gate;
- unresolved findings;
- attempted fixes;
- non-secret evidence/logs;
- suspected root cause;
- recommended human action.

## Vercel policy

Vercel Preview is a late-stage smoke-test environment, not the primary debugging loop.

Preferred order:

```text
implement
-> pnpm verify
-> local/branch Chromium QA
-> push / PR
-> Vercel Preview
-> preview smoke test
```

Do not add a second PR-preview deployment workflow while Vercel's native GitHub integration already handles PR previews.

## Review checklist

Review the changed code and directly affected call chain for:

1. functional correctness;
2. acceptance-criteria coverage;
3. type safety;
4. error handling;
5. security and accidental credential exposure;
6. boundary conditions;
7. regression risk;
8. duplicate code;
9. maintainability and documented component/store boundaries;
10. test completeness;
11. visual hierarchy and responsive behavior when UI is affected;
12. resource cleanup when maps, charts, playback, animation, or listeners are affected;
13. required visual evidence;
14. unresolved PR review threads related to the active Issue;
15. unrelated changes or scope creep.

## Completion contract

`CODE_WRITTEN != DONE`.

Enter `DONE` / `ready-to-merge` only when all applicable conditions are true:

1. all acceptance criteria are satisfied;
2. deterministic validation passes;
3. required browser tests pass;
4. required visual/dynamic QA passes;
5. no blocking finding remains unverified;
6. relevant PR review findings are resolved;
7. the PR contains validation and QA evidence plus remaining limitations;
8. the branch contains no unrelated changes.

For high-risk visual/animation work or after a repair, prefer two consecutive clean validation + browser/visual review cycles before final approval. Do not require extra Vercel deployments merely to obtain the second clean cycle.

## Final report

The task completion report should include:

1. summary of implemented changes;
2. files changed;
3. tests added or updated;
4. commands executed;
5. validation results and unavailable scripts;
6. findings fixed and verified;
7. browser/visual evidence and viewport conclusions;
8. dynamic observations when relevant;
9. remaining limitations or subjective decisions;
10. evidence for each acceptance criterion.
