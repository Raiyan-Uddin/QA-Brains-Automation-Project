---
description: "Prompt for execution-only workflow: run suite, triage failures, and collect artifacts."
---

Execute tests for this repository and triage the run results.

Execution mode selection:
- Use **full suite** (`npm run master:automation`) when running scheduled, pre-release, or master-agent-triggered runs
- Use **smoke only** (`npx playwright test --config playwright.testcases.config.ts --grep @smoke`) when the user requests a fast sanity check only
- Use **regression only** (`npx playwright test --config playwright.testcases.config.ts --grep @regression`) when smoke tests already passed and deeper coverage is needed
- Use **single module** (`npx playwright test --config playwright.testcases.config.ts "Test_cases/<module folder>"`) when investigating a specific module failure

Quality gate (mandatory):
- Pass rate ≥ 90% = PASS (green)
- Pass rate < 90% = FAIL (block reporting, escalate to master agent)

Output required:
- Total / passed / failed / skipped / flaky counts and pass rate %
- Quality gate result: PASS or FAIL
- Failure classification table:
  | Test ID | Title | Category | Error Summary |
  |---------|-------|----------|---------------|
  - Categories: App Bug / Test Bug / Flaky / Environment
- Retry analytics: list any tests that passed only on retry (flaky)
- Artifact paths for all failed tests (screenshots, traces under `test-results/`)
- Next step recommendation per failure category

Constraints:
- Only execution and triage — do not edit test cases
- Do not generate final HTML/CSV reports (that belongs to test-report-agent)
- Preserve all artifacts for failed runs
- If `playwright-report-testcases/results.json` is missing after a run, report the missing artifact and stop; do not proceed to triage
