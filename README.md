<!-- generated-by: gsd-doc-writer -->
# AI Customer Support Agent for Commerce

**v1.2 — Ship Ready May 20, 2026** | 607 tests passing | 149 commits | 10 phases complete

A "Store-Native" Shopify AI customer support agent built for the Kasparro Agentic Commerce Hackathon (Track 4). Uses a **hybrid architecture**: in-browser semantic understanding (MiniLM embeddings via transformer.js) for intent routing + deterministic data retrieval for zero-hallucination answers.

Not a generic FAQ wrapper or an expensive LLM chatbot. Executes active workflows: product lookup, stock checks, policy answers, order tracking, and live human handoff.

## Why This System Feels Different

| Traditional Chatbot | This System |
|---------------------|-------------|
| LLM API calls → hallucination risk | Zero LLM calls → deterministic answers |
| Generic responses | Grounded in live Shopify data |
| Cloud-dependent | Runs entirely in-browser |
| Black box intent | Semantic routing + keyword fallback |
| No escalation path | Real-time human handoff via Supabase |
| Static UI | Response-type-aware surfaces |

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** (included with Node.js)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run unit tests (optional, 605 tests)

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
│   ├── tests/               # Widget integration tests (13 test files)
│   ├── vite.config.ts       # Vite IIFE library build config
│   └── vitest.config.ts     # Widget-specific Vitest config
├── src/
│   ├── integrations/        # IDE integrations (Antigravity, Context7)
│   ├── services/            # All core services (22 test files)
│   │   ├── catalogService.ts          # Product search, stock, variants
│   │   ├── catalogIntentDetector.ts   # Intent classification + parsing
│   │   ├── catalogSync.ts             # Periodic catalog sync manager (5-min TTL)
│   │   ├── policySync.ts              # Policy change detection (SHA-256 hashing)
│   │   ├── synonymConstants.ts        # Decoupled synonym mappings (SIZE, COLOR, MATERIAL)
│   │   ├── orderService.ts            # Order lookup by ID/email/number
│   │   ├── orderIntentDetector.ts     # Order intent + email/number extraction
│   │   ├── orderResponseFormatter.ts  # Order query → formatted response
│   │   ├── returnService.ts           # Return eligibility + submission
│   │   ├── mockOrderData.ts           # Mock orders (testing only)
│   │   ├── offTopicDetector.ts        # Off-topic guard
│   │   ├── responseGrounder.ts        # Policy grounding check
│   │   ├── refusalResponses.ts        # Polite refusal messages
│   │   ├── policyService.ts           # Policy data management
│   │   ├── mockCatalogData.ts         # 7 products, 52 variants (testing only)
│   │   ├── synonymResolver.ts         # Canonical → alias mapping
│   │   ├── conversationContext.ts     # 5min/3turn context manager
│   │   ├── cacheManager.ts            # Generic TTL cache
│   │   ├── escalationDetector.ts      # Handoff + frustration detection
│   │   ├── escalationStateMachine.ts  # FSM with localStorage
│   │   ├── escalationTransferHandler.ts # 20s timeout, retry
│   │   ├── suggestedActions.ts        # Context-aware action chips (6 states)
│   │   ├── autocomplete.ts            # Prefix-matching product/order dropdown
│   │   ├── shopifyStorefrontDataSource.ts # Live Shopify Storefront API client
│   │   ├── shopifyOrderProxyDataSource.ts # HMAC-signed proxy client
│   │   ├── handoffChannel.ts          # Supabase Realtime channel management
│   │   ├── agentPresence.ts           # Agent online/offline presence tracking
│   │   └── types.ts                   # All TypeScript definitions
│   ├── config/synonyms/     # Size, color, material synonym tables
│   ├── config/semantic/     # Reference phrases + pre-computed embeddings for SemanticRouter
│   └── tests/eval/          # Scenario evaluation tests
├── e2e/                     # Playwright E2E tests (4 spec files)
│   ├── playwright.config.ts       # Main E2E config
│   ├── playwright.dom.config.ts   # DOM snapshot config
│   ├── dev-server.mjs             # Dev server helper
│   └── specs/
│       ├── catalogQuery.spec.ts    # Catalog query tests (3)
│       ├── offTopic.spec.ts        # Off-topic detection tests (4)
│       ├── stockCheck.spec.ts      # Stock check tests (4)
│       └── domSnapshot.spec.ts     # DOM snapshot test (1)
├── tsconfig.json            # Root TypeScript config
├── tsconfig.widget.json     # Widget-specific TS config
├── vitest.config.ts         # Vitest configuration
├── docs/                    # Product, technical, and decision documentation
└── package.json
```

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

- **No hallucinations**: Data retrieval pipeline uses zero LLM calls — every product lookup, variant resolution, stock check, order lookup, and policy lookup goes through deterministic structured parsing.
- **Hybrid AI approach**: MiniLM sentence embeddings for semantic intent detection (in-browser), structured code for all data lookups. Best of both worlds.
- **Live-by-default data sources**: `CatalogDataSource` and `OrderDataSource` interfaces for mock → live Shopify API migration. `PolicyService` supports live markdown fetch. Production uses live sources; tests explicitly use mock.
- **Periodic sync**: `CatalogSyncManager` pulls fresh catalog every 5 minutes. `PolicySyncManager` checks policy changes via SHA-256 hashing every 10 minutes. Both configurable via constructor.
- **Bounded context**: Cross-turn context expires after 5 minutes or 3 turns.
- **All services run in-browser**: No backend required (except optional serverless proxy for order security).
- **Semantic Router**: `@huggingface/transformers` with `all-MiniLM-L6-v2` — in-browser sentence embeddings for intent classification. Handles typos, synonyms, and natural phrasing.
- **Live human handoff**: Escalation routes through Supabase Realtime WebSocket channel (`support-queue`). Agent console (`agent-console.html`) receives requests, accepts, and sends responses. Typing indicators, presence tracking, reconnect with exponential backoff.
- **Response surfaces**: Structured product/order data rendered as inline commerce cards — not text-only responses. Each response type has distinct visual rhythm.
- **Premium commerce UI**: Inter typography, cream/ink palette, structured surfaces, mobile-optimized with safe-area support.

## Testing

- **30 test files** (Vitest) — covering catalog, policy, order, escalation, semantic router, Supabase handoff, guard services, data sources, security, sync managers, suggested actions, autocomplete
- **4 E2E spec files** (Playwright) — catalog queries, off-topic detection, stock checks, DOM snapshot
- **Eval suite** — 48 scenario-based catalog intelligence evals
- **Coverage**: 607 unit tests + 12 E2E tests passing

```bash
# Run all Vitest tests (607 passing)
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

