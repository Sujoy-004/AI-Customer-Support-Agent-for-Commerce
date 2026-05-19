<!-- generated-by: gsd-doc-writer -->
# Product Document: AI Customer Support Agent for Commerce

> **Track:** Kasparro Agentic Commerce Hackathon — Track 4
> **Stack:** TypeScript, Vitest, Playwright, @huggingface/transformers, Supabase Realtime, OpenCode Plugin System
> **Status:** 8 phases planned, 7 complete, Phase 8 in progress (May 2026)

## What Problem Does This Solve?

Shopify store owners need customer support that knows their business — not a generic FAQ bot that gives vague answers. Customers ask about specific products ("is the classic hoodie in medium black in stock?"), store policies ("what's your return window?"), and want to complete workflows (track an order, start a return) without leaving the chat.

Current solutions fall into two bad buckets:

1. **Generic FAQ wrappers** — keyword-match bots that return static text. They don't know inventory, can't resolve variants, and hallucinate policy details.
2. **Full LLM agents** — expensive, unpredictable, and prone to hallucinating prices, stock levels, and policy terms that don't exist.

This product takes a third path: **deterministic ground truth for everything verifiable**, with AI only used for natural language understanding (intent detection, query parsing). Catalog lookups, stock checks, and policy grounding all go through structured data pipelines. No LLM touches a price, a stock count, or a policy term.

## Who Is It For?

**Primary: Shopify Store Owners**
- Want a support agent that answers accurately from live store data
- Need to reduce support load without hiring humans
- Must not risk hallucinated policy promises (false return windows, wrong shipping costs)
- Need a branded widget that fits their store's look and feel

**Secondary: Store Customers**
- Want instant answers about products, sizing, and stock
- Need to complete workflows (order tracking, returns) in-chat
- Should be politely redirected when asking off-topic questions
- Must never get wrong information about prices, availability, or policies

## Key Features (by Phase)

### Phase 1 — UI Foundation & Error Handling (COMPLETE)
- **ChatWidget** — browser-side chat interface with toggle button, message bubbles, sending states
- **NetworkDetector** — detects online/offline transitions; queues messages when offline
- **CSS Design System** — Berkeley Mono typography, flat cream canvas (`#fdfcfc`), hairline borders, ASCII bracket markers (`[+]`/`[-]`)
- **Error handling** — graceful fallbacks on network failure, API timeout, message send failure
- **No welcome message** — deliberate product decision (D-14): widget opens clean without a greeting

### Phase 2 — Policy Grounding & Guardrails (COMPLETE)
- **PolicyService** (`src/services/policyService.ts`) — manages shipping, warranty, and returns policies with 5-min cache TTL
- **ResponseGrounder** (`src/services/responseGrounder.ts`) — validates agent responses against actual policy data; flags contradictions as violations with confidence scoring
- **OffTopicDetector** (`src/services/offTopicDetector.ts`) — keyword-based detection of off-topic queries (weather, competitors, personal advice, medical/legal), with on-topic keyword override logic
- **RefusalResponseService** (`src/services/refusalResponses.ts`) — generates polite, contextual refusal messages that redirect to on-topic suggestions
- **Pipeline integration** — ChatWidget routes queries through OffTopicDetector → PolicyService → ResponseGrounder before responding

### Phase 3 — Live Catalog Intelligence (COMPLETE)
- **CatalogService** (`src/services/catalogService.ts`) — product search, variant lookup, stock check. Product cache at 2-min TTL. Inventory NEVER cached — always fresh from data source
- **CatalogIntentDetector** (`src/services/catalogIntentDetector.ts`) — hybrid keyword + structured parsing pipeline. Detects four intents: `stock_check`, `sizing_inquiry`, `product_search`, `variant_lookup`
- **ResolvedQuery** — discriminated union type with 8 variants: `exact`, `partial`, `product_only`, `search_results`, `ambiguous`, `not_found`, `context_expired`, `not_catalog`
- **SynonymResolver** (`src/services/synonymResolver.ts`) — maps user aliases to canonical values for sizes (M → Medium), colors (navy → Blue), materials (poly → Polyester)
- **Cross-turn context** — remembers last product across up to 3 turns, expiring after 5 minutes
- **MockCatalogDataSource** — swappable data source interface (`CatalogDataSource`) with 7 products, 52 variants across clothing and accessories

