<!-- generated-by: gsd-doc-writer -->
# Decision Log

> A running record of architectural, product, and design decisions for the AI Customer Support Agent for Commerce.
> Format: `YYYY-MM-DD: Decision Title` — Considered / Chose / Because.

---

## 2026-05-14: Berkeley Mono Typography, Flat Cream Canvas, Hairline Borders

**Considered:**
- Using the OpenCode brand design system (Berkeley Mono monospaced font, `#fdfcfc` cream canvas, hairline borders, ASCII bracket markers) for the chat widget
- Building a conventional chat UI with rounded corners, shadows, sans-serif fonts, and gradient backgrounds
- Using a 3rd-party chat widget library (Intercom-style, Zendesk-style)

**Chose:** The OpenCode design system — Berkeley Mono for all text, `#fdfcfc` cream canvas background, 1px `rgba(15,0,0,0.12)` hairline borders, 4px border radius on interactive elements, ASCII `[+]`/`[-]` bracket markers for toggle button, no shadows or gradients.

**Because:** This is an Agentic Commerce Hackathon submission using the Antigravity Skills stack, which itself derives from OpenCode. Using the same design language creates visual coherence with the broader ecosystem. The monospaced-only constraint forces simplicity — there's nowhere to hide visual complexity behind decorative flourishes. The bracket markers as toggle buttons (`[+] Support` / `[-] Support`) are instantly recognizable and on-brand. DESIGN.md (lines 5, 227-238) specifies all tokens precisely.

**Tradeoff:** Berkeley Mono is a paid commercial font. Open-source substitutes (JetBrains Mono, IBM Plex Mono) are needed for production deployment. The 100% monospaced constraint means long messages take more horizontal space than proportional fonts would.

---

## 2026-05-14: No Welcome Message (D-14)

**Considered:**
- Showing a welcome message on widget open: "Hello! How can I help you today?"
- Showing no welcome message — widget opens to an empty message list

**Chose:** No welcome message. The widget opens to a blank message area with the textarea focused, ready for typing.

**Because:** A welcome message forces the user to dismiss or ignore it before they can type their real question. It adds friction to the first interaction. Per the Phase 1 planning document (D-14 in 01-CONTEXT): "Widget opens clean. No salutation. No 'How can I help you today?' — the user's first character is already an answer." The input is focused and ready; the cursor position is the welcome.

**Tradeoff:** First-time users may be briefly confused by the empty widget. Mitigated by the placeholder text "Type a message..." and the visible input area.

---

## 2026-05-15: Keyword-Based Off-Topic Detection vs NLP Approach

**Considered:**
- NLP/ML approach: train a classifier (or use an LLM) to determine if queries are on-topic vs off-topic
- Keyword-based approach: maintain two lists (ON_TOPIC_KEYWORDS with 50 terms, OFF_TOPIC_KEYWORDS with 51 terms) with confidence scoring and override logic
- Hybrid approach: keyword pre-filter with LLM fallback for ambiguous cases

**Chose:** Pure keyword-based detection with confidence scoring and on-topic override logic.

**Because:**
- Predictable behavior — keywords define exactly what is on/off topic with no ambiguity
- Zero API cost — no LLM calls per query
- Testable — each keyword can be unit-tested for correct classification
- Override logic handles the real edge case: queries containing both on-topic and off-topic keywords (e.g., "Amazon shipping policy" — on-topic keywords "shipping" + "policy" override "Amazon" off-topic match)
- Off-topic suggestions are contextual: if weather keywords detected, suggestion mentions "latest products"; if competitor keywords, suggestion mentions "our unique features"

**Tradeoff:** Cannot detect novel off-topic categories. Adding a new off-topic category requires code changes. The list is finite and needs maintenance.

Source: `src/services/offTopicDetector.ts` lines 26-73.

---

## 2026-05-15: Interface-First PolicyService with Caching

**Considered:**
- Inline policy data in a constant file
- PolicyService with async loading and TTL-based caching
- PolicyService with live Shopify Admin API fetch

**Chose:** PolicyService class with async `loadPolicies()` method, 5-minute TTL cache, and a mock implementation ready for replacement with a live API client.

**Because:** The async interface (`loadPolicies(): Promise<PolicyData>`) lets the same class be swapped from mock data → Shopify Admin API without changing any consumer code. The 5-minute TTL balances freshness with load reduction — policies change rarely but shouldn't be cached for hours during a hackathon demo. The `PolicyData` interface (`src/services/types.ts` lines 9-30) defines the exact shape: shipping (standard, express, international, freeShippingThreshold, processingTime), warranty (standardPeriod, extendedOptions, coverageDetails, claimProcess), returns (returnWindow, conditionRequirements, refundMethod, exchangePolicy, restockingFee).

**Tradeoff:** Mock data is hardcoded — not a live Shopify integration. No error handling for API fetch failures in the mock.

Source: `src/services/policyService.ts`, `src/services/types.ts`.

---

## 2026-05-15: Hybrid Intent Classification — Keyword Pre-Filter + Structured Parsing (No LLM)

