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

---

## 2026-05-16: Combined Order Card — Rich HTML + Timeline + Text Summary (Phase 4)

**Considered:**
- Rich HTML order card only (visual card with status badge, tracking number, ETA)
- Text summary only (structured text like catalog responses)
- Visual timeline only (progress steps with current step highlighted)
- **Chose: All three combined** — rich HTML card that includes a visual timeline progress component plus structured text summary

**Chose:** Dedicated `OrderCard` DOM component class with `render()` method. Shows: order ID, purchased items summary, current status with timeline step highlight, carrier + tracking number, estimated delivery date. No price breakdown or shipping address on the card.

**Because:** The success criteria say "natively rendered in the chat UI" — a rich card with timeline provides a better UX than plain text, matching the visual quality expected from a store's order status page. The dedicated component approach (vs inline HTML) follows good separation of concerns and makes the card testable and reusable for Phase 6 (return initiation). Combining all three formats means users get both the quick visual scan (timeline) and the detailed information (text summary) in one bubble.

**Tradeoff:** Requires upgrading the widget's message renderer to support rich HTML cards (current widget only does plain text bubbles). More DOM complexity than text-only.

---

## 2026-05-16: Order Number + Email Authentication (Phase 4)

**Considered:**
- Order number only — simplest, treats it like a public lookup
- Order number + email/zip — user provides both, system validates match
- Magic link / email verification — most secure but adds complexity outside chat flow

**Chose:** Order number + email (or zip) for identity validation. Both single-message format supported ("Track order #1234 for email@example.com") and conversational multi-turn fallback (chat asks for order number first, then email).

**Because:** This is a browser-side chat widget with no backend — true "secure authentication" is limited. Order number + email matches Shopify's own order lookup pattern and is familiar to users. Supporting both single-message and multi-turn means power users can paste everything at once while new users get a guided experience.

**Tradeoff:** Not truly "secure" — email is not a strong authenticator. Acceptable for hackathon scope. A production version would use Shopify's Storefront API tokens or OAuth.

---

## 2026-05-16: Mock Order Data Source with Full Shopify Model (Phase 4)

**Considered:**
- Basic 3-status orders (Pending, Shipped, Delivered)
- Full timeline with 6 statuses (Confirmed→Processing→Shipped→In Transit→Out for Delivery→Delivered)
- Full set including edge cases: Cancelled, Returned, On Hold

**Chose:** Full Shopify-like order model with 9 statuses including edge cases. Follows Phase 3 pattern: `OrderDataSource` interface → `MockOrderDataSource` implementation. Full order fields: orderId, status, items[], total, shippingAddress, email, fulfillmentStatus, financialStatus, line items with price/quantity, trackingNumber, carrier, estimatedDelivery, createdAt, notes. Full tracking timeline events per order.

**Because:** Phase 6 (return initiation) depends on Phase 4 — having edge case statuses (Cancelled, Returned, On Hold) means Phase 6 can reuse the same order data without rework. The full Shopify model ensures the order data is realistic enough for demo purposes. Following the Phase 3 `CatalogDataSource` pattern exactly means developers familiar with the catalog code can work on orders with zero learning curve.

**Tradeoff:** More mock data to maintain. The full model includes fields (shippingAddress, financialStatus) that aren't displayed on the order card but are available for future use.

---

## 2026-05-16: Order Pipeline Priority — Before Catalog (Phase 4)

**Considered:**
- Order detection after catalog (catalog runs first, then order)
- Order detection before catalog (after off-topic check, order runs first)

**Chose:** Order intent detection runs after off-topic check, BEFORE catalog detection in the ChatWidget pipeline. New `OrderService` + `OrderIntentDetector` + `formatOrderResponse()` — parallels the CatalogService pattern exactly.

**Because:** CatalogIntentDetector already has `EXCLUSION_KEYWORDS` routing 'order status'/'tracking' away from catalog. But there's a race condition risk: if order detection comes after catalog, a query like "track my order of a hoodie" could trigger catalog matching on "hoodie" before order detection gets a chance. Running order first avoids this entirely. The new `OrderIntentDetector` class mirrors `CatalogIntentDetector`'s pattern: keyword groups with includes/excludes, structured parsing, specific error messages per failure type.

**Tradeoff:** Slightly more pipeline steps for catalog queries (passes through order detection first). Negligible since both are deterministic keyword checks.

---

## 2026-05-16: Specific Error Messages with Corrective Prompts (Phase 4)