### Phase 4 — Order Tracking Workflow (COMPLETE)
Secure order status retrieval with fulfillment tracking. Rich HTML order card with visual timeline. Order number + email authentication. Multi-turn auth with 5min/3turn context expiry.

**Key files:**
- **OrderService** (`src/services/orderService.ts`) — order lookup, status resolution, tracking events
- **OrderIntentDetector** (`src/services/orderIntentDetector.ts`) — keyword-based order intent detection with structured parsing
- **OrderResponseFormatter** (`src/services/orderResponseFormatter.ts`) — formats order responses with order card HTML
- **OrderCard** (`shopify-widget/src/OrderCard.ts`) — DOM component for rich order card with visual timeline
- **MockOrderDataSource** (`src/services/mockOrderData.ts`) — mock orders with 9 statuses, full timeline events

### Phase 5 — Graceful Escalation (COMPLETE)
- **EscalationDetector** (`src/services/escalationDetector.ts`) — Keyword-based detection for explicit handoff ("talk to human", "speak to agent") and frustration signals ("useless", "terrible", 3+ non-resolving messages)
- **EscalationStateMachine** (`src/services/escalationStateMachine.ts`) — FSM with valid transition matrix (IDLE → OFFERED → CONFIRMING → TRANSFERRING → CONNECTED), localStorage persistence, duplicate request blocking
- **EscalationTransferHandler** (`src/services/escalationTransferHandler.ts`) — 20s → 60s transfer timeout with retry
- **ChatWidget integration** — Pipeline step 2 (after off-topic, before order), 5 system message bubble types (escalation-offer, frustration-offer, transferring, queue, connected)
- **Upgraded in Phase 8:** EscalationQueueSimulator and HumanAgentSimulator replaced by live Supabase Realtime broadcast. Handoff is now genuinely real — agent responses come from `agent-console.html` via WebSocket, not canned scripts.
- **CSS** — 13 new classes + pulse animation keyframes

### Phase 6 — Semantic AI Router (COMPLETE)
In-browser semantic intent detection replacing keyword-based routing. Uses `@huggingface/transformers` with `all-MiniLM-L6-v2` for sentence embeddings. All three intent detectors (catalog, off-topic, order) use embedding cosine similarity as primary routing method, with keyword fallback below 0.6 confidence threshold. Singleton `SemanticRouter` class with lazy model load, embedding cache (5-min TTL), and silent fallback to keywords on model failure. Reference phrases pre-computed at build time via npm prebuild hook. Return service feature-flagged off by default. Mixed intent detection splits queries at conjunctions and provides context-aware secondary acknowledgments.

### Phase 7 — Security & Live Data (COMPLETE)
Secure order lookup via Cloudflare Workers proxy with HMAC request authentication. Shopify Storefront API integration for live product catalog reads. Shopify Admin GraphQL API via proxy for order status queries. Live policy data fetch from markdown config file. Configurable data source selection (`mock` vs `live`) per domain. All live sources include error handling with graceful fallback.

### Phase 8 — UX & Demo (IN PROGRESS)
Quick action chips below the textarea for rapid task initiation (Track Order, Check Stock, Return Item, View Policies). Onboarding hint on first open so users never face a blank screen. Supabase Realtime (WebSocket) replaces the fake EscalationQueueSimulator and HumanAgentSimulator — handoff is now genuinely live via a `support-queue` broadcast channel. Standalone agent console page (`agent-console.html`) with split-view layout, accept-first flow, and multi-line textarea for agent responses. Demo video recorded by the user after code freeze.

## How Is It Different from Generic Chatbot Solutions?

| Aspect | Generic Chatbot | This Product |
|--------|----------------|--------------|
| **Catalog data** | Static FAQ text or LLM hallucination | Live product data through structured pipeline |
| **Stock levels** | "Check our website" | Real-time `checkStock()` — never cached |
| **Policy grounding** | Vague policy summaries | Exact policy strings validated by ResponseGrounder |
| **Intent detection** | LLM (expensive, variable) | Semantic embeddings + keyword fallback (deterministic, free, handles typos) |
| **Product matching** | Semantic search (fuzzy) | Direct text matching + synonym resolution |
| **Variant resolution** | "We have that item" | Exact SKU-level match with options tracking |
| **Off-topic handling** | May answer off-topic | Keyword-based guard with contextual refusal |
| **LLM cost per query** | $0.01-0.10 (variable) | $0.00 for catalog/policy paths |
| **Hallucination risk** | High | Zero — verifiable data only |

