#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..')

function usage() {
  console.error([
    'Usage:',
    '  node scripts/reports/run-command.mjs --name <name> --out <dir> [--cwd <dir>]',
    '    [--coverage <path>] [--html-report <path>] [--env KEY=VALUE] -- <command...>',
  ].join('\n'))
}

function parseArgs(argv) {
  const options = {
    env: {},
  }
  const commandIndex = argv.indexOf('--')
  if (commandIndex === -1) {
    usage()
    process.exit(2)
  }

  const optionArgs = argv.slice(0, commandIndex)
  const command = argv.slice(commandIndex + 1)
  for (let index = 0; index < optionArgs.length; index += 1) {
    const arg = optionArgs[index]
    const next = optionArgs[index + 1]
    if (arg === '--name') {
      options.name = next
      index += 1
    } else if (arg === '--out') {
      options.out = next
      index += 1
    } else if (arg === '--cwd') {
      options.cwd = next
      index += 1
    } else if (arg === '--coverage') {
      options.coverage = next
      index += 1
    } else if (arg === '--html-report') {
      options.htmlReport = next
      index += 1
    } else if (arg === '--env') {
      const [key, ...valueParts] = String(next ?? '').split('=')
      if (!key || valueParts.length === 0) {
        throw new Error(`Invalid --env value: ${next}`)
      }
      options.env[key] = valueParts.join('=')
      index += 1
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (!options.name || !options.out || command.length === 0) {
    usage()
    process.exit(2)
  }

  options.command = command
  return options
}

function toAbsolute(inputPath, baseDir = rootDir) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(baseDir, inputPath)
}

function toRootRelative(inputPath) {
  return path.relative(rootDir, inputPath).replaceAll(path.sep, '/')
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function cleanDirectory(directory) {
  mkdirSync(directory, { recursive: true })
  for (const entry of [
    'stdout.log',
    'stderr.log',
    'combined.log',
    'summary.json',
    'report.html',
    'vitest-results.json',
    'playwright-results.json',
  ]) {
    const target = path.join(directory, entry)
    if (existsSync(target)) {
      rmSync(target, { force: true })
    }
  }
  for (const entry of ['coverage', 'playwright-report', 'test-results']) {
    const target = path.join(directory, entry)
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true })
    }
  }
}

function statusLabel(exitCode) {
  return exitCode === 0 ? 'PASS' : 'FAIL'
}