**Considered:**
- Generic error message for all failures
- Specific messages per failure type
- Specific messages + prompt to retry

**Chose:** Specific error messages per failure type (order not found, email mismatch, service unavailable) followed by a corrective prompt: "Order #1234 wasn't found. Would you like to try a different order number or check your email?"

**Because:** A generic "couldn't find that order" is frustrating — the user doesn't know what to do next. Specific messages tell them exactly what went wrong, and the corrective prompt keeps the conversation flowing instead of dead-ending. This pattern is common in good conversational UX (Shopify's own order lookup does this).

**Tradeoff:** Slightly more code paths to handle. Requires the OrderService to distinguish between "order not found" and "email doesn't match".

---

## 2026-05-16: Full Tracking Timeline Events (Phase 4)

**Considered:**
- Carrier + tracking number + ETA only
- Full tracking timeline with events

**Chose:** Full tracking timeline events rendered within the order card. Each order has a sequence of events: "May 14: Order placed", "May 15: Shipped", "May 17: Arrived at sort facility", "May 22: Estimated delivery". The timeline is a visual component within the OrderCard, not separate messages.

**Because:** A full timeline tells a story — the user can see the entire journey of their order at a glance. "Shipped" with a tracking number is just a status; a timeline with dates and milestones is a narrative. This also makes the order card more visually rich, matching the "natively rendered" requirement from the success criteria.

**Tradeoff:** Each mock order needs a realistic timeline of events. More mock data to maintain. Timeline rendering adds visual complexity to the OrderCard component.

---

## 2026-05-16: ResponseGrounder Wired into ChatWidget Pipeline (Post-Phase-4 Fix)

**Considered:**
- Leave ResponseGrounder as imported dead code in ChatWidget (it was created but never called in the pipeline)
- Wire it into `_generateAgentResponse()` as the final validation step before returning a response
- Remove ResponseGrounder entirely

**Chose:** Wired ResponseGrounder into the ChatWidget pipeline as a grounding validation step. The grounded response is now the actual output sent to the user.

**Because:** The original implementation imported ResponseGrounder but never used its output — every response bypassed grounding. This meant policy contradictions in catalog responses or fallback text would not be caught. The fix is minimal: call `groundResponse()` on the pipeline output and return the grounded version. This closes a correctness gap that existed since Phase 2.

**Tradeoff:** Slightly more processing per response (~2ms). Grounding confidence thresholds may need tuning if false positives appear in production.

---

## 2026-05-16: On-Hold Timeline Shows Paused Steps (Phase 4 Refinement)

**Considered:**
- Hide timeline entirely for `on_hold` orders (no status display)
- Show completed steps but dim future steps with a "Paused" indicator at the current step
- Show full timeline with all steps but mark current as "On Hold"

**Chose:** Show completed steps up to the current position with filled circles, then a distinct "Paused" indicator at the current step with an amber color (`#b8860b`), followed by dimmed future steps. The timeline visually communicates "your order is paused" rather than "your order is progressing".

**Because:** Users whose orders are on hold need to see where the hold happened in the fulfillment process. A hidden timeline would be confusing ("is my order lost?"). A full timeline with "On Hold" status marker provides the clearest signal: "You got to this point, and it's stopped here." The amber color distinguishes it from cancelled (red) and active (green) states.

**Tradeoff:** Adds another visual state to the OrderCard component. Three distinct timeline styles (active, cancelled, on-hold) means more CSS and rendering branches.

---

## 2026-05-17: Keyword-Based Escalation Detection (Phase 5)

**Considered:**
- LLM-based escalation detection: classify query as needing human handoff
- Sentiment analysis API for frustration detection
- Keyword-based approach: explicit handoff keywords + frustration keywords + non-resolving message count

**Chose:** Keyword-based detection with three triggers: explicit keywords ("talk to human", "speak to agent"), frustration keywords ("useless", "terrible"), and 3+ non-resolving messages.

**Because:**
- Zero API cost — no LLM or sentiment API needed
- Deterministic — exact keyword matching, no ambiguity
- Testable — each keyword group has dedicated tests
- The non-resolving counter handles the "silent frustration" case where users don't explicitly say they're frustrated but keep getting unhelpful responses

**Tradeoff:** Cannot detect novel frustration phrases not in the keyword list. The list is finite and may need maintenance.

Source: `src/services/escalationDetector.ts` lines 10-23, 40.

---

## 2026-05-17: Escalation State Machine with Valid Transition Matrix (Phase 5)

