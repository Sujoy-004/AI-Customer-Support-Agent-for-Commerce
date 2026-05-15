<!-- generated-by: gsd-doc-writer -->
# AI Customer Support Agent for Commerce

A "Store-Native" Shopify AI customer support agent built for the Kasparro Agentic Commerce Hackathon (Track 4). Deeply integrated into live store data — catalog, sizing, stock — with deterministic guardrails and zero hallucination risk.

Not a generic FAQ wrapper. Executes active workflows.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** (included with Node.js)

## Quick Start

```bash
# Install dependencies
npm install

# Run unit and integration tests (201 tests, Vitest)
npx vitest run

# Run E2E browser tests (Playwright)
npx playwright test --config=e2e/playwright.config.ts

# Open the widget demo page
open shopify-widget/index.html
```

## Project Structure

```
├── shopify-widget/          # Browser widget (ChatWidget DOM rendering)
│   ├── src/ChatWidget.ts    # Main widget class — pipeline, events, DOM
│   └── tests/               # Widget integration tests
├── src/
│   ├── services/            # All core services
│   │   ├── catalogService.ts          # Product search, stock, variants
│   │   ├── catalogIntentDetector.ts   # Intent classification + parsing
│   │   ├── offTopicDetector.ts        # Off-topic guard
│   │   ├── responseGrounder.ts        # Policy grounding check
│   │   ├── refusalResponses.ts        # Polite refusal messages
│   │   ├── policyService.ts           # Policy data management
│   │   ├── mockCatalogData.ts         # 7 products, 52 variants (mock)
│   │   ├── synonymResolver.ts         # Canonical → alias mapping
│   │   ├── conversationContext.ts      # 5min/3turn context manager
│   │   ├── cacheManager.ts            # Generic TTL cache
│   │   └── types.ts                   # All TypeScript definitions
│   ├── config/synonyms/     # Size, color, material synonym tables
│   └── tests/eval/          # Scenario evaluation tests
├── e2e/                     # Playwright E2E tests
│   ├── playwright.config.ts
│   └── specs/
│       ├── catalogQuery.spec.ts    # 3 tests
│       ├── offTopic.spec.ts        # 4 tests
│       └── stockCheck.spec.ts      # 4 tests
├── .opencode/               # OpenCode plugin config (dev tooling)
├── .planning/               # GSD planning artifacts
├── vitest.config.ts         # Vitest configuration
├── package.json
└── DESIGN.md                # Berkeley Mono design system spec
```

## Architecture

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

- **No hallucinations**: Catalog pipeline uses zero LLM calls. Stock is never cached. Policy responses are verified against source data.
- **Deterministic intent**: Keyword-based intent detection with exclusion guards prevents catalog/policy cross-contamination.
- **Swappable data sources**: `CatalogDataSource` interface for mock → live Shopify API migration.
- **Bounded context**: Cross-turn context expires after 5 minutes or 3 turns.

## Testing

- **201 tests** across 10 Vitest test files (unit + integration)
- **3 E2E spec files** with Playwright (11 browser test scenarios)
- **Eval suite** — 20 scenario-based catalog intelligence evals

```bash
# Run all Vitest tests
npx vitest run

# Run with coverage
npx vitest run --coverage

# Run E2E tests
npx playwright test --config=e2e/playwright.config.ts
```

## Phases

| Phase | Status | What It Delivers |
|-------|--------|------------------|
| 1. UI Foundation | Complete | ChatWidget, NetworkDetector, CSS design system |
| 2. Policy Grounding | Complete | PolicyService, OffTopicDetector, ResponseGrounder |
| 3. Catalog Intelligence | Complete | CatalogService, IntentDetector, synonym resolution |
| 4. Order Tracking | Not started | Secure order status workflow |
| 5. Graceful Escalation | Not started | Human handoff |
| 6. Return Initiation | Not started | In-chat return submission |

## Key Technologies

- **TypeScript** — strict mode, discriminated unions, ES modules
- **Vitest** — unit and integration tests (201 tests)
- **Playwright** — E2E browser tests (3 spec files)
- **OpenCode Plugin System** — development tooling (TDD, code review, verification)

## Product Decisions

See [DECISION_LOG.md](./DECISION_LOG.md) for a full record of architectural and product choices.
