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

The repository exposes one deterministic command:

```text
pnpm verify
```

It currently runs:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

A command passes only when its exit code is 0. ESLint warnings also fail the current lint gate.

### Gate B — functional browser validation

Run:

```text
pnpm test:e2e
```

The current Playwright project uses Chromium.

Check at minimum:

- page loads;
- changed interaction works;
- required enabled/disabled states behave correctly;
- no relevant console/page errors occur;
- no horizontal overflow or obvious clipping appears.

For a single local/CI command that runs Gate A and Gate B, use:

```text
pnpm verify:full
```

The CI workflow intentionally keeps Gate A and Gate B as separate jobs so expensive browser setup does not run when deterministic validation already fails.

### Gate C — visual and dynamic QA

Required for user-visible changes.

The reusable GitHub Actions interface is documented in:

```text
docs/QA_CONTRACT.md
```

`Branch Chromium QA` supports:

```text
functional
full
```

A normal feature-branch push runs `functional` mode. `full` mode is intended for explicit dispatch by an orchestrator or human when the Issue requires visual evidence.

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

## 8. QA transport and finding contracts

The stable workflow transport contract is defined in:

```text
docs/QA_CONTRACT.md
```

The workflow currently produces:

```text
qa/qa-contract.json
qa/qa-summary.json
```

These files identify the requested ref, exact validated SHA, mode, run ID, stage outcomes, overall automated result, and evidence locations.

The transport contract is intentionally separate from the future repair finding contract.

Every automated QA failure that will be passed to a repair agent should ultimately produce findings in this shape:

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

Phase 4 will make these findings machine-readable and connect them to the active repair loop.

## 9. Exact SHA rule

An autonomous orchestrator must validate the commit it intended to validate, not merely the latest commit on a branch at some later time.

Recommended sequence:

```text
read branch HEAD SHA
-> dispatch QA with target_ref + expected_sha
-> workflow resolves checkout SHA
-> fail if expected_sha != resolved SHA
-> read qa-summary.json
-> require summary.target.sha == intended SHA
```

Never mark an Issue verified using evidence generated from a different commit.

## 10. QA cost policy

Use the cheapest sufficient gate.

Preferred sequence:

```text
local/branch pnpm verify
-> functional Chromium E2E
-> full visual QA only when Issue scope requires it
```

Normal branch pushes therefore run functional QA only.

The expensive production-preview screenshot/dynamic evidence path is reserved for explicit `full` QA requests. This reduces repeated browser work while preserving visual verification for UI/map/chart/animation changes.

## 11. Vercel policy

Vercel Preview is a late-stage smoke-test environment, not the first validation layer.

Preferred order:

```text
implement
-> deterministic validation
-> functional/full Chromium QA as applicable
-> push / PR
-> Vercel Preview
-> preview smoke test
```

Avoid duplicate preview workflows when Vercel's native GitHub integration already deploys pull requests.

Avoid repeated push/deploy cycles for problems that can be detected with local build or Chromium QA first.

## 12. Completion contract

`CODE_WRITTEN` is not `DONE`.

An Issue is ready for merge only when all applicable conditions are true:

- acceptance criteria are satisfied;
- deterministic validation passes;
- required browser tests pass;
- required visual/dynamic QA passes;
- QA evidence belongs to the intended commit SHA;
- no blocking finding remains unverified;
- relevant PR review findings are resolved;
- PR contains evidence and remaining limitations;
- the branch contains no unrelated changes.

## 13. Progressive rollout

Do not automate every layer at once.

### Phase 1 — task contract — implemented in foundation PR

- standard Codex-ready Issue form;
- documented lifecycle and state machine;
- bounded retry policy.

### Phase 2 — deterministic gates — implemented in foundation PR

- normalized package scripts;
- ESLint baseline;
- fixed Playwright dependency in the lockfile;
- deterministic CI before Chromium browser work;
- stable `pnpm verify`, `pnpm test:e2e`, and `pnpm verify:full` commands.

### Phase 3 — reusable Chromium QA — implemented in foundation PR

- feature-branch pushes use `functional` mode;
- explicit dispatch supports `functional` or `full` mode;
- optional `expected_sha` prevents validating a moved branch accidentally;
- optional Issue/request correlation metadata;
- commit status points to the exact Actions run;
- artifact naming includes run ID and attempt;
- `qa-contract.json` and `qa-summary.json` provide a versioned machine-readable interface;
- expensive visual capture is separated from ordinary push validation.

Phase 3 functional mode was exercised end to end on run `31473341755`, target SHA `7458f6e5c4e6278780fdfb646d065f9d66392f7e`, and produced artifact `branch-chromium-qa-31473341755-1` with `result: success`.

### Phase 4 — repair loop

Next implementation target:

- convert deterministic/E2E/visual failures into machine-readable findings;
- map failed stages to repair instructions;
- feed findings back to the active implementation branch;
- rerun QA against the new exact branch SHA;
- stop within the repair budget.

Before enabling automated repair for visual work, explicitly dispatch one `full` QA run after this workflow version exists on the default branch and verify its contract/artifact output.

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

## 14. Current next step

Phase 4 should build on the versioned QA transport rather than parsing human-oriented logs directly.

The next repository change should introduce a machine-readable finding format and failure extraction for deterministic/E2E stages first. Visual finding generation should be added only after an explicit `full` dispatch has been verified on the default branch.
