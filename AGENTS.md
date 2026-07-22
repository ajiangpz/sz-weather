# AGENTS.md

## Project

This project is called RainScope. It is a weather visualization dashboard for Shenzhen.

The goal is to build a portfolio-level frontend data visualization project, not a normal weather query app.

The project should focus on:

- Weather map visualization
- Rainfall radar layer
- Weather alerts
- Time-axis playback
- Trend charts
- Layer control
- Responsive dashboard layout

## Tech Stack

Use:

- Vue 3
- TypeScript
- Vite
- Pinia
- ECharts
- SCSS
- CSS Variables
- Mock data

For the first version, do not require a real weather API.

For the first version, keep the existing MapLibre GL + OSM tile implementation if it is already present.
The map must still follow the RainScope visual direction: dark professional dashboard style, visually quiet basemap, prominent rainfall layer, and no generic weather-query UI.
Do not introduce a real weather API in the first version.

Do not use Three.js in the first version.

## Documentation Source

`chatGPT.md` is a seed/reference document for the project documentation structure.
When it conflicts with later project decisions, follow the current project documents and direct user instructions.
The current map decision is to keep MapLibre GL + OSM for the first implementation milestone and restyle it to match RainScope.

## Required Reading Before Coding

Before making changes, read these documents:

1. `docs/PRODUCT_REQUIREMENTS.md`
2. `docs/UI_DESIGN_SPEC.md`
3. `docs/VISUAL_STYLE_GUIDE.md`
4. `docs/COMPONENT_ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/INTERACTION_SPEC.md`
7. `docs/RESPONSIVE_SPEC.md`
8. `docs/CODEX_TASKS.md`

## Development Principles

- Keep the map as the visual center.
- Do not overuse decorative sci-fi effects.
- Do not turn the project into a basic weather app.
- Use mock data first.
- Keep components small and focused.
- Use TypeScript interfaces for all core weather data.
- Use Pinia for shared dashboard state.
- Use ECharts only through reusable chart components.
- Clean up timers, ECharts instances, and event listeners on component unmount.
- Use responsive layout rules from `docs/RESPONSIVE_SPEC.md`.

## UI Principles

- Use a dark professional dashboard style.
- Use translucent dark-blue panels.
- Keep the rainfall layer visually prominent.
- Use continuous rainfall bands, not administrative area blocks.
- Use meaningful colors for rainfall and alert levels.
- Do not use excessive glow, borders, or animated decorations.

## Validation

Before finishing a task, check:

- The page still works at 1920×1080.
- The page still works at 1440px width.
- TypeScript has no obvious errors.
- ECharts instances are disposed correctly.
- Intervals and event listeners are cleaned up.
- Components follow the documented structure.

## Autonomous Development Loop

Use the following controlled loop for every implementation task. Writing code alone is not completion.

### Workflow

Execute these stages in order:

1. Read the task, acceptance criteria, this file, and the required project documents above.
2. Read `.agent/state.json` when it exists and resume from its recorded state.
3. Inspect the relevant repository files and the directly affected call chain. If `.codegraph/` exists, use CodeGraph before text or file search for code discovery.
4. Create or update the implementation plan.
5. Implement the smallest complete change that satisfies the task.
6. Run all applicable validation commands.
7. Review the implementation and directly related tests, not only the changed lines.
8. Record every test failure and review finding in `.agent/issues.md`.
9. Fix every blocking problem, then rerun the complete applicable validation suite.
10. Repeat validation, review, and repair until the completion conditions are met or 10 repair iterations have been exhausted.

Do not rewrite unrelated modules, add unnecessary dependencies, weaken assertions, suppress failures, disable lint rules globally, or use `any` merely to bypass type errors.

### Execution State

Maintain `.agent/state.json` for active tasks. After every stage, update:

- `status`: one of `PLAN`, `DEVELOP`, `TEST`, `REVIEW`, `FIX`, `DONE`, or `BLOCKED`
- `iteration`: current repair iteration, starting at 1
- `lastCompletedAction`: concise description of the completed stage
- `pendingIssueCount`: number of issues not yet Verified
- `testResult`: latest applicable command results, including unavailable commands and reasons
- `reviewResult`: latest review result

When `.agent/state.json` does not exist, create it at the start of the task. State updates are part of the task and should not be skipped merely because the product change is small.

### Issue Log

Maintain `.agent/issues.md`. Every test failure and review finding must include:

- issue ID
- severity (`Critical`, `High`, `Medium`, or `Low`)
- source (`Test`, `Build`, `Review`, or `Visual QA`)
- affected file
- problem description
- expected behavior
- status (`Open`, `In Progress`, `Resolved`, or `Verified`)

Do not enter `DONE` while any Critical or High issue is Open, In Progress, Resolved but unverified, or otherwise not Verified. Keep resolved issues in the log and mark them Verified only after relevant validation succeeds.

### RainScope Validation Matrix

Before running commands, inspect `package.json` and use the package manager represented by the lockfile. This repository currently uses pnpm conventions. Run each script below when it exists:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

A command passes only when its exit code is 0. If a script is absent, do not invent it or silently skip it: record `Unavailable` with the reason in `.agent/state.json` and the final report. An absent script is not a passing result. In the current project, `build` runs `vue-tsc --noEmit` before Vite, so it provides the available type-check gate until a standalone `typecheck` script is added.

Apply these project-specific checks when relevant:

- For UI, layout, map, chart, or responsive changes, visually verify 1920×1080, 1536×1024, and 1440px desktop layouts. Use the responsive breakpoints in `docs/RESPONSIVE_SPEC.md` when the affected scope reaches tablet or mobile.
- Keep the map visually primary and verify MapLibre, deck.gl overlays, controls, and popups when their call chain is affected.
- Verify that ECharts instances, MapLibre maps, deck.gl overlays, intervals, resize handlers, and manually registered listeners are cleaned up when lifecycle code is affected.
- Use mock data and do not require a live weather API for MVP validation.
- Documentation-only changes do not require browser visual QA unless they alter visual assets or runnable examples.

### Review Checklist

Review for:

1. Functional correctness
2. Acceptance-criteria coverage
3. Type safety
4. Error handling
5. Security risks and accidental credential exposure
6. Boundary conditions
7. Regression risks
8. Duplicate code
9. Maintainability and documented component/store boundaries
10. Test completeness
11. RainScope visual hierarchy and responsive behavior when UI is affected
12. Resource cleanup when charts, maps, playback, or listeners are affected

### Completion and Blocking

Enter `DONE` only when:

1. All acceptance criteria are satisfied.
2. Every available applicable validation command passes.
3. Every unavailable required script is explicitly documented with its reason.
4. No Critical or High issue remains unverified.
5. Every resolved issue has been verified by an applicable test, build, or visual check.
6. Two consecutive complete validation and review cycles produce no new blocking issue.
7. A final completion report has been written.

Run no more than 10 repair iterations. If the limit is reached, set the state to `BLOCKED` and report unresolved problems, attempted fixes, relevant non-secret logs, suspected root cause, and the recommended next action. Never include credentials or secret environment-variable values in state, issues, logs, documentation, or the final report.

### Final Report

The completion report must include:

1. Summary of implemented changes
2. Files changed
3. Tests added or updated
4. Commands executed
5. Validation results, including unavailable scripts
6. Issues found, fixed, and verified
7. Remaining limitations
8. Evidence for each acceptance criterion