**Considered:**
- Unrestricted state transitions (any event can trigger any state)
- Hard-coded if/else state logic
- Explicit valid transition matrix defining allowed transitions per state

**Chose:** Explicit `VALID_TRANSITIONS` record mapping each `EscalationStatus` to an array of allowed `EscalationEvent` values. Invalid transitions return false silently.

**Because:**
- Security: prevents invalid state jumps that could cause undefined behavior
- Testable: each transition can be explicitly verified in tests
- Self-documenting: the matrix is a single source of truth for allowed flows
- Valid transitions: IDLE→OFFERED, OFFERED→CONFIRMING/CANCELLED, CONFIRMING→QUEUED/CANCELLED, etc.

**Tradeoff:** Slightly more code than hard-coded if/else, but the explicitness is worth it for a security-sensitive flow (human handoff involves user trust).

Source: `src/services/escalationStateMachine.ts` lines 9-18.

---

## 2026-05-17: localStorage Persistence for Escalation State (Phase 5)

**Considered:**
- No persistence (state lost on page refresh)
- Session storage only
- localStorage for cross-session persistence

**Chose:** localStorage with graceful fallback — state persists across page refreshes, but if localStorage is unavailable or corrupted, the state machine initializes to IDLE silently.

**Because:**
- Users may refresh the page during an escalation flow — losing their place would be frustrating
- Graceful fallback prevents errors — if localStorage is disabled or full, the system just starts fresh
- No sensitive data stored — escalation state (status, position) is not PII

**Tradeoff:** If localStorage contains corrupted JSON, the user loses their escalation progress with no warning. The catch block silently creates a fresh state.

Source: `src/services/escalationStateMachine.ts` lines 127-134 (load), 136-141 (save).

---

## 2026-05-17: Pipeline Position — Escalation After Off-Topic (Phase 5)

**Considered:**
- Escalation at pipeline start (before any detection)
- Escalation at end of pipeline (fallback)
- Escalation after off-topic, before order detection (D-14 design decision)

**Chose:** Escalation detection at pipeline step 2 — runs after off-topic check but before order/catalog detection. Active escalations short-circuit the rest of the pipeline.

**Because:**
- Off-topic users shouldn't be offered human handoff — they're asking about weather, not store issues
- Order detection needs to be bypassed when escalation is active — if user is in escalation flow, their queries should not trigger order lookups
- Short-circuit pattern: `if (isActive())` returns early with current system message

**Tradeoff:** If a user's escalation is cancelled and they immediately ask an order question, there's one extra round-trip through the pipeline. Negligible performance impact.

Source: `shopify-widget/src/ChatWidget.ts` lines 572-596.

---

## 2026-05-17: Queue Position from ChatWidget (Not State Machine)

**Considered:**
- Queue position stored in EscalationStateMachine
- Queue position generated in ChatWidget
- Queue position from EscalationQueueSimulator service

**Chose:** ChatWidget generates position via `Math.floor(Math.random() * 5) + 1` fallback, with `EscalationQueueSimulator` class available for interval-based updates (not currently wired).

**Because:**
- Simpler implementation — no state machine state update needed for position
- Queue simulator available for future enhancement (8s refresh interval)
- The design decision (W-01 in code review) is noted — position is not stored in state machine

**Tradeoff:** Queue position is not persisted across page refreshes. The `EscalationQueueSimulator` class exists but is unused (dead code, noted in review).

Source: `shopify-widget/src/ChatWidget.ts` lines 708-709.

---

## 2026-05-17: Widget Bundle Format — IIFE Over ESM for Shopify Embedding

**Considered:**
- ES module bundle: `<script type="module" src="dist/widget.js">` — standard Vite library output
- IIFE bundle: `<script src="dist/widget.js">` — self-executing function in global scope

**Chose:** IIFE format via Vite library mode (`formats: ['iife']` in `vite.config.ts`).

**Because:**
- The widget must embed in any Shopify theme via a simple `<script>` tag — no module loader, no importmap
- ES modules require `type="module"` which has CORS restrictions and fails in older Shopify themes
- IIFE exposes `ChatWidget` as a global, callable via `new ChatWidget()` from any inline script
- The default export must be set in the source (`export default class ChatWidget`) and rollup output (`exports: 'default'`) for IIFE to produce the correct global binding
- Tested via `domSnapshot.spec.ts` — verifies the widget mounts successfully in a real browser

