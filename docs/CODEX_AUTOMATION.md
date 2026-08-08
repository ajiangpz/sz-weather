# Codex Daily Development Automation

This repository is prepared for a controlled daily Codex development loop.

## Task source

Use GitHub Issues as the task queue.

A task is eligible for autonomous development only when it has the label:

```text
codex-ready
```

Each issue should contain:

- Background / problem
- Requirements
- Acceptance criteria
- Relevant screenshots or references when applicable
- Explicit non-goals when useful

## Daily Codex automation prompt

Use the following prompt for the scheduled Codex task:

```text
Work on repository ajiangpz/sz-weather.

Find open GitHub Issues labeled `codex-ready`.
If there are none, report that there is no eligible task and make no code changes.

Select exactly one eligible issue. Prefer the oldest issue unless the issue text explicitly states a higher priority.

Before coding:
1. Read AGENTS.md completely.
2. Read all project documents required by AGENTS.md.
3. Read the selected issue and its acceptance criteria.
4. Inspect the directly affected code and tests.

Development workflow:
1. Create a branch named `codex/<issue-number>-<short-description>` from `deckGL`.
2. Implement the smallest complete change that satisfies the issue.
3. Do not make unrelated refactors.
4. Do not add dependencies unless clearly required.
5. Add or update tests for changed logic where practical.
6. Maintain `.agent/state.json` and `.agent/issues.md` exactly as required by AGENTS.md.

Validation:
1. Run `pnpm install --frozen-lockfile` when dependencies are not already installed.
2. Run `pnpm verify`.
3. For UI/map/chart/responsive changes, perform the visual checks required by AGENTS.md when browser tooling is available.
4. If validation fails, diagnose the root cause, fix it, and rerun the full applicable validation suite.

Self review:
1. Review the final diff and directly affected call chain.
2. Check functional correctness, acceptance criteria, type safety, boundary cases, error handling, security, performance, resource cleanup, regression risk, and test completeness.
3. Record findings in `.agent/issues.md`.
4. Fix blocking findings and rerun validation.
5. Follow the completion conditions and repair-iteration limit in AGENTS.md.

When complete:
1. Commit the changes with a clear commit message.
2. Push the task branch.
3. Open a Pull Request targeting `deckGL`.
4. Do NOT merge the Pull Request.
5. Link the source issue using `Closes #<issue-number>` when appropriate.
6. Include these PR sections:
   - Summary
   - Changes
   - Tests
   - Validation results
   - Review findings and fixes
   - Risks / limitations
   - Manual verification

If the task cannot be completed safely, do not guess or bypass checks. Leave the task in BLOCKED state and explain the blocker in the final report.
```

## Repository validation

The repository exposes a single verification command:

```bash
pnpm verify
```

It currently runs:

```text
vue-tsc --noEmit
vitest run --passWithNoTests
vue-tsc --noEmit && vite build
```

`--passWithNoTests` is temporary because the current repository does not yet contain a baseline Vitest suite. Once baseline tests are added, remove this flag so absence of tests becomes a CI failure.

## GitHub Actions

Pull requests targeting `deckGL` are independently validated by `.github/workflows/ci.yml`.

Codex validation and GitHub Actions are intentionally separate gates. A successful local/agent run does not replace CI.

## Merge policy

Codex must never automatically merge a task PR. Final merge approval remains manual.
