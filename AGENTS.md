# AGENTS.md

## ⚠️ MANDATORY — READ BEFORE EVERY TASK

**Before executing any command, read this entire file.** Do not skip sections. This file defines the project's architecture, constraints, conventions, and workflows.

**If cached from a previous turn, re-read.** Stale context causes wrong decisions.

## Tone & Communication

Short sentences. Plain words. No fancy talk. Say what's happening and why. One or two sentences is enough unless asked for detail.

## Parallel Execution & Subagents

OpenCode MUST:
1. **Parallelize** — break non-trivial tasks into 3-5 sub-tasks
2. **Deploy Subagents** — use `Task` tool for simultaneous sub-tasks
3. **Independent Execution** — each subagent in its own context
4. **Synthesize** — merge results into final output
5. **Always Parallel** — mandatory for all multi-step engineering tasks

## Core Constraints

Zero LLM calls for data retrieval — product lookups, stock checks, order tracking, human handoff use deterministic keyword + structured parsing. `CatalogDataSource` and `OrderDataSource` interfaces for mock → live Shopify migration. Context expires after 5 minutes or 3 turns. All services run in-browser.

**4 mandatory docs:** PRODUCT_DOC.md, TECHNICAL_DOC.md, DECISION_LOG.md, README.md

**Deadline:** May 20, 2026 11:59 PM IST | **Priority:** Phase 6 > Phase 7 > Phase 8

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kasparro Agentic Commerce Hackathon: AI Customer Support Agent** — Track 4, GSD protocol.

**Core Value:** Zero-hallucination customer resolution grounded in live Shopify data.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

**Languages:** TypeScript, JavaScript/Node.js

**Testing:** Vitest (unit/integration), Playwright (E2E)

**Dev Tooling:** OpenCode + GSD workflow engine
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### Language Standards
- **Primary:** TypeScript (>=5.3.0), Node.js (>=18.0.0)
- **Strict Mode** via tsconfig.json
- **Modules:** ES Modules

### Naming
- Variables/Functions: camelCase
- Types/Interfaces/Classes: PascalCase
- Files: camelCase.ts
- Constants: UPPER_SNAKE_CASE

### Code Style
- 2-space indent, no tabs
- Semicolons required
- Single quotes
- Trailing commas on multiline

### Immutability
- Objects: `{ ...obj, prop: value }`
- Arrays: `[...arr, newItem]` or `.map()`, `.filter()`
- Never: direct mutation (`obj.prop = value`, `arr.push()`)

### Error Handling
- Async: try/catch with meaningful messages
- Early returns for validation

### Type Safety
- No `any` or `unknown`
- Discriminated unions for limited value sets
- Generics for reusable types
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Three-layer browser-side architecture. No backend required (optional serverless proxy for secure order lookup).

```
User query → SemanticRouter → OffTopicDetector → CatalogIntentDetector → PolicyService → Response
             (transformer.js) (keyword guard)    (catalog + intent parsing)   (policy lookup)

MiniLM embeddings (transformer.js) classify intent in-browser.
Data retrieval is fully deterministic — zero LLM calls.
```

### Pipeline Flow

```
User Input → SemanticRouter (embedding similarity routing)
  ├─ (off-topic) → OffTopicDetector → RefusalResponseService → polite refusal
  ├─ (catalog) → CatalogIntentDetector → formatCatalogResponse() → product info
  ├─ (policy) → PolicyService → grounded policy response
  └─ (other) → Greeting check / Fallback text
```

### Key Design Properties
- **No hallucinations** — zero LLM calls for data retrieval
- **Hybrid AI** — MiniLM for intent detection, structured code for lookups
- **Swappable data sources** — `CatalogDataSource` / `OrderDataSource` interfaces
- **Bounded context** — 5-min / 3-turn expiry

### .opencode Structure
```
.opencode/
├── command/         # GSD slash commands
├── skills/          # Skill packages
├── get-shit-done/   # GSD engine (workflows, agents, templates, references, bin/)
├── hooks/
├── sdk/
└── rules/
```
<!-- GSD:architecture-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Not yet configured. Run `/gsd-profile-user` to generate.
> Managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->

## graphify

Knowledge graph at `graphify-out/` (root, not `.opencode/graphify-out/`).

Rules:
- Before answering architecture/codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/manifest.json` exists, use for file-to-node mapping
- After modifying code, run `graphify update .` to keep graph current (AST-only, no API cost)
- On session start, if `graphify-out/` exists, read `GRAPH_REPORT.md` before exploring codebase

## UAT Sessions

- **Spawn a subagent** as tester/responder for all UAT queries
- Subagent **MUST inspect `graphify-out/`** to determine actual implementation state
- Subagent **MUST answer truthfully** based on code and graph — never fabricate results, never agree for convenience, never skip verification
- If a feature is incomplete/broken/missing, report as-is with evidence
- Orchestrator records truthful responses into UAT.md without filtering

## Doc Sync — After Every Task/Command

After any change:
- **Update `docs/` files** — sync architectural/technical/product changes to relevant docs
- **Update `README.md`** — keep current with project status, setup, recent changes
- **Verify accuracy** — read files before writing, confirm changes match codebase
- **Never skip** — small changes cascade into doc drift. Update immediately.
