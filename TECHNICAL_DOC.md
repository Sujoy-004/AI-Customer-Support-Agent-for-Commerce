<!-- generated-by: gsd-doc-writer -->
# Technical Document: AI Customer Support Agent for Commerce

> **Last updated:** 2026-05-16
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
│  └─ Pipeline: OffTopicDetector → OrderIntentDetector →        │
│     CatalogIntentDetector → PolicyService → Greeting →        │
│     Fallback                                                   │
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
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                  │
│  ┌────────────────────┐  ┌────────────────────────────┐       │
│  │MockCatalogDataSource│  │MockOrderDataSource          │       │
│  │(7 products, 52 var.)│  │(orders with 9 statuses)    │       │
│  └────────────────────┘  └────────────────────────────┘       │
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

### 1.3 Key Files and Their Roles

| File | Lines | Role |
|------|-------|------|
| `shopify-widget/src/ChatWidget.ts` | 417+ | Main widget — DOM creation, order support now in pipeline |
| `shopify-widget/src/OrderCard.ts` | New | DOM component for rich order card with timeline |
| `src/services/catalogService.ts` | 134 | Product search, variant resolution, stock check, caching |
| `src/services/catalogIntentDetector.ts` | 637 | Intent classification, option extraction, cross-turn context |
| `src/services/orderService.ts` | New | Order lookup, status resolution, tracking events |
| `src/services/orderIntentDetector.ts` | New | Order intent detection with keyword groups + structured parsing |
| `src/services/offTopicDetector.ts` | 184 | Keyword-based off-topic detection with confidence scoring |
| `src/services/responseGrounder.ts` | 457 | Validates agent responses against actual policy data |
| `src/services/refusalResponses.ts` | 178 | Generates contextual polite refusal messages |
| `src/services/policyService.ts` | 93 | Policy data management with caching |
| `src/services/types.ts` | 126+ | All TypeScript interfaces — now includes Order, OrderStatus, TrackingEvent, OrderDataSource |
| `src/services/synonymResolver.ts` | 69 | Maps aliases to canonical option values |
| `src/services/mockCatalogData.ts` | 332 | 7 products with 52 variants, stock overrides |
| `src/services/mockOrderData.ts` | New | Mock orders with 9 statuses, full timeline events |
| `src/services/conversationContext.ts` | 49 | Cross-turn context manager |
| `src/services/cacheManager.ts` | 33 | Generic TTL cache |

## 2. AI/Deterministic Boundary

This is the most important architectural property of the system. The boundary is explicitly defined and enforced.

### 2.1 What Is Deterministic (ZERO LLM)

**The entire Phase 3 catalog pipeline uses no LLM calls.** Every step is keyword-based, rule-based, or structured code:

```
User Query → OffTopicDetector (keyword match)
           → CatalogIntentDetector.resolveQuery() (keyword intent pre-filter)
             → extractSearchTerms() (noise word removal)
             → searchProducts() (text matching)
             → extractOptions() (option value matching with synonym resolution)
             → checkVariantByOptions() (exact structured lookup)
             → formatCatalogResponse() (template-based formatting)

NO LLM call anywhere in this chain.
```

**Specific deterministic components:**

1. **OffTopicDetector** (`src/services/offTopicDetector.ts`):
   - 50 on-topic keywords vs 51 off-topic keywords
   - Confidence scoring: `0.5 + offTopicMatches * 0.1` (capped at 0.9)
   - On-topic override: `>= 2 onTopicMatches → confidence = 0.5 - onTopicMatches * 0.1`

2. **CatalogIntentDetector** (`src/services/catalogIntentDetector.ts`):
   - Intent classification: `INTENT_GROUPS` with includes/excludes arrays
   - `stock_check`: matches `['stock', 'available', 'in stock', 'backorder', 'restock', 'inventory', 'how many', 'still have']`
   - `sizing_inquiry`: matches `['size', 'sizing', 'fit', 'measurement', 'dimension', 'small', 'medium', ...]`
   - `product_search`: matches `['carry', 'sell', 'product', 'looking for', 'got any', 'do you have', ...]`
   - Best-score wins: highest keyword match count determines intent

3. **Option Extraction**:
   - Exact string matching against product option values
   - Synonym resolution via config files: `colors.ts` (7 canonical + 37 aliases), `sizes.ts` (6 canonical + 14 aliases), `materials.ts` (6 canonical + 13 aliases)
   - No embeddings, no fuzzy matching, no LLM fallback

4. **CatalogService.checkStock()**:
   - `src/services/catalogService.ts` line 75-85: **NEVER caches inventory** — always fetches fresh from data source
   - Product catalog cached at 2-min TTL (`CACHE_TTL_MS = 120000`)
   - Stock is explicitly excluded from cache — every stock check hits the data source

5. **Response Grounding**:
   - `ResponseGrounder.groundResponse()` compares agent response text against policy data strings
   - Confidence threshold: `>= 0.5` for grounded, `>= 0.15` for "approximate"
   - Reports exact violations when response contains values that don't match policy
   - Policy type detection via keyword frequency counting with tie-breaking

