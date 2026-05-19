<!-- generated-by: gsd-doc-writer -->
# AI Customer Support Agent for Commerce

A "Store-Native" Shopify AI customer support agent built for the Kasparro Agentic Commerce Hackathon (Track 4). Uses a **hybrid architecture**: in-browser semantic understanding (MiniLM embeddings via transformer.js) for intent routing + deterministic data retrieval for zero-hallucination answers.

Not a generic FAQ wrapper or an expensive LLM chatbot. Executes active workflows: product lookup, stock checks, policy answers, order tracking, and live human handoff.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** (included with Node.js)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run unit tests (optional, 427 tests)

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

### 5. Configure Supabase Realtime (for live human handoff)

```bash
# Copy and fill in your Supabase credentials
cp shopify-widget/.env.example shopify-widget/.env
# Then edit .env with your Supabase project URL and anon key
# Create a free project at https://supabase.com (Settings → API)
```

### 6. Open the widget demo in your browser

```bash
# Build the widget bundle (IIFE)
npx tsc -p tsconfig.widget.json && npx vite build --config shopify-widget/vite.config.ts

# Then open shopify-widget/index.html in your browser
```

### 7. Use the agent console (for live handoff)

Open `shopify-widget/agent-console.html` in your browser. It connects to the same Supabase channel and shows pending handoff requests.

## Project Structure

```
├── shopify-proxy/           # Cloudflare Workers serverless proxy
│   ├── package.json         # wrangler + workerd dependencies
│   ├── wrangler.toml        # CF Workers config
│   ├── .env.example         # Template for SHOPIFY_ADMIN_TOKEN, SHOPIFY_STORE_DOMAIN
│   └── src/worker.ts        # HMAC verification, Admin GraphQL query, filtered response
├── shopify-widget/          # Browser widget (ChatWidget DOM rendering)
│   ├── index.html           # Demo page — loads dist/widget.js
│   ├── agent-console.html   # Agent console — standalone, split view, Supabase handoff
│   ├── .env.example         # Template for Supabase URL + anon key
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
│   │   ├── shopifyStorefrontDataSource.ts # Live Shopify Storefront API client
│   │   ├── shopifyOrderProxyDataSource.ts # HMAC-signed proxy client
│   │   └── types.ts                   # All TypeScript definitions
│   ├── config/synonyms/     # Size, color, material synonym tables
│   ├── config/semantic/     # Reference phrases + pre-computed embeddings for SemanticRouter
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
├── PRODUCT_DOC.md           # Product document (in docs/)
├── TECHNICAL_DOC.md         # Technical document (in docs/)
├── DECISION_LOG.md          # Key decisions log (in docs/)
├── DESIGN.md                # Berkeley Mono design system spec (in docs/)
├── hackathon.md             # Hackathon rules & requirements (in docs/)
└── package.json

## Architecture

Three-layer browser-side architecture. All services run in the browser — no backend required (optional serverless proxy for secure order lookup).

```
User query → SemanticRouter → OffTopicDetector → EscalationDetector → OrderIntentDetector → CatalogIntentDetector → PolicyService → Response
              (transformer.js) (keyword guard)   (handoff)           (order intent)       (catalog + intent)     (policy lookup)

SemanticRouter (MiniLM sentence embeddings) classifies user intent in-browser.
All data retrieval is fully deterministic — zero LLM calls, zero hallucinations.
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
EscalationDetector ── active? ──► system message (offer/queue/connected)
  │                    ── trigger ──► EscalationStateMachine
  ▼ (not escalating)
OrderIntentDetector ── order? ──► formatOrderResponse() ──► order card
  │ (not order)
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
- **Swappable data sources**: `CatalogDataSource` and `OrderDataSource` interfaces for mock → live Shopify API migration. `PolicyService` supports live markdown fetch.
- **Bounded context**: Cross-turn context expires after 5 minutes or 3 turns.
- **All services run in-browser**: No backend required (except optional serverless proxy for order security).
- **Semantic Router**: `@huggingface/transformers` with `all-MiniLM-L6-v2` — in-browser sentence embeddings for intent classification. Handles typos, synonyms, and natural phrasing.
- **Live human handoff**: Escalation routes through Supabase Realtime WebSocket channel (`support-queue`). Agent console (`agent-console.html`) receives requests, accepts, and sends responses. No fake simulators or canned scripts.

## Testing

