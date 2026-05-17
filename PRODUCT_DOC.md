<!-- generated-by: gsd-doc-writer -->
# Product Document: AI Customer Support Agent for Commerce

> **Track:** Kasparro Agentic Commerce Hackathon — Track 4
> **Stack:** TypeScript, Vitest, Playwright, OpenCode Plugin System
> **Status:** 5 of 6 phases complete (May 2026)

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
- **EscalationStateMachine** (`src/services/escalationStateMachine.ts`) — FSM with valid transition matrix (IDLE → OFFERED → CONFIRMING → TRANSFERRING → QUEUED → CONNECTED), localStorage persistence, duplicate request blocking
- **EscalationQueueSimulator** (`src/services/escalationQueueSimulator.ts`) — Dynamic queue position (random 1-5), 8s refresh interval
- **EscalationTransferHandler** (`src/services/escalationTransferHandler.ts`) — 20s transfer timeout with retry and email fallback
- **HumanAgentSimulator** (`src/services/escalationHumanAgent.ts`) — 3-message canned script for connected state
- **ChatWidget integration** — Pipeline step 2 (after off-topic, before order), 5 system message bubble types (escalation-offer, frustration-offer, transferring, queue, connected)
- **CSS** — 13 new classes + pulse animation keyframes

### Phase 6 — Return Initiation Workflow (COMPLETE)
Full in-chat return initiation with eligibility checks against policy rules. Detects return intent from keywords, resolves order via shared OrderService, checks eligibility (order must be delivered, email must match), and supports multi-turn item selection and return submission.

## How Is It Different from Generic Chatbot Solutions?

| Aspect | Generic Chatbot | This Product |
|--------|----------------|--------------|
| **Catalog data** | Static FAQ text or LLM hallucination | Live product data through structured pipeline |
| **Stock levels** | "Check our website" | Real-time `checkStock()` — never cached |
| **Policy grounding** | Vague policy summaries | Exact policy strings validated by ResponseGrounder |
| **Intent detection** | LLM (expensive, variable) | Keyword + structured parsing (deterministic, free) |
| **Product matching** | Semantic search (fuzzy) | Direct text matching + synonym resolution |
| **Variant resolution** | "We have that item" | Exact SKU-level match with options tracking |
| **Off-topic handling** | May answer off-topic | Keyword-based guard with contextual refusal |
| **LLM cost per query** | $0.01-0.10 (variable) | $0.00 for catalog/policy paths |
| **Hallucination risk** | High | Zero — verifiable data only |

The critical differentiator: **Phase 3 (catalog queries) uses ZERO LLM calls.** Every product lookup, variant resolution, and stock check goes through deterministic structured parsing. The only AI involvement is the `CatalogIntentDetector`'s keyword-based intent classification — which is still rule-based, not generative.

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
9. **Graceful handoff** — "talk to human" → escalation offer → queue → human agent connection

### Planned (Not Yet Implemented)
10. **Return initiation** — in-chat return submission

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
2. **Mock data** — Catalog and policy data are mock implementations. `CatalogDataSource` and `PolicyService` have interfaces ready for live API connections but no Shopify Admin API client has been written yet.
3. **No return initiation** (Phase 6) — The most common support workflow is not yet automated.
4. **No persistent conversation history** — Context expires after 5 minutes or 3 turns; no long-term session storage.

## Future Roadmap

### Hackathon Submission (Current)
| Phase | Status | Deliverable |
|-------|--------|-------------|
| 1. UI Foundation | Complete | ChatWidget, NetworkDetector, CSS design system |
| 2. Policy Grounding | Complete | PolicyService, OffTopicDetector, ResponseGrounder |
| 3. Catalog Intelligence | Complete | CatalogService, IntentDetector, synonym resolution |
| 4. Order Tracking | Complete | OrderService, OrderCard, multi-turn auth |
| 5. Graceful Escalation | Complete | Human handoff with queue, transfer, canned script |
| 6. Return Initiation | Complete | Return eligibility, item selection, in-chat submission |

### Post-Hackathon
- Live Shopify API integration (replacing mock data sources)
- Server-side service architecture (move from browser to Shopify App backend)
- Persistent conversation storage
- Multi-store support
- Analytics dashboard for common queries