### 2.2 What Uses AI (and How)

**Zero generative AI is used.** The only thing approaching "AI" is intent classification, which is entirely keyword-based. There are:

- No LLM API calls
- No prompt engineering
- No embedding lookups
- No vector search
- No generative response construction

The `_generateAgentResponse` pipeline in ChatWidget.ts is a pure deterministic decision tree:

```
→ OffTopicDetector.detectOffTopic()       (keyword match)
→ OrderIntentDetector.resolveOrderQuery() (keyword + structured parse)
→ CatalogIntentDetector.resolveQuery()    (keyword + structured parse) 
→ PolicyService.getAllPolicies()          (cached data lookup)
→ Greeting keywords                       (string includes)
→ Fallback text                           (static string)
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
  Note: Currently ResponseGrounder is imported in ChatWidget but its output is not
  used to block or modify responses — this is a known gap.
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

### 3.8 API Timeout

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
TypeScript Source ─→ Vitest (unit/integration) ─→ 201 tests, 10 files
Browser Widget   ─→ Playwright (E2E)          ─→ 3 spec files
Eval Harness     ─→ Catalog Intelligence Eval  ─→ 20 scenario eval tests
```

### 4.2 Test Files (10 total)

| Test File | Tests | Scope |
|-----------|-------|-------|
| `src/services/policyService.test.ts` | ~80 lines | Policy loading, caching, TTL refresh |
| `src/services/offTopicDetector.test.ts` | ~163 lines | Off-topic detection, edge cases, override logic |
| `src/services/responseGrounder.test.ts` | ~457 lines | Grounding for shipping, warranty, returns |
| `src/services/refusalResponses.test.ts` | ~178 lines | Contextual refusal generation |
| `src/services/catalogService.test.ts` | ~599 lines | Product search, variant resolution, caching, error handling |
| `src/services/catalogIntentDetector.test.ts` | ~428 lines | Intent detection, exact/partial/ambiguous, context expiry |
| `src/services/mockCatalogData.test.ts` | ~332 lines | Variant counts across all 7 products |
| `shopify-widget/tests/ChatWidget.integration.test.ts` | Integration | End-to-end widget + service integration |
| `shopify-widget/tests/NetworkDetector.test.ts` | Unit | Network state detection |
| `src/tests/eval/catalogIntelligence.eval.test.ts` | ~20 eval scenarios | Scenario-based eval for catalog queries |

### 4.3 E2E Tests (Playwright, 3 spec files)

| Spec File | Tests | What It Verifies |
|-----------|-------|------------------|
| `e2e/specs/catalogQuery.spec.ts` | 3 | Widget loads, responds to catalog query, shows OOS badge, handles sizing |
| `e2e/specs/offTopic.spec.ts` | 4 | Weather, competitor, personal advice, technical support refusals |
| `e2e/specs/stockCheck.spec.ts` | 4 | In-stock badge, low stock warning, OOS badge, stock summary |

Playwright config: `e2e/playwright.config.ts` — serves `shopify-widget/` on port 3000 via `npx serve`, 30s timeout, 1 retry.

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

Step 2: OffTopicDetector
──────────────────────────────────
  detectOffTopic("is the classic hoodie in stock?")
  → lowerQuery = "is the classic hoodie in stock"
  → OFF_TOPIC_KEYWORDS check: "stock" matches NO off-topic keywords
  → ON_TOPIC_KEYWORDS check: "stock", "product" → 2 matches
  → Since ≥2 on-topic matches, isOffTopic = false, confidence = 0.3
  → Returns { isOffTopic: false, ... }

Step 3: CatalogIntentDetector.resolveQuery()
──────────────────────────────────
  → lowerQuery = "is the classic hoodie in stock"
  → isContextExpired? No (fresh context)
  → hasStrongExclusionKeywords? "stock" is not in EXCLUSION_KEYWORDS → false
  → detectIntent("is the classic hoodie in stock"):
     stock_check includes: "stock" → match, "available" → no match
     Score: stock_check = 1, sizing_inquiry = 0, product_search = 1 ("product")
     Best: stock_check (first tied)
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
┌─────────────────────┐
│ OffTopicDetector    │──── isOffTopic? ──► RefusalResponseService ──► Response
└─────────────────────┘
    │ (not off-topic)
    ▼
┌──────────────────────────┐
│ OrderIntentDetector      │──── order found ──► formatOrderResponse() ──► Response
│ ├─ detectOrderIntent()   │
│ ├─ parseOrderIdentifier()│
│ ├─ validateEmail()       │
│ └─ orderService.lookup() │
└──────────────────────────┘
    │ (not order-related)
    ▼
┌──────────────────────────┐
│ CatalogIntentDetector    │──── not_catalog? ──► (continue to policy)
│ .resolveQuery()          │
│  ├─ detectIntent()       │──── catalog found ──► formatCatalogResponse() ──► Response
│  ├─ searchProducts()     │
│  ├─ extractOptions()     │
│  ├─ checkVariantByOptions│
│  └─ context management   │
└──────────────────────────┘
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
