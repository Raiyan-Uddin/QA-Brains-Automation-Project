import fs from 'node:fs';
import path from 'node:path';
import {
  collectExecutionRows,
  ensureDir,
  loadResultsJson,
  moduleToCsvFile,
  reportRoot,
  rowToCsv,
  summarizeRows,
} from './report-utils.mjs';

const executionDate = new Date().toISOString();
const executionId = `RUN-${executionDate.replace(/[-:.TZ]/g, '').slice(0, 14)}`;

const json = loadResultsJson();
const moduleRows = collectExecutionRows(json, executionId, executionDate);

const perModuleHeader = [
  'Execution_ID',
  'Execution_Date',
  'Module',
  'Test_Case_ID',
  'Test_Title',
  'Browser',
  'Status',
  'Duration_ms',
  'Error_Message',
  'Screenshot_Path',
  'Trace_Path',
  'Executed_By',
  'Notes',
];

for (const [moduleName, fileName] of Object.entries(moduleToCsvFile)) {
  const moduleDir = path.join(reportRoot, moduleName);
  ensureDir(moduleDir);

  const rows = moduleRows.get(moduleName) ?? [];
  const csv = [
    rowToCsv(perModuleHeader),
    ...rows.map((r) => rowToCsv([
      r.executionId,
      r.executionDate,
      r.moduleName,
      r.testCaseId,
      r.testTitle,
      r.browser,
      r.status,
      r.duration,
      r.errorMessage,
      r.screenshot,
      r.trace,
      r.executedBy,
      r.notes,
    ])),
  ].join('\n') + '\n';

  fs.writeFileSync(path.join(moduleDir, fileName), csv, 'utf8');
}

const allRows = Array.from(moduleRows.values()).flat();
const { total, passed, failed, skipped, flaky, duration, passRate } = summarizeRows(allRows);

const masterDir = path.join(reportRoot, 'master');
ensureDir(masterDir);

const masterHeader = [
  'Execution_Run_ID',
  'Execution_Date',
  'Total_Modules',
  'Total_Test_Cases',
  'Passed',
  'Failed',
  'Skipped',
  'Flaky',
  'Pass_Rate',
  'Total_Duration_ms',
  'Environment',
  'Report_Source',
  'Remarks',
];

const masterRow = [
  executionId,
  executionDate,
  7,
  total,
  passed,
  failed,
  skipped,
  flaky,
  `${passRate}%`,
  duration,
  'https://practice.qabrains.com/ecommerce',
  'playwright-report-testcases/results.json',
  '',
];

const masterCsv = [rowToCsv(masterHeader), rowToCsv(masterRow)].join('\n') + '\n';
fs.writeFileSync(path.join(masterDir, 'overall_test_execution_summary.csv'), masterCsv, 'utf8');

// Consolidated all-modules report
const allModulesCsv = [
  rowToCsv(perModuleHeader),
  ...allRows.map((r) => rowToCsv([
    r.executionId,
    r.executionDate,
    r.moduleName,
    r.testCaseId,
    r.testTitle,
    r.browser,
    r.status,
    r.duration,
    r.errorMessage,
    r.screenshot,
    r.trace,
    r.executedBy,
    r.notes,
  ])),
].join('\n') + '\n';
fs.writeFileSync(path.join(masterDir, 'all_modules_execution_report.csv'), allModulesCsv, 'utf8');

console.log(`CSV reports generated in: ${reportRoot}`);
console.log(`Execution ID: ${executionId}`);
console.log(`Total=${total}, Passed=${passed}, Failed=${failed}, Skipped=${skipped}, Flaky=${flaky}`);