**Tradeoff:** IIFE bundles are slightly larger (no tree-shaking across modules after bundling). The global namespace pollution is acceptable since `ChatWidget` is a unique name.

Source: `shopify-widget/vite.config.ts` (lines 8-10), `shopify-widget/src/ChatWidget.ts` (default export), `e2e/specs/domSnapshot.spec.ts` (DOM capture test).

---

## 2026-05-17: E2E Assertion Fix — toContainText Over toBeVisible for Dynamic Content

**Considered:**
- `toBeVisible()` matcher for agent response content — checks only DOM visibility
- `toContainText()` matcher — waits for text content to match, retries until timeout

**Chose:** `toContainText()` for content assertions, `toBeVisible()` only for structural elements (chat window open/close).

**Because:**
- `toBeVisible()` on `.chat-bubble--agent` passes as soon as the bubble DOM element appears, but its text content may still be the placeholder/sending state
- `toContainText('Classic Hoodie')` waits until the actual text content contains the expected string — handles async rendering correctly
- Tests were flaky: sometimes passing when the agent said "Let me look that up..." (visible bubble, wrong content)
- This fix made all 12 E2E tests consistently green

**Tradeoff:** Slightly slower assertions (Playwright retries until timeout). Acceptable for test reliability.

Source: `e2e/specs/catalogQuery.spec.ts`, `e2e/specs/stockCheck.spec.ts`.

---

## 2026-05-17: Playwright Config — Build Pipeline + No Reuse Server

**Considered:**
- Serve pre-built static files: `npx serve shopify-widget -l 3000` — fastest startup, but uses stale JS
- Single serve with `reuseExistingServer: true` — serve once, reuse across test runs
- Build pipeline + `reuseExistingServer: false` — rebuild widget on every test run

**Chose:** Build pipeline (`tsc → vite build → serve`) with `reuseExistingServer: false`.

**Because:**
- The widget TypeScript source must be compiled before it can be served to the browser
- `reuseExistingServer: false` ensures every Playwright run gets a fresh widget build — no stale output
- The full pipeline runs in ~20s (tsc: 5s, vite build: 3s, serve: instant, remaining: startup time)
- The command runs from `cwd: '..'` (project root) so tsc and vite configs resolve correctly
- Previously the widget HTML loaded an ES module that failed to execute — the build pipeline guarantees the IIFE bundle is current

**Tradeoff:** Longer startup time for E2E tests (~20s vs instant for pre-built). Acceptable for test correctness.

Source: `e2e/playwright.config.ts` lines 13-19.

---

## 2026-05-17: In-Browser Semantic Routing with @huggingface/transformers (Phase 6)

**Considered:**
- Transformer.js via npm bundler import (@huggingface/transformers, all-MiniLM-L6-v2, 22MB)
- CDN dynamic import (no build change, but CDN dependency)
- ONNX Runtime Web (alternative runtime, less ecosystem support)
- Keep pure keyword detection (status quo — judge score 58/100)

**Chose:** npm bundler import of `@huggingface/transformers` with `Xenova/all-MiniLM-L6-v2`. Singleton `SemanticRouter` class shared across all 3 detectors (catalog, off-topic, order). Lazy-load model on first query. Pre-computed reference embeddings generated at build time. 5-8 reference phrases per intent category. 0.6 confidence threshold for semantic result, keyword fallback below that. Silent fallback to keywords on model failure with one retry attempt.

**Because:**
- Directly addresses the judge's core finding (#58/100, "no real semantic routing"). Transforms the project from "rule-based chatbot" to "AI-augmented agent."
- Zero API cost — embeddings compute locally in <50ms, no network round-trip
- Zero privacy exposure — user queries never leave the browser
- Hybrid belt-and-suspenders: semantic handles typos/synonyms/natural phrasing, keyword fallback ensures known phrases always work
- Pre-computed embeddings at build time means runtime is just a cosine similarity comparison (<1ms)
- npm bundler import gives cleanest integration with existing build pipeline

**Tradeoff:** ~30MB model download on first query (~1-2s). Mitigated by IndexedDB caching via transformer.js (instant on subsequent loads) and "Loading AI model…" UX with query queuing. Build-time embedding generation adds ~2-3s to npm run build.

Source: `.planning/phases/06-semantic-ai-router/06-AI-SPEC.md` — full decision record with 34 decisions across 9 gray areas.

---

## 2026-05-18: D-01 — Cloudflare Workers Proxy Platform