The critical differentiator: **All data retrieval uses ZERO LLM calls.** Every product lookup, variant resolution, stock check, order lookup, and policy lookup goes through deterministic structured parsing. AI is used only for intent routing — the **Semantic Router** (`SemanticRouter` class) uses MiniLM sentence embeddings to classify what the user wants, then hands off to deterministic data pipelines. No generative AI touches a price, a stock count, or a policy term. Human handoff is also real — when escalation is triggered, messages flow through a Supabase Realtime WebSocket channel (`support-queue`) to a live agent console and back, not through fake simulators or canned scripts.

## What Workflows Does It Support?

### Active (Implemented)
1. **Product search** — "do you have a leather belt?" → product details with stock summary
2. **Stock check** — "is the classic hoodie in stock?" → per-variant availability with badges
3. **Sizing inquiry** — "what sizes does the denim jacket come in?" → option listing
4. **Variant lookup** — "classic hoodie medium black" → exact SKU with price + stock
5. **Multi-turn refinement** — "classic hoodie" → "in black" → "what about large" (cross-turn context)
6. **Policy queries** — "what's your return policy?" → grounded policy response
7. **Off-topic refusal** — "what's the weather?" → polite refusal with redirect suggestions
8. **Order tracking** — "track order #1234 for email@example.com" → rich order card with timeline
9. **Live human handoff** — "talk to human" → escalation offer → Supabase Realtime handoff → real agent from agent console
10. **Return initiation** — "start a return for #1234" → eligibility check → item selection → in-chat submission (feature-flagged, off by default)

## User Experience

The chat widget loads as a `[+] Support` toggle button, bottom-right of the store page. Clicking it opens a bookended message list with an auto-growing textarea. The design follows the OpenCode aesthetic: Berkeley Mono typography throughout, warm cream background (`#fdfcfc`), hairline-bordered message bubbles, ASCII bracket markers.

**Example conversation:**
```
[+] Support

User:  is the classic hoodie in stock?
Agent: Classic Hoodie — M, Black
       $49.99 [In Stock (25 available)]

       Options: Size: S, M, L, XL | Color: Black, Gray, Navy | Material: Cotton, Polyester
       Which Size and Material would you like?

User:  medium black cotton
Agent: Classic Hoodie — M, Black
       $49.99 [In Stock (25 available)]

User:  what's the weather today?
Agent: I specialize in store-related assistance rather than general
       news or weather updates. Ask about our latest product arrivals,
       check current promotions, or get help with an existing order.
```

There is **no welcome message**. The widget opens to an empty message area. This was a deliberate product decision (documented as D-14 in planning): you should not have to close a "Hello! How can I help?" message before typing your real question.

## Current Limitations

1. **Browser-side only** — All services run in the browser. The `_generateAgentResponse` pipeline in ChatWidget calls local services, not a server API. This means every page load creates new service instances. A production deployment would move services to a Shopify App backend.
2. **Mock data fallback** — Catalog, order, and policy data now support live Shopify API connections (Phase 7). `dataSource: { catalog, order, policy }` option in ChatWidgetOptions toggles between mock fallback and live sources. Default remains mock for backward compatibility.
3. **No persistent conversation history** — Context expires after 5 minutes or 3 turns; no long-term session storage.

## Future Roadmap

### Hackathon Submission (Current)
| Phase | Status | Deliverable |
|-------|--------|-------------|
| 1. UI Foundation | Complete | ChatWidget, NetworkDetector, CSS design system |
| 2. Policy Grounding | Complete | PolicyService, OffTopicDetector, ResponseGrounder |
| 3. Catalog Intelligence | Complete | CatalogService, IntentDetector, synonym resolution |
| 4. Order Tracking | Complete | OrderService, OrderCard, multi-turn auth |
| 5. Graceful Escalation | Complete | FSM + Supabase Realtime live handoff (simulators replaced) |
| 6. Semantic AI Router | Complete | In-browser semantic intent detection (transformer.js) |
| 7. Security & Live Data | Complete | Cloudflare Workers proxy + HMAC auth, Shopify Storefront API, live policy fetch |
| 8. UX & Demo | In Progress | Quick action chips, realtime handoff, agent console, demo video |

### Post-Hackathon
- Live Shopify API integration (replacing mock data sources)
- Server-side service architecture (move from browser to Shopify App backend)
- Persistent conversation storage
- Multi-store support
- Analytics dashboard for common queries
