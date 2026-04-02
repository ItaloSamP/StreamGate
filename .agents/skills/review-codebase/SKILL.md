---
name: review-codebase
description: Architecture and design review for specified files, directories, or the whole repo. Covers tech debt, patterns, maintainability, and current-state quality.
tags: [code-review]
version: 1.3.1
license: MIT
recommended_scope: project
metadata:
  author: ai-cortex
triggers: [review codebase, codebase review]
input_schema:
  type: code-scope
  description: Files, directories, or repository path to review for architecture and design
output_schema:
  type: diagnostic-report
  description: Structured review report with findings on boundaries, patterns, and tech debt
---

# Review Codebase

Use this skill when the user wants a structured review of a file set, module, directory, or the whole repository. This is the right fit for broad backend quality checks after design or implementation work, especially when the goal is to surface architectural drift, maintainability risks, missing boundaries, or testability issues.

## What This Skill Covers

- Architecture and boundaries
- Design consistency and naming
- Tech debt and maintainability
- Cross-module dependencies and coupling
- Testability and operational clarity
- Current-state quality of the selected scope

## What This Skill Does Not Cover

- Pure diff review of a patch
- Language style nitpicks
- Security-only or performance-only audits

For architecture-only feedback, use `review-architecture`.

## When to Use

- After a backend slice lands and needs a quality pass
- When planning a refactor of an app, folder, or service
- When a module grew quickly and likely accumulated debt
- Before declaring a sprint done for backend or worker work
- When the user explicitly asks for a codebase review

## Review Dimensions

1. Architecture and boundaries
2. Design patterns and consistency
3. Maintainability and tech debt
4. Dependency shape and coupling
5. Testability and operational clarity
6. Concrete improvement suggestions

## Review Process

1. Confirm the scope to review.
2. Read enough code to understand current structure.
3. Group findings by severity and by architectural area when useful.
4. Prefer findings that would affect delivery, correctness, future changes, or operability.
5. Anchor every finding to a real file or directory.

## Output Contract

Return findings first, ordered by severity. Each finding should include:

- `Location`
- `Category`: `codebase`
- `Severity`
- `Title`
- `Description`
- `Suggestion`

If no material findings are discovered, say so explicitly and note any residual risks or missing test coverage.

## Self-check

- [ ] Findings focus on real engineering risk, not style trivia
- [ ] Review covers boundaries, maintainability, and dependencies
- [ ] Suggestions are actionable and grounded in the current code
- [ ] Output references concrete files or directories
