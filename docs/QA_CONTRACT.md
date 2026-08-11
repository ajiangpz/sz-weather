# RainScope Chromium QA Contract

This document defines the stable interface between the RainScope repository and a future autonomous development orchestrator.

The implementation lives in `.github/workflows/online-visual-qa.yml` and is exposed as the GitHub Actions workflow **Branch Chromium QA**.

## 1. Purpose

The QA workflow has two responsibilities:

1. validate an exact repository commit through deterministic and Chromium functional gates;
2. optionally collect the more expensive production-preview visual evidence required for user-visible changes.

The workflow must be callable without creating marker/no-op commits.

## 2. Invocation modes

### Automatic branch push

A push to any branch except `deckGL` runs:

```text
qa_mode = functional
```

This intentionally performs the cheaper validation path only:

```text
frozen-lockfile install
-> pnpm verify
-> Chromium install
-> pnpm test:e2e
-> machine-readable summary
```

It does not start the separate production preview or dynamic visual-evidence capture.

### Explicit workflow dispatch

An orchestrator or human may explicitly dispatch the workflow with these inputs:

| Input | Required | Meaning |
| --- | --- | --- |
| `target_ref` | yes | Branch, tag, or SHA to checkout |
| `expected_sha` | no | Exact commit the caller expects `target_ref` to resolve to |
| `qa_mode` | yes | `functional` or `full` |
| `issue_number` | no | GitHub Issue number used for correlation |
| `request_id` | no | Caller-generated idempotency/correlation identifier |

Recommended autonomous call:

```text
target_ref   = active Issue branch
expected_sha = branch HEAD observed by the orchestrator
qa_mode      = full for user-visible work, otherwise functional
issue_number = active Issue number
request_id   = stable identifier for this QA request
```

## 3. Exact target safety

`target_ref` alone is not sufficient for autonomous validation because a branch may move between scheduling and checkout.

The workflow resolves the checkout to:

```text
TARGET_SHA = git rev-parse HEAD
```

When `expected_sha` is supplied, the workflow fails before validation if:

```text
expected_sha != TARGET_SHA
```

An orchestrator must never mark a task verified when the returned `target.sha` differs from the commit it intended to validate.

## 4. QA modes

### `functional`

Required stages:

```text
resolve
install
deterministic
browserInstall
functionalE2E
```

The following stages are intentionally skipped:

```text
preview
visualCapture
visualSanity
```

### `full`

Runs all functional stages first. Only after they pass does it run:

```text
production preview
-> desktop screenshot capture
-> dynamic wind-frame capture when available
-> artifact sanity checks
```

Current desktop visual evidence:

- 1920x1080
- 1536x1024
- 1440x900

Current dynamic evidence samples the wind-enabled page at multiple time offsets.

## 5. Run discovery

The workflow publishes a commit status with context:

```text
branch-chromium-qa
```

The status `target_url` points to the exact GitHub Actions run.

This allows a caller that knows the intended commit SHA to discover the corresponding QA run without enumerating unrelated repository runs.

The workflow also records the run URL and run ID inside its machine-readable artifact.

## 6. Artifact name

Each workflow attempt uploads one artifact named:

```text
branch-chromium-qa-{run_id}-{run_attempt}
```

The run ID is the primary locator. A rerun produces a separate attempt-suffixed artifact.

## 7. Artifact layout

Expected structure:

```text
qa/
  qa-contract.json
  qa-summary.json
  logs/
    preview.log              # full mode when available

playwright-report/
test-results/

visual-qa/                   # full mode only
  visual-summary.json
  desktop/
    1920x1080.png
    1536x1024.png
    1440x900.png
  wind/
    frame-*.png
```

The JSON files are the API. Screenshots, HTML reports, and logs are evidence referenced by that API.

## 8. `qa-contract.json`

Written immediately after checkout and target resolution.

Schema version 1:

