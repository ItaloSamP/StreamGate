---
name: review-architecture
description: Review code for architecture: layer boundaries, dependency direction, interface stability, single responsibility, and coupling. Use when validating backend structure before or during implementation.
tags: [code-review]
version: 1.0.1
license: MIT
recommended_scope: project
metadata:
  author: ai-cortex
triggers: [review architecture, architecture review]
input_schema:
  type: code-scope
  description: Source files or directories to review
output_schema:
  type: findings-list
  description: Zero or more findings with location, category, severity, and suggestion
---

# Review Architecture

Use this skill when the task is to evaluate architecture decisions, not to do a full code review. It is especially useful before backend implementation starts, when a module is being refactored, or when the team needs to validate boundaries between API, domain, worker, infrastructure, and contracts.

## What This Skill Reviews

- Layer boundaries and responsibility splits
- Dependency direction and imports across layers
- Interface stability and leakage of infrastructure details
- Coupling between modules, packages, or apps
- Cycles between components or directories
- Whether a design is testable without booting the whole stack

## What This Skill Does Not Review

- Language style or formatting
- Security-specific concerns unless they directly affect architecture
- Framework minutiae
- Diff-only review of a patch

For a broader review of tech debt and maintainability, use `review-codebase`.

## When to Use

- Before creating a new backend slice or domain module
- Before locking in API, domain, worker, and contract boundaries
- When introducing queues, storage, analytics, or integrations
- When a directory feels overloaded or responsibilities are blurred
- When tests are hard to write because the code is too coupled

## Review Checklist

1. Are modules named by business capability rather than framework detail?
2. Do dependencies point inward to stable abstractions instead of outward to implementation details?
3. Is domain logic isolated from HTTP, persistence, message broker, and framework glue?
4. Are adapter layers thin, or are they carrying business rules that belong elsewhere?
5. Can the core behavior be tested with fakes or in-memory collaborators?
6. Are there cyclic dependencies between modules, packages, or folders?
7. Are interfaces stable enough to support API docs, contracts, and worker integrations?
8. Would this design still make sense if one infrastructure choice changed?

## Output Contract

Return a findings list ordered by severity. Each finding should include:

- `Location`
- `Category`: `architecture`
- `Severity`
- `Title`
- `Description`
- `Suggestion`

Use concrete file or directory references whenever possible.

## Good Outcome

The result should help the team answer:

- what belongs in the API vs worker vs contracts
- where to place new code without creating hidden coupling
- what to refactor before implementation grows around the wrong shape

## Self-check

- [ ] Review stayed focused on architecture and boundaries
- [ ] Findings are specific and actionable
- [ ] Suggestions reduce coupling or clarify responsibilities
- [ ] Output references concrete files or directories
