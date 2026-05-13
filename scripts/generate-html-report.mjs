import fs from 'node:fs';
import path from 'node:path';
import {
  collectExecutionRows,
  ensureDir,
  escapeHtml,
  formatMs,
  loadResultsJson,
  moduleOrder,
  reportRoot,
  summarizeRows,
} from './report-utils.mjs';

const json = loadResultsJson();
const executionDate = new Date();
const executionDateIso = executionDate.toISOString();
const executionId = `RUN-${executionDateIso.replace(/[-:.TZ]/g, '').slice(0, 14)}`;

const moduleRows = collectExecutionRows(json, executionId, executionDateIso);

const allRows = Array.from(moduleRows.values()).flat();
const { total, passed, failed, skipped, flaky, duration: totalDuration, passRate } = summarizeRows(allRows);

// Quality gate
const QUALITY_GATE_THRESHOLD = Number(process.env.QUALITY_GATE_THRESHOLD ?? 90);
const gatePassed = passRate >= QUALITY_GATE_THRESHOLD;

// Smoke vs regression split
const smokeRows = allRows.filter((r) => /@smoke/i.test(r.testTitle));
const regressionRows = allRows.filter((r) => /@regression/i.test(r.testTitle));
const smokePassRate = smokeRows.length > 0 ? Math.round((smokeRows.filter((r) => r.status === 'passed' || r.status === 'flaky').length / smokeRows.length) * 100) : 100;
const regressionPassRate = regressionRows.length > 0 ? Math.round((regressionRows.filter((r) => r.status === 'passed' || r.status === 'flaky').length / regressionRows.length) * 100) : 100;

// Failed rows for category section
const failedRows = allRows.filter((r) => r.status !== 'passed' && r.status !== 'skipped');

function badgeClass(status) {
  if (status === 'passed') return 'passed';
  if (status === 'skipped') return 'skipped';
  if (status === 'flaky') return 'flaky';
  return 'failed';
}

