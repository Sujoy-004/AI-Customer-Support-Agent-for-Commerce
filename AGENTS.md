# AGENTS.md

## Tone & Communication Style

Short sentences. Plain words. No fancy talk. Say what's happening and why. One or two sentences is enough unless asked for detail.

---

## Setup

- Config: `.opencode/opencode.json`
- Dependencies: `npm install` (Node.js >=18.0.0)

## Architecture

```
User Input → OffTopicDetector → EscalationDetector → OrderIntentDetector → CatalogIntentDetector → PolicyService → Response
```

Catalog, order, and escalation queries use ZERO LLM calls — every product lookup, stock check, variant resolution, order tracking, and human handoff goes through deterministic keyword + structured parsing. `CatalogDataSource` and `OrderDataSource` interfaces for mock → live Shopify migration. Context expires after 5 minutes or 3 turns. All services run in-browser — no backend.

## Key Directories

- `.opencode/command/` — GSD slash commands
- `.opencode/skills/` — Domain-specific skills
- `.opencode/get-shit-done/` — GSD workflow engine
- `.planning/` — GSD artifacts (maps, plans, specs)

## Project Status

**6 mandatory workflows — all complete:**
- Policy Execution (Phase 2) ✓
- Product Intelligence (Phase 3) ✓
- Order Tracking (Phase 4) ✓
- Graceful Handoff (Phase 5) ✓
- Return Initiation (Phase 6) ✓

**4 mandatory docs:** PRODUCT_DOC.md, TECHNICAL_DOC.md, DECISION_LOG.md, README.md

**Priority:** 1. Demo video → 2. Coverage to 80%+

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kasparro Agentic Commerce Hackathon: AI Customer Support Agent**

A "Store-Native" Shopify AI customer support agent (Track 4) built with GSD protocol.

**Core Value:** Zero-hallucination, high-fidelity customer resolution grounded strictly in live Shopify data.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

**Languages & Runtimes:** TypeScript, JavaScript/Node.js

**Testing:** Vitest (unit/integration), Playwright (E2E)

**Dev Tooling:** OpenCode + GSD workflow engine
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### Language Standards
- **Primary Language**: TypeScript (>=5.3.0)
- **Runtime**: Node.js (>=18.0.0)
- **Strict Mode**: Enforced via tsconfig.json
- **Module System**: ES Modules (import/export)

### Naming
- Variables/Function: camelCase
- Types/Interfaces/Classes: PascalCase
- Files: camelCase.ts
- Constants: UPPER_SNAKE_CASE

### Code Style
- 2 space indentation, no tabs
- Semicolons required
- Single quotes for strings
- Trailing commas on multiline

### Immutability
- Objects: `{ ...obj, prop: value }`
- Arrays: `[...arr, newItem]` or `.map()`, `.filter()`
- Never: direct mutation (`obj.prop = value`, `arr.push(item)`)

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

### Project Architecture

Three-layer browser-side architecture. All services run in the browser — no backend required.

```
User query → OffTopicDetector → CatalogIntentDetector → PolicyService → Response
              (keyword guard)    (catalog + intent parsing)   (policy lookup)

Catalog queries use ZERO LLM calls — every product lookup, stock check,
and variant resolution goes through deterministic keyword + structured parsing.
```

### Pipeline Flow

```
User Input
  │
  ▼
OffTopicDetector ── off-topic? ──► RefusalResponseService ──► polite refusal
  │ (on-topic)
  ▼
CatalogIntentDetector ── catalog? ──► formatCatalogResponse() ──► product info
  │ (not catalog)
  ▼
PolicyService ── policy? ──► grounded policy response
  │ (not policy)
  ▼
Greeting check / Fallback text
```

### Key Design Properties

- **No hallucinations**: Catalog pipeline uses zero LLM calls.
- **Deterministic intent**: Keyword-based intent detection with exclusion guards prevents catalog/policy cross-contamination.
- **Swappable data sources**: `CatalogDataSource` interface for mock → live Shopify API migration.
- **Bounded context**: Cross-turn context expires after 5 minutes or 3 turns.

### .opencode Structure (GSD Only)

The `.opencode/` directory contains the GSD workflow engine:

```
.opencode/
├── command/             # GSD slash commands (one .md per command)
├── skills/              # Domain-specific skill packages
├── get-shit-done/       # GSD engine (workflows, agents, templates, references)
│   ├── workflows/       # Executable workflow prompts
│   ├── agents/          # Agent definitions (prompts at .opencode get-shit-done agents)
│   ├── templates/       # Output templates
│   ├── references/      # Reference docs
│   └── bin/             # GSD SDK scripts
├── hooks/               # GSD hooks
├── sdk/                 # GSD SDK
└── rules/               # GSD rules
```
<!-- GSD:architecture-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## graphify

This project has a graphify knowledge graph at `graphify-out/` (root, not `.opencode/graphify-out/`).

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
- On session start, if `graphify-out/` exists, read `GRAPH_REPORT.md` before exploring the codebase