```json
{
  "schemaVersion": 1,
  "workflow": "branch-chromium-qa",
  "request": {
    "requestId": "issue-42-qa-1",
    "issueNumber": "42",
    "targetRef": "fix/issue-42-example",
    "expectedSha": "abc123...",
    "mode": "full"
  },
  "execution": {
    "eventName": "workflow_dispatch",
    "runId": 123456,
    "runAttempt": 1,
    "runUrl": "..."
  },
  "target": {
    "sha": "abc123..."
  }
}
```

For automatic push validation, `requestId` defaults to:

```text
run-{run_id}
```

## 9. `qa-summary.json`

Written with `if: always()` so ordinary validation failures still produce a machine-readable result whenever checkout/runner execution allowed the summary step to run.

Schema version 1:

```json
{
  "schemaVersion": 1,
  "workflow": "branch-chromium-qa",
  "request": {
    "requestId": "issue-42-qa-1",
    "issueNumber": "42",
    "targetRef": "fix/issue-42-example",
    "expectedSha": "abc123...",
    "mode": "full"
  },
  "execution": {
    "eventName": "workflow_dispatch",
    "runId": 123456,
    "runAttempt": 1,
    "runUrl": "..."
  },
  "target": {
    "sha": "abc123..."
  },
  "result": "success",
  "stages": {
    "resolve": "success",
    "install": "success",
    "deterministic": "success",
    "browserInstall": "success",
    "functionalE2E": "success",
    "preview": "success",
    "visualCapture": "success",
    "visualSanity": "success"
  },
  "evidence": {
    "playwrightReport": "playwright-report/",
    "testResults": "test-results/",
    "visualSummary": "visual-qa/visual-summary.json",
    "desktopScreenshots": "visual-qa/desktop/",
    "dynamicFrames": "visual-qa/wind/",
    "previewLog": "qa/logs/preview.log"
  }
}
```

Stage outcomes use GitHub step outcomes such as:

```text
success
failure
skipped
cancelled
```

For `functional` mode, visual stages are expected to be `skipped` and visual evidence paths are `null`.

## 10. Result semantics

A successful `functional` result requires:

```text
resolve
AND install
AND deterministic
AND browserInstall
AND functionalE2E
```

A successful `full` result additionally requires:

```text
preview
AND visualCapture
AND visualSanity
```

The `result` field reflects automated gate completion. It does not mean that subjective visual inspection has approved every screenshot. Phase 4 may add machine-readable visual findings on top of this transport contract.

## 11. Orchestrator consumption algorithm

Recommended sequence:

```text
1. Read active branch HEAD SHA.
2. Decide functional vs full from Issue scope.
3. Dispatch Branch Chromium QA with expected_sha.
4. Resolve the run through commit status / returned orchestration metadata.
5. Wait for run completion.
6. Download branch-chromium-qa-{run_id}-{attempt}.
7. Read qa/qa-summary.json first.
8. Confirm summary.target.sha == intended SHA.
9. If result == failure, inspect the failing stage and evidence.
10. If result == success and mode == full, continue visual finding/review processing.
```

Do not infer PASS solely from the existence of screenshots or a successful artifact upload.

## 12. Current validation evidence

Phase 3 functional contract was exercised on branch `agent/autonomy-foundation`.

Run:

```text
31473341755
```

Artifact:

```text
branch-chromium-qa-31473341755-1
```

Validated target SHA:

```text
7458f6e5c4e6278780fdfb646d065f9d66392f7e
```

The produced `qa-summary.json` reported:

- mode: `functional`
- deterministic: `success`
- functionalE2E: `success`
- preview / visualCapture / visualSanity: `skipped`
- result: `success`

## 13. Rollout note

GitHub `workflow_dispatch` is intended to be exercised after this workflow version exists on the repository default branch. Until this foundation PR is merged, the feature-branch push path is the available end-to-end validation of the new contract.

The existing full visual-capture implementation remains the basis of `qa_mode=full`; after merge, an explicit full dispatch should be used as the first Phase 4 prerequisite check.
