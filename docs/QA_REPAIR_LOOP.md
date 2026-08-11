# RainScope QA Repair Loop

This document defines Phase 4 of the autonomous development workflow: bounded automatic repair for machine-verifiable QA failures.

## 1. Scope

Phase 4 intentionally starts narrow.

Automatically repairable failure stages:

- `deterministic` — `pnpm verify` failed;
- `functionalE2E` — `pnpm test:e2e` failed.

Not automatically repairable in this phase:

- QA contract resolution failures;
- dependency-install failures;
- Chromium-install failures;
- production-preview infrastructure failures;
- visual capture failures;
- visual artifact sanity failures;
- subjective screenshot findings.

Visual-semantic repair should be added only after visual findings have a structured, trustworthy contract.

## 2. Trigger

`.github/workflows/qa-repair.yml` listens for completed `Branch Chromium QA` runs.

The repair workflow proceeds only when:

1. the QA run concluded with `failure`;
2. the originating repository is this repository;
3. the QA artifact contains `qa/qa-summary.json`;
4. the failed stage is currently repairable;
5. the target resolves to an existing non-`deckGL` branch;
6. the target SHA is exact;
7. the automatic repair budget has not been exhausted.

Cancelled QA runs do not start automatic repair.

## 3. Machine-readable repair input

The prepare job converts the failed QA summary into:

```text
qa-summary.json
findings.json
repair-request.json
```

`findings.json` contains the normalized QA finding.

`repair-request.json` contains:

- origin QA run;
- target branch and exact SHA;
- QA mode;
- failed stage;
- reproduction command;
- repair attempt and maximum budget;
- allowed/protected scope;
- eligibility decision.

These files are uploaded as a short-lived workflow artifact and copied into `.agent/qa-input/` only inside the repair runner. `.agent/` is excluded locally from Git so repair context is never committed.

## 4. Codex repair policy

The repair job uses `openai/codex-action@v1` with the repository prompt:

```text
.github/codex/prompts/qa-repair.md
```

The automated repair lane may modify only:

```text
src/**
```

Protected paths include:

```text
.github/**
.agent/**
AGENTS.md
docs/**
tests/**
package.json
pnpm-lock.yaml
```

This prevents an automatic repair from making a failing run green by weakening tests, changing workflow behavior, changing dependencies, or editing project rules.

Codex is instructed not to commit or push. The orchestration workflow independently validates and publishes the patch.

## 5. Independent patch validation

After Codex runs, the repair job:

1. rejects untracked files outside `.agent/**` and `src/**`;
2. rejects modified files outside `src/**`;
3. requires a non-empty patch;
4. reruns `pnpm verify`;
5. reruns `pnpm test:e2e` when the original failed stage was `functionalE2E`;
6. exports a binary-safe Git patch only after those checks pass.

The resulting patch is uploaded as a separate artifact.

## 6. Stale-write protection

The apply job checks out the target branch and compares its current HEAD to the exact SHA that failed QA.

If the branch has moved, the repair is rejected as stale and is not pushed.

This prevents a patch generated for an old commit from being silently applied on top of unrelated newer work.

## 7. Repair commit and retry budget

A successful automatic repair commit contains trailers similar to:

```text
QA-Repair-Attempt: 1
QA-Repair-Origin-Run: 123456789
QA-Repair-Mode: functional
QA-Repair-Issue: 42
QA-Repair-Request: issue-42-attempt-1
```

The next repair attempt is derived from `QA-Repair-Attempt` on the failed target commit.

Maximum automatic repair attempts:

```text
3
```

Attempt 4 is not started automatically.

## 8. Revalidation

The workflow does not rely on the repair push to trigger another GitHub Actions run.

After pushing the validated repair commit, the apply job explicitly dispatches `online-visual-qa.yml` with:

- the repaired branch;
- the new exact SHA;
- the original QA mode;
- the original Issue number when available;
- the original request ID when available.

This is required because GitHub intentionally suppresses most new workflow runs caused by pushes performed with the repository `GITHUB_TOKEN`.

The loop is therefore:

```text
QA failure
-> normalize finding
-> check budget/scope
-> Codex repair
-> local validation
-> stale-SHA guard
-> push repair commit
-> explicit QA dispatch
-> PASS or next bounded repair attempt
```

## 9. Required secret

The repository must provide this GitHub Actions secret before automatic Codex repair can execute:

```text
OPENAI_API_KEY
```

If the secret is absent, the repair workflow stops before calling Codex and does not push a speculative change.

## 10. Security boundaries

The repair workflow:

- accepts automatic repair only for failures from this repository;
- does not auto-repair the protected `deckGL` branch;
- checks out the exact failed SHA for Codex;
- does not persist GitHub write credentials in the Codex checkout;
- runs Codex with `sandbox: workspace-write`;
- keeps the default `drop-sudo` safety strategy;
- explicitly allows only the repository GitHub Actions bot for chained repair attempts;
- validates the patch again in a separate write-enabled job that does not receive the OpenAI API key;
- rejects stale branches and protected-path changes.

## 11. Activation test

Because `workflow_run` workflows execute from the default branch, the Phase 4 workflow becomes fully active only after its PR is merged into `deckGL`.

After merge, validate the loop with a controlled disposable branch containing a small, deterministic `src/**` defect that is expected to fail an existing test or typecheck. The successful activation test must demonstrate:

1. Branch Chromium QA fails;
2. QA Repair downloads and normalizes the artifact;
3. Codex produces an in-scope repair;
4. independent validation passes;
5. a repair commit is pushed;
6. the repaired SHA is explicitly re-dispatched to Branch Chromium QA;
7. the second QA run passes;
8. no fourth repair attempt can be started after the configured budget.

Do not test the repair loop by weakening an existing assertion or by introducing a destructive production behavior.