- **22+ unit/integration test files** (Vitest) — covering catalog, policy, order, escalation, semantic router, Supabase handoff, guard services, data sources, security
- **4 E2E spec files** (Playwright) — catalog queries, off-topic detection, stock checks, DOM snapshot
- **Eval suite** — 48 scenario-based catalog intelligence evals
- **Coverage**: 427 unit tests + 12 E2E tests passing

```bash
# Run all Vitest tests (427 passing)
npx vitest run

# Run with coverage
npx vitest run --coverage

# Build widget + run E2E tests (12 passing)
npx playwright test --config=e2e/playwright.config.ts
```

### Proxy Local Dev

```bash
cd shopify-proxy
cp .env.example .env         # Set SHOPIFY_ADMIN_TOKEN, SHOPIFY_STORE_DOMAIN, HMAC_SECRET
npx wrangler dev             # Starts proxy at localhost:8787
```

Or from root:
```bash
npm run dev:proxy
```

### Proxy Security Configuration (Phase 1)

The Shopify proxy now includes production-grade security hardening:

```bash
# Required environment variables
SHOPIFY_ADMIN_TOKEN=your-admin-api-token
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
HMAC_SECRET=your-32-byte-secret-key

# Optional security configuration
ALLOWED_ORIGINS=https://your-store.com,https://admin.your-store.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
```

See `docs/PHASE1_SECURITY.md` for complete security implementation details.

## Phases

| Phase | Status | What It Delivers |
|-------|--------|------------------|
| 1. UI Foundation | Complete | ChatWidget, NetworkDetector, CSS design system |
| 2. Policy Grounding | Complete | PolicyService, OffTopicDetector, ResponseGrounder |
| 3. Catalog Intelligence | Complete | CatalogService, IntentDetector, synonym resolution |
| 4. Order Tracking | Complete | OrderService, OrderIntentDetector, OrderCard, email + number matching |
| 5. Graceful Handoff | Complete | FSM + Supabase Realtime live handoff (simulators replaced) |
| 6. Semantic AI Router | Complete | In-browser semantic intent detection (transformer.js) |
| 7. Security & Live Data | Complete | Cloudflare Workers proxy + HMAC auth, Shopify Storefront API, live policy fetch |
| **Rebuild Phase 1** | **Complete** | **Security hardening: CORS allowlist, rate limiting, input validation, structured logging, security headers** |
| 8. UX & Demo | In Progress | Quick action chips, realtime handoff, agent console, demo video |

## Key Technologies

- **TypeScript** — strict mode, discriminated unions, ES modules
- **@huggingface/transformers** — in-browser MiniLM embeddings for semantic intent detection
- **Supabase Realtime** — WebSocket broadcast channel for live human handoff
- **Cloudflare Workers** — Edge runtime for secure Shopify Admin API proxy (rate limiting, CORS, HMAC verification)
- **Vitest** — unit and integration tests (22 test files, 427 tests)
- **Playwright** — E2E browser tests (4 spec files, 12 tests)
- **OpenCode + GSD** — development workflow engine (planning, execution, verification)

## Product Decisions

See [DECISION_LOG.md](./DECISION_LOG.md) for a full record of architectural and product choices.

## Demo Video

*Demo video coming soon — will be uploaded after submission freeze.*

4-minute walkthrough showing:
1. **0:00-0:30** — Introduction: "This is an AI customer support agent for Shopify."
2. **0:30-1:30** — Semantic understanding: "avialable?", "where's my stuff", "got medium blue pants?" — demonstrating typo and synonym handling
3. **1:30-2:30** — Product lookup → order tracking flow: full customer journey
4. **2:30-3:30** — Live human handoff: user requests agent, Supabase Realtime handoff, agent responds from console
5. **3:30-4:00** — Architecture summary: "Semantic router → deterministic data → zero hallucinations"

## Screenshots

*To be added after Phase 8 completion*

## Contribution Note

**Participants:** Sujoy and Sparsh

**Roles:** *to be filled*

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npx playwright test` fails — browser not found | Run `npx playwright install chromium` |
| Widget shows blank page | Run the build step first: `npx tsc -p tsconfig.widget.json && npx vite build --config shopify-widget/vite.config.ts` |
| E2E tests hang or fail | Run tests one at a time: `npx playwright test --config=e2e/playwright.config.ts --headed` |
| `npm install` fails | Use Node.js >= 18.0.0. Check with `node -v` |
