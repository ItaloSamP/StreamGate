#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..')
const outputPath = path.join(rootDir, 'docs', 'reports', 'index.html')

const REPORTS = [
  ['Frontend unit', 'apps/web/reports/unit/summary.json'],
  ['Frontend integration', 'apps/web/reports/integration/summary.json'],
  ['Frontend E2E', 'apps/web/e2e/reports/summary.json'],
  ['API tests', 'apps/api/test/reports/summary.json'],
  ['Worker tests', 'apps/worker/spec/reports/summary.json'],
  ['Smokes', 'scripts/smokes/reports/summary.json'],
  ['CI local', 'scripts/ci/reports/summary.json'],
]

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function readSummary(label, relativePath) {
  const absolutePath = path.join(rootDir, relativePath)
  if (!existsSync(absolutePath)) {
    return {
      label,
      status: 'NOT_RUN',
      durationSeconds: null,
      startedAt: null,
      reportPath: null,
      artifacts: [],
    }
  }

  try {
    const rawSummary = readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '')
    return {
      label,
      ...JSON.parse(rawSummary),
    }
  } catch (error) {
    return {
      label,
      status: 'ERROR',
      durationSeconds: null,
      startedAt: null,
      reportPath: null,
      artifacts: [{ label: 'Parse error', path: relativePath, detail: error.message }],
    }
  }
}

function hrefFromDocsReports(relativePath) {
  return path.relative(path.dirname(outputPath), path.join(rootDir, relativePath)).replaceAll(path.sep, '/')
}

function card(summary) {
  const statusClass = summary.status === 'PASS' ? 'pass' : summary.status === 'FAIL' ? 'fail' : 'neutral'
  const artifacts = [
    summary.reportPath ? { label: 'Report', path: summary.reportPath } : null,
    ...(summary.artifacts ?? []),
  ].filter(Boolean)

  const artifactLinks = artifacts.length
    ? artifacts.map((artifact) => `<a href="${escapeHtml(hrefFromDocsReports(artifact.path))}">${escapeHtml(artifact.label)}</a>`).join('')
    : '<span class="muted">Sem artefatos ainda</span>'
  const workflowItems = Array.isArray(summary.workflows) && summary.workflows.length
    ? `<ul class="workflow-list">${summary.workflows.map((workflow) => `<li><strong>${escapeHtml(workflow.Workflow)}</strong><span class="${escapeHtml(String(workflow.Status ?? '').toLowerCase())}">${escapeHtml(workflow.Status ?? 'UNKNOWN')}</span><em>${escapeHtml(workflow.Detail ?? '')}</em></li>`).join('')}</ul>`
    : ''
  const lastStep = summary.lastCompletedStep
    ? `<p class="last-step">Ultima etapa concluida: ${escapeHtml(summary.lastCompletedStep)}</p>`
    : ''

  return `<article class="card ${statusClass}">
    <div class="card-top">
      <span class="status">${escapeHtml(summary.status)}</span>
      <span>${summary.durationSeconds == null ? '-' : `${summary.durationSeconds}s`}</span>
    </div>
    <h2>${escapeHtml(summary.label)}</h2>
    <p>${summary.startedAt ? `Ultima execucao: ${escapeHtml(summary.startedAt)}` : 'Ainda nao executado nesta workspace.'}</p>
    ${lastStep}
    ${workflowItems}
    <div class="links">${artifactLinks}</div>
  </article>`
}

