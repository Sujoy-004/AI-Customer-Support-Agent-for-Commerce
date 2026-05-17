# AGENTS.md

## Tone & Communication Style

Talk to me like that git warning. Short sentences. Plain words. No fancy talk. Say what's happening and why in the simplest way possible. Don't dumb down the thinking — just make the output easy to read. One or two sentences is usually enough. If I ask for detail, give it. Otherwise, keep it tight.

## Critical Must-Haves (Updated — May 16, 2026)

These are non-negotiable. Everything else can wait.

**5 mandatory workflows — 5 complete (Phases 1-5), 1 to go:**
- Policy Execution (Phase 2) — Built ✓
- Product Intelligence (Phase 3) — Built ✓
- Order Tracking Workflow (Phase 4) — Built ✓
- Graceful Handoff (Phase 5) — Built ✓
- Return Initiation Workflow (Phase 6) — NOT started

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
1. Execute Phase 6 (return initiation)
2. Improve test coverage to 80%+
3. Record demo video

## Setup

- **Configuration**: `.opencode/opencode.json`
- **Dependencies**: `npm install` (Node.js >=18.0.0)

## GSD Commands

Use these instead of direct edits. GSD is the engine — it powers parallel subagent execution, quality gates, testing enforcement, and code conventions. Every command below runs on GSD infrastructure.

### Workflow Lifecycle — plan → execute → verify → ship

| Command | When |
|---------|------|
| `/gsd-spec-phase` | Clarify WHAT with ambiguity scoring before planning |
| `/gsd-discuss-phase` | Surface assumptions and decisions before planning |
| `/gsd-plan-phase` | Create executable phase plans with task breakdown |
| `/gsd-execute-phase` | Execute planned phase work with subagents |
| `/gsd-verify-work` | Goal-backward verification that phase delivered |
| `/gsd-code-review` | Review changed files for bugs and quality |
| `/gsd-ship` | Create PR, run review, prepare for merge |

### Quick Actions

| Command | When |
|---------|------|
| `/gsd-quick` | Small fixes, doc updates, ad-hoc tasks |
| `/gsd-fast` | Trivial inline task (typo, config, rename) |
| `/gsd-debug` | Systematic debugging with checkpoints |
| `/gsd-capture` | Capture ideas, tasks, notes to proper destinations |

### Discovery & Design

| Command | When |
|---------|------|
| `/gsd-explore` | Socratic ideation before committing to artifacts |
| `/gsd-spike` | Build experimental validation of an idea |
| `/gsd-mvp-phase` | MVP-mode planning with SPIDR splitting |
| `/gsd-map-codebase` | Parallel codebase analysis |

### Testing & Quality

| Command | When |
|---------|------|
| `/gsd-add-tests` | Generate unit+E2E tests for completed phases |
| `/gsd-audit-uat` | Cross-phase UAT audit |
| `/gsd-audit-fix` | Auto-fix audit findings |
| `/gsd-validate-phase` | Fill Nyquist validation gaps retroactively |

### Project Management

| Command | When |
|---------|------|
| `/gsd-progress` | Check progress and advance the workflow |
| `/gsd-stats` | Project statistics and timeline |
| `/gsd-phase` | CRUD for ROADMAP phases |
| `/gsd-new-milestone` | Start a new milestone cycle |
| `/gsd-cleanup` | Archive completed milestone phases |

### Docs & Context

| Command | When |
|---------|------|
| `/gsd-docs-update` | Generate/verify all docs against live codebase |
| `/gsd-thread` | Persistent context threads across sessions |
| `/gsd-pause-work` | Create context handoff when pausing mid-phase |
| `/gsd-resume-work` | Resume with full context restoration |

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
- **GSD enforcement**: GSD's execute-phase and verify-work enforce these gates automatically

## Execution Rules

1. **GenZ commit messages only**: When pushing to GitHub, always use gen-Z terms in a humane way. No emojis. Keep it real.
2. **Stop and ask on uncertainty**: If anything is unclear — command, prompt, requirement, whatever — stop and run a question-answer session with the user before proceeding.

## Engineering Rigor

No vibe coding. Every line is deliberate.

**When writing code:**
- Write one logical unit at a time. Pause between each. Think through edge cases before moving on.
- Cross-verify each line as it lands — does this type check? does this handle null? does this cover the edge case?
- Do not dump blocks of code. If a function needs 30 lines, write it in 3 passes of 10 lines each with verification between.

**When reviewing code:**
- Read each line individually. Say what it does in plain words before approving it.
- Flag anything that looks like "vibe code" — unused variables, shallow error handling, magic numbers, copy-paste patterns.

**When debugging code:**
- Form a hypothesis about ONE variable or ONE path at a time. Verify it before moving to the next.
- Do not shotgun-guess. Do not rewrite whole functions hoping something sticks. Isolate the fault line by line.

This applies to you and every subagent you spawn. No exceptions.

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
