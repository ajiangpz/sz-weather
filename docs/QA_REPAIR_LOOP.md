# RainScope QA Repair Loop

This document defines Phase 4 of the autonomous development workflow for a ChatGPT Plus / Codex scheduled-task setup.

The repository does **not** require an OpenAI API key for this phase. GitHub Actions remains responsible for deterministic CI and Chromium QA. The existing ChatGPT scheduled development task is responsible for inspecting failed QA runs, performing bounded repairs, publishing the repair branch, and verifying the next QA result.

## 1. Architecture

```text
GitHub Issue / existing PR
        ↓
ChatGPT scheduled development task
        ↓
implement / continue branch
        ↓
push
        ↓
Branch Chromium QA
        ↓
qa-summary.json
        ↓
PASS ─────────────→ continue review / ready-to-merge
        │
        └─ FAIL
             ↓
next scheduled task run
             ↓
inspect exact failed SHA + artifact
             ↓
bounded source repair
             ↓
pnpm verify / relevant E2E
             ↓
push one repair commit
             ↓
new exact-SHA QA
```

There is no `openai/codex-action` repair job and no `OPENAI_API_KEY` dependency.

## 2. Repair priority

At the beginning of each scheduled development run, inspect existing active branches/PRs before selecting new `codex-ready` Issues.

Priority order:

1. existing branch/PR with actionable failed `Branch Chromium QA`;
2. existing branch/PR with unresolved review feedback;
3. new `codex-ready` Issue.

This prevents the scheduler from continually starting new work while an earlier branch is waiting for a deterministic repair.

## 3. Automatically repairable failures

Phase 4 intentionally starts narrow.

Automatically repairable stages:

- `deterministic` — `pnpm verify` failed;
- `functionalE2E` — `pnpm test:e2e` failed.

Not automatically repairable in this phase:

- QA contract resolution failures;
- dependency-install failures;
- Chromium-install failures;
- preview/infrastructure failures;
- visual capture failures;
- visual artifact sanity failures;
- subjective screenshot findings without a clear active Issue and reproduction path.

Visual-semantic repair should remain Issue-driven until visual findings have a structured, trustworthy contract.

## 4. Failure discovery

For each active implementation branch, resolve its exact current HEAD SHA and inspect the `branch-chromium-qa` commit status.

When the status indicates failure:

1. parse the Actions Run ID from its target URL;
2. fetch the workflow jobs and artifact;
3. verify artifact `head_branch` and `head_sha` exactly match the active branch and current SHA;
4. read `qa/qa-summary.json`;
5. inspect the relevant logs/evidence for the failed stage.

Do not repair from stale QA evidence.

If the latest status is pending, do not start a repair. Leave the task for a later scheduled execution unless the run completes during the current execution.

## 5. Exact-SHA guard

Before any repair edit:

```text
current branch HEAD == qa-summary.json.target.sha
```

If the branch has moved, discard the stale failure context and inspect the newer SHA instead.

Before pushing a repair, check the branch HEAD again. Do not silently apply an old repair over unrelated newer work.

## 6. Repair scope

The unattended repair lane may modify only:

```text
src/**
```

Protected paths:

```text
.github/**
.agent/**
AGENTS.md
docs/**
tests/**
package.json
pnpm-lock.yaml
```

Do not weaken tests, assertions, lint rules, type checks, validation commands, or acceptance criteria to make QA green.

If the actual root cause requires a protected-path change, leave the branch unchanged and report `BLOCKED` for automatic repair. That change should be handled as normal Issue work with explicit scope.

The detailed repair procedure is in:

```text
.github/codex/prompts/qa-repair.md
```

## 7. Repair budget

Maximum automatic QA repair attempts per Issue/branch:

```text
3
```

Each repair commit records:

```text
QA-Repair-Attempt: N
QA-Repair-Origin-Run: <run-id>
QA-Repair-Mode: <functional|full>
QA-Repair-Issue: <issue-number-or-none>
QA-Repair-Request: <request-id-or-run-id>
```

The scheduler reads the latest relevant repair trailer to calculate the next attempt.

Attempt 4 is not started automatically. The task is reported as `BLOCKED` with the remaining failure, prior attempts, relevant logs/evidence, and recommended human action.

## 8. Validation before publish

A repair must not be pushed until:

1. the root cause has been reproduced or sufficiently identified from deterministic evidence;
2. all changed files are inside `src/**`;
3. the diff is non-empty and contains no unrelated edits;
4. `pnpm verify` passes;
5. when repairing `functionalE2E`, `pnpm test:e2e` passes;
6. the branch still points to the failed QA SHA immediately before publishing.

Publish at most one repair commit for that attempt.

## 9. Revalidation

After a repair push, identify the new exact branch SHA and locate the corresponding `Branch Chromium QA` run.

Normal branch pushes should trigger functional QA. If a required QA run cannot be located, follow `docs/QA_CONTRACT.md` and the repository's documented `gh`/workflow-dispatch fallback. Do not create marker, noop, or trigger-only commits.

For user-visible Issues that require full visual QA, run the full QA contract after functional repair is clean and inspect the screenshots/artifacts rather than treating workflow success alone as visual approval.

If the new QA result is still pending near the end of a scheduled execution, stop cleanly. The next scheduled execution resumes from the same branch and exact latest QA state.

## 10. Scheduled task behavior

The scheduled task should behave as a durable orchestrator rather than a stateless Issue picker:

```text
repair existing failed work
-> handle review feedback
-> continue existing PRs
-> only then start new codex-ready Issues
```

It must reuse existing branches and PRs and must not duplicate work.

A blocked Issue does not block other independent Issues, but an actionable failed QA branch should be repaired before starting additional lower-priority work.

## 11. Push and deployment discipline

For initial Issue implementation, complete local validation before the first final push whenever possible.

For QA repair, an additional push is allowed only when it is a genuine validated repair attempt. Maximum repair pushes are bounded by the three-attempt repair budget.

Never push:

- marker commits;
- noop commits;
- status-only commits;
- commits whose only purpose is to trigger QA or Vercel.

Vercel Preview remains late-stage evidence and is not the primary repair loop.

## 12. Completion

`CODE_WRITTEN != DONE`.

A repaired branch is considered clean only when the repaired exact SHA passes the applicable deterministic/browser QA, and any required visual review and PR review are complete.

The scheduled task must not auto-merge PRs.
