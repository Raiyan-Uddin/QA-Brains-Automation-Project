---
description: "Prompt for execution-only workflow: run suite, triage failures, and collect artifacts."
---

Execute tests for this repository and triage the run results.

Execution options (pick one based on context):
- Full suite with reports: `npm run master:automation`
- Smoke only (fast check): `npx playwright test --config playwright.testcases.config.ts --grep @smoke`
- Regression only: `npx playwright test --config playwright.testcases.config.ts --grep @regression`
- Single module: `npx playwright test --config playwright.testcases.config.ts "Test_cases/<module folder>"`

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
