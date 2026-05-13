---
description: "Prompt for master orchestration with mandatory delegation to writer, execute, and report agents."
---

Orchestrate the full automation lifecycle for this repository targeting https://practice.qabrains.com/ecommerce:

1. **Generation phase** — Call `test-case-writer-agent`:
   - Verify all 7 modules have `*_automation.spec.ts` and `*_test_cases.csv`
   - Confirm `Test_cases/_shared/helpers.ts` exists with shared login helper
   - Confirm each module has `@smoke` and `@regression` tagged tests
   - Target: ≥ 85 total tests, ≥ 10 per module

2. **Execution phase** — Call `test-execute-agent`:
   - Run `npm run master:automation` for full suite + reports
   - For quick feedback only (not a full run), use: `npx playwright test --config playwright.testcases.config.ts --grep @smoke`
   - Apply quality gate: pass rate must be ≥ 90%
   - If pass rate < 90%, stop and report failures before proceeding to the reporting phase
   - Confirm `playwright-report-testcases/results.json` produced

3. **Reporting phase** — Call `test-report-agent`:
   - Confirm per-module CSVs in `report/{module}/`
   - Confirm `report/master/overall_test_report.html` and CSV summaries exist
   - Confirm failure categories and severity (P1–P4) are in the report
   - Report smoke vs. regression pass rate split

4. **Summary** — Provide final outcome:
   - Quality gate result (PASS ≥ 90% / FAIL < 90%)
   - Total / passed / failed / skipped counts
   - Any P1 or P2 failures that need immediate attention
   - Recommended next step: fix failing tests, re-run, or escalate to relevant agent

Delegation is mandatory. Always call the specialized agent for each phase; do not perform writer, execute, or report duties inline.
Do not remove any existing files.
