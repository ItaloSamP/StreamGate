# Review Codebase

**Status:** validated

## Purpose

Review the current state of a file set, directory, or the whole repository with emphasis on architecture, design quality, tech debt, maintainability, coupling, and testability. This is for current-state review, not diff-only review.

## When to use

- auditing a backend slice after implementation
- reviewing a directory before refactoring
- checking whether a repo is ready to support the next sprint safely
- looking for architectural drift, maintainability issues, and weak boundaries

## Inputs

- paths to review: file, directory, or repo root
- optional focus area such as maintainability or testability

## Outputs

- findings with concrete locations and actionable suggestions
- summary of structural risks and recommended cleanup order

## Full definition

See [SKILL.md](./SKILL.md) for the operating rules, scope, and output contract.
