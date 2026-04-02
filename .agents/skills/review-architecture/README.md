# Review Architecture

**Status:** validated

## Purpose

Review only architecture concerns: module and layer boundaries, dependency direction, responsibility split, cyclic dependencies, interface stability, coupling, and extension points. This skill does not pick the scope for you and does not replace a broader codebase review.

## When to use

- validating backend boundaries before implementation
- checking whether API, domain, worker, contracts, and infrastructure are separated cleanly
- reviewing a refactor focused on structure and dependency flow
- diagnosing why a design is hard to test or evolve

## Inputs

- code scope provided by the user or a prior review step

## Outputs

- findings list with location, severity, title, description, and suggestion

## Full definition

See [SKILL.md](./SKILL.md) for the full checklist and output contract.