**Considered:**
- Pure LLM intent classification: "Classify this query into stock_check/sizing_inquiry/product_search/variant_lookup"
- Pure keyword matching: check for specific words to determine intent
- Hybrid: keyword pre-filter to classify intent, then structured parsing to extract products, options, and values

**Chose:** Hybrid approach — keyword pre-filter with structured parsing. No LLM involvement.

**Because:**
- **Zero hallucination risk** — the most important design constraint. An LLM might classify "can I return the hoodie" as a product query and respond with catalog data instead of policy info.
- **Deterministic intent groups** — `INTENT_GROUPS` defines includes/excludes per intent. For example, `stock_check` includes "stock", "available", "in stock", "backorder", "restock" but excludes "return", "refund", "exchange". This prevents catalog intents from leaking into policy workflows.
- **Transparent** — every classification is traceable to a matching keyword.
- **Testable** — each intent group's keyword set has dedicated tests.

**Tradeoff:** Cannot handle novel phrasing that doesn't include any of the keyword terms. For example, "are you well-stocked on hoodies right now?" might not trigger stock_check intent because "well-stocked" is not in the keyword list.

Source: `src/services/catalogIntentDetector.ts` lines 146-170.

---

## 2026-05-15: Synonym Mapping for Variant Matching (Not Fuzzy/Embedding)

**Considered:**
- Fuzzy string matching (Levenshtein distance) for variant option values
- Embedding-based similarity search
- Synonym mapping: explicit canonical → aliases tables for sizes, colors, materials

**Chose:** Explicit synonym mapping with config files.

**Because:**
- **Predictable** — "navy" will always map to "Blue" because `COLOR_SYNONYM_TABLE` explicitly defines `{ canonical: 'Blue', aliases: ['navy', 'navy blue', 'royal', 'royal blue', ...] }`. No false positives.
- **Configurable** — synonym tables are standalone config files (`src/config/synonyms/colors.ts`, `sizes.ts`, `materials.ts`), not embedded in business logic.
- **Small vocabulary** — sizes (6 entries), colors (7 entries), materials (6 entries). The total alias count is ~64. Embeddings would be absurd overkill.
- **Testable** — `normalizeOptionValue()` resolves "m" → "Medium", "charcoal" → "Gray", "poly" → "Polyester" with unit-verifiable logic.

**Tradeoff:** Does not handle misspellings ("meduim" → Medium would fail). Does not handle new colors/sizes/materials without config updates.

Source: `src/config/synonyms/colors.ts` (37 lines), `sizes.ts` (33 lines), `materials.ts` (33 lines), `src/services/synonymResolver.ts` (69 lines).

---

## 2026-05-15: 2-Min Catalog Cache, NEVER Cache Inventory

**Considered:**
- Cache everything (products + inventory) for 5 minutes
- Cache products only, never inventory
- No caching at all

**Chose:** Product catalog cached at 2-minute TTL. Inventory/stock checks ALWAYS hit the data source (never cached).

**Because:**
- Product data (titles, descriptions, options, prices) changes infrequently. A 2-minute cache prevents repeated data source calls for the same products.
- Inventory changes constantly (other customers are buying). Caching stock would produce stale "in stock" responses — which is a hallucination-equivalent failure for a store support agent.
- `checkStock()` explicitly bypasses the cache by calling `this.dataSource.loadProducts()` directly instead of `this.loadProducts()`.
- Tested in `catalogService.test.ts` "should never cache inventory" test (lines 434-469) which verifies that `checkStock` increments `loadCount` on every call even after a cached `loadProducts`.

**Tradeoff:** Stock checks are slower than product lookups since they always fetch fresh data. Acceptable for real-time accuracy.

Source: `src/services/catalogService.ts` lines 16 (CACHE_TTL_MS = 120000), 75-85 (checkStock bypasses cache).

---

## 2026-05-15: Cross-Turn Context with 5min/3turn Expiry

**Considered:**
- No cross-turn context (each query is independent)
- Infinite context (remember everything forever)
- Bounded context: 5-minute TTL + 3-turn max

**Chose:** Bounded context — 5-minute time-to-live OR 3-turn maximum, whichever expires first.

**Because:**
- Users naturally refine queries across turns: "classic hoodie" → "in black" → "what about large"
- Without context, "what about large" would be treated as a standalone query about a "large" product (not found)
- Context must expire eventually — infinite context would confuse customers who return after a gap
- 3 turns feels natural: initial query + 2 refinements
- 5 minutes matches typical attention span for a support interaction
- Tested explicitly: `catalogIntentDetector.test.ts` has tests for context merge (lines 240-268), 5-min expiry via `vi.advanceTimersByTime(310000)` (lines 270-277), and 3-turn expiry (lines 356-377)

**Tradeoff:** After 3 turns, the user sees "Your previous product inquiry has expired" — which may be confusing if they're mid-conversation. Mitigated by the fact that most variant resolutions happen within 1-2 turns.

Source: `src/services/catalogIntentDetector.ts` lines 141-142, 397-423.

---

