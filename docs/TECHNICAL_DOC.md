<!-- generated-by: gsd-doc-writer -->
# Technical Document: AI Customer Support Agent for Commerce

> **Last updated:** 2026-05-18
> **Repository:** AI Customer Support Agent for Commerce (Track 4)

## 1. Architecture Overview

### 1.1 Layered Design

The system uses a browser-side layered architecture. All services run in the user's browser, loaded as ES modules. Widget mounts in the DOM at a `<div id="ai-support-widget">` placeholder.

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                         │
│  shopify-widget/src/ChatWidget.ts                            │
│  └─ DOM rendering, event binding, message history             │
├─────────────────────────────────────────────────────────────┤
│                   Orchestration Layer                         │
│  ChatWidget._generateAgentResponse()                          │
│  └─ Pipeline: SemanticRouter → OffTopicDetector →            │
│     EscalationDetector → OrderIntentDetector →                │
│     CatalogIntentDetector → PolicyService → Greeting →       │
│     Fallback                                                  │
├─────────────────────────────────────────────────────────────┤
│                   Semantic Layer (NEW in Phase 6)             │
│  ┌────────────────────────────────────────────────────┐      │
│  │ SemanticRouter (singleton)                         │      │
│  │ ├─ @huggingface/transformers (all-MiniLM-L6-v2)         │      │
│  │ ├─ classify(query, refs) → intent + confidence     │      │
│  │ ├─ Embedding cache (5-min TTL)                     │      │
│  │ └─ Lazy-load on first query                        │      │
│  └────────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────────┐      │
│  │ src/config/semantic/                               │      │
│  │ ├─ catalogIntents.ts (5-8 phrases per intent)      │      │
│  │ ├─ offTopicIntents.ts (3 clusters: products,       │      │
│  │ │                      orders, policies)           │      │
│  │ ├─ orderIntents.ts (5-8 phrases per intent)        │      │
│  │ └─ embeddings.json (pre-computed, .gitignore'd)    │      │
│  └────────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PolicyService │  │CatalogService│  │ OrderService  │       │
│  │ (policies)    │  │ (products)   │  │ (orders)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────────────┐ ┌────────────────────────────────┐ │
│  │ ResponseGrounder     │ │ CatalogIntentDetector          │ │
│  │ (grounding check)    │ │ (intent + parsing)             │ │
│  └──────────────────────┘ └────────────────────────────────┘ │
│  ┌──────────────────┐ ┌──────────────────────────────────┐   │
│  │OffTopicDetector   │ │OrderIntentDetector               │   │
│  │(off-topic guard)  │ │(order intent + parsing)          │   │
│  └──────────────────┘ └──────────────────────────────────┘   │
│  ┌──────────────────────┐ ┌───────────────────────────────┐  │
│  │RefusalResponseService│ │ OrderCard                     │  │
│  │(polite refusals)     │ │ (DOM component for orders)    │  │
│  └──────────────────────┘ └───────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐            │
│  │ ReturnService (feature-flagged)              │            │
│  │ (return intent, eligibility, submission)     │            │
│  └──────────────────────────────────────────────┘            │
│  ┌────────────────────────────┐ ┌─────────────────────────┐  │
│  │EscalationDetector          │ │EscalationStateMachine   │  │
│  │(handoff + frustration)     │ │(FSM + localStorage)     │  │
│  └────────────────────────────┘ └─────────────────────────┘  │
│  ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  │EscalationQueueSimulator  │ │EscalationTransferHandler │  │
│  │(position 1-5, refresh)   │ │(20s timeout, retry)      │  │
│  └──────────────────────────┘ └──────────────────────────┘  │
│  ┌──────────────────────────┐                                │
│  │HumanAgentSimulator       │                                │
│  │(3-message canned script) │                                │
│  └──────────────────────────┘                                │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                  │
│  ┌────────────────────┐  ┌────────────────────────────┐       │
│  │MockCatalogDataSource│  │MockOrderDataSource          │       │
│  │(7 products, 52 var.)│  │(orders with 9 statuses)    │       │
│  └────────────────────┘  └────────────────────────────┘       │
│  ┌──────────────────────────┐  ┌────────────────────────────┐ │
│  │ShopifyStorefrontDataSource│  │ShopifyOrderProxyDataSource│ │
│  │(live Storefront API)     │  │(HMAC-signed proxy client)  │ │
│  └──────────────────────────┘  └────────────────────────────┘ │
│  ┌────────────────────┐  ┌────────────────────────────────┐   │
│  │ConversationContext │  │ Synonym Config (colors.ts,     │   │
│  │Manager (5min/3turn)│  │  sizes.ts, materials.ts)      │   │
│  └────────────────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Boundaries

| Layer | Directory | Key Files | Responsibility |
|-------|-----------|-----------|----------------|
| Presentation | `shopify-widget/src/` | `ChatWidget.ts` | DOM rendering, event handling, message state |
| Orchestration | `ChatWidget.ts` | `_generateAgentResponse()` | Routes queries through service pipeline |
| Services | `src/services/` | `policyService.ts`, `catalogService.ts`, `orderService.ts`, `offTopicDetector.ts`, `responseGrounder.ts`, `refusalResponses.ts`, `catalogIntentDetector.ts`, `orderIntentDetector.ts` | Domain logic — policies, catalog, orders, guardrails |
| Data | `src/services/` | `mockCatalogData.ts`, `mockOrderData.ts`, `conversationContext.ts`, `cacheManager.ts` | Data sources, caching, context management |
| Config | `src/config/synonyms/` | `colors.ts`, `sizes.ts`, `materials.ts` | Synonym maps for natural language → canonical values |
| Semantic Config | `shopify-widget/src/config/semantic/` | `catalogIntents.ts`, `offTopicIntents.ts`, `orderIntents.ts`, `embeddings.json` | Reference phrases + pre-computed embeddings for semantic router |

### 1.3 Key Files and Their Roles

| File | Lines | Role |
|------|-------|------|
| `shopify-widget/src/ChatWidget.ts` | 440+ | Main widget — DOM creation, order support in pipeline |
| `shopify-widget/src/OrderCard.ts` | ~120 | DOM component for rich order card with timeline |
| `src/services/catalogService.ts` | 134 | Product search, variant resolution, stock check, caching |
| `src/services/catalogIntentDetector.ts` | 637 | Intent classification, option extraction, cross-turn context |
| `src/services/orderService.ts` | ~85 | Order lookup, status resolution, tracking events |
| `src/services/orderIntentDetector.ts` | ~350 | Order intent detection with keyword groups + structured parsing |
| `src/services/orderResponseFormatter.ts` | ~80 | Formats order responses with order card HTML |
| `src/services/offTopicDetector.ts` | 184 | Keyword-based off-topic detection with confidence scoring |
| `src/services/responseGrounder.ts` | 457 | Validates agent responses against actual policy data |
| `src/services/refusalResponses.ts` | 178 | Generates contextual polite refusal messages |
| `src/services/policyService.ts` | 93 | Policy data management with caching |
| `src/services/types.ts` | 210+ | All TypeScript interfaces — includes Order, OrderStatus, TrackingEvent, OrderDataSource, Escalation* types |
| `src/services/synonymResolver.ts` | 69 | Maps aliases to canonical option values |
| `src/services/escalationDetector.ts` | 64 | Keyword-based escalation and frustration detection |
| `src/services/escalationStateMachine.ts` | 142 | FSM for escalation workflow with localStorage persistence |
| `src/services/escalationQueueSimulator.ts` | 45 | Dynamic queue position (1-5) with refresh capability |
| `src/services/escalationTransferHandler.ts` | 48 | 20s transfer timeout, retry logic, email fallback |
| `src/services/escalationHumanAgent.ts` | 26 | 3-message canned script player for connected state |
| `src/services/semanticRouter.ts` | New | Singleton SemanticRouter — lazy-loads all-MiniLM-L6-v2, classify(), embedding cache |
| `shopify-widget/src/core/semanticRouter.ts` | New | Singleton SemanticRouter — lazy-loads all-MiniLM-L6-v2, classify(), embedding cache |
| `shopify-widget/src/config/semantic/catalogIntents.ts` | New | 5-8 reference phrases per catalog intent category |
| `shopify-widget/src/config/semantic/offTopicIntents.ts` | New | 3 on-topic clusters: products, orders, policies + COMPLIMENT_PHRASES |
| `shopify-widget/src/config/semantic/orderIntents.ts` | New | 5-8 reference phrases for order intent detection |
| `shopify-widget/src/config/semantic/embeddings.json` | Generated | Pre-computed 384-dim embeddings per reference phrase (`.gitignore`d) |
| `shopify-widget/scripts/generateEmbeddings.ts` | New | Build-time script — loads model, generates embeddings.json |
| `src/services/mockCatalogData.ts` | 332 | 7 products with 52 variants, stock overrides |
| `src/services/mockOrderData.ts` | ~200 | Mock orders with 9 statuses, full timeline events |
| `src/services/shopifyStorefrontDataSource.ts` | 208 | Live Shopify Storefront API integration — GraphQL product query, maps to Product/Variant types |
| `src/services/shopifyOrderProxyDataSource.ts` | 142 | HMAC-signed proxy client — SHA-256 email hash, HMAC signing, retry on 5xx |
| `src/services/conversationContext.ts` | 49 | Cross-turn context manager |
| `src/services/cacheManager.ts` | 33 | Generic TTL cache |
| `policies.md` | Example | Markdown config file with YAML frontmatter — live policy data source |
| `shopify-proxy/src/worker.ts` | New | Cloudflare Worker — HMAC verification, Shopify Admin GraphQL query, filtered status response |

## 2. AI/Deterministic Boundary

This is the most important architectural property of the system. The boundary is explicitly defined and enforced.

The system uses a **hybrid AI architecture**: in-browser semantic understanding for intent routing, then deterministic data retrieval for all responses. No LLM API calls are made — zero API cost, zero privacy exposure, zero hallucination risk.

```
User Query → SemanticRouter (MiniLM embeddings, deterministic embeddings)
           → Classified intent (semantic primary, keyword fallback)
           → Grounded Retrieval Layer (deterministic data pipeline)
           → Template-based response formatting
```

### 2.1 The AI Layer — Semantic Intent Routing (Phase 6)

**What is AI here:** In-browser sentence embeddings via `Xenova/all-MiniLM-L6-v2` (22MB, 384-dim). This is a pre-trained transformer model that converts text into numeric vectors. It runs locally in the browser — no network calls, no API keys, no data leaving the user's machine.

**What it does:** Replaces the previous keyword-only intent classification with embedding similarity matching. The pipeline:

```
User Query → SemanticRouter.classify(query, refs)
           → Embed query into 384-dim vector
           → Cosine similarity with pre-computed reference embeddings
           → Highest similarity above 0.6 threshold → classified intent
           → Below 0.6 → fall back to keyword matching
```

**SemanticRouter** (`shopify-widget/src/core/semanticRouter.ts` — new):
- Singleton shared across all detectors
- Lazy-loads model on first user query
- `classify(query, categoryRefs)` returns `{ intent: string | null, confidence: number }`
- Internal embedding cache with 5-min TTL (exact string key match)
- On model failure: silent fallback to keyword matching with one retry attempt

**Reference embeddings** (pre-computed at build time):
- `shopify-widget/src/config/semantic/catalogIntents.ts` — 5-8 phrases per catalog intent
- `shopify-widget/src/config/semantic/offTopicIntents.ts` — 3 on-topic clusters (products, orders, policies) + compliment detection
- `shopify-widget/src/config/semantic/orderIntents.ts` — 5-8 phrases for order queries
- Built via npm prebuild hook (`shopify-widget/scripts/generateEmbeddings.ts`) that loads the model and generates `embeddings.json`
- `embeddings.json` is `.gitignore`d, always regenerated

**Failure mode:** If transformer.js fails to load (network error, outdated browser), the system silently falls back to the original keyword-only detection. No user-visible error, console.error only.

### 2.2 What Is Deterministic (ZERO LLM — Data Retrieval Layer)

**The entire data retrieval pipeline uses zero LLM calls.** Every product lookup, stock check, variant resolution, order lookup, and policy lookup goes through deterministic structured code:

```
Classified Intent → CatalogService.searchProducts() (text matching)
                 → checkVariantByOptions() (exact structured lookup)
                 → formatCatalogResponse() (template-based formatting)
                 → ResponseGrounder (policy string matching)

NO LLM call anywhere in this chain.
```

**Specific deterministic components:**

1. **SemanticRouter** (intent-only) — Determines WHAT the user wants, not the answer. Uses embedding similarity, not generative AI.
2. **CatalogIntentDetector** — Now has two paths:
   - Semantic primary: `SemanticRouter.classify()` dispatches to stock_check/sizing_inquiry/product_search/variant_lookup
   - Keyword fallback: original `INTENT_GROUPS` with includes/excludes arrays if confidence < 0.6
3. **OffTopicDetector** — Gets semantic on-topic check via `SemanticRouter` with 3 reference clusters (products, orders, policies). Full keyword lists retained as fallback.
4. **OrderIntentDetector** — Semantic routing for order intent detection with keyword fallback.
5. **Option Extraction** — Unchanged. Exact string matching against product option values with synonym resolution via config files.
6. **CatalogService.checkStock()** — Unchanged. NEVER caches inventory.
7. **Response Grounding** — Unchanged. Compares agent response text against policy data strings.

**What stays purely deterministic (no semantic change):**
- CatalogService, OrderService, PolicyService — data retrieval, zero changes
- EscalationDetector — uses keywords + frustration signals by design, not semantic routing
- ReturnService — feature-flagged (disabled by default), uses keyword detection
- ResponseGrounder — policy validation unchanged

### 2.3 Why This Hybrid Approach

| Aspect | Pure Keyword (Before Phase 6) | Hybrid (After Phase 6) |
|--------|-------------------------------|------------------------|
| Intent detection | `lowerQuery.includes(keyword)` — breaks on typos | Embedding similarity — handles typos, synonyms, natural phrasing |
| Fallback | None — if no keyword matches, intent missed | Keyword fallback at 0.6 confidence threshold |
| Resilience | Brittle — new phrasing needs code changes | Robust — embeddings handle unseen variations |
| Determinism | 100% | Intent layer is probabilistic, data layer is deterministic |
| Cost | Zero | Zero (runs in-browser, no API calls) |
| Privacy | Full (browser-only) | Full (browser-only, no data leaves) |

The `_generateAgentResponse` pipeline in ChatWidget.ts now starts with semantic routing, then falls through to the deterministic data pipeline:

```
→ SemanticRouter.classify()                 (semantic intent)
→ OffTopicDetector.detectOffTopic()         (semantic on-topic check + keyword fallback)
→ OrderIntentDetector.resolveQuery()        (semantic + keyword fallback)
→ CatalogIntentDetector.resolveQuery()      (semantic + keyword fallback)
→ PolicyService.getAllPolicies()            (cached data lookup)
→ Greeting keywords                         (string includes)
→ Fallback text                             (static string)
```

## 3. Failure Handling

### 3.1 Data Source Failure (CatalogDataSource throws)

```
Scenario: Product data source throws error (network down, API unavailable)
What happens:
  CatalogService.loadProducts() → propagates the error
  CatalogIntentDetector.resolveQuery() → error propagates to ChatWidget._sendMessage()
  ChatWidget catches in try/catch (line 330-336):
    → Updates user message status to 'error'
    → Displays: "Sorry, I couldn't process that request right now. Please try again."
    → Sets isProcessing = false, re-enables input
```

Test coverage: `catalogService.test.ts` lines 500-534 — 3 tests for data source errors:
- `should propagate data source errors`
- `should re-throw errors from checkStock when data source fails`
- `should throw when loadProducts fails in checkVariantByOptions`

### 3.2 Off-Topic Detected

```
Scenario: User asks about weather, competitors, personal advice, etc.
What happens:
  OffTopicDetector.detectOffTopic() returns { isOffTopic: true, confidence: 0.8 }
  ChatWidget._generateAgentResponse() step 1 — returns early:
    RefusalResponseService.generateRefusal() produces contextual response
    Examples:
    - Weather → "I specialize in store-related assistance..."
    - Amazon → "I can only provide information about our store..."
    - Personal advice → "While I can't give personal advice..."
    - Generic short query → "Could you please provide more details..."
    - No specific category → "I'm here to help with questions about our store..."
```

### 3.3 Grounding Fails

```
Scenario: Agent response contradicts actual policy data
What happens:
  ResponseGrounder.groundResponse():
    → Checks response text against policy data field-by-field
    → Assigns confidence based on exact/approximate matches
    → If confidence < 0.5: isGrounded = false
    → Reports specific violations (e.g., "Standard shipping details do not match policy")
    → Suggests corrections ("Reference specific policy details from shipping policy")
   Note: ResponseGrounder was previously imported but unused. As of May 16, 2026,
   it is now wired into the `_generateAgentResponse()` pipeline as the final
   validation step — all responses pass through grounding before being returned.
```

### 3.4 Network Offline

```
Scenario: User's browser goes offline
What happens:
  ChatWidget._initNetworkDetection() listens for 'offline' event
  → offlineBanner unhidden: "Connection lost. Messages will send when back online."
  → Input disabled (textarea + send button)
  On 'online' event:
  → offlineBanner hidden
  → Input re-enabled
```

### 3.5 Catalog Returns No Match

```
Scenario: Product not found in catalog
What happens:
  CatalogIntentDetector.resolveQuery():
    → searchProducts() returns empty array
    → Returns { type: 'not_found', message: "Sorry, we don't carry that.", suggestions: [] }
  formatCatalogResponse():
    → Outputs the "don't carry" message
    → Currently suggestions are always empty (findSuggestions returns first 5 products)
```

### 3.6 Order Not Found / Auth Failure

```
Scenario: User provides order number that doesn't exist, or email doesn't match
What happens:
  OrderService.lookup(orderId, email):
    → Checks order exists by ID
    → If not found: returns { found: false, reason: 'not_found' }
    → If found but email doesn't match: returns { found: false, reason: 'email_mismatch' }
    → If found and email matches: returns { found: true, order }
  OrderIntentDetector.resolveOrderQuery():
    → If not_found: "I couldn't find order #1234. Please double-check the order number."
    → If email_mismatch: "The email provided doesn't match order #1234. Can you try a different email?"
    → Followed by corrective prompt: "Would you like to try again?"
```

### 3.7 Context Expired

```
Scenario: User returns to chat after 5+ minutes or exceeds 3 turns
What happens:
  CatalogIntentDetector.isContextExpired():
    → Checks elapsed time > CONTEXT_TTL_MS (300000ms = 5 min)
    → Checks turnCount >= MAX_CONTEXT_TURNS (3)
  If expired:
    → Context cleared via clearContext()
    → Returns { type: 'context_expired', message: "Your previous product inquiry has expired..." }
```

### 3.9 Return Not Eligible

```
Scenario: User wants to return an item but order is not delivered
What happens:
  ReturnService.checkEligibility():
    → OrderService.getOrderByNumber() fetches order
    → Checks order status !== 'delivered'
    → Returns { type: 'return_not_eligible', reason: 'not_delivered' }
    → Message: "Order #1234 hasn't been delivered yet. Returns are only
      available for delivered items."
```

### 3.10 API Timeout

```
Scenario: _generateAgentResponse() takes longer than 10 seconds
What happens:
  ChatWidget constructor sets this.timeoutMs = options.timeoutMs || 10000
  Note: The timeout is configured but not actively enforced in _sendMessage().
  The try/catch on line 330 catches any thrown error and shows the fallback message.
```

## 4. Testing Strategy

### 4.1 Test Architecture

```
TypeScript Source ─→ Vitest (unit/integration) ─→ 366 tests, 20 test files
Browser Widget   ─→ Playwright (E2E)          ─→ 4 spec files (12 tests)
Eval Harness     ─→ Catalog Intelligence Eval  ─→ 48 scenario eval tests
```

### 4.2 Test Files (20 suites + 3 E2E specs)

| Test File | Tests | Scope |
|-----------|-------|-------|
| `src/services/policyService.test.ts` | ~80 lines | Policy loading, caching, TTL refresh |
| `src/services/offTopicDetector.test.ts` | ~163 lines | Off-topic detection, edge cases, override logic |
| `src/services/responseGrounder.test.ts` | ~457 lines | Grounding for shipping, warranty, returns |
| `src/services/refusalResponses.test.ts` | ~178 lines | Contextual refusal generation |
| `src/services/catalogService.test.ts` | ~599 lines | Product search, variant resolution, caching, error handling |
| `src/services/catalogIntentDetector.test.ts` | ~428 lines | Intent detection, exact/partial/ambiguous, context expiry |
| `src/services/mockCatalogData.test.ts` | ~332 lines | Variant counts across all 7 products |
| `src/services/orderService.test.ts` | New | Order lookup, auth validation, status resolution |
| `src/services/orderIntentDetector.test.ts` | New | Order intent detection, multi-turn auth flow, context expiry |
| `src/services/orderResponseFormatter.test.ts` | New | Order response formatting, error messages |
| `src/services/escalationDetector.test.ts` | New | Explicit/frustration keyword detection, non-resolving counter |
| `src/services/escalationStateMachine.test.ts` | New | FSM transitions, localStorage persistence, invalid transition rejection |
| `src/services/escalationQueueSimulator.test.ts` | New | Queue position 1-5, refresh, interval updates |
| `src/services/escalationTransferHandler.test.ts` | New | 20s timeout, retry logic |
| `src/services/escalationHumanAgent.test.ts` | New | 3-message canned script sequence |
| `src/services/returnService.test.ts` | New | Return intent detection, eligibility checks, return submission |
| `shopify-widget/tests/ChatWidget.integration.test.ts` | Integration | End-to-end widget + service integration |
| `shopify-widget/tests/NetworkDetector.test.ts` | Unit | Network state detection |
| `src/services/semanticRouter.test.ts` | New | SemanticRouter model load, classify(), fallback, embedding cache, retry logic |
| `src/config/semantic/catalogIntents.test.ts` | New | Reference phrase coverage, intent classification accuracy |
| `src/tests/eval/catalogIntelligence.eval.test.ts` | ~48 eval scenarios + semantic regression | Scenario-based eval for catalog queries + full regression through semantic pipeline |

### 4.3 E2E Tests (Playwright, 4 spec files, 12 tests)

| Spec File | Tests | What It Verifies |
|-----------|-------|------------------|
| `e2e/specs/catalogQuery.spec.ts` | 3 | Widget loads, responds to catalog query, shows OOS badge, handles sizing |
| `e2e/specs/offTopic.spec.ts` | 4 | Weather, competitor, personal advice, technical support refusals |
| `e2e/specs/stockCheck.spec.ts` | 4 | In-stock badge, low stock warning, OOS badge, stock summary |
| `e2e/specs/domSnapshot.spec.ts` | 1 | Captures DOM snapshot, console errors, console warnings, and screenshot for visual review |

Playwright config: `e2e/playwright.config.ts` — builds widget via `tsc -p tsconfig.widget.json && vite build --config shopify-widget/vite.config.ts`, serves `shopify-widget/` on port 3000 via `npx serve`, 30s timeout, 1 retry, `reuseExistingServer: false`.

### 4.4 Coverage Approach

- Target: >77% coverage on `src/services/` (per STATE.md)
- Framework: Vitest with `@vitest/coverage-v8`
- Test environment: `jsdom` for DOM-dependent widget tests
- `vitest.config.ts` includes patterns: `src/**/*.test.ts`, `shopify-widget/tests/**/*.test.ts`

### 4.5 Key Testing Patterns

1. **Mock data sources** — `createMockDataSource()` in `catalogService.test.ts` tracks `loadCount` for cache verification
2. **Discriminated union type guards** — `isExact()`, `isPartial()`, `isProductOnly()` helpers verify correct ResolvedQuery type
3. **Fake timers** — `vi.useFakeTimers()` + `vi.advanceTimersByTime(310000)` for context expiry tests
4. **Error propagation** — Tests verify errors from data sources are not silently caught

## 5. Data Flow

### 5.1 End-to-End Query Trace: "is the classic hoodie in stock?"

```
Step 1: ChatWidget → DOM Event
──────────────────────────────────
  User types in textarea → Enter key → _sendMessage()
  → input disabled, message added with status 'sending'
  → Calls _generateAgentResponse("is the classic hoodie in stock?")

Step 1b: Model Load Check
──────────────────────────────────
  SemanticRouter.isLoaded()? → If first query, model is loading
  → Show "Loading AI model…" briefly
  → Queue query until model is ready
  → On model failure: fall through to keyword-only path

Step 2: SemanticRouter (NEW — Phase 6)
──────────────────────────────────
  SemanticRouter.classify("is the classic hoodie in stock?", CATALOG_REF_PHRASES)
  → Embed query into 384-dim vector
  → Compare with stock_check reference embeddings (cosine similarity)
  → stock_check confidence: 0.82 (> 0.6 threshold) ← matches strongly
  → sizing_inquiry confidence: 0.12
  → product_search confidence: 0.31
  → Result: { intent: 'stock_check', confidence: 0.82 }
  → CatalogIntentDetector receives classified intent = stock_check

Step 3: OffTopicDetector (semantic on-topic check)
──────────────────────────────────
  detectOffTopic("is the classic hoodie in stock?")
  → SemanticRouter.classify(query, ON_TOPIC_CLUSTERS)
  → Products cluster confidence: 0.85 — strongly on-topic
  → isOffTopic = false (semantic verdict, no keyword check needed)

Step 4: CatalogIntentDetector.resolveQuery() (with semantic hint)
──────────────────────────────────
  → lowerQuery = "is the classic hoodie in stock"
  → intent already classified as stock_check by SemanticRouter (confidence 0.82)
  → searchProducts("is the classic hoodie in stock"):
     extractSearchTerms → removes noise words → ["classic", "hoodie"]
     Matches "Classic Hoodie" by title
     Returns [Product{Classic Hoodie}]

Step 4: Variant Resolution
──────────────────────────────────
  → targetProduct = Classic Hoodie (single result)
  → extractOptions(Classic Hoodie, "is the classic hoodie in stock"):
     Strips product title words from query → "is the in stock"
     No option values found (no size, color, or material terms)
     Returns {} (empty options)
  → fullyResolvedCount = 0
  → Returns { type: 'product_only', intent: 'stock_check', product, variants }

Step 5: Response Formatting
──────────────────────────────────
  formatCatalogResponse("is the classic hoodie in stock?", result)
  → type is 'product_only' → renders:
    "Classic Hoodie
     A comfortable cotton-blend hoodie...
     Price: $49.99 – $59.99

     Options:
     Size: S, M, L, XL
     Color: Black, Gray, Navy
     Material: Cotton, Polyester

     Stock: 5 variants in stock, 3 low on stock, ..."

Step 6: Message Rendering
──────────────────────────────────
  ChatWidget._createMessage(formattedResponse, 'agent')
  → Creates chat bubble with header ("Support"), timestamp, content, status
  → Appends to messageList DOM
  → Scrolls to bottom
```

### 5.2 Pipeline Flow Diagram

```
User Input
    │
    ▼
┌────────────────────────────────────────────────────┐
│ SemanticRouter (NEW — Phase 6)                     │
│ ├─ Lazy-load all-MiniLM-L6-v2 (on first query)    │
│ ├─ Embed query → 384-dim vector                   │
│ ├─ Cosine similarity with pre-computed refs       │
│ ├─ Above 0.6 threshold → classified intent        │
│ ├─ Below 0.6 → keyword fallback                   │
│ └─ On model failure → silent keyword fallback     │
│                                                    │
│ Intent flows to the appropriate pipeline step:     │
│ off-topic → escalation → order → catalog → policy │
└────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────┐
│ OffTopicDetector    │──── isOffTopic? ──► RefusalResponseService ──► Response
│ (semantic on-topic  │
│  check + keyword    │
│  fallback)          │
└─────────────────────┘
    │ (not off-topic)
    ▼
┌──────────────────────────┐
│ EscalationDetector      │──── escalation active? ──► system message (offer/queue/connected)
│ ├─ detectIntent()       │──── escalation trigger ──► EscalationStateMachine ──► system message
│ ├─ nonResolvingCount    │
│ └─ isDuplicateRequest() │
└──────────────────────────┘
    │ (not escalating)
    ▼
┌──────────────────────────────┐
│ OrderIntentDetector          │──── order found ──► formatOrderResponse() ──► Response
│ (semantic + keyword fallback)│
│ ├─ classify() via SemanticRouter
│ ├─ parseOrderIdentifier()    │
│ ├─ validateEmail()           │
│ └─ orderService.lookup()     │
└──────────────────────────────┘
    │ (not order-related)
    ▼
┌──────────────────────────┐
│ ReturnService            │──── return intent? ──► checkEligibility() ──► return response
│ (feature-flagged: false) │
└──────────────────────────┘
    │ (not return)
    ▼
┌──────────────────────────────────┐
│ CatalogIntentDetector            │──── not_catalog? ──► (continue to policy)
│ (semantic + keyword fallback)    │
│ .resolveQuery()                  │
│  ├─ classify() via SemanticRouter│──── catalog found ──► formatCatalogResponse() ──► Response
│  ├─ searchProducts()             │
│  ├─ extractOptions()             │
│  ├─ checkVariantByOptions        │
│  └─ context management           │
└──────────────────────────────────┘
    │ (not catalog)
    ▼
┌─────────────────────┐
│ PolicyService       │──── has policy? ──► format policy response ──► Response
│ .getAllPolicies()   │
│ .getPolicy(type)    │
└─────────────────────┘
    │ (no policy match)
    ▼
┌─────────────────────┐
│ Greeting detection  │──── "hello"/"hi" ──► greeting response
└─────────────────────┘
    │
    ▼
  Fallback text
```

## 6. Plugin Architecture

The project is built as an OpenCode plugin (ECC - Everything Claude Code) that extends the OpenCode host with specialized agents, commands, skills, and tools.

### 6.1 OpenCode Plugin Registration

**`.opencode/index.ts`** exports the plugin interface:

```typescript
export { ECCHooksPlugin, default } from "./plugins/index.js"
export const VERSION = "1.6.0"
export const metadata = {
  name: "ecc-universal",
  features: {
    agents: 13,
    commands: 31,
    skills: 37,
    hookEvents: ["file.edited", "tool.execute.before", ...],
    customTools: ["run-tests", "check-coverage", "security-audit", ...],
  },
}
```

### 6.2 Command Registration

Commands are defined in `.opencode/commands/` as markdown files and registered in `opencode.json`:

| Command | Agent | Purpose |
|---------|-------|---------|
| `/plan` | planner | Create implementation plans |
| `/tdd` | tdd-guide | Enforce TDD workflow |
| `/code-review` | code-reviewer | Code quality review |
| `/security` | security-reviewer | Security audit |
| `/build-fix` | build-error-resolver | Fix TypeScript errors |
| `/e2e` | e2e-runner | Run Playwright E2E tests |
| `/verify` | (direct) | Run verification loop |
| `/update-docs` | doc-updater | Update documentation |

### 6.3 Skill Registration

Skills are loaded from `../skills` (relative to `.opencode/`):

- `tdd-workflow` — TDD enforcement with 80%+ coverage
- `security-review` — Security patterns and checklist
- `coding-standards` — TypeScript code conventions
- `e2e-testing` — Playwright patterns
- `verification-loop` — Comprehensive verification system
- `api-design`, `frontend-patterns`, `backend-patterns` — Domain patterns
- `strategic-compact` — Context management
- `eval-harness` — Evaluation-driven development

### 6.4 Agent Configuration

`opencode.json` defines 16+ specialized sub-agents with specific models, prompts, and tool permissions:

```json
{
  "agent": {
    "build": { "mode": "primary", "model": "claude-sonnet-4-5", "tools": { ... } },
    "planner": { "mode": "subagent", "model": "claude-opus-4-5", "prompt": "{file:prompts/agents/planner.txt}" },
    "code-reviewer": { "mode": "subagent", "model": "claude-opus-4-5" },
    "tdd-guide": { "mode": "subagent", "model": "claude-opus-4-5" },
    "e2e-runner": { "mode": "subagent", "model": "claude-opus-4-5" }
  }
}
```

### 6.5 ChatWidget Service Pipeline (Plugin-Independent)

The actual AI Customer Support Agent services (`src/services/`) are **not OpenCode plugins** — they are standalone TypeScript modules that run in the browser. They follow the same architectural principles (modular, typed, testable) but do not depend on the OpenCode runtime. The OpenCode plugin system was used for development tooling (TDD, review, testing), not for the customer-facing widget.

## 7. Type System

### 7.1 Discriminated Unions

The most important type in the system is `ResolvedQuery` — a discriminated union with 8 variants:

```typescript
type ResolvedQuery =
  | { type: 'exact'; intent: CatalogIntent; product: Product; variant: Variant; stock: StockInfo }
  | { type: 'partial'; intent: CatalogIntent; product: Product; options: Record<string, string>; candidates: Variant[] }
  | { type: 'product_only'; intent: CatalogIntent; product: Product; variants: Variant[] }
  | { type: 'search_results'; intent: 'product_search'; products: Product[]; totalCount: number }
  | { type: 'ambiguous'; intent: CatalogIntent; message: string; possibleOptions: Record<string, string[]> }
  | { type: 'not_found'; intent: CatalogIntent; message: string; suggestions: Product[] }
  | { type: 'context_expired'; message: string }
  | { type: 'not_catalog'; reason: string };
```

Each variant represents a distinct UX state. TypeScript's type narrowing ensures exhaustive handling in `formatCatalogResponse()` via the `switch(result.type)` statement (lines 32-108 of `catalogIntentDetector.ts`).

### 7.2 Data Source Interface

```typescript
export interface CatalogDataSource {
  loadProducts(): Promise<Product[]>;
}
```

Implemented by `MockCatalogDataSource` (for testing/development) with an interface designed for future `ShopifyCatalogDataSource`.

## 8. Caching Strategy

| Data | Cache TTL | Bypass | File |
|------|-----------|--------|------|
| Product catalog | 2 minutes (120000ms) | `clearCache()` method | `catalogService.ts` |
| Inventory/Stock | **NEVER cached** | Always hits data source | `catalogService.ts` line 75-85 |
| Policies | 5 minutes (300000ms) | `clearCache()` method | `policyService.ts` |
| Conversation context | 5 minutes (300000ms) | 3-turn max, `clearContext()` | `catalogIntentDetector.ts` |
| Generic cache | Configurable per key | `CacheManager.delete()` | `cacheManager.ts` |

## 9. Build Pipeline

### 9.0 Embedding Generation (Prebuild Hook)

Before the widget bundle is built, a prebuild hook generates reference embeddings for the semantic router:

```
npm run build → prebuild hook → shopify-widget/scripts/generateEmbeddings.ts
   → Loads @huggingface/transformers (Xenova/all-MiniLM-L6-v2)
   → Reads reference phrases from shopify-widget/src/config/semantic/*.ts
   → Pre-computes 384-dim embeddings for each phrase
   → Writes shopify-widget/src/config/semantic/embeddings.json

If generation fails → build fails (D-16)
embeddings.json is .gitignore'd → always regenerated (D-17, D-18)
```

The embedding generation script:
```javascript
// scripts/generate-embeddings.js — simplified pseudocode
import { pipeline } from '@huggingface/transformers';
const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const refs = loadReferencePhrases(); // from src/config/semantic/*.ts
const embeddings = {};
for (const [intent, phrases] of Object.entries(refs)) {
  embeddings[intent] = {
    phrases,
    embeddings: await Promise.all(phrases.map(p => model(p)))
  };
}
writeFile('src/config/semantic/embeddings.json', JSON.stringify(embeddings));
```

### 9.1 Widget Bundle (Vite Library Mode)

The chat widget (`shopify-widget/`) is built as an IIFE bundle via Vite's library mode:

```
TypeScript source (ChatWidget.ts) → tsc compilation → JS output → Vite build → dist/widget.js (IIFE)
```

**Configuration** (`shopify-widget/vite.config.ts`):
- **Entry:** Compiled `ChatWidget.js` (ES module with default export)
- **Output:** `dist/widget.js` — IIFE bundle that registers `ChatWidget` in the global scope
- **Format:** `iife` — self-executing function, no module loader required
- **Entry filename:** `widget.js`

**Why IIFE instead of ESM:**

| Aspect | ES Module (previous) | IIFE (current) |
|--------|---------------------|----------------|
| Script tag | `<script type="module" src="...">` | `<script src="...">` |
| Browser support | Requires modern browsers (type=module) | All browsers |
| CORS | Requires server with correct MIME types | No CORS issues |
| Global access | Not available outside module scope | `window.ChatWidget` available |
| Compatibility | Fails in older Shopify themes | Works everywhere |

The `index.html` loads the IIFE bundle via `<script src="dist/widget.js"></script>` and instantiates `new ChatWidget()` on `DOMContentLoaded`.

### 9.2 E2E Test Build Pipeline

Playwright E2E tests require a built widget before the server starts. The `webServer` command in `e2e/playwright.config.ts` runs three steps sequentially:

```
npx tsc -p tsconfig.widget.json    # 1. Compile TS → JS
npx vite build ...                  # 2. Bundle IIFE widget
npx serve shopify-widget -l 3000   # 3. Serve static files
```

Key settings:
- `reuseExistingServer: false` — ensures a fresh build every test run
- `port: 3000` — matches `baseURL`
- `timeout: 60000` — 60s for the full build + serve pipeline

## 10. Phase 7: Security & Live Data Architecture

### 10.1 Overview

Phase 7 moves sensitive operations behind a serverless backend proxy and connects catalog/policy data to live Shopify APIs. This addresses two critical production-readiness gaps: client-side data exposure (JUDGE-04) and hardcoded static arrays (JUDGE-05, JUDGE-06).

### 10.2 Cloudflare Workers Proxy

The `shopify-proxy/` directory is a standalone Cloudflare Workers project:

```
shopify-proxy/
├── package.json
├── wrangler.toml
├── .env.example
└── src/
    └── worker.ts
```

The Worker serves a single endpoint `POST /api/order-lookup`:

1. **HMAC verification** — Uses `crypto.subtle.verify()` (constant-time) to validate the request signature
2. **Timestamp validation** — 5-minute window prevents replay attacks
3. **Admin GraphQL query** — Fetches order status + timeline via Shopify Admin API
4. **Filtered response** — Returns only `{ found, status, estimatedDelivery, timeline }`

**Request contract:**
```json
{ "orderNumber": 1001, "emailHash": "abc...64chars", "timestamp": 1700000000, "hmac": "def...64chars" }
```

**Response contract (success):**
```json
{ "found": true, "status": "shipped", "estimatedDelivery": "2026-05-18", "timeline": [...] }
```

**Error codes:** `not_found`, `email_mismatch`, `proxy_error`, `invalid_hmac`, `invalid_request`

### 10.3 Live Data Sources

#### ShopifyStorefrontDataSource (`src/services/shopifyStorefrontDataSource.ts`)

Implements `CatalogDataSource` by querying the Shopify Storefront API's `products()` GraphQL endpoint. Products queried with variants, prices, options, and images. Maps API response to the existing `Product`/`Variant` types.

**Key properties:**
- `storeDomain` normalized (strips `https://` and trailing slashes)
- Optional `storefrontToken` sent as `X-Shopify-Storefront-Access-Token` header
- API version `2026-04`

#### ShopifyOrderProxyDataSource (`src/services/shopifyOrderProxyDataSource.ts`)

Implements `OrderDataSource` by HMAC-signing requests and sending them to the Cloudflare Worker proxy.

**Key properties:**
- SHA-256 hashes the user's email for request signing
- HMAC-SHA256 signs `orderNumber + emailHash + timestamp`
- Retry logic: 1 retry after 2s delay on 5xx responses
- Stub methods `getOrder()` and `getOrdersByEmail()` return null/empty (not supported via proxy)

### 10.4 PolicyService with Live Fetch

`PolicyService` (`src/services/policyService.ts`) now accepts options:

```typescript
interface PolicyServiceOptions {
  policyUrl?: string;    // default: './policies.md'
  useMockData?: boolean; // default: true
}
```

- **`useMockData: true`** — Returns existing hardcoded mock policies (unchanged behavior)
- **`useMockData: false`** — Fetches markdown from `policyUrl`, parses YAML frontmatter, maps to `PolicyData`
- **Frontmatter parser** — Handles nested section keys (e.g., `shipping.standard`), arrays (`["a", "b"]`), booleans (`true`/`false`), and numbers
- **Failure mode** — Throws Error with fallback text "Please check our store policies for the most current information." (D-13)

Example `policies.md` at project root:
```markdown
---
shipping:
  standard: "5-7 business days"
  express: "2-3 business days"
  free_threshold: 50
return_window_days: 30
warranty_months: 12
---
# Store Policies
```

### 10.5 ChatWidget Options Update

`ChatWidgetOptions` extended with live data source options:

```typescript
interface ChatWidgetOptions {
  // ... existing options ...
  proxyUrl?: string;          // URL to Cloudflare Worker
  hmacSecret?: string;         // Shared HMAC secret
  policyUrl?: string;          // URL to policies.md (default: ./policies.md)
  storeDomain?: string;        // Shopify store domain for Storefront API
  storefrontToken?: string;    // Optional Storefront API access token
  dataSource?: {
    catalog?: 'mock' | 'live';
    order?: 'mock' | 'live';
    policy?: 'mock' | 'live';
  };
}
```

**Data source selection logic:**
- Default (`dataSource` not set or `'mock'`): Uses `MockCatalogDataSource`, `MockOrderDataSource`, and mock PolicyService
- `catalog: 'live'`: Creates `ShopifyStorefrontDataSource` (requires `storeDomain`)
- `order: 'live'`: Creates `ShopifyOrderProxyDataSource` (requires `proxyUrl`, `hmacSecret`)
- `policy: 'live'`: PolicyService uses `useMockData: false` (requires `policyUrl`)
- Silent by design (D-14) — no UI indicator of data source mode

### 10.6 Error Handling Per Data Source

| Source | Failure Behavior |
|--------|-----------------|
| Order lookup | Retry once (2s delay), then return null |
| Catalog | Propagates error (caught by ChatWidget try/catch) |
| Policy | Throws fallback text: "Please check our store policies..." |
| Data source mode | Silent — no user-facing indication (D-14) |

### 10.7 HMAC Request Authentication (Browser-Side)

Widget signs requests with a shared secret before sending to proxy:

```typescript
async function signRequest(payload, secret): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```
