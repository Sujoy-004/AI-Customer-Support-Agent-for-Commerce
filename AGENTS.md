# AGENTS.md

## Tone & Communication Style

Short sentences. Plain words. No fancy talk. Say what's happening and why. One or two sentences is enough unless asked for detail.

## Parallel Execution & Subagents

To ensure high-speed, high-quality delivery, opencode MUST:
1.  **Parallelize:** Break every non-trivial task into 3-5 distinct sub-tasks.
2.  **Deploy Subagents:** Use the `Task` tool to spawn specialized subagents for each sub-task simultaneously.
3.  **Independent Execution:** Each subagent must operate in its own context to prevent cross-contamination of logic while maintaining execution quality.
4.  **Synthesize:** Once all subagents return, merge their results into a final, high-fidelity output.
5.  **Always Parallel:** This multi-agent parallel approach is mandatory for all multi-step engineering tasks.

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

**5 phases complete. 3 remaining after judge verdict pivot:**
- Policy Execution (Phase 2) ✓
- Product Intelligence (Phase 3) ✓
- Order Tracking (Phase 4) ✓
- Graceful Handoff (Phase 5) ✓
- [ ] Phase 6: Semantic AI Router — in-browser semantic intent detection (transformer.js)
- [ ] Phase 7: Security & Live Data — serverless order proxy, Shopify Storefront API
- [ ] Phase 8: UX & Demo — quick action chips, realtime handoff, demo video

**4 mandatory docs:** PRODUCT_DOC.md, TECHNICAL_DOC.md, DECISION_LOG.md, README.md

**Judge Score:** 58/100 — Bronze Tier. Rebuild in progress.
**Deadline:** May 20, 2026 11:59 PM IST
**Priority:** Phase 6 > Phase 7 > Phase 8 (sequential)

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

Three-layer browser-side architecture. All services run in the browser — no backend required (optional serverless proxy for secure order lookup).

```
User query → SemanticRouter → OffTopicDetector → CatalogIntentDetector → PolicyService → Response
              (transformer.js) (keyword guard)    (catalog + intent parsing)   (policy lookup)

Semantic router (MiniLM embeddings via transformer.js) classifies intent in-browser.
Data retrieval is fully deterministic — zero LLM calls, zero hallucinations.
```

### Pipeline Flow

```
User Input
  │
  ▼
SemanticRouter (transformer.js) ── embedding similarity routing
  │ (catalog intent)
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

- **No hallucinations**: Data retrieval pipeline uses zero LLM calls — every product lookup, stock check, and variant resolution goes through deterministic code.
- **Hybrid AI approach**: MiniLM sentence embeddings for semantic intent detection (in-browser), structured code for all data lookups. Best of both worlds.
- **Swappable data sources**: `CatalogDataSource` and `OrderDataSource` interfaces for mock → live Shopify API migration.
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

## UAT Sessions

During User Acceptance Testing (UAT) sessions:
- **Spawn a subagent** to act as the tester/responder for all UAT queries.
- The subagent **MUST inspect `graphify-out/`** (knowledge graph, codebase analysis, and implementation artifacts) to determine the actual state of the implementation.
- The subagent **MUST answer truthfully** based on what the code and graph actually show — never fabricate positive results, never agree for convenience, and never skip verification.
- If a feature is incomplete, broken, or missing, the subagent reports it as-is with evidence from the codebase.
- The orchestrator records the subagent's truthful responses into the UAT.md file without filtering or softening.
