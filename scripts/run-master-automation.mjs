import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeExecutable = process.execPath;
const resultsPath = path.join(workspaceRoot, 'playwright-report-testcases', 'results.json');

// Quality gate threshold: minimum pass rate required for a green run.
const QUALITY_GATE_THRESHOLD = Number(process.env.QUALITY_GATE_THRESHOLD ?? 90);

function ensureExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`${label} not found: ${filePath}`);
    process.exit(1);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    cwd: workspaceRoot,
  });

  if (typeof result.status === 'number') {
    return result.status;
  }

  return 1;
}

function runNode(args) {
  return run(nodeExecutable, args);
}

function evaluateQualityGate() {
  if (!fs.existsSync(resultsPath)) return null;

  try {
    const json = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const stats = json.stats ?? {};
    const total = (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.skipped ?? 0) + (stats.flaky ?? 0);
    const passed = (stats.expected ?? 0) + (stats.flaky ?? 0);
    const failed = stats.unexpected ?? 0;
    const skipped = stats.skipped ?? 0;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log('\n========== QUALITY GATE ==========');
    console.log(`  Total:   ${total}`);
    console.log(`  Passed:  ${passed}`);
    console.log(`  Failed:  ${failed}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Pass rate: ${passRate}% (threshold: ${QUALITY_GATE_THRESHOLD}%)`);

    if (passRate >= QUALITY_GATE_THRESHOLD) {
      console.log(`  RESULT: ✓ PASS - Quality gate met`);
    } else {
      console.log(`  RESULT: ✗ FAIL - Pass rate ${passRate}% is below the ${QUALITY_GATE_THRESHOLD}% threshold`);
    }
    console.log('===================================\n');

    return { passRate, passed, failed, skipped, total, gatePassed: passRate >= QUALITY_GATE_THRESHOLD };
  } catch {
    return null;
  }
}

ensureExists(path.join(workspaceRoot, 'package.json'), 'package.json');
ensureExists(path.join(workspaceRoot, 'playwright.testcases.config.ts'), 'playwright testcase config');

// Prevent stale results from previous runs from being reused by report generation.
if (fs.existsSync(resultsPath)) {
  fs.rmSync(resultsPath, { force: true });
}

console.log('Step 1/3: Running all automation test cases from Test_cases...');
const testExitCode = runNode([
  'node_modules/@playwright/test/cli.js',
  'test',
  '--config=playwright.testcases.config.ts',
]);

console.log('Step 2/3: Generating CSV execution reports in report/...');
const csvExitCode = runNode(['scripts/generate-execution-csv-report.mjs']);

if (csvExitCode !== 0) {
  console.error(`CSV report generation failed with exit code ${csvExitCode}.`);
  process.exit(csvExitCode);
}

console.log('Step 3/3: Generating overall HTML report in report/master/...');
const htmlExitCode = runNode(['scripts/generate-html-report.mjs']);

if (htmlExitCode !== 0) {
  console.error(`HTML report generation failed with exit code ${htmlExitCode}.`);
  process.exit(htmlExitCode);
}

const gate = evaluateQualityGate();

if (testExitCode !== 0) {
  if (gate && !gate.gatePassed) {
    console.error(`Quality gate FAILED: pass rate ${gate.passRate}% < ${QUALITY_GATE_THRESHOLD}%. Reports were generated for review.`);
  } else {
    console.warn(`Test execution finished with failures (exit code ${testExitCode}). Reports were generated.`);
  }
  process.exit(testExitCode);
}

console.log('Master automation run completed successfully.');
process.exit(0);