function writeHtmlReport(summary, stdout, stderr) {
  const badgeClass = summary.status === 'PASS' ? 'pass' : 'fail'
  const artifacts = summary.artifacts
    .map((artifact) => `<a href="${escapeHtml(path.relative(path.dirname(summary.reportPathAbsolute), artifact.pathAbsolute).replaceAll(path.sep, '/'))}">${escapeHtml(artifact.label)}</a>`)
    .join('')

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(summary.name)} - StreamGate Report</title>
  <style>
    :root { color-scheme: dark; --bg: #11130f; --panel: #1b2118; --line: #33402c; --text: #f3f0df; --muted: #b8b19a; --ok: #8fd694; --bad: #ff8a75; --accent: #d7ff72; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: "Segoe UI", "Aptos", sans-serif; background: radial-gradient(circle at 20% 0%, #2b3a1d, transparent 32rem), var(--bg); color: var(--text); }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 22px; }
    .hero { border: 1px solid var(--line); border-radius: 28px; padding: 28px; background: linear-gradient(135deg, rgba(215,255,114,.13), rgba(27,33,24,.9)); box-shadow: 0 24px 80px rgba(0,0,0,.32); }
    h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 4rem); letter-spacing: -.05em; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--muted); }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: rgba(255,255,255,.04); }
    .status { font-weight: 800; }
    .pass { color: var(--ok); }
    .fail { color: var(--bad); }
    .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin: 22px 0; }
    .card { border: 1px solid var(--line); border-radius: 20px; padding: 18px; background: rgba(27,33,24,.82); }
    .artifacts { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    a { color: var(--accent); text-decoration: none; }
    pre { overflow: auto; max-height: 520px; padding: 18px; border-radius: 18px; border: 1px solid var(--line); background: #070907; color: #e9e2c8; line-height: 1.5; }
    section { margin-top: 28px; }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>${escapeHtml(summary.name)}</h1>
      <div class="meta">
        <span class="pill status ${badgeClass}">${summary.status}</span>
        <span class="pill">Exit code: ${summary.exitCode}</span>
        <span class="pill">Duracao: ${summary.durationSeconds}s</span>
        <span class="pill">Inicio: ${escapeHtml(summary.startedAt)}</span>
      </div>
      <div class="artifacts">${artifacts}</div>
    </section>
    <section class="grid">
      <div class="card"><strong>Comando</strong><br><code>${escapeHtml(summary.command)}</code></div>
      <div class="card"><strong>Diretorio</strong><br><code>${escapeHtml(summary.cwd)}</code></div>
    </section>
    <section>
      <h2>Output combinado</h2>
      <pre>${escapeHtml(stdout + (stderr ? `\n${stderr}` : ''))}</pre>
    </section>
  </main>
</body>
</html>
`
  writeFileSync(summary.reportPathAbsolute, html, 'utf8')
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  const outDir = toAbsolute(options.out)
  const cwd = toAbsolute(options.cwd ?? '.', rootDir)
  cleanDirectory(outDir)

  const stdoutPath = path.join(outDir, 'stdout.log')
  const stderrPath = path.join(outDir, 'stderr.log')
  const combinedPath = path.join(outDir, 'combined.log')
  const reportPath = path.join(outDir, 'report.html')
  const startedAt = new Date()
  const commandText = options.command.join(' ')
  let stdout = ''
  let stderr = ''

  const child = spawn(commandText, {
    cwd,
    shell: true,
    env: {
      ...process.env,
      ...options.env,
    },
  })

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    stdout += text
    process.stdout.write(text)
  })
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    stderr += text
    process.stderr.write(text)
  })

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve)
  })

  const finishedAt = new Date()
  const durationSeconds = Number(((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(2))
  writeFileSync(stdoutPath, stdout, 'utf8')
  writeFileSync(stderrPath, stderr, 'utf8')
  writeFileSync(combinedPath, `${stdout}${stderr ? `\n${stderr}` : ''}`, 'utf8')

  const artifacts = [
    { label: 'stdout.log', path: toRootRelative(stdoutPath), pathAbsolute: stdoutPath },
    { label: 'stderr.log', path: toRootRelative(stderrPath), pathAbsolute: stderrPath },
    { label: 'combined.log', path: toRootRelative(combinedPath), pathAbsolute: combinedPath },
  ]

  if (options.coverage) {
    artifacts.push({ label: 'Coverage HTML', path: options.coverage, pathAbsolute: toAbsolute(options.coverage) })
  }
  if (options.htmlReport) {
    artifacts.push({ label: 'HTML detalhado', path: options.htmlReport, pathAbsolute: toAbsolute(options.htmlReport) })
  }

  const summary = {
    name: options.name,
    status: statusLabel(exitCode),
    exitCode,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationSeconds,
    cwd: toRootRelative(cwd) || '.',
    command: commandText,
    reportPath: toRootRelative(reportPath),
    reportPathAbsolute: reportPath,
    artifacts: artifacts.map(({ label, path }) => ({ label, path })),
  }

  writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  writeHtmlReport({ ...summary, artifacts, reportPathAbsolute: reportPath }, stdout, stderr)

  try {
    const { generateIndex } = await import('./generate-index.mjs')
    generateIndex()
  } catch (error) {
    console.warn(`[reports] failed to update index: ${error.message}`)
  }

  process.exit(exitCode ?? 1)
}

run().catch((error) => {
  console.error(error.stack ?? error.message)
  process.exit(1)
})
