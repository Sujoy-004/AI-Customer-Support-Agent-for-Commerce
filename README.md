<!-- generated-by: gsd-doc-writer -->
# AI Customer Support Agent for Commerce

A "Store-Native" Shopify AI customer support agent built for the Kasparro Agentic Commerce Hackathon (Track 4). Deeply integrated into live store data — catalog, sizing, stock, orders — with deterministic guardrails and zero hallucination risk.

Not a generic FAQ wrapper. Executes active workflows: product lookup, stock checks, policy answers, and order tracking.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** (included with Node.js)

## Quick Start

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Run unit and integration tests (325 tests, 19 files)
npx vitest run

# Build the widget bundle, then run E2E browser tests (12 tests, 4 specs)
npx playwright test --config=e2e/playwright.config.ts

# Build the widget and open the demo page
npx tsc -p tsconfig.widget.json && npx vite build --config shopify-widget/vite.config.ts
# Then open shopify-widget/index.html in your browser
```

## Project Structure

```
├── shopify-widget/          # Browser widget (ChatWidget DOM rendering)
│   ├── src/ChatWidget.ts    # Main widget class — pipeline, events, DOM
│   ├── src/OrderCard.ts     # Order status HTML card renderer
│   ├── src/styles/widget.css # CSS with escalation components
│   └── tests/               # Widget integration tests
├── src/
│   ├── services/            # All core services
│   │   ├── catalogService.ts          # Product search, stock, variants
│   │   ├── catalogIntentDetector.ts   # Intent classification + parsing
│   │   ├── orderService.ts            # Order lookup by ID/email/number
│   │   ├── orderIntentDetector.ts     # Order intent + email/number extraction
│   │   ├── orderResponseFormatter.ts  # Order query → formatted response
│   │   ├── mockOrderData.ts           # Mock orders for testing
│   │   ├── offTopicDetector.ts        # Off-topic guard
│   │   ├── responseGrounder.ts        # Policy grounding check
│   │   ├── refusalResponses.ts        # Polite refusal messages
│   │   ├── policyService.ts           # Policy data management
│   │   ├── mockCatalogData.ts         # 7 products, 52 variants (mock)
│   │   ├── synonymResolver.ts         # Canonical → alias mapping
│   │   ├── conversationContext.ts     # 5min/3turn context manager
│   │   ├── cacheManager.ts            # Generic TTL cache
│   │   ├── escalationDetector.ts       # Handoff + frustration detection
│   │   ├── escalationStateMachine.ts   # FSM with localStorage
│   │   ├── escalationQueueSimulator.ts # Queue position (1-5)
│   │   ├── escalationTransferHandler.ts # 20s timeout, retry
│   │   ├── escalationHumanAgent.ts     # 3-message canned script
│   │   └── types.ts                   # All TypeScript definitions
│   ├── config/synonyms/     # Size, color, material synonym tables
│   └── tests/eval/          # Scenario evaluation tests
├── e2e/                     # Playwright E2E tests
│   ├── playwright.config.ts
│   └── specs/
│       ├── catalogQuery.spec.ts    # Catalog query tests (3)
│       ├── offTopic.spec.ts        # Off-topic detection tests (4)
│       ├── stockCheck.spec.ts      # Stock check tests (4)
│       └── domSnapshot.spec.ts     # DOM snapshot test (1)
├── .opencode/               # OpenCode plugin config (dev tooling)
├── .planning/               # GSD planning artifacts
├── vitest.config.ts         # Vitest configuration
├── package.json
└── DESIGN.md                # Berkeley Mono design system spec
```

## Architecture

Three-layer browser-side architecture. All services run in the browser — no backend required.

```
User query → OffTopicDetector → EscalationDetector → OrderIntentDetector → CatalogIntentDetector → PolicyService → Response
              (keyword guard)    (handoff + frustration) (order intent)   (catalog + intent)     (policy lookup)
              │
              └→ EscalationStateMachine → EscalationTransferHandler → HumanAgentSimulator
                 (FSM + localStorage)       (20s timeout)           (3-message script)

Catalog, order, and escalation use ZERO LLM calls — every product lookup, stock check,
variant resolution, order tracking, and human handoff goes through deterministic keyword + structured parsing.
```

### Pipeline Flow

```
User Input
  │
  ▼
OffTopicDetector ── off-topic? ──► RefusalResponseService ──► polite refusal
  │ (on-topic)
  ▼
EscalationDetector ── active? ──► system message (offer/queue/connected)
  │                    ── trigger ──► EscalationStateMachine
  ▼ (not escalating)
OrderIntentDetector ── order? ──► formatOrderResponse() ──► order card
  │ (not order)
  ▼
ReturnService ── return intent? ──► checkEligibility() ──► return flow
  │ (not return)
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
- **10 implemented workflows**: Product search, stock check, sizing inquiry, variant lookup, multi-turn refinement, policy queries, order tracking, return initiation, off-topic refusal, and graceful human handoff.
- **Deterministic intent**: Keyword-based intent detection with exclusion guards prevents catalog/policy cross-contamination.
- **Swappable data sources**: `CatalogDataSource` and `OrderDataSource` interfaces for mock → live Shopify API migration.
- **Bounded context**: Cross-turn context expires after 5 minutes or 3 turns.

## Testing

- **19 unit/integration test files** (Vitest) — covering catalog, policy, order, escalation, and guard services
- **4 E2E spec files** (Playwright) — catalog queries, off-topic detection, stock checks, DOM snapshot
- **Eval suite** — 20 scenario-based catalog intelligence evals
- **Coverage**: 325 unit tests + 12 E2E tests passing

```bash
# Run all Vitest tests (325 passing)
npx vitest run

# Run with coverage
npx vitest run --coverage

# Build widget + run E2E tests (12 passing)
npx playwright test --config=e2e/playwright.config.ts
```

## Phases

| Phase | Status | What It Delivers |
|-------|--------|------------------|
| 1. UI Foundation | Complete | ChatWidget, NetworkDetector, CSS design system |
| 2. Policy Grounding | Complete | PolicyService, OffTopicDetector, ResponseGrounder |
| 3. Catalog Intelligence | Complete | CatalogService, IntentDetector, synonym resolution |
| 4. Order Tracking | Complete | OrderService, OrderIntentDetector, OrderCard, email + number matching |
| 5. Graceful Handoff | Complete | EscalationDetector, StateMachine, queue, transfer, human agent |
| 6. Return Initiation | Complete | Return eligibility, item selection, in-chat submission |

## Key Technologies

- **TypeScript** — strict mode, discriminated unions, ES modules
- **Vitest** — unit and integration tests (19 test files)
- **Playwright** — E2E browser tests (4 spec files, 12 tests)
- **OpenCode + GSD** — development workflow engine (planning, execution, verification)

## Product Decisions

See [DECISION_LOG.md](./DECISION_LOG.md) for a full record of architectural and product choices.

## Demo Video

*A 3–5 minute demo video will be uploaded as YouTube unlisted before the submission deadline (20th May 2026). The walkthrough will cover: widget loading, product search, stock check, order tracking, return initiation, and graceful human handoff.*

## Screenshots

*Product walkthrough screenshots will be added before the submission deadline.*