**Considered:**
- Vercel Edge Functions — 100k edge requests/month free
- Cloudflare Workers — 100k requests/day free
- Deno Deploy — 100k requests/month free

**Chose:** Cloudflare Workers with TypeScript + `wrangler` CLI. Standalone `shopify-proxy/` directory at project root with its own `package.json`, `wrangler.toml`, and `src/worker.ts`.

**Because:** Best free tier (100k requests/day), native Web Crypto API support for HMAC verification, excellent `wrangler dev` DX, and edge-native deployment.

**Tradeoff:** Requires deploying to Cloudflare's edge network. Local dev requires `wrangler dev` which spawns a `workerd` process.

---

## 2026-05-18: D-02 — HMAC Request Authentication

**Considered:**
- No auth (open proxy) — anyone could query any order
- API key in request header
- HMAC signing with shared secret

**Chose:** HMAC-SHA256 signing with a shared secret passed via ChatWidget constructor option. Browser signs `orderNumber + emailHash + timestamp` with `crypto.subtle.sign()`. Worker verifies with `crypto.subtle.verify()` (constant-time).

**Because:** Directly addresses the judge's concern about client-side data exposure. HMAC prevents arbitrary third parties from using the proxy. Timestamp inclusion prevents replay attacks within a 5-minute window. No server-side state needed.

**Tradeoff:** Shared secret is embedded in widget bundle — same risk profile as Storefront API token. Deployment-specific secret rotation recommended.

---

## 2026-05-18: D-03 — Shopify Admin GraphQL API

**Considered:**
- Shopify Admin REST API — simpler but returns full order objects
- Shopify Admin GraphQL API — query only needed fields

**Chose:** GraphQL Admin API. Worker queries `orders(first: 1, query: "name:1001")` for only status and timeline fields.

**Because:** GraphQL allows querying exactly the fields needed (status, timeline, customer email), making the filtered response contract implicit in the query. More efficient than REST for partial data.

**Tradeoff:** GraphQL query syntax is more complex than REST endpoints. API version `2025-07` must match the store's Admin API version.

---

## 2026-05-18: D-04 — Shopify Storefront API for Catalog

**Considered:**
- Admin API (requires secret token, server-side only)
- Storefront API (public, designed for client-side use)

**Chose:** Shopify Storefront API for catalog reads. GraphQL `products(first: 250)` query. Optional `X-Shopify-Storefront-Access-Token` header (depends on store configuration).

**Because:** Storefront API is designed for public-facing store data. No secret key needed for basic published product queries (some stores may require a public token). Real-time inventory data.

**Tradeoff:** The API may require a public token depending on store configuration. The token is safe to embed client-side since it only exposes public product data.

---

## 2026-05-18: D-05 — Policy Data Source (Markdown Frontmatter)

**Considered:**
- Separate JSON config file — structured but less human-friendly
- Shopify Admin API policies endpoint — requires server-side auth
- Markdown config file with frontmatter YAML

**Chose:** Markdown file with frontmatter YAML (`policies.md`). Fetched client-side via `fetch()` — no proxy needed since policies are public data. PolicyService takes a `policyUrl` option (default: `./policies.md`).

**Because:** Simplest approach that works offline and has zero API dependency. Frontmatter YAML gives structured fields for the widget to use programmatically. Markdown body provides human-readable policy text. Merchant edits a single file.

**Tradeoff:** Requires editing a file rather than a dashboard UI. No version control or audit trail beyond git.

---

## 2026-05-18: D-06 — Fallback to Mock Data

**Considered:**
- Remove mock data entirely (require live API)
- Keep mock data as default, live data as opt-in

**Chose:** Keep mock data sources as fallback. Toggle via `dataSource: { catalog, order, policy }` option in ChatWidget constructor. Default is all mock.

**Because:** Demo environment may not have a live Shopify store configured. Tests still use mock data (deterministic, fast, no network dependency). Migration path: merchant sets `dataSource: { catalog: 'live', order: 'live' }` when ready.

**Tradeoff:** Two code paths to maintain. Widget defaults to non-production behavior unless explicitly configured.

---

## 2026-05-18: D-07 — Proxy Request Contract

**Considered:**
- Full email in request (worker hashes server-side)
- Email hash only + HMAC

**Chose:** Request body: `{ orderNumber, emailHash (SHA-256), timestamp, hmac }`. Email hash computed client-side via `crypto.subtle.digest('SHA-256')`. HMAC signs `orderNumber + emailHash + timestamp`. Timestamp validated within a 5-minute window on the proxy.

