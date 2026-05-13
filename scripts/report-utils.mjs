import fs from 'node:fs';
import path from 'node:path';

export const workspaceRoot = process.cwd();
export const resultsPath = path.join(workspaceRoot, 'playwright-report-testcases', 'results.json');
export const reportRoot = path.join(workspaceRoot, 'report');

export const moduleOrder = [
  '1. LOGIN PAGE',
  '2. HOME PAGE',
  '3. PRODUCT DETAILS PAGE',
  '4. CART PAGE',
  '5. CHECKOUT YOUR INFO PAGE',
  '6. CHECKOUT OVERVIEW PAGE',
  '7. CHECKOUT COMPLETE PAGE',
];

export const moduleToCsvFile = {
  '1. LOGIN PAGE': 'login_execution_report.csv',
  '2. HOME PAGE': 'home_execution_report.csv',
  '3. PRODUCT DETAILS PAGE': 'product_details_execution_report.csv',
  '4. CART PAGE': 'cart_execution_report.csv',
  '5. CHECKOUT YOUR INFO PAGE': 'checkout_info_execution_report.csv',
  '6. CHECKOUT OVERVIEW PAGE': 'checkout_overview_execution_report.csv',
  '7. CHECKOUT COMPLETE PAGE': 'checkout_complete_execution_report.csv',
};

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function parseTestCaseId(title) {
  const match = /^([A-Z]+-\d+)/.exec(title ?? '');
  return match ? match[1] : '';
}

export function parseModuleName(specFilePath) {
  const normalized = String(specFilePath ?? '').replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts[0].toLowerCase() === 'test_cases') return parts[1] ?? '';
  return parts[0] ?? '';
}

export function walkSuites(suites, callback) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      callback(spec);
    }
    walkSuites(suite.suites ?? [], callback);
  }
}

export function loadResultsJson() {
  if (!fs.existsSync(resultsPath)) {
    console.error(`results.json not found at: ${resultsPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

export function collectExecutionRows(json, executionId, executionDateIso) {
  const moduleRows = new Map(moduleOrder.map((m) => [m, []]));

  walkSuites(json.suites, (spec) => {
    const moduleName = parseModuleName(spec.file ?? '');
    if (!moduleRows.has(moduleName)) return;

    for (const t of spec.tests ?? []) {
      const result = t.results?.length ? t.results[t.results.length - 1] : null;
      const status = String(result?.status ?? (t.status === 'skipped' ? 'skipped' : t.status ?? 'unknown')).toLowerCase();
      const duration = Number(result?.duration ?? 0);
      const browser = t.projectName ?? t.projectId ?? '';

      const errorMessage =
        result?.error?.message ||
        (Array.isArray(result?.errors) && result.errors.length > 0 ? result.errors[0]?.message : '') ||
        '';

      const attachments = result?.attachments ?? [];
      const screenshot = attachments.find((a) => (a.name || '').toLowerCase().includes('screenshot'))?.path ?? '';
      const trace = attachments.find((a) => (a.name || '').toLowerCase().includes('trace') || String(a.path || '').toLowerCase().endsWith('.zip'))?.path ?? '';

      moduleRows.get(moduleName).push({
        executionId,
        executionDate: executionDateIso,
        moduleName,
        testCaseId: parseTestCaseId(spec.title),
        testTitle: spec.title ?? '',
        browser,
        status,
        duration,
        errorMessage,
        screenshot,
        trace,
        executedBy: 'Test_Execute_Agent',
        notes: '',
      });
    }
  });

  return moduleRows;
}

export function summarizeRows(rows) {
  const total = rows.length;
  const passed = rows.filter((r) => r.status === 'passed').length;
  const skipped = rows.filter((r) => r.status === 'skipped').length;
  const flaky = rows.filter((r) => r.status === 'flaky').length;
  const failed = rows.filter((r) => !['passed', 'skipped', 'flaky'].includes(r.status)).length;
  const duration = rows.reduce((sum, r) => sum + Number(r.duration || 0), 0);
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

  return { total, passed, failed, skipped, flaky, duration, passRate };
}

export function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowToCsv(row) {
  return row.map(csvEscape).join(',');
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMs(ms) {
  const n = Number(ms ?? 0);
  if (n < 1000) return `${n} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}