export function generateIndex() {
  mkdirSync(path.dirname(outputPath), { recursive: true })
  const generatedAt = new Date().toISOString()
  const summaries = REPORTS.map(([label, relativePath]) => readSummary(label, relativePath))
  const totals = summaries.reduce((acc, summary) => {
    acc[summary.status] = (acc[summary.status] ?? 0) + 1
    return acc
  }, {})

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>StreamGate Reports</title>
  <style>
    :root { color-scheme: dark; --bg: #10130f; --panel: #1b2118; --panel-2: #252e20; --line: #394631; --text: #f8f2dc; --muted: #bdb59b; --ok: #98e6a2; --bad: #ff8c76; --warn: #ffd36b; --accent: #d7ff72; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: "Segoe UI", "Aptos", sans-serif; background: radial-gradient(circle at top left, rgba(215,255,114,.18), transparent 34rem), linear-gradient(160deg, #10130f 0%, #171d14 50%, #0b0d0a 100%); color: var(--text); }
    main { width: min(1200px, calc(100% - 36px)); margin: 0 auto; padding: 44px 0; }
    .hero { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: 32px; padding: clamp(24px, 5vw, 48px); background: linear-gradient(135deg, rgba(215,255,114,.16), rgba(27,33,24,.88)); box-shadow: 0 32px 90px rgba(0,0,0,.36); }
    .hero:after { content: ""; position: absolute; inset: auto -10% -45% 35%; height: 240px; background: radial-gradient(circle, rgba(215,255,114,.24), transparent 70%); transform: rotate(-8deg); }
    h1 { position: relative; margin: 0; font-size: clamp(2.4rem, 7vw, 6.5rem); letter-spacing: -.07em; line-height: .92; }
    .subtitle { position: relative; max-width: 760px; margin: 18px 0 0; color: var(--muted); font-size: 1.06rem; line-height: 1.6; }
    .summary { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 9px 13px; background: rgba(255,255,255,.05); color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin-top: 24px; }
    .card { border: 1px solid var(--line); border-radius: 24px; padding: 20px; background: rgba(27,33,24,.8); min-height: 220px; display: flex; flex-direction: column; box-shadow: 0 18px 52px rgba(0,0,0,.18); }
    .playbook { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:24px; }
    .playbook-card { border:1px solid var(--line); border-radius:22px; padding:18px; background:rgba(27,33,24,.72); }
    .playbook-card h2 { margin:0 0 10px; font-size:1.2rem; }
    .playbook-card p { margin:0 0 12px; }
    .playbook-card code { color: var(--accent); font-family: Consolas, monospace; }
    .card.pass { border-color: rgba(152,230,162,.45); }
    .card.fail { border-color: rgba(255,140,118,.58); }
    .card.neutral { border-color: rgba(255,211,107,.35); }
    .card-top { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); }
    .status { font-weight: 900; letter-spacing: .08em; }
    .pass .status { color: var(--ok); }
    .fail .status { color: var(--bad); }
    .neutral .status { color: var(--warn); }
    h2 { margin: 20px 0 8px; font-size: 1.45rem; letter-spacing: -.03em; }
    p { color: var(--muted); line-height: 1.55; }
    .last-step { margin-top: 0; font-size: .94rem; }
    .workflow-list { list-style:none; margin:0 0 12px; padding:0; display:grid; gap:8px; }
    .workflow-list li { display:grid; gap:4px; padding:10px 12px; border-radius:16px; background:rgba(255,255,255,.04); }
    .workflow-list strong { font-size:.95rem; }
    .workflow-list span { font-size:.82rem; letter-spacing:.06em; font-weight:800; }
    .workflow-list em { color: var(--muted); font-style:normal; font-size:.85rem; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: auto; padding-top: 16px; }
    a { display: inline-flex; align-items: center; border: 1px solid rgba(215,255,114,.32); border-radius: 999px; padding: 8px 11px; color: var(--accent); text-decoration: none; background: rgba(215,255,114,.06); }
    .muted { color: var(--muted); }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>StreamGate<br>Reports</h1>
      <p class="subtitle">Hub local de evidencias para testes, coverage, smokes e CI. Os artefatos sao sobrescritos a cada execucao para manter a workspace limpa e util para diagnostico.</p>
      <div class="summary">
        <span class="pill">Gerado em ${escapeHtml(generatedAt)}</span>
        <span class="pill">PASS: ${totals.PASS ?? 0}</span>
        <span class="pill">FAIL: ${totals.FAIL ?? 0}</span>
        <span class="pill">NOT_RUN: ${totals.NOT_RUN ?? 0}</span>
      </div>
    </section>
    <section class="playbook">
      <article class="playbook-card">
        <h2>Fast</h2>
        <p>Use no dia a dia para validar uma trilha sem pagar o custo do pacote completo.</p>
        <code>scripts/ci/ci-local.ps1 frontend|backend|e2e|docker</code>
      </article>
      <article class="playbook-card">
        <h2>Operational</h2>
        <p>Use quando a entrega tocar runtime, worker, notificacoes, artefatos ou operacao mutavel.</p>
        <code>scripts/smokes/run-smokes.ps1</code>
      </article>
      <article class="playbook-card">
        <h2>Full-closeout</h2>
        <p>Use no fechamento de ciclo de entrega, PR grande ou mudanca critica de runtime/CI. O caminho pesado oficial e WSL/Compose-first.</p>
        <code>scripts/reports/run-all-reports.ps1 -Profile full-closeout</code>
      </article>
    </section>
    <section class="grid">
      ${summaries.map(card).join('\n')}
    </section>
  </main>
</body>
</html>
`

  writeFileSync(outputPath, html, 'utf8')
  return outputPath
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = generateIndex()
  console.log(`Report index generated: ${path.relative(rootDir, output).replaceAll(path.sep, '/')}`)
}