**Because:** SHA-256 is standard, built into browsers via SubtleCrypto. The proxy never receives raw email addresses. Timestamp prevents replay attacks without server-side session state.

**Tradeoff:** Email hash is deterministic — same email always produces the same hash (limited privacy improvement). Acceptable since the proxy only returns status data.

---

## 2026-05-18: D-08 — Proxy Response Contract

**Considered:**
- Pass through full Shopify Admin API response
- Filter to status-only fields

**Chose:** Return only status-related fields: `{ found, status, estimatedDelivery, timeline }`. On error: HTTP status code + JSON body `{ error: true, code, message }`. Error codes: `not_found`, `email_mismatch`, `proxy_error`, `invalid_hmac`, `invalid_request`.

**Because:** Minimal data exposure — the widget already knows how to render these fields via OrderCard. Structured error codes let the widget handle each case specifically.

**Tradeoff:** If the widget needs additional order fields in the future, the proxy must be updated.

---

## 2026-05-18: D-09 — Local Development Workflow

**Considered:**
- Use Cloudflare Dashboard for env vars
- Use `.env` file + `wrangler dev`

**Chose:** `wrangler dev` runs the worker locally on `localhost:8787`. Root `package.json` gets a `dev:proxy` npm script. Configuration via `.env` file (not `wrangler.toml [vars]`).

**Because:** `.env` is more portable and familiar. `wrangler dev` is the standard CF Workers local dev approach. `.env` is gitignored, `.env.example` committed with placeholder values.

**Tradeoff:** `wrangler dev` requires Node.js and the `workerd` binary to be installed.

---

## 2026-05-18: D-10 — Shopify Credential Setup

**Considered:**
- Shopify OAuth app (handles token management)
- Custom app + Admin API token

**Chose:** Create a Shopify Partners account → dev store → custom app → Admin API access token. Token stored as `SHOPIFY_ADMIN_TOKEN` in worker `.env`. Store domain configured similarly.

**Because:** Custom app + Admin API token is the standard, non-OAuth approach for server-to-server integrations. Per hackathon setup instructions (`docs/hackathon.md` §"Getting Started with Shopify").

**Tradeoff:** Admin API token has full write access to the store. Must be kept secret (never in client-side code).

---

## 2026-05-18: D-11 — Order Lookup Error Handling

**Considered:**
- Fail immediately on proxy error
- Retry then fail (user sees error)
- Retry then silently fall back to mock data

**Chose:** Automatic retry once after 2s on proxy failure. If retry also fails, silently fall back to MockOrderDataSource. User still gets an order status response.

**Because:** Best UX — user isn't blocked by transient API issues. Mock data may be stale but order lookup is primarily about showing the experience.

**Tradeoff:** If the proxy is down, users see potentially stale order data. Acceptable for hackathon demo.

---

## 2026-05-18: D-12 — Catalog Error Handling

**Considered:**
- Fall back to mock catalog data
- Show user-visible error message

**Chose:** Show user-visible error message: "Product catalog is temporarily unavailable." No fallback to mock catalog data.

**Because:** Catalog data changes frequently. Showing stale mock data could mislead users about actual product availability and pricing.

**Tradeoff:** Users cannot browse products during a catalog outage. Acceptable for a support agent (not a storefront).

---

## 2026-05-18: D-13 — Policy Error Handling

**Considered:**
- Error message with no fallback
- Show hardcoded fallback policy text

**Chose:** Show built-in fallback text: "Please check our store policies for the most current information."

