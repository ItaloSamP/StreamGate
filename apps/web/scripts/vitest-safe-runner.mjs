#!/usr/bin/env node

import { createRequire, syncBuiltinESMExports } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const vitestPackageJsonPath = require.resolve('vitest/package.json')
const vitestRequire = createRequire(vitestPackageJsonPath)

function ensureExpectTypeRuntimeShims() {
  try {
    const expectTypePackageJsonPath = vitestRequire.resolve('expect-type/package.json')
    const expectTypeDistDir = path.join(path.dirname(expectTypePackageJsonPath), 'dist')
    const expectTypeIndexPath = path.join(expectTypeDistDir, 'index.js')

    if (!existsSync(expectTypeIndexPath)) {
      return
    }

    const indexSource = readFileSync(expectTypeIndexPath, 'utf8')
    const requirePattern = /require\(["']\.\/([^"']+)["']\)/g
    const requiredModules = new Set()

    for (const match of indexSource.matchAll(requirePattern)) {
      const moduleName = match[1]
      if (moduleName) {
        requiredModules.add(moduleName)
      }
    }

    for (const moduleName of requiredModules) {
      const modulePath = path.join(expectTypeDistDir, `${moduleName}.js`)
      if (!existsSync(modulePath)) {
        writeFileSync(
          modulePath,
          "'use strict';\nObject.defineProperty(exports, '__esModule', { value: true });\n",
          'utf8',
        )
      }
    }
  } catch {
    // No-op: if expect-type is not present, Vitest can continue normally.
  }
}

function ensureLruCacheCommonJsScope() {
  try {
    const lruPackageJsonPath = vitestRequire.resolve('lru-cache/package.json')
    const lruCommonJsDir = path.join(path.dirname(lruPackageJsonPath), 'dist', 'commonjs')
    const commonJsScopePath = path.join(lruCommonJsDir, 'package.json')

    if (!existsSync(lruCommonJsDir)) {
      return
    }

    if (!existsSync(commonJsScopePath)) {
      mkdirSync(lruCommonJsDir, { recursive: true })
      writeFileSync(commonJsScopePath, '{"type":"commonjs"}\n', 'utf8')
    }
  } catch {
    // No-op: if lru-cache is not present in Vitest dependency graph.
  }
}

if (process.platform === 'win32') {
  const childProcess = require('node:child_process')
  const originalExec = childProcess.exec

  childProcess.exec = function patchedExec(command, options, callback) {
    const normalizedCommand =
      typeof command === 'string' ? command.trim().toLowerCase() : ''

    // Vite calls `exec("net use")` on Windows to detect mapped drives.
    // In restricted environments this can throw EPERM before tests start.
    if (normalizedCommand === 'net use') {
      const cb =
        typeof options === 'function'
          ? options
          : typeof callback === 'function'
            ? callback
            : null

      if (cb) {
        queueMicrotask(() => cb(null, '', ''))
      }

      return {
        stdout: null,
        stderr: null,
        on() {
          return this
        },
        once() {
          return this
        },
        kill() {
          return true
        },
      }
    }

    return originalExec.call(this, command, options, callback)
  }

  syncBuiltinESMExports()
}

ensureExpectTypeRuntimeShims()
ensureLruCacheCommonJsScope()

const vitestEntrypoint = path.join(path.dirname(vitestPackageJsonPath), 'vitest.mjs')

await import(pathToFileURL(vitestEntrypoint).href)