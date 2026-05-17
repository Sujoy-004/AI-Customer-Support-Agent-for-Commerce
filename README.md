<!-- generated-by: gsd-doc-writer -->
# AI Customer Support Agent for Commerce

A "Store-Native" Shopify AI customer support agent built for the Kasparro Agentic Commerce Hackathon (Track 4). Deeply integrated into live store data — catalog, sizing, stock, orders — with deterministic guardrails and zero hallucination risk.

Not a generic FAQ wrapper. Executes active workflows: product lookup, stock checks, policy answers, and order tracking.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** (included with Node.js)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run unit tests (optional, 325 tests)

```bash
npx vitest run
```

### 3. Install Playwright browsers (first time only)

```bash
npx playwright install chromium
```

### 4. Run E2E browser tests (12 tests)

```bash
npx playwright test --config=e2e/playwright.config.ts
```

This builds the widget (tsc + vite), serves it on port 3000, runs tests.

### 5. Open the widget demo in your browser

```bash
# Build the widget bundle (IIFE)
npx tsc -p tsconfig.widget.json && npx vite build --config shopify-widget/vite.config.ts

# Then open shopify-widget/index.html in your browser
```

## Project Structure

```
├── shopify-widget/          # Browser widget (ChatWidget DOM rendering)
│   ├── index.html           # Demo page — loads dist/widget.js
│   ├── src/ChatWidget.ts    # Main widget class — pipeline, events, DOM
│   ├── src/orderCard.ts     # Order status HTML card renderer
│   ├── src/styles/widget.css # CSS with escalation components
│   ├── tests/               # Widget integration tests
│   ├── vite.config.ts       # Vite IIFE library build config
│   └── vitest.config.ts     # Widget-specific Vitest config
├── src/
│   ├── integrations/        # IDE integrations (Antigravity, Context7)
│   ├── services/            # All core services
│   │   ├── catalogService.ts          # Product search, stock, variants
│   │   ├── catalogIntentDetector.ts   # Intent classification + parsing
│   │   ├── orderService.ts            # Order lookup by ID/email/number
│   │   ├── orderIntentDetector.ts     # Order intent + email/number extraction
│   │   ├── orderResponseFormatter.ts  # Order query → formatted response
│   │   ├── returnService.ts           # Return eligibility + submission
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
│   ├── playwright.config.ts       # Main E2E config
│   ├── playwright.dom.config.ts   # DOM snapshot config
│   ├── dev-server.mjs             # Dev server helper
│   └── specs/
│       ├── catalogQuery.spec.ts    # Catalog query tests (3)
│       ├── offTopic.spec.ts        # Off-topic detection tests (4)
│       ├── stockCheck.spec.ts      # Stock check tests (4)
│               └── domSnapshot.spec.ts     # DOM snapshot test (1)
├── tsconfig.json            # Root TypeScript config
├── tsconfig.widget.json     # Widget-specific TS config
├── vitest.config.ts         # Vitest configuration
├── PRODUCT_DOC.md           # Product document (hackathon requirement)
├── TECHNICAL_DOC.md         # Technical document (hackathon requirement)
├── DECISION_LOG.md          # Key decisions log
├── DESIGN.md                # Berkeley Mono design system spec
├── hackathon.md             # Hackathon rules & requirements
└── package.json

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

*coming before 20th May 2026*

## Screenshots

*coming before 20th May 2026*

## Contribution Note

Solo participant. Product thinking, architecture, implementation, testing, and documentation all by one developer.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npx playwright test` fails — browser not found | Run `npx playwright install chromium` |
| Widget shows blank page | Run the build step first: `npx tsc -p tsconfig.widget.json && npx vite build --config shopify-widget/vite.config.ts` |
| E2E tests hang or fail | Run tests one at a time: `npx playwright test --config=e2e/playwright.config.ts --headed` |
| `npm install` fails | Use Node.js >= 18.0.0. Check with `node -v` |