## Phases

| Phase | Status | What It Delivers |
|-------|--------|------------------|
| 1. Security Hardening | Complete | CORS allowlist, rate limiting, input validation, structured logging, security headers |
| 2. Semantic Router | Complete | In-browser semantic intent detection (transformer.js, MiniLM embeddings) |
| 3. Realtime Human Handoff | Complete | Supabase Realtime WebSocket, typing indicators, presence tracking, reconnect logic |
| 4. Dynamic Store Sync | Complete | Live-by-default data sources, CatalogSyncManager (5-min sync), PolicySyncManager (SHA-256 detection) |
| 5. UX Refinement | Complete | Context-aware action chips, autocomplete, adaptive onboarding (May 2026) |
| 6. Order Management | Complete | OrderIntentDetector, OrderService, order card with timeline, email + order number auth |
| 7. Return Processing | Complete | ReturnService, return eligibility checks, return submission flow |
| 8. Escalation & Handoff | Complete | EscalationDetector, EscalationStateMachine, Supabase handoff channel, agent console |
| 9. Gap Closure | Complete | B1-B2 blockers fixed, W2-W6 warnings resolved, all evals passing |
| 10. UI Stabilization | Complete | Premium commerce UI, response surfaces, mobile optimization, production realism |

## Key Technologies

- **TypeScript** — strict mode, discriminated unions, ES modules
- **@huggingface/transformers** — in-browser MiniLM embeddings for semantic intent detection
- **Supabase Realtime** — WebSocket broadcast channel for live human handoff
- **Cloudflare Workers** — Edge runtime for secure Shopify Admin API proxy (rate limiting, CORS, HMAC verification)
- **Vitest** — unit and integration tests (30 test files, 605 tests)
- **Playwright** — E2E browser tests (4 spec files, 12 tests)
- **OpenCode + GSD** — development workflow engine (planning, execution, verification)

## Product Decisions

See [DECISION_LOG.md](./DECISION_LOG.md) for a full record of architectural and product choices.

## Demo Video

*Demo video pending — to be recorded after code freeze (per D-14).*

4-minute walkthrough showing:
1. **0:00-0:30** — Introduction: "This is an AI customer support agent for Shopify."
2. **0:30-1:30** — Semantic understanding: "avialable?", "where's my stuff", "got medium blue pants?" — demonstrating typo and synonym handling
3. **1:30-2:30** — Product lookup → order tracking flow: full customer journey
4. **2:30-3:30** — Live human handoff: user requests agent, Supabase Realtime handoff, agent responds from console
5. **3:30-4:00** — Architecture summary: "Semantic router → deterministic data → zero hallucinations"

## Screenshots

Widget UI features premium commerce design with:
- Berkeley Mono font family, cream/ink palette, hairline borders
- Structured product cards with stock status badges
- Response-type-aware message surfaces (product, order, policy, escalation)
- Silent data source mode — identical UX regardless of backend
- Adaptive onboarding with example queries
- Context-aware action chips and autocomplete dropdown
- Mobile-optimized layout with safe-area support

## Demo Walkthrough

### Recommended Demo Script (4 minutes)

| Time | Action | What to Say | What Judges See |
|------|--------|-------------|-----------------|
| 0:00 | Open widget | "This is a store-native AI support agent for Shopify." | Clean widget opens with "Store Support" onboarding |
| 0:15 | Type: `do you have blue pants` | "Natural language — no exact keywords needed." | Semantic routing handles the query |
| 0:30 | Type: `avialable` (typo) | "Handles typos naturally." | MiniLM embeddings match intent despite typo |
| 0:45 | Type: `track order #1001 for john@example.com` | "Order tracking with authentication." | Order card with timeline, tracking, carrier |
| 1:15 | Type: `what's your return policy` | "Policy answers grounded in live data." | Grounded policy response |
| 1:45 | Type: `I want to speak to a human` | "Real-time escalation to human agents." | Escalation FSM → Supabase handoff |
| 2:15 | Show agent console | "Agent receives request, accepts, responds." | Real-time WebSocket communication |
| 2:45 | Show architecture | "Zero LLM calls. Semantic routing + deterministic data." | Hybrid architecture diagram |

### Strongest Judging Moments

1. **Typo handling** (0:30) — "avialable" → correct product match via embeddings
2. **Product card surface** (0:45) — structured commerce data, not text-only
3. **Order timeline** (1:00) — visual logistics tracking with carrier + ETA
4. **Live handoff** (2:00) — real Supabase WebSocket, not simulated
5. **Policy grounding** (1:15) — exact policy answers validated against live data

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
