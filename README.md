# QA-Brains-Automation-Project

End-to-end Playwright automation for the QA Brains ecommerce practice app.

## What this project includes

- Module-based automation suites in `Test_cases/`
- Page Object Model framework in `Test_cases/_pom/`
- Master run pipeline (tests + CSV + HTML reports)
- Quality gate summary from `playwright-report-testcases/results.json`
- Consolidated reporting in `report/master/`

## POM framework

The framework is implemented under `Test_cases/_pom/` and is ready for incremental module migration.

- `Test_cases/_pom/constants.ts`: shared routes/constants
- `Test_cases/_pom/pages/BasePage.ts`: base page abstraction
- `Test_cases/_pom/pages/LoginPage.ts`: login interactions and fallback auth flow
- `Test_cases/_pom/pages/HomePage.ts`: home page interactions (sort/cart/profile)
- `Test_cases/_pom/fixtures.ts`: optional Playwright fixtures for page objects

Backward compatibility is preserved:

- Existing shared helper `Test_cases/_shared/helpers.ts` now uses the `LoginPage` object internally.
- Non-migrated specs continue to run without changes.

Migrated examples:

- `Test_cases/1. LOGIN PAGE/login_automation.spec.ts`
- `Test_cases/2. HOME PAGE/home_automation.spec.ts`
- `Test_cases/3. PRODUCT DETAILS PAGE/product_details_automation.spec.ts`
- `Test_cases/4. CART PAGE/cart_automation.spec.ts`
- `Test_cases/5. CHECKOUT YOUR INFO PAGE/checkout_info_automation.spec.ts`
- `Test_cases/6. CHECKOUT OVERVIEW PAGE/checkout_overview_automation.spec.ts`
- `Test_cases/7. CHECKOUT COMPLETE PAGE/checkout_complete_automation.spec.ts`

## Prerequisites

- Node.js LTS 20+ (24.x tested)
- npm 10+
- Windows PowerShell or any shell that can run Node.js

## First-time setup

1. Open project root:

```powershell
cd "d:\2. VScode\Demo ecommerce project"
```

2. Install dependencies:

```powershell
npm install
```

3. Install Playwright browsers:

```powershell
npx playwright install
```

## Run commands

Run all testcase suites:

```powershell
npm run test:testcases
```

Run smoke only:

```powershell
npm run test:smoke
```

Run regression only:

```powershell
npm run test:regression
```

Run full master automation (tests + CSV + HTML):

```powershell
npm run master:automation
```

Open Playwright report:

```powershell
npm run show-report:testcases
```

## Reports generated

- Playwright report: `playwright-report-testcases/index.html`
- Module CSV reports: `report/<module>/...`
- Master CSV + HTML summary: `report/master/`

## Environment variables (optional)

- `TEST_EMAIL`: preferred login username
- `TEST_PASSWORD`: login password
- `QUALITY_GATE_THRESHOLD`: minimum pass-rate percentage for quality gate (default `90`)

PowerShell example:

```powershell
$env:TEST_EMAIL="test@qabrains.com"
$env:TEST_PASSWORD="Password123"
$env:QUALITY_GATE_THRESHOLD="92"
npm run master:automation
```

## Troubleshooting

### npm is not recognized

If `npm` or `node` is not recognized in VS Code terminal:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Alias npm "C:\Program Files\nodejs\npm.cmd" -Scope Global
Set-Alias npx "C:\Program Files\nodejs\npx.cmd" -Scope Global
```

Then verify:

```powershell
npm -v
node -v
```

### Playwright browser missing

```powershell
npx playwright install
```

### Reports generated but tests failed

This is expected behavior of the master runner. It always attempts report generation after test execution to help failure analysis.
