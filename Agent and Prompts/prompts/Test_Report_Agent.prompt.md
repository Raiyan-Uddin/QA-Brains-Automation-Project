---
description: "Prompt for post-execution reporting only using Playwright results and report artifacts."
---

After test execution, parse the latest Playwright results and produce reporting outputs.

Pre-condition check:
- Confirm `playwright-report-testcases/results.json` exists before proceeding
- If missing, stop and notify master agent to re-run execution phase

Report generation commands:
- `npm run report:testcases:csv` → per-module CSVs + `report/master/all_modules_execution_report.csv`
- `npm run report:testcases:html` → `report/master/overall_test_report.html`

Required report sections:
1. **Executive summary**: total / passed / failed / skipped, pass rate %, quality gate result (PASS ≥ 90% / FAIL < 90%)
2. **Module breakdown**: per-module pass/fail counts and pass rate
3. **Smoke vs regression split**: smoke pass rate and regression pass rate; flag any smoke failure as a P1 issue
4. **Failure severity table** (sorted P1 first):
   | Severity | Test ID | Title | Category | Error Summary | Remediation |
   |----------|---------|-------|----------|---------------|-------------|
   - P1 Critical: checkout/login/cart broken
   - P2 High: key feature failure (sort, PDP, add-to-cart)
   - P3 Medium: validation, boundary failure
   - P4 Low: cosmetic/accessibility failure
5. **FR coverage map**: SRS FR-* requirements with at least one passing test (linked to test IDs)
6. **Next actions**: prioritized list for the team — each item must include the failure test ID, severity, recommended fix type (test fix / app bug / environment), and which agent to delegate to

Project path constraints:
- Read results from `playwright-report-testcases/results.json`
- Write reports to `C:\Other\Demo ecommerce project\report`
- Keep summary consistent with `report/master/overall_test_execution_summary.csv`

Constraints:
- Reporting only — do not edit test cases or execute tests
- Use test evidence for classification, not speculation
