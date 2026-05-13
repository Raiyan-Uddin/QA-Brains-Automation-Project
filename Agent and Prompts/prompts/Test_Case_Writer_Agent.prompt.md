---
description: "Prompt for test-case writing only in Test_cases inputs and Playwright automation files for this project."
---

Analyze `C:\Other\Demo ecommerce project\Test_cases` and perform test-case writing work only.

Requirements:
- Maintain and grow `Test_cases/_shared/helpers.ts` with shared `login()`, `seedCart()`, `fillCheckoutInfo()` helpers
- All spec files must import shared helpers instead of duplicating login logic inline
- Update `*_automation.spec.ts` and matching `*_test_cases.csv` files for all 7 modules
- Keep module-by-module FR traceability from `doc/srs.txt` to every test ID
- Keep test IDs and titles consistent across spec and CSV files
- Tag every test with `@smoke` or `@regression` in the test title
  - `@smoke` = critical happy-path (2–3 per module, fast)
  - `@regression` = boundary, negative, validation, edge, guard scenarios

Coverage targets per module (minimum):
- 2 `@smoke` tests (happy path, critical feature)
- 3 positive flow tests
- 2 validation / negative tests
- 1 boundary test
- 1 access-guard test
- Total per module: ≥ 10 tests
- Grand total: ≥ 85 tests across all 7 modules

Locator standards:
- Prefer `#id`, `[role]`, `[placeholder]`, `data-testid` selectors
- Avoid positional selectors (`:nth-child`, `:eq`, XPath) unless no alternative
- Use `getByRole`, `getByLabel`, `getByText` from Playwright locator API

Do not execute tests.
Do not generate reports.

Output format:
- List updated module paths
- List updated CSV files
- List updated automation spec files
- Report new test count per module and grand total