## 2026-05-15: Mock Data First, CatalogDataSource Interface for Swappable Live API

**Considered:**
- Build directly against Shopify Admin API (live integration from day one)
- Build mock data first, then add live API integration later
- Use a 3rd-party Shopify client library

**Chose:** Mock data first with a `CatalogDataSource` interface for future live API swapping.

**Because:**
- Shopify API access requires authentication setup (API keys, scopes, OAuth) — adding time and complexity to the hackathon
- The `CatalogDataSource` interface is 1 method: `loadProducts(): Promise<Product[]>`. Both `MockCatalogDataSource` and a future `ShopifyCatalogDataSource` implement the same contract.
- The mock data provides 7 products with 52 variants across 3 categories (clothing, accessories), with realistic stock overrides (in-stock, low-stock, out-of-stock, backordered). This covers all variant resolution scenarios during development.
- Development and testing can proceed without network calls, making tests faster and more reliable.

**Tradeoff:** Judges will see mock data in the demo, not live Shopify data. The product data is representative but not real. Future `ShopifyCatalogDataSource` must parse Shopify's GraphQL response into the `Product[]` shape.

Source: `src/services/types.ts` lines 124-126 (`CatalogDataSource` interface), `src/services/mockCatalogData.ts` lines 321-330 (`MockCatalogDataSource` class).

---

## 2026-05-15: Discriminated Union Types for ResolvedQuery

**Considered:**
- Return a single `CatalogResult` type with nullable fields (`product?: Product`, `variant?: Variant`, etc.)
- Return a discriminated union with 8 specific variants
- Return separate functions for each resolution path

**Chose:** Discriminated union with 8 variants: `exact`, `partial`, `product_only`, `search_results`, `ambiguous`, `not_found`, `context_expired`, `not_catalog`.

**Because:**
- Each variant has exactly the fields it needs — no null checks needed
- TypeScript's `switch(result.type)` narrowing ensures exhaustive handling (verified by `formatCatalogResponse`)
- Impossible states are impossible at compile time: an `exact` result always has `variant`, `product`, and `stock`; a `not_found` result never does
- The type system documents all possible conversation states in one place

**Tradeoff:** 8 variants add complexity to the type definition and require type guard functions (`isExact()`, `isPartial()`, etc.) in tests.

Source: `src/services/catalogIntentDetector.ts` lines 8-16 (type definition), 31-108 (exhaustive switch handler).

---

## 2026-05-15: Playwright E2E over Vitest-Only Approach

**Considered:**
- Vitest only (all testing through Vitest with jsdom)
- Playwright for E2E only (browser-based integration tests)
- Cypress for E2E
- Combination: Vitest (unit/integration) + Playwright (E2E)

**Chose:** Both Vitest and Playwright — Vitest for 201 unit/integration tests, Playwright for 3 E2E spec files (11 test scenarios).

**Because:**
- Vitest cannot test actual browser behavior (DOM rendering, network events, widget lifecycle) — jsdom is a simulation
- Playwright tests verify widget DOM structure, message rendering, and real text content in a browser context
- The E2E tests serve as smoke tests: they verify the widget mounts, responds to queries, and handles off-topic refusals correctly at the browser level
- Per AGENTS.md requirement: "Playwright NOT set up — only Vitest exists. E2E tests are required." This was a critical fix item.

**Tradeoff:** E2E tests are slower (~30s timeout per test) and require a web server (`npx serve shopify-widget -l 3000`). E2E tests use the mock data — they don't test against a real backend.

Source: `e2e/playwright.config.ts` (config), `e2e/specs/catalogQuery.spec.ts` (3 tests), `e2e/specs/offTopic.spec.ts` (4 tests), `e2e/specs/stockCheck.spec.ts` (4 tests).

---

## 2026-05-15: Browser-Side Services vs Server-Side API

**Considered:**
- Server-side architecture: all services run on a Shopify App backend, widget communicates via REST/GraphQL API
- Browser-side architecture: all services run in the browser as ES modules, widget imports and calls them directly
- Hybrid: lightweight browser client with server-side catalog and policy APIs

**Chose:** Browser-side services (current). Server-side is the known next evolution.

**Because:**
- **Hackathon velocity** — browser-side services require no backend, no API server, no deployment infrastructure. Everything runs from a single HTML file in the browser.
- **No CORS issues** — services run in the same JS context as the widget
- **No authentication needed** — mock data has no auth requirements
- **Immediate iteration** — change code, reload browser, see results. No deploy step.

**Known limitation and planned evolution:** This approach will not scale to production. Browser-side services mean:
- Every page load creates new service instances (no shared cache across users)
- Product data must be sent to every browser (bandwidth cost)
- Cannot integrate with Shopify Admin API (requires server-side auth)
- No persistent conversation storage

Production deployment will move to a Shopify App backend with a REST/GraphQL API, keeping the widget as a thin DOM client.

**Tradeoff accepted for hackathon.** The `CatalogDataSource` interface and `PolicyService`'s async design make the migration to server-side straightforward — swap the data source implementation.
