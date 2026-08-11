# RainScope Autonomous Development Lifecycle

This document defines the repository-level workflow for AI-assisted autonomous development.

The goal is not to let one agent make unlimited changes. The goal is to make each GitHub Issue a small, testable unit of work that moves through a controlled state machine with explicit quality gates.

## 1. Operating model

Human responsibilities:

- define product direction and priorities;
- approve ambiguous product/design decisions;
- review blocked tasks;
- perform the final merge until the automation is proven stable.

Agent responsibilities:

- implement one ready Issue at a time;
- run deterministic validation before pushing;
- collect browser evidence for user-visible changes;
- repair bounded failures;
- open or update one pull request per Issue;
- stop and report when retry limits are reached.

## 2. Source of truth

GitHub is the control plane.

The authoritative task inputs are:

1. GitHub Issue body and acceptance criteria;
2. `AGENTS.md`;
3. project documents required by `AGENTS.md`;
4. unresolved review comments on the active pull request.

A chat message, temporary scratch file, or agent memory must not silently override the Issue or repository rules.

## 3. Task sizing

One Issue should normally map to:

- one branch;
- one implementation scope;
- one pull request;
- one independently verifiable outcome.

Split a task before marking it ready when it contains unrelated product changes, multiple architectural migrations, or acceptance criteria that cannot be validated together.

## 4. State machine

Recommended lifecycle:

```text
backlog
  -> codex-ready
  -> agent-working
  -> ci
  -> qa
      -> agent-fix -> ci -> qa
  -> review
  -> ready-to-merge
  -> done
```

Any stage may enter `blocked` when a dependency is missing, a required environment is unavailable, or retry limits are exhausted.

State labels describe workflow state. Type, area, priority, and risk labels should remain separate from state labels.

## 5. Branch and pull-request policy

Branch naming:

```text
feat/issue-{number}-{slug}
fix/issue-{number}-{slug}
refactor/issue-{number}-{slug}
agent/issue-{number}-{slug}
```

Rules:

- one Issue = one active implementation branch;
- continue an existing branch/PR instead of creating a duplicate;
- do not force-push the base branch;
- do not auto-merge while the workflow is still being hardened;
- PR body must include the Issue, implementation summary, validation results, QA evidence, known limitations, and remaining subjective decisions.

## 6. Quality gates

Use gates from cheapest to most expensive.

### Gate A — deterministic code validation

Run locally or in the branch environment before expensive browser work:

```text
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm verify` when it represents the complete currently available deterministic suite.

A missing required script is `Unavailable`, not `Passed`.

### Gate B — functional browser validation

Run Playwright Chromium for relevant user flows.

Check at minimum:

- page loads;
- changed interaction works;
- required enabled/disabled states behave correctly;
- no relevant console/page errors occur;
- no horizontal overflow or obvious clipping appears.

### Gate C — visual and dynamic QA

Required for user-visible changes.

Current desktop evidence set:

- 1920x1080;
- 1536x1024;
- 1440x900.

For animation, radar playback, wind field, or timeline changes, capture multiple time points. A single static screenshot is not sufficient evidence.

Tablet/mobile evidence should be added when the active Issue affects those responsive ranges.

### Gate D — pull-request review

Review the complete affected call chain, not only changed lines.

Review for:

- acceptance-criteria coverage;
- regression risk;
- type safety;
- lifecycle/resource cleanup;
- error handling;
- duplicated logic;
- scope creep;
- test adequacy;
- unresolved PR review findings.

## 7. Repair budget

Automation must be bounded.

Recommended maximum automatic repair attempts per Issue:

- deterministic CI repair: 2;
- browser/visual repair: 3;
- deployment retry: 1.

After the relevant limit is exhausted, transition the task to `blocked` and report:

- failing gate;
- exact remaining findings;
- fixes already attempted;
- non-secret logs/evidence;
- suspected root cause;
- recommended human action.

Do not create marker/no-op commits merely to trigger additional QA runs unless the workflow explicitly requires it and no safer dispatch mechanism exists.

## 8. QA report contract

Every automated QA failure should produce structured evidence that a repair agent can consume.

Recommended finding format:

```text
ID: QA-001
Severity: Critical | High | Medium | Low
Source: Test | Build | Browser | Visual QA | Review
Viewport / environment: ...
Affected file/component: ...
Expected: ...
Actual: ...
Reproduction: ...
Evidence: ...
Status: Open | In Progress | Resolved | Verified
```

A finding is only `Verified` after the relevant validation is rerun successfully.

## 9. Vercel policy

Vercel Preview is a late-stage smoke-test environment, not the first validation layer.

Preferred order:

```text
implement
-> local/branch deterministic validation
-> local Chromium QA
-> push / PR
-> Vercel Preview
-> preview smoke test
```

Avoid duplicate preview workflows when Vercel's native GitHub integration already deploys pull requests.

Avoid repeated push/deploy cycles for problems that can be detected with local build or Chromium QA first.

## 10. Completion contract

`CODE_WRITTEN` is not `DONE`.

An Issue is ready for merge only when all applicable conditions are true:

- acceptance criteria are satisfied;
- deterministic validation passes;
- required browser tests pass;
- required visual/dynamic QA passes;
- no blocking finding remains unverified;
- relevant PR review findings are resolved;
- PR contains evidence and remaining limitations;
- the branch contains no unrelated changes.

## 11. Progressive rollout

Do not automate every layer at once.

### Phase 1 — task contract

- standard Codex-ready Issue form;
- documented lifecycle and state machine;
- bounded retry policy.

### Phase 2 — deterministic gates

- normalize package scripts;
- add/repair lint and browser-test commands;
- expose one predictable CI entry point.

### Phase 3 — reusable Chromium QA

- make branch QA discoverable and reliably dispatchable;
- upload structured artifacts and metadata;
- avoid trigger-only commits.

### Phase 4 — repair loop

- convert QA failures into machine-readable findings;
- feed findings back to the active implementation branch;
- rerun only within the repair budget.

### Phase 5 — orchestration

- select one `codex-ready` Issue;
- transition workflow state;
- invoke development, QA, repair, and review stages;
- stop on `blocked` or `ready-to-merge`;
- only then select the next Issue.

### Phase 6 — optional concurrency

Only after the single-Issue loop is stable:

- run independent Issues in parallel;
- isolate worktrees/branches;
- enforce dependency ordering;
- limit concurrent expensive QA and deployment jobs.

## 12. Current next step

After this foundation is merged, the next repository change should focus on Phase 2: make the deterministic and browser validation commands explicit and stable before adding an autonomous repair orchestrator.