function renderModuleSection(moduleName) {
  const rows = moduleRows.get(moduleName) ?? [];
  const rowHtml = rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.testCaseId)}</td>
        <td>${escapeHtml(r.testTitle)}</td>
        <td>${escapeHtml(r.browser)}</td>
        <td><span class="badge ${badgeClass(r.status)}">${escapeHtml(r.status.toUpperCase())}</span></td>
        <td>${escapeHtml(formatMs(r.duration))}</td>
        <td>${escapeHtml(r.errorMessage || '-')}</td>
      </tr>`).join('');

  return `
    <section class="module">
      <h3>${escapeHtml(moduleName)} <span>${rows.length} tests</span></h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Test ID</th>
              <th>Title</th>
              <th>Browser</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </div>
    </section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Overall Test Report</title>
  <style>
    :root {
      --bg: #0b1220;
      --panel: #121b2f;
      --panel2: #18243d;
      --text: #dce7ff;
      --muted: #98a7cc;
      --ok: #2ecc71;
      --bad: #ff5f56;
      --warn: #f5c451;
      --skip: #7f8ea3;
      --border: #243659;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Segoe UI, Arial, sans-serif;
      background: radial-gradient(circle at top right, #1a2f52 0%, var(--bg) 45%);
      color: var(--text);
    }
    .container {
      width: min(1280px, 95vw);
      margin: 24px auto 40px;
    }
    .header {
      background: linear-gradient(145deg, var(--panel), var(--panel2));
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .header h1 { margin: 0 0 8px; font-size: 24px; }
    .meta { color: var(--muted); font-size: 13px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(6, minmax(110px, 1fr));
      gap: 10px;
      margin: 16px 0 10px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
    }
    .card .k { color: var(--muted); font-size: 12px; }
    .card .v { font-size: 22px; font-weight: 700; margin-top: 4px; }
    .module {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-top: 12px;
      overflow: hidden;
    }
    .module h3 {
      margin: 0;
      padding: 12px 14px;
      background: #0f1a2c;
      border-bottom: 1px solid var(--border);
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .module h3 span { color: var(--muted); font-size: 12px; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 900px; }
    th, td {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      font-size: 13px;
    }
    th { color: var(--muted); background: #101a2b; }
    .badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: 700;
      display: inline-block;
    }
    .badge.passed { background: rgba(46,204,113,0.15); color: var(--ok); }
    .badge.failed { background: rgba(255,95,86,0.16); color: var(--bad); }
    .badge.flaky { background: rgba(245,196,81,0.18); color: var(--warn); }
    .badge.skipped { background: rgba(127,142,163,0.2); color: var(--skip); }
    .badge.gate-pass { background: rgba(46,204,113,0.2); color: var(--ok); font-size: 13px; padding: 6px 14px; }
    .badge.gate-fail { background: rgba(255,95,86,0.2); color: var(--bad); font-size: 13px; padding: 6px 14px; }
    .quality-gate {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      margin: 8px 0 14px;
      border: 1px solid var(--border);
      background: var(--panel2);
    }
    .split-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .split-table th, .split-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
    .split-table th { color: var(--muted); background: #101a2b; }
    .section-title { font-size: 16px; font-weight: 600; margin: 18px 0 8px; color: var(--text); }
    .footer { color: var(--muted); font-size: 12px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Overall Automation Report</h1>
      <div class="meta">Execution ID: ${escapeHtml(executionId)} | Date: ${escapeHtml(executionDateIso)} | Source: playwright-report-testcases/results.json</div>
    </div>

    <div class="stats">
      <div class="card"><div class="k">Total</div><div class="v">${total}</div></div>
      <div class="card"><div class="k">Passed</div><div class="v" style="color:var(--ok)">${passed}</div></div>
      <div class="card"><div class="k">Failed</div><div class="v" style="color:var(--bad)">${failed}</div></div>
      <div class="card"><div class="k">Skipped</div><div class="v" style="color:var(--skip)">${skipped}</div></div>
      <div class="card"><div class="k">Flaky</div><div class="v" style="color:var(--warn)">${flaky}</div></div>
      <div class="card"><div class="k">Pass Rate</div><div class="v">${passRate}%</div></div>
    </div>

    <div class="quality-gate">
      <span class="badge ${gatePassed ? 'gate-pass' : 'gate-fail'}">${gatePassed ? '✓ QUALITY GATE PASSED' : '✗ QUALITY GATE FAILED'}</span>
      <span style="color:var(--muted);font-size:13px">Pass rate ${passRate}% ${gatePassed ? '≥' : '<'} threshold ${QUALITY_GATE_THRESHOLD}%</span>
    </div>

    <div class="section-title">Smoke vs Regression Split</div>
    <div class="module">
      <div class="table-wrap">
        <table class="split-table">
          <thead><tr><th>Tag</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr></thead>
          <tbody>
            <tr>
              <td>@smoke</td>
              <td>${smokeRows.length}</td>
              <td style="color:var(--ok)">${smokeRows.filter((r) => r.status === 'passed' || r.status === 'flaky').length}</td>
              <td style="color:var(--bad)">${smokeRows.filter((r) => r.status !== 'passed' && r.status !== 'skipped' && r.status !== 'flaky').length}</td>
              <td>${smokePassRate}%</td>
            </tr>
            <tr>
              <td>@regression</td>
              <td>${regressionRows.length}</td>
              <td style="color:var(--ok)">${regressionRows.filter((r) => r.status === 'passed' || r.status === 'flaky').length}</td>
              <td style="color:var(--bad)">${regressionRows.filter((r) => r.status !== 'passed' && r.status !== 'skipped' && r.status !== 'flaky').length}</td>
              <td>${regressionPassRate}%</td>
            </tr>
            <tr>
              <td style="color:var(--muted)">Untagged</td>
              <td>${allRows.length - smokeRows.length - regressionRows.length}</td>
              <td style="color:var(--ok)">${allRows.filter((r) => !/@smoke|@regression/i.test(r.testTitle) && (r.status === 'passed' || r.status === 'flaky')).length}</td>
              <td style="color:var(--bad)">${allRows.filter((r) => !/@smoke|@regression/i.test(r.testTitle) && r.status !== 'passed' && r.status !== 'skipped' && r.status !== 'flaky').length}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    ${failedRows.length > 0 ? `
    <div class="section-title">Failed &amp; Flaky Tests</div>
    <div class="module">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Test ID</th><th>Title</th><th>Status</th><th>Module</th><th>Error Summary</th></tr>
          </thead>
          <tbody>
            ${failedRows.map((r) => `
            <tr>
              <td>${escapeHtml(r.testCaseId)}</td>
              <td>${escapeHtml(r.testTitle)}</td>
              <td><span class="badge ${badgeClass(r.status)}">${escapeHtml(r.status.toUpperCase())}</span></td>
              <td style="color:var(--muted);font-size:12px">${escapeHtml(r.moduleName ?? '')}</td>
              <td style="color:var(--bad);font-size:12px">${escapeHtml((r.errorMessage ?? '').slice(0, 200) || '—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="section-title">Module Results</div>
    ${moduleOrder.map(renderModuleSection).join('')}

    <div class="footer">Total Duration: ${escapeHtml(formatMs(totalDuration))}</div>
  </div>
</body>
</html>`;

const masterDir = path.join(reportRoot, 'master');
ensureDir(masterDir);

const outFile = path.join(masterDir, 'overall_test_report.html');
fs.writeFileSync(outFile, html, 'utf8');

console.log(`HTML report generated: ${outFile}`);
console.log(`Execution ID: ${executionId}`);
console.log(`Total=${total}, Passed=${passed}, Failed=${failed}, Skipped=${skipped}, Flaky=${flaky}`);
