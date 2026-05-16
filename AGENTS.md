# AGENTS.md

## Tone & Communication Style

Talk to me like that git warning. Short sentences. Plain words. No fancy talk. Say what's happening and why in the simplest way possible. Don't dumb down the thinking — just make the output easy to read. One or two sentences is usually enough. If I ask for detail, give it. Otherwise, keep it tight.

## Critical Must-Haves (Updated — May 16, 2026)

These are non-negotiable. Everything else can wait.

**4 mandatory workflows — 2 in progress, 2 to go:**
- Product Intelligence (Phase 3) — In progress. Catalog intent detector + ChatWidget integration done.
- Policy Execution (Phase 2) — Built ✓
- Active Workflows: order tracking (Phase 4) + return initiation (Phase 6) — NOT started.
- Graceful Handoff (Phase 5) — NOT started.

**4 mandatory docs (25% of score):**
- `PRODUCT_DOC.md` — Created. Update during/after each phase.
- `TECHNICAL_DOC.md` — Created. Shows AI/deterministic boundary and failure handling.
- `DECISION_LOG.md` — Created. Logs every "considered X, chose Y, because Z."
- `README.md` — Created. Setup and overview.

**3 mandatory tools — ECC integrations removed:**
- Superpowers — ECC integration removed.
- Context7 — ECC integration removed.
- Antigravity Skills — ECC integration removed.

**Testing status:**
- Playwright SET UP — Both Vitest and Playwright configured. E2E test specs exist in `e2e/`.
- `e2e/` directory EXISTS with test specs (catalogQuery, offTopic, stockCheck).
- Current test coverage: 72.54% lines, 66.44% branches. Target 80%+.

**Priority order for remaining work:**
1. Execute Phase 4 (order tracking) and Phase 6 (return initiation) — Active workflows
2. Execute Phase 5 (graceful handoff)
3. Improve test coverage to 80%+
4. Record demo video

## Setup

- **Configuration**: `.opencode/opencode.json`
- **Dependencies**: `npm install` (Node.js >=18.0.0)

## GSD Commands

Use these instead of direct edits:

| Command | When |
|---------|------|
| `/gsd-quick` | Small fixes, doc updates, ad-hoc tasks |
| `/gsd-debug` | Investigation and bug fixing |
| `/gsd-execute-phase` | Planned phase work |
| `/gsd-plan-phase` | Create phase plans |
| `/gsd-discuss-phase` | Surface assumptions before planning |
| `/gsd-code-review` | Review changed files |
| `/gsd-verify-work` | Verify phase goal achievement |
| `/gsd-verfy-work` | Batch audit: verify goals + review code quality, no-fluff output |
| `/gsd-progress` | Check progress, advance workflow |

Full list in `.opencode/command/` — each `.md` file is a slash command.

## Key Directories

- `.opencode/command/` — GSD slash command definitions
- `.opencode/skills/` — Domain-specific skill packages
- `.opencode/get-shit-done/` — GSD workflow engine (agents, workflows, templates, references)
- `.opencode/hooks/` — GSD hooks
- `.opencode/sdk/` — GSD SDK
- `.opencode/rules/` — GSD rules
- `.planning/` — GSD artifacts (codebase maps, plans, specs)

## Track 4 Specifics (AI Customer Support Agent)

- **Zero hallucinations**: All responses must be Shopify-verifiable
- **Store-native only**: Use live catalog/sizing/stock data
- **Active workflows**: Order status/tracking, returns, exchanges, graceful handoff
- **Required artifacts**: PRODUCT_DOC.md, TECHNICAL_DOC.md, DECISION_LOG.md, README.md

## Testing Requirements

- **Coverage target**: 80%+ (unit + integration + E2E)
- **Test command**: `npm test`
- **Test structure**: Unit tests alongside source, E2E in `e2e/` directory
- **Frameworks**: Vitest (unit/integration), Playwright (E2E)
- **Run unit/integration**: `npx vitest run`
- **Run E2E**: `npx playwright test`
- **Run with coverage**: `npx vitest run --coverage`
- **Current coverage**: 72.54% lines, 66.44% branches

## Code Conventions

- **Language**: TypeScript (strict mode)
- **Naming**: camelCase variables/functions, PascalCase types/interfaces
- **Immutability**: Use spread operator, never mutate directly
- **Error handling**: Try/catch with meaningful messages
- **Comments**: Explain WHY, not WHAT

## Parallel Multi-Agent Execution

Break independent work into concurrent agents. This cuts execution time without cutting quality.

**Rules:**
- Identify independent work packages from the PLAN.md task list. If task A needs output from task B, they are NOT independent — run sequentially.
- Launch independent packages simultaneously using the `task` tool with `subagent_type` appropriate to the work (gsd-executor, gsd-code-reviewer, etc).
- Maximum 3 parallel agents at a time. More than that creates coordination overhead that cancels the speed gain.
- Each agent must still produce testable code. No agent skips tests, lint, or typecheck.
- After all parallel agents complete, run integration verification — parallel work may still conflict at boundaries.

**How to identify independent work:**
- No shared files (writes to different files = independent)
- No shared interfaces/types (unless types are already committed)
- Example: 04-01 (service layer) and 04-02 (ChatWidget) are NOT independent — 04-02 imports from 04-01. But within 04-01, writing `orderService.ts` and `orderService.test.ts` can run in parallel since the interface is defined by the plan.

**Quality gates (same as sequential, non-negotiable):**
1. Each agent runs `npm test` on its output
2. Each agent runs lint/typecheck
3. After merge, run full `npm test` to catch cross-agent regressions
4. No parallel agent touches the same file — use `changed-files` to verify no overlap

## Verification

Before considering work complete:
1. Run `npm test` to verify tests pass
2. Check no secrets leaked (scan for API keys, tokens)
3. Confirm all required documents exist and are updated
4. Verify Shopify integration uses live data (no mocks)

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

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

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