**Because:** Policy text is relatively stable. Fallback text is truthful and directs users to the authoritative source (the store's actual policy page).

**Tradeoff:** Users don't get a specific answer. Directed to check the store's actual policy page for complete information.

---

## 2026-05-18: D-14 — Silent Data Source Mode

**Considered:**
- Show data source badge ("Live" / "Demo")
- No indication — identical UX regardless of backend

**Chose:** Silent — no data source indicator shown to the user. Widget works identically regardless of backend.

**Because:** Users don't need to know whether data comes from a live API or mock data. The experience and responses are the same. A data source badge would cause confusion ("why does it say Demo on my live store?").

**Tradeoff:** Developers cannot visually confirm which data source is active.

---

## 2026-05-19: D-01 — Quick Action Chips Placement (Phase 8)

**Context:** Users need clear affordances for first actions. The judge's finding identified "blank screen" as a UX problem.

**Decision:** Render 4 action chips as inline `<button>` elements in a flex row below the textarea input. Chips disappear once user sends their first message. Chips use same Berkeley Mono font and hairline borders as the widget.

**Rationale:**
- Always visible — users can tap a chip at any time
- Below input — follows the natural F-pattern (read output → type → see suggestions)
- Terminal aesthetic preserved — chips use same CSS variables (`--font-mono`, `--color-hairline`)
- Disappear after first message — reduces noise for returning users

**Tradeoff:** Chips add vertical space below the input. Acceptable tradeoff for guiding first-time users.

---

## 2026-05-19: D-02 — Onboarding State (Phase 8)

**Context:** The judge's finding #58 mentioned "blank screen leaves users stranded" on first open.

**Decision:** On very first open (no conversation history in localStorage), show a subtle hint text in the message area: "[+] Ask about products, track orders, or check policies. Type naturally — I understand typos."

**Rationale:**
- Single line, no popup, no dismissable welcome message (respects D-14 from Phase 1: no welcome message)
- Sets expectations: the widget handles natural language and typos
- Removed on first send — disappears naturally as part of the conversation flow

**Tradeoff:** First-time users who don't read the hint may still be briefly confused. The visible textarea cursor mitigates this.

---

## 2026-05-19: D-03 — Realtime Channel Choice (Phase 8)

**Context:** Human handoff needs a realtime messaging channel. Options: Supabase Realtime, custom WebSocket server, polling-based queue.

**Decision:** Supabase Realtime (WebSocket-based, free tier: 50 concurrent connections, 2GB bandwidth).

**Rationale:**
- Free tier handles demo requirements (50 concurrent connections, 2GB bandwidth)
- WebSocket-based — no polling, no fake timers, true bidirectional communication
- Simple API: `supabase.channel('support-queue').subscribe()`
- Agent console subscribes to same channel — real bidirectional flow
- Can be deployed in 30 minutes with a free Supabase account (no server setup)

**Tradeoff:** Requires a Supabase account. Not configurable via constructor options (deferred to post-hackathon). If Supabase is unavailable, handoff shows "unavailable" message (D-12).

---

## 2026-05-19: D-04 — Agent Console Scope (Phase 8)

**Context:** Need a way for human agents to receive handoff requests and respond. The agent console must prove handoff is real for the judge demo.

**Decision:** Single HTML page that lists active handoff requests in a sidebar, shows chat history in a right pane, and lets the agent type responses. Built as a standalone HTML file — no framework, no build step.

**Rationale:**
- MVP — not a full helpdesk dashboard. Shows the judge that handoff is real.
- Standalone HTML file (no framework, no npm dependencies)
- Uses same Supabase channel to send responses back to the widget
- Can be opened directly in a browser — no server needed

**Tradeoff:** No authentication for demo agent. Uses fixed `agentId: 'agent-1'`. Production would authenticate via Supabase RLS.

---

## 2026-05-19: D-05 — Demo Video Structure (Phase 8)

**Context:** Hackathon requires a demo video (3-5 minutes) showing the submission. Need a clear structure covering all features.

**Decision:** 4-minute video with this structure:
1. **0:00-0:30** — Introduction: "This is an AI customer support agent for Shopify."
2. **0:30-1:30** — Semantic understanding: "avialable?", "where's my stuff", "got medium blue pants?" — typo/synonym handling
3. **1:30-2:30** — Product lookup → order tracking flow: full customer journey
4. **2:30-3:30** — Live human handoff: user requests agent, Supabase handoff, agent responds
5. **3:30-4:00** — Architecture summary: "Semantic router → deterministic data → zero hallucinations"

**Rationale:** Video recorded personally by user after code freeze (per user request). Not part of implementation scope. Unlisted YouTube or Google Drive link in README.

**Tradeoff:** Video quality and timing depend on user availability.

---

## 2026-05-19: D-06 — Supabase Credential Strategy (Phase 8)

**Considered:**
- Constructor options — add `supabaseUrl` and `supabaseAnonKey` to ChatWidgetOptions
- Data attributes — read from `data-supabase-url` on the container element
- Hardcoded for demo — inline const values in ChatWidget.ts

**Chose:** Hardcoded as inline constants in ChatWidget.ts. `.env.example` file documents where to get values. Supabase URL and anon key are safe to expose (anon key is public by RLS design).

**Because:** Simplest approach for demo. Anon key is designed to be public. Post-hackathon flexibility (constructor options) is deferred.

**Tradeoff:** The Supabase URL and anon key must be manually updated for each deployment. No runtime configurability.

---

## 2026-05-19: D-07 — Action Chip Behavior (Phase 8)

**Considered:**
- All chips insert text into textarea for user editing
- Mixed: some chips fill textarea, some send immediately
- All chips send immediately

**Chose:**
- Track Order — inserts "track order #" in textarea (user fills in order number)
- Check Stock — inserts "check stock for " in textarea (user fills in product name)
- Return Item — immediately sends "I'd like to start a return"
- View Policies — immediately sends "what are your policies?"

**Because:** Chips needing variable input (order number, product name) go to textarea for the user to complete. Self-contained queries (return initiation, policy lookup) send immediately without extra steps.

**Tradeoff:** Inconsistent behavior — three chips require user action, two send immediately. Users must learn which does what.

---

## 2026-05-19: D-08 — Action Chip Persistence (Phase 8)

**Considered:**
- Never show chips after first use (localStorage flag)
- Reappear every page refresh until first message sent

**Chose:** Chips reappear on every page load until the user sends their first message in that session. No localStorage persistence flag — simple check against conversation history length.

**Because:** Simplest implementation. Returning users who refresh will see chips until they send another message, which is fine — the chips are helpful suggestions.

**Tradeoff:** Users who refresh mid-conversation see chips again, even though they already know about them.

---

## 2026-05-19: D-09 — Agent Console Interaction Model (Phase 8)

**Considered:**
- Immediate connection — agent console shows conversation live, agent just starts typing
- Accept-first — handoff request appears, agent clicks Accept to see conversation

**Chose:** Accept-first flow. Handoff requests appear in a sidebar list with user ID and conversation preview. Agent clicks Accept to see full transcript and begin responding.

**Because:** More realistic UX for demo. Shows the judge that handoff is a deliberate human action, not an automatic script.

**Tradeoff:** Users wait longer for a response while the agent evaluates and accepts. Acceptable for demo.

---

## 2026-05-19: D-10 — Agent Console Layout (Phase 8)

**Considered:**
- Split view — left sidebar + right chat pane
- Two-step view — request list page → navigate to chat page

**Chose:** Split view layout. Left sidebar shows pending handoff requests. Right pane shows the chat view for the accepted request.

**Because:** Shows both views simultaneously. More professional appearance for the demo. Matches common helpdesk tool patterns.

**Tradeoff:** More complex HTML/CSS than a single-view page. Must handle responsive layout.

---

## 2026-05-19: D-11 — Agent Console Input Method (Phase 8)

**Considered:**
- Simple single-line text input + send button
- Multi-line textarea

**Chose:** Multi-line textarea for agent responses, matching the widget's own input UX.

**Because:** Allows longer, more detailed agent responses. Consistent UX with the customer-facing widget.

**Tradeoff:** Textarea takes more vertical space in the console layout.

---

## 2026-05-19: D-12 — Escalation Fallback Strategy (Phase 8)

**Considered:**
- Keep EscalationQueueSimulator + HumanAgentSimulator as fallback if Supabase fails
- Graceful failure — no simulators, show unavailability message

**Chose:** Graceful failure. If Supabase is not configured or the channel fails to connect, show "Human support is currently unavailable. Please try again later." and keep the user in the normal flow.

**Because:** The simulators are fake — keeping them would mean the handoff demo isn't real. Better to show honest unavailability than fake a queue and canned script responses.

**Tradeoff:** If Supabase is down during the demo, the handoff feature cannot be demonstrated.

---

## 2026-05-19: D-13 — Supabase Channel Architecture (Phase 8)

**Considered:**
- Single channel with broadcast event types
- Per-conversation channels for each handoff

**Chose:** Single channel named 'support-queue' with distinct broadcast event types: `handoff_request`, `handoff_accepted`, `agent_message`.

**Because:** Single channel simplifies subscription management. Event types route messages correctly without multiple channel subscriptions.

**Tradeoff:** All handoff traffic shares one channel. At high scale, message filtering by event type adds overhead.

---

## 2026-05-19: D-14 — Demo Video (Phase 8)

**Considered:**
- Record during development
- Record after code freeze
- User handles personally

**Chose:** User handles demo video personally after code freeze. Not part of implementation scope. Video uploaded as unlisted YouTube or Google Drive link in README.

**Because:** Video recording requires a specific Shopify store, product catalog, and narration style that the user controls best.

**Tradeoff:** Video quality and timing depend on user availability after code freeze.
