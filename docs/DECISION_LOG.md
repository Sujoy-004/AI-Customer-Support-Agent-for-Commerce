<!-- generated-by: gsd-doc-writer -->
# Decision Log

> A running record of architectural, product, and design decisions. Format: `YYYY-MM-DD: Title` — Considered / Chose / Because.

---

## 2026-05-14: Berkeley Mono Typography, Flat Cream Canvas, Hairline Borders

**Considered:** OpenCode brand system (Berkeley Mono, `#fdfcfc`, hairlines, bracket markers) vs conventional chat UI (rounded, shadows, sans-serif) vs 3rd-party library.

**Chose:** OpenCode system — Berkeley Mono for all text, `#fdfcfc` cream canvas, 1px `rgba(15,0,0,0.12)` hairline borders, 4px radius, ASCII `[+]`/`[-]` toggle buttons, no shadows or gradients.

**Because:** Hackathon submission using Antigravity Skills stack (derived from OpenCode) — visual coherence with ecosystem. Monospaced-only constraint forces simplicity — no place to hide behind flourishes. Bracket markers are instantly recognizable. DESIGN.md (lines 5, 227-238) specifies all tokens.

**Tradeoff:** Berkeley Mono is paid — JetBrains Mono / IBM Plex Mono needed for production. Monospaced constraint consumes more horizontal space for long messages.

---

## 2026-05-14: No Welcome Message (D-14)

**Considered:** Welcome message on open vs empty message list with focused textarea.

**Chose:** No welcome message — widget opens blank, textarea focused.

**Because:** Welcome message adds friction — user must dismiss before typing. Per Phase 1 planning: "Widget opens clean. No salutation. Cursor position is the welcome."

**Tradeoff:** First-time users may be briefly confused. Mitigated by placeholder text and visible input area.

---

## 2026-05-15: Keyword-Based Off-Topic Detection vs NLP Approach

**Considered:** NLP/ML classifier vs keyword-based (ON_TOPIC_KEYWORDS: 50, OFF_TOPIC_KEYWORDS: 51) with confidence scoring and override logic vs hybrid with LLM fallback.

**Chose:** Pure keyword-based detection with confidence scoring and on-topic override.

**Because:** Keywords define exact behavior — no ambiguity. Zero API cost. Unit-testable. Override logic handles mixed queries (e.g., "Amazon shipping policy" — "shipping" + "policy" override "Amazon"). Off-topic suggestions are contextual: weather → "latest products", competitor → "our unique features".

**Tradeoff:** Cannot detect novel off-topic categories. Adding new categories requires code changes.

Source: `src/services/offTopicDetector.ts` lines 26-73.

---

## 2026-05-15: Interface-First PolicyService with Caching

**Considered:** Inline constant data vs PolicyService with async TTL caching vs live Shopify Admin API fetch.

**Chose:** PolicyService class with async `loadPolicies()`, 5-minute TTL cache, mock implementation swappable for live API client.

**Because:** Async interface lets mock → Shopify swap without changing consumers. 5-minute TTL balances freshness with load. `PolicyData` interface (`src/services/types.ts` lines 9-30) defines exact shape: shipping (standard, express, international, freeShippingThreshold, processingTime), warranty (standardPeriod, extendedOptions, coverageDetails, claimProcess), returns (returnWindow, conditionRequirements, refundMethod, exchangePolicy, restockingFee).

**Tradeoff:** Mock data is hardcoded — no live Shopify integration. No error handling for API fetch failures in mock.

Source: `src/services/policyService.ts`, `src/services/types.ts`.

---

## 2026-05-15: Hybrid Intent Classification — Keyword Pre-Filter + Structured Parsing (No LLM)

**Considered:** Pure LLM classification vs pure keyword matching vs hybrid: keyword pre-filter + structured parsing.

**Chose:** Hybrid — keyword pre-filter with structured parsing. No LLM.

**Because:** Zero hallucination risk — core constraint. LLM might classify "can I return the hoodie" as catalog query. `INTENT_GROUPS` defines includes/excludes per intent (e.g., stock_check includes "stock"/"available" but excludes "return"/"refund") — prevents intent leakage. Every classification traceable to matching keyword. Easily testable.

**Tradeoff:** Cannot handle novel phrasing missing keyword terms (e.g., "are you well-stocked on hoodies?" — "well-stocked" not in list).

Source: `src/services/catalogIntentDetector.ts` lines 146-170.

---

## 2026-05-15: Synonym Mapping for Variant Matching (Not Fuzzy/Embedding)

**Considered:** Levenshtein fuzzy matching vs embedding similarity vs explicit synonym mapping with canonical→aliases tables.

**Chose:** Explicit synonym mapping with config files.

**Because:** Predictable — "navy" always maps to "Blue" via `COLOR_SYNONYM_TABLE`. Configurable — synonym tables are standalone files (`src/config/synonyms/colors.ts`, `sizes.ts`, `materials.ts`). Small vocabulary — sizes (6), colors (7), materials (6), ~64 aliases total. Embeddings would be absurd overkill. `normalizeOptionValue()` resolves "m" → "Medium", "charcoal" → "Gray", "poly" → "Polyester" with unit-verifiable logic.

**Tradeoff:** Misspellings ("meduim" → fails). New colors/sizes/materials need config updates.

Source: `src/config/synonyms/colors.ts` (37 lines), `sizes.ts` (33 lines), `materials.ts` (33 lines), `src/services/synonymResolver.ts` (69 lines).

---

## 2026-05-15: 2-Min Catalog Cache, NEVER Cache Inventory

**Considered:** Cache everything 5min vs cache products only (never inventory) vs no caching.

**Chose:** Product catalog cached at 2-minute TTL. Inventory ALWAYS fetches fresh (never cached).

**Because:** Product data changes infrequently. Inventory changes constantly — caching stock produces stale "in stock" responses (hallucination-equivalent). `checkStock()` bypasses cache by calling `this.dataSource.loadProducts()` directly. Tested in `catalogService.test.ts` "should never cache inventory" (lines 434-469).

**Tradeoff:** Stock checks are slower than product lookups. Acceptable for real-time accuracy.

Source: `src/services/catalogService.ts` lines 16 (CACHE_TTL_MS = 120000), 75-85 (checkStock bypass).

---

## 2026-05-15: Cross-Turn Context with 5min/3turn Expiry

**Considered:** No context vs infinite context vs bounded: 5-minute TTL + 3-turn max.

**Chose:** Bounded context — 5-minute TTL OR 3-turn max, whichever expires first.

**Because:** Users naturally refine queries across turns ("classic hoodie" → "in black" → "what about large"). Without context, "what about large" would fail. Context must expire — infinite would confuse returning customers. 3 turns = natural refinement cycle. 5 minutes = typical support interaction span. Tested: context merge (lines 240-268), 5-min expiry via `vi.advanceTimersByTime(310000)` (270-277), 3-turn expiry (356-377).

**Tradeoff:** After 3 turns, "Your previous product inquiry has expired" may confuse mid-conversation users. Most resolutions happen within 1-2 turns.

Source: `src/services/catalogIntentDetector.ts` lines 141-142, 397-423.

---

## 2026-05-15: Mock Data First, CatalogDataSource Interface for Swappable Live API

**Considered:** Live Shopify Admin API from day one vs mock data first with swappable interface vs 3rd-party client library.

**Chose:** Mock data first with `CatalogDataSource` interface for future live API swap.

**Because:** Shopify API auth (keys, scopes, OAuth) adds hackathon complexity. Interface is 1 method: `loadProducts(): Promise<Product[]>`. Both `MockCatalogDataSource` and future `ShopifyCatalogDataSource` implement the same contract. 7 products, 52 variants, 3 categories with realistic stock overrides — covers all resolution scenarios. Development proceeds without network calls, making tests faster and more reliable.

**Tradeoff:** Judges see mock data, not live Shopify. Future `ShopifyCatalogDataSource` must parse Shopify's GraphQL into `Product[]` shape.

Source: `src/services/types.ts` lines 124-126, `src/services/mockCatalogData.ts` lines 321-330.

---

## 2026-05-15: Discriminated Union Types for ResolvedQuery

**Considered:** Single `CatalogResult` with nullable fields vs discriminated union (8 variants) vs separate functions per resolution path.

**Chose:** Discriminated union: `exact`, `partial`, `product_only`, `search_results`, `ambiguous`, `not_found`, `context_expired`, `not_catalog`.

**Because:** Each variant has exactly the fields it needs — no null checks. `switch(result.type)` narrowing ensures exhaustive handling (`formatCatalogResponse`). Impossible states impossible at compile time: `exact` always has `variant`/`product`/`stock`; `not_found` never does. Type system documents all conversation states in one place.

**Tradeoff:** 8 variants add type complexity and require guard functions (`isExact()`, `isPartial()`) in tests.

Source: `src/services/catalogIntentDetector.ts` lines 8-16 (type def), 31-108 (exhaustive handler).

---

## 2026-05-15: Playwright E2E over Vitest-Only Approach

**Considered:** Vitest-only (jsdom) vs Playwright E2E-only vs Cypress vs Vitest + Playwright.

**Chose:** Both — Vitest for 201 unit/integration tests, Playwright for 3 E2E spec files (11 scenarios).

**Because:** Vitest cannot test real browser behavior (DOM rendering, network events, widget lifecycle). Playwright verifies widget DOM structure, message rendering, and content in real browser context. E2E tests serve as smoke tests for mounting, responding, and off-topic refusal. Per AGENTS.md: "Playwright NOT set up — only Vitest exists" — this was a critical fix item.

**Tradeoff:** E2E tests slower (~30s timeout) and need web server (`npx serve shopify-widget -l 3000`). Use mock data — no real backend.

Source: `e2e/playwright.config.ts`, `e2e/specs/catalogQuery.spec.ts`, `e2e/specs/offTopic.spec.ts`, `e2e/specs/stockCheck.spec.ts`.

---

## 2026-05-15: Browser-Side Services vs Server-Side API

**Considered:** Server-side (Shopify App backend, REST/GraphQL API) vs browser-side (ES modules, direct import) vs hybrid.

**Chose:** Browser-side services (current). Server-side is the known next evolution.

**Because:** Hackathon velocity — no backend, no API server, no infrastructure. Everything runs from a single HTML file. No CORS issues, no auth needed (mock data), immediate iteration (reload browser to see changes).

**Known limitation:** Not production-scalable — every page load creates new service instances, product data sent to every browser, no Shopify Admin API integration, no persistent storage. Production will move to a Shopify App backend with the widget as a thin DOM client. The `CatalogDataSource` interface and `PolicyService`'s async design make this migration straightforward.

**Tradeoff accepted for hackathon.**

---

## 2026-05-16: Combined Order Card — Rich HTML + Timeline + Text Summary (Phase 4)

**Considered:** Rich HTML card only vs text summary only vs visual timeline only vs all three combined.

**Chose:** Dedicated `OrderCard` DOM component with `render()`. Shows: order ID, items summary, status with timeline step highlight, carrier + tracking, estimated delivery. No price or shipping address.

**Because:** Success criteria requires "natively rendered in chat UI" — rich card with timeline provides better UX than plain text. Dedicated component (vs inline HTML) follows separation of concerns and is testable/reusable for Phase 6 returns. Combined formats give users both visual scan (timeline) and detail (text summary).

**Tradeoff:** Requires widget message renderer upgrade (currently plain-text only). More DOM complexity.

---

## 2026-05-16: Order Number + Email Authentication (Phase 4)

**Considered:** Order number only vs order + email/zip vs magic link/email verification.

**Chose:** Order number + email (or zip). Supports single-message ("Track order #1234 for email@example.com") and conversational multi-turn fallback.

**Because:** Browser-side widget with no backend limits true security. This matches Shopify's own order lookup pattern — familiar to users. Single-message for power users, multi-turn guided for new users.

**Tradeoff:** Not truly "secure" — email is weak authenticator. Production would use Shopify Storefront API tokens or OAuth.

---

## 2026-05-16: Mock Order Data Source with Full Shopify Model (Phase 4)

**Considered:** Basic 3-status orders vs full 6-status timeline vs full set including edge cases (Cancelled, Returned, On Hold).

**Chose:** Full Shopify-like order model — 9 statuses including edge cases. Follows Phase 3 pattern: `OrderDataSource` interface → `MockOrderDataSource`. Fields: orderId, status, items[], total, shippingAddress, email, fulfillmentStatus, financialStatus, line items, trackingNumber, carrier, estimatedDelivery, createdAt, notes. Full tracking timeline events per order.

**Because:** Phase 6 (returns) depends on Phase 4 — edge case statuses mean Phase 6 reuses the same data without rework. Full Shopify model ensures realistic demo data. Following `CatalogDataSource` pattern exactly means zero learning curve for developers.

**Tradeoff:** More mock data to maintain. Includes fields (shippingAddress, financialStatus) not displayed on card but available for future use.

---

## 2026-05-16: Order Pipeline Priority — Before Catalog (Phase 4)

**Considered:** Order detection after catalog vs before catalog (after off-topic check).

**Chose:** Order intent detection runs after off-topic, BEFORE catalog. New `OrderService` + `OrderIntentDetector` + `formatOrderResponse()` — parallels CatalogService pattern.

**Because:** `CatalogIntentDetector` has `EXCLUSION_KEYWORDS` routing 'order status'/'tracking' away from catalog, but a query like "track my order of a hoodie" could trigger catalog matching on "hoodie" first. Running order first avoids this race condition entirely.

**Tradeoff:** Slightly more pipeline steps for catalog queries (passes through order detection first). Negligible — both are deterministic keyword checks.

---

## 2026-05-16: Specific Error Messages with Corrective Prompts (Phase 4)

**Considered:** Generic error vs specific per failure type vs specific + corrective prompt.

**Chose:** Specific error per type (order not found, email mismatch, service unavailable) + corrective prompt: "Order #1234 wasn't found. Would you like to try a different order number or check your email?"

**Because:** Generic errors frustrate — user doesn't know what to do next. Specific messages tell exactly what went wrong; corrective prompt keeps conversation flowing. Shopify's own order lookup follows this pattern.

**Tradeoff:** Slightly more code paths. Requires OrderService to distinguish "not found" from "email mismatch".

---

## 2026-05-16: Full Tracking Timeline Events (Phase 4)

**Considered:** Carrier + tracking + ETA only vs full timeline with events.

**Chose:** Full timeline events rendered within the order card. Each order has a sequence: "May 14: Order placed", "May 15: Shipped", "May 17: Arrived at sort facility", "May 22: Estimated delivery". Timeline is a visual component within OrderCard, not separate messages.

**Because:** Timeline tells a story — user sees the entire journey at a glance. "Shipped" with tracking is just a status; timeline with dates is a narrative. Matches "natively rendered" requirement.

**Tradeoff:** Each mock order needs a realistic timeline. More mock data to maintain. Timeline rendering adds visual complexity to OrderCard.

---

## 2026-05-16: ResponseGrounder Wired into ChatWidget Pipeline (Post-Phase-4 Fix)

**Considered:** Leave as dead code (imported but never called) vs wire into `_generateAgentResponse()` vs remove.

**Chose:** Wired ResponseGrounder into ChatWidget pipeline as final validation step. Grounded response is now the actual output.

**Because:** Original implementation imported ResponseGrounder but bypassed it — policy contradictions in catalog responses or fallback text were not caught. Closing this correctness gap that existed since Phase 2.

**Tradeoff:** ~2ms additional processing per response. Grounding thresholds may need tuning for production.

---

## 2026-05-16: On-Hold Timeline Shows Paused Steps (Phase 4 Refinement)

**Considered:** Hide timeline for on_hold vs show completed steps with "Paused" indicator at current step vs show all steps with "On Hold" marker.

**Chose:** Show completed steps (filled circles), amber (`#b8860b`) "Paused" indicator at current step, dimmed future steps. Visually communicates "your order is paused," not "your order is progressing."

**Because:** Users need to see where the hold happened. Hidden timeline is confusing ("is my order lost?"). Full timeline with distinct marker provides clearest signal. Amber distinguishes from cancelled (red) and active (green).

**Tradeoff:** Three distinct timeline styles (active, cancelled, on-hold) means more CSS and rendering branches.

---

## 2026-05-17: Keyword-Based Escalation Detection (Phase 5)

**Considered:** LLM-based classification vs sentiment analysis API vs keyword-based (explicit handoff keywords + frustration keywords + non-resolving message count).

**Chose:** Keyword-based with three triggers: explicit ("talk to human", "speak to agent"), frustration ("useless", "terrible"), and 3+ non-resolving messages.

**Because:** Zero API cost. Deterministic — exact matching, no ambiguity. Testable — each keyword group has dedicated tests. Non-resolving counter handles "silent frustration" without explicit complaint.

**Tradeoff:** Cannot detect novel frustration phrases not in keyword list. List needs maintenance.

Source: `src/services/escalationDetector.ts` lines 10-23, 40.

---

## 2026-05-17: Escalation State Machine with Valid Transition Matrix (Phase 5)

**Considered:** Unrestricted transitions vs hard-coded if/else vs explicit valid transition matrix.

**Chose:** Explicit `VALID_TRANSITIONS` record mapping each `EscalationStatus` to allowed `EscalationEvent` values. Invalid transitions return false silently.

**Because:** Security — prevents invalid state jumps causing undefined behavior. Testable — each transition explicitly verifiable. Self-documenting — single source of truth for allowed flows: IDLE→OFFERED, OFFERED→CONFIRMING/CANCELLED, CONFIRMING→QUEUED/CANCELLED, etc.

**Tradeoff:** More code than if/else, but worth it for a security-sensitive human handoff flow.

Source: `src/services/escalationStateMachine.ts` lines 9-18.

---

## 2026-05-17: localStorage Persistence for Escalation State (Phase 5)

**Considered:** No persistence vs session storage vs localStorage.

**Chose:** localStorage with graceful fallback — state persists across page refreshes; if unavailable or corrupted, initializes to IDLE silently.

**Because:** Users may refresh during escalation — losing progress would be frustrating. Graceful fallback prevents errors. No sensitive data stored (status, position — not PII).

**Tradeoff:** Corrupted JSON silently loses escalation progress. Catch block creates fresh state with no warning.

Source: `src/services/escalationStateMachine.ts` lines 127-134 (load), 136-141 (save).

---

## 2026-05-17: Pipeline Position — Escalation After Off-Topic (Phase 5)

**Considered:** Escalation at pipeline start vs end vs after off-topic, before order detection.

**Chose:** Escalation at pipeline step 2 — after off-topic, before order/catalog. Active escalations short-circuit rest of pipeline.

**Because:** Off-topic users shouldn't be offered handoff (weather, not store issues). Order detection must be bypassed when escalation is active — queries during escalation should not trigger lookups. Short-circuit: `if (isActive())` returns early with current system message.

**Tradeoff:** If escalation cancelled and user immediately asks order question, one extra pipeline round-trip. Negligible.

Source: `shopify-widget/src/ChatWidget.ts` lines 572-596.

---

## 2026-05-17: Queue Position from ChatWidget (Not State Machine)

**Considered:** Queue position in EscalationStateMachine vs generated in ChatWidget vs from EscalationQueueSimulator service.

**Chose:** ChatWidget generates via `Math.floor(Math.random() * 5) + 1`. `EscalationQueueSimulator` class available for interval-based updates (not wired).

**Because:** Simpler — no state machine update needed for position. Queue simulator available for future enhancement (8s refresh). Position not stored in state machine (W-01 in code review).

**Tradeoff:** Position not persisted across page refreshes. `EscalationQueueSimulator` is dead code (noted in review).

Source: `shopify-widget/src/ChatWidget.ts` lines 708-709.

---

## 2026-05-17: Widget Bundle Format — IIFE Over ESM for Shopify Embedding

**Considered:** ES module (`<script type="module">`) vs IIFE (`<script src="...">`).

**Chose:** IIFE via Vite library mode (`formats: ['iife']` in `vite.config.ts`).

**Because:** Widget must embed in any Shopify theme via simple `<script>` tag — no module loader, no importmap. ES modules require `type="module"` with CORS restrictions that fail in older Shopify themes. IIFE exposes `ChatWidget` as global, callable via `new ChatWidget()` from inline script. Must set default export in source and `exports: 'default'` in rollup output. Tested via `domSnapshot.spec.ts`.

**Tradeoff:** IIFE bundles slightly larger (no cross-module tree-shaking). Global namespace pollution acceptable since `ChatWidget` is unique.

Source: `shopify-widget/vite.config.ts` (lines 8-10), `shopify-widget/src/ChatWidget.ts`, `e2e/specs/domSnapshot.spec.ts`.

---

## 2026-05-17: E2E Assertion Fix — toContainText Over toBeVisible for Dynamic Content

**Considered:** `toBeVisible()` for content vs `toContainText()`.

**Chose:** `toContainText()` for content assertions, `toBeVisible()` only for structural elements (chat window open/close).

**Because:** `toBeVisible()` passes as soon as bubble DOM appears, but text may still be placeholder/sending state. `toContainText('Classic Hoodie')` waits until actual content contains expected string. Tests were flaky — sometimes passing on "Let me look that up..." (visible bubble, wrong content). Fix made all 12 E2E tests consistently green.

**Tradeoff:** Slightly slower assertions (Playwright retries). Acceptable for reliability.

Source: `e2e/specs/catalogQuery.spec.ts`, `e2e/specs/stockCheck.spec.ts`.

---

## 2026-05-17: Playwright Config — Build Pipeline + No Reuse Server

**Considered:** Serve pre-built files (fast but stale) vs single serve with `reuseExistingServer: true` vs build pipeline + `reuseExistingServer: false`.

**Chose:** Build pipeline (`tsc → vite build → serve`) with `reuseExistingServer: false`.

**Because:** Widget TypeScript must be compiled before serving. `reuseExistingServer: false` ensures fresh widget build on every run. Full pipeline ~20s (tsc: 5s, vite build: 3s, serve: instant). Command runs from `cwd: '..'` so configs resolve correctly. Previously widget HTML loaded failing ES module — build pipeline guarantees IIFE bundle is current.

**Tradeoff:** ~20s vs instant startup for pre-built. Acceptable for correctness.

Source: `e2e/playwright.config.ts` lines 13-19.

---

## 2026-05-17: In-Browser Semantic Routing with @huggingface/transformers (Phase 6)

**Considered:** Transformer.js npm bundler import (`@huggingface/transformers`, all-MiniLM-L6-v2, 22MB) vs CDN dynamic import vs ONNX Runtime Web vs keep pure keyword detection (judge score 58/100).

**Chose:** npm bundler import with `Xenova/all-MiniLM-L6-v2`. Singleton `SemanticRouter` shared across 3 detectors (catalog, off-topic, order). Lazy-load model on first query. Pre-computed reference embeddings at build time. 5-8 reference phrases per intent category. 0.6 confidence threshold for semantic result, keyword fallback below. Silent fallback to keywords on model failure with one retry.

**Because:** Directly addresses judge's core finding (#58/100, "no real semantic routing") — transforms rule-based chatbot to AI-augmented agent. Zero API cost — embeddings compute locally <50ms. Zero privacy exposure — queries never leave browser. Hybrid belt-and-suspenders: semantic handles typos/synonyms/natural phrasing, keywords ensure known phrases always work. Pre-computed embeddings mean runtime is just cosine similarity (<1ms). npm import gives cleanest build pipeline integration.

**Tradeoff:** ~30MB model download on first query (~1-2s). Mitigated by IndexedDB caching (instant later loads) and "Loading AI model…" UX with query queuing. Build-time embedding generation adds ~2-3s to build.

Source: `.planning/phases/06-semantic-ai-router/06-AI-SPEC.md` — 34 decisions across 9 gray areas.

---

## 2026-05-18: D-01 — Cloudflare Workers Proxy Platform

**Considered:** Vercel Edge Functions (100k req/month free) vs Cloudflare Workers (100k req/day free) vs Deno Deploy (100k req/month free).

**Chose:** Cloudflare Workers with TypeScript + `wrangler` CLI. Standalone `shopify-proxy/` directory with its own `package.json`, `wrangler.toml`, and `src/worker.ts`.

**Because:** Best free tier (100k/day), native Web Crypto API for HMAC, excellent `wrangler dev` DX, edge-native deployment.

**Tradeoff:** Requires Cloudflare deployment. Local dev needs `wrangler dev` (spawns `workerd` process).

---

## 2026-05-18: D-02 — HMAC Request Authentication

**Considered:** No auth (open proxy) vs API key in header vs HMAC-SHA256 with shared secret.

**Chose:** HMAC-SHA256 with shared secret via ChatWidget constructor option. Browser signs `orderNumber + emailHash + timestamp` with `crypto.subtle.sign()`. Worker verifies with `crypto.subtle.verify()` (constant-time).

**Because:** Directly addresses judge's concern about client-side data exposure. HMAC prevents arbitrary third parties from using proxy. Timestamp prevents replay attacks within 5-minute window. No server-side state.

**Tradeoff:** Shared secret in widget bundle — same risk profile as Storefront API token. Deployment-specific rotation recommended.

---

## 2026-05-18: D-03 — Shopify Admin GraphQL API

**Considered:** Admin REST API (simpler, full objects) vs Admin GraphQL API (query only needed fields).

**Chose:** GraphQL Admin API. Worker queries `orders(first: 1, query: "name:1001")` for status and timeline fields only.

**Because:** GraphQL queries exactly the fields needed (status, timeline, customer email), making filtered response contract implicit in the query. More efficient than REST for partial data.

**Tradeoff:** GraphQL syntax more complex than REST. API version `2025-07` must match store's Admin API version.

---

## 2026-05-18: D-04 — Shopify Storefront API for Catalog

**Considered:** Admin API (server-side only, needs secret) vs Storefront API (public, client-side designed).

**Chose:** Shopify Storefront API for catalog reads. GraphQL `products(first: 250)` query. Optional `X-Shopify-Storefront-Access-Token` header.

**Because:** Storefront API is designed for public store data. No secret key needed for basic published products (some stores may require public token). Real-time inventory.

**Tradeoff:** May require public token depending on store config. Token is safe client-side since it only exposes public data.

---

## 2026-05-18: D-05 — Policy Data Source (Markdown Frontmatter)

**Considered:** Separate JSON config vs Shopify Admin API policies endpoint vs Markdown with frontmatter YAML.

**Chose:** Markdown file with frontmatter YAML (`policies.md`). Fetched client-side via `fetch()` — no proxy needed (public data). PolicyService takes `policyUrl` option (default: `./policies.md`).

**Because:** Simplest approach — works offline, zero API dependency. Frontmatter YAML gives structured fields for widget. Markdown body provides human-readable text. Merchant edits one file.

**Tradeoff:** Requires file editing, not dashboard UI. No audit trail beyond git.

---

## 2026-05-18: D-06 — Fallback to Mock Data

**Considered:** Remove mock data entirely vs keep as default with live as opt-in.

**Chose:** Keep mock data sources as fallback. Toggle via `dataSource: { catalog, order, policy }` option in ChatWidget constructor. Default: all mock.

**Because:** Demo environment may not have live Shopify store. Tests still use mock (deterministic, fast, no network). Migration path: set `dataSource: { catalog: 'live', order: 'live' }` when ready.

**Tradeoff:** Two code paths to maintain. Widget defaults to non-production behavior unless configured.

---

## 2026-05-18: D-07 — Proxy Request Contract

**Considered:** Full email in request vs email hash only + HMAC.

**Chose:** Request body: `{ orderNumber, emailHash (SHA-256), timestamp, hmac }`. Email hash computed client-side via `crypto.subtle.digest('SHA-256')`. HMAC signs `orderNumber + emailHash + timestamp`. Timestamp validated within 5-minute window.

**Because:** SHA-256 is standard, built into browsers via SubtleCrypto. Proxy never receives raw email addresses. Timestamp prevents replay without server-side session state.

**Tradeoff:** Email hash is deterministic — same email always produces same hash (limited privacy improvement). Acceptable since proxy only returns status data.

---

## 2026-05-18: D-08 — Proxy Response Contract

**Considered:** Pass through full Shopify Admin API response vs filter to status-only fields.

**Chose:** Return only: `{ found, status, estimatedDelivery, timeline }`. On error: HTTP status + JSON `{ error: true, code, message }`. Error codes: `not_found`, `email_mismatch`, `proxy_error`, `invalid_hmac`, `invalid_request`.

**Because:** Minimal data exposure — widget already knows how to render these fields (OrderCard). Structured error codes let widget handle each case specifically.

**Tradeoff:** If widget needs additional fields in future, proxy must be updated.

---

## 2026-05-18: D-09 — Local Development Workflow

**Considered:** Cloudflare Dashboard for env vars vs `.env` file + `wrangler dev`.

**Chose:** `wrangler dev` runs locally on `localhost:8787`. Root `package.json` gets `dev:proxy` script. Configuration via `.env` (not `wrangler.toml [vars]`).

**Because:** `.env` is more portable and familiar. `wrangler dev` is standard CF Workers local dev. `.env` gitignored, `.env.example` committed with placeholders.

**Tradeoff:** `wrangler dev` requires Node.js and `workerd` binary.

---

## 2026-05-18: D-10 — Shopify Credential Setup

**Considered:** Shopify OAuth app vs custom app + Admin API token.

**Chose:** Shopify Partners account → dev store → custom app → Admin API token. Stored as `SHOPIFY_ADMIN_TOKEN` in worker `.env`. Store domain similarly.

**Because:** Custom app + Admin API token is standard non-OAuth approach for server-to-server. Per hackathon setup instructions (`docs/hackathon.md`).

**Tradeoff:** Admin API token has full write access to store. Must stay secret (never client-side).

---

## 2026-05-18: D-11 — Order Lookup Error Handling

**Considered:** Fail immediately vs retry then fail vs retry then silently fall back to mock data.

**Chose:** Automatic retry once after 2s. If retry fails, silently fall back to MockOrderDataSource. User still gets order status response.

**Because:** Best UX — user isn't blocked by transient API issues. Mock data may be stale but order lookup primarily shows the experience.

**Tradeoff:** If proxy is down, users see potentially stale order data. Acceptable for demo.

---

## 2026-05-18: D-12 — Catalog Error Handling

**Considered:** Fall back to mock catalog vs show user-visible error.

**Chose:** Show "Product catalog is temporarily unavailable." No fallback to mock.

**Because:** Catalog data changes frequently — stale mock could mislead about actual availability and pricing.

**Tradeoff:** Users can't browse during catalog outage. Acceptable for a support agent (not storefront).

---

## 2026-05-18: D-13 — Policy Error Handling

**Considered:** Error with no fallback vs hardcoded fallback text.

**Chose:** Built-in fallback: "Please check our store policies for the most current information."

**Because:** Policy text is relatively stable. Fallback is truthful and directs users to authoritative source.

**Tradeoff:** Users don't get a specific answer. Directed to store's actual policy page.

---

## 2026-05-18: D-14 — Silent Data Source Mode

**Considered:** Show data source badge ("Live"/"Demo") vs no indication.

**Chose:** Silent — no data source indicator. Widget works identically regardless of backend.

**Because:** Users don't need to know data source. Experience is the same. Badge causes confusion ("why is my live store showing 'Demo'?").

**Tradeoff:** Developers cannot visually confirm active data source.

---

## 2026-05-19: D-01 — Quick Action Chips Placement (Phase 8)

**Context:** Judge identified "blank screen" as UX problem — users need clear first-action affordances.

**Decision:** 4 action chips as inline `<button>` elements in a flex row below the textarea. Disappear after first message. Same Berkeley Mono font and hairline borders.

**Rationale:** Always visible — below input follows natural F-pattern (read → type → see suggestions). Terminal aesthetic preserved via CSS variables. Disappearance reduces noise for returning users.

**Tradeoff:** Chips add vertical space below input. Acceptable for guiding first-time users.

---

## 2026-05-19: D-02 — Onboarding State (Phase 8)

**Context:** Judge finding #58 cited "blank screen leaves users stranded" on first open.

**Decision:** On first open (no conversation history), show subtle hint: "[+] Ask about products, track orders, or check policies. Type naturally — I understand typos."

**Rationale:** Single line, no popup, no dismissable welcome (respects D-14). Sets expectations for natural language handling. Removed on first send — disappears naturally in conversation flow.

**Tradeoff:** Users who don't read hint may still be briefly confused. Visible textarea cursor mitigates.

---

## 2026-05-19: D-03 — Realtime Channel Choice (Phase 8)

**Context:** Human handoff needs realtime messaging. Options: Supabase Realtime, custom WebSocket, polling queue.

**Decision:** Supabase Realtime (WebSocket, free tier: 50 concurrent, 2GB bandwidth).

**Rationale:** Free tier handles demo. True bidirectional communication via `supabase.channel('support-queue').subscribe()`. Agent console subscribes to same channel. Deployable in 30 minutes with free Supabase account.

**Tradeoff:** Requires Supabase account. Not configurable via constructor (deferred). If Supabase unavailable, shows "unavailable" message (D-12).

---

## 2026-05-19: D-04 — Agent Console Scope (Phase 8)

**Context:** Need human agent UI to prove real handoff in demo.

**Decision:** Single HTML page — active requests sidebar, chat history right pane, agent types responses. Standalone — no framework, no build step.

**Rationale:** MVP — shows judge handoff is real, not a full helpdesk. Supabase channel sends responses back to widget. No server needed.

**Tradeoff:** No demo authentication — uses fixed `agentId: 'agent-1'`. Production would use Supabase RLS.

---

## 2026-05-19: D-05 — Demo Video Structure (Phase 8)

**Context:** Hackathon requires 3-5 minute demo video covering all features.

**Decision:** 4-minute structure: (1) 0:00-0:30 Introduction, (2) 0:30-1:30 Semantic understanding (typo/synonym handling), (3) 1:30-2:30 Product → order tracking journey, (4) 2:30-3:30 Live human handoff, (5) 3:30-4:00 Architecture summary.

**Rationale:** User records personally after code freeze per user request. Unlisted YouTube or Google Drive link in README.

**Tradeoff:** Video quality/timing depend on user availability.

---

## 2026-05-19: D-06 — Supabase Credential Strategy (Phase 8)

**Considered:** Constructor options vs data attributes vs hardcoded constants.

**Chose:** Hardcoded inline constants in ChatWidget.ts. `.env.example` documents where to get values. Supabase URL and anon key are safe to expose (RLS design).

**Because:** Simplest for demo. Anon key is public by design. Post-hackathon flexibility deferred.

**Tradeoff:** Must be manually updated per deployment. No runtime configurability.

---

## 2026-05-19: D-07 — Action Chip Behavior (Phase 8)

**Considered:** All chips insert text into textarea vs mixed (some insert, some send immediately) vs all send immediately.

**Chose:** Track Order inserts "track order #" (user fills number). Check Stock inserts "check stock for " (user fills product). Return Item sends immediately. View Policies sends immediately.

**Because:** Chips needing variable input go to textarea for completion. Self-contained queries send without extra steps.

**Tradeoff:** Inconsistent — three require action, two send immediately. Users must learn which does what.

---

## 2026-05-19: D-08 — Action Chip Persistence (Phase 8)

**Considered:** Never show after first use (localStorage flag) vs reappear every page refresh until first message sent.

**Chose:** Reappear on every page load until user sends first message in that session. Check against conversation history length — no localStorage flag.

**Because:** Simplest implementation. Returning users who refresh see chips until they send another message — fine since chips are helpful.

**Tradeoff:** Users refreshing mid-conversation see chips again.

---

## 2026-05-19: D-09 — Agent Console Interaction Model (Phase 8)

**Considered:** Immediate connection (agent starts typing) vs accept-first flow.

**Chose:** Accept-first. Handoff requests appear in sidebar (user ID, conversation preview). Agent clicks Accept to see full transcript and respond.

**Because:** More realistic demo — shows handoff is deliberate human action, not automatic script.

**Tradeoff:** Users wait longer while agent evaluates. Acceptable for demo.

---

## 2026-05-19: D-10 — Agent Console Layout (Phase 8)

**Considered:** Split view (sidebar + chat pane) vs two-step (request list → chat page).

**Chose:** Split view — left sidebar (pending requests), right pane (chat for accepted request).

**Because:** Shows both views simultaneously. Professional appearance. Matches helpdesk tool patterns.

**Tradeoff:** More complex HTML/CSS. Must handle responsive layout.

---

## 2026-05-19: D-11 — Agent Console Input Method (Phase 8)

**Considered:** Single-line input + send button vs multi-line textarea.

**Chose:** Multi-line textarea, matching the widget's input UX.

**Because:** Allows longer, more detailed responses. Consistent with customer-facing widget.

**Tradeoff:** Textarea takes more vertical space.

---

## 2026-05-19: D-12 — Escalation Fallback Strategy (Phase 8)

**Considered:** Keep simulators (EscalationQueueSimulator + HumanAgentSimulator) as fallback vs graceful failure message.

**Chose:** Graceful failure. If Supabase unconfigured or channel fails: "Human support is currently unavailable. Please try again later." User stays in normal flow.

**Because:** Simulators are fake — keeping them means handoff demo isn't real. Better to show honest unavailability.

**Tradeoff:** If Supabase is down during demo, handoff cannot be demonstrated.

---

## 2026-05-19: D-13 — Supabase Channel Architecture (Phase 8)

**Considered:** Single channel with broadcast event types vs per-conversation channels.

**Chose:** Single 'support-queue' channel with distinct broadcast events: `handoff_request`, `handoff_accepted`, `agent_message`.

**Because:** Single channel simplifies subscription management. Event types route correctly without multiple subscriptions.

**Tradeoff:** All traffic shares one channel. At high scale, event filtering adds overhead.

---

## 2026-05-19: D-14 — Demo Video (Phase 8)

**Considered:** Record during development vs after code freeze vs user handles personally.

**Chose:** User handles personally after code freeze. Not in implementation scope. Unlisted YouTube or Google Drive link in README.

**Because:** Video needs specific Shopify store, catalog, and narration style that user controls best.

**Tradeoff:** Quality/timing depend on user availability after code freeze.

---

## 2026-05-19: Phase 1 — Security Hardening for Order Lookup Pipeline

**Considered:** Keeping wildcard CORS, no rate limiting, client-side HMAC secret, minimal validation.

**Chose:** Defense-in-depth: (1) Configurable CORS allowlist (defaults localhost), (2) In-memory rate limiting (20 req/60s per IP, configurable), (3) Server-side HMAC secret only, (4) Comprehensive input validation with sanitization, (5) Structured JSON logging with request lifecycle, (6) Six security headers (CSP, HSTS, X-Frame-Options, etc.), (7) Shopify API response validation before client return.

**Because:** Judge verdict (58/100, Bronze) criticized "client-side security risks" and "hardcoded data." Order lookup handles sensitive customer data and accesses Shopify Admin API — must be production-grade. Cloudflare Workers provide secure edge runtime; we leverage fully.

**Tradeoff:** In-memory rate limiting resets on redeploy (KV persistence later). CORS allowlist needs per-environment config. Validation adds ~5ms/request (negligible vs Shopify API latency).

**Files Changed:** `shopify-proxy/src/worker.ts`, `src/services/shopifyOrderProxyDataSource.ts`, `shopify-proxy/test/worker.test.ts` (9 new security tests), `src/services/shopifyOrderProxyDataSource.test.ts`, `docs/PHASE1_SECURITY.md`.

**Test Results:** 607 tests passing (30 test files).

---

## 2026-05-19: 5-Phase Roadmap Restructure

**Considered:** Continue original 8-phase roadmap vs collapse to 5 priority phases aligned with judge feedback.

**Chose:** 5-phase rebuild: (1) Security Hardening ✓, (2) Semantic Router ✓, (3) Realtime Human Handoff ✓, (4) Dynamic Store Sync ✓, (5) UX Refinement (planned).

**Because:** Judge verdict (58/100) identified critical gaps — mock data as production, simulated handoffs, feature-flagged live sources. 5-phase structure directly addresses each in priority order with live-by-default as core principle.

**Tradeoff:** Original Phases 5-8 (UX, demo, polish) deferred or absorbed into new Phase 5.

---

## 2026-05-19: D-15 — Live-by-Default Data Sources (Phase 4)

**Considered:** Mock default with feature flag for live vs live default, mock only for tests vs hybrid auto-fallback.

**Chose:** Live-by-default. ChatWidget uses `ShopifyStorefrontDataSource` and `ShopifyOrderProxyDataSource` as production defaults. Mock data only for test isolation and offline dev.

**Because:** Judge feedback specifically criticized "hardcoded data treated as production-ready." Live default eliminates this gap. Tests explicitly pass `dataSource: 'mock'`.

**Tradeoff:** Demo needs configured Shopify store or proxy. Offline dev needs explicit mock override.

---

## 2026-05-19: D-16 — Stale Cache Preservation on Sync Failure (Phase 4)

**Considered:** Clear cache on failure (fresh empty) vs retain last-known cache (stale but populated) vs hybrid with staleness indicator.

**Chose:** Retain existing cache on network failure with visible staleness indicator. Complete failure shows polite error.

**Because:** Empty UI is worse than stale data. Users can still see product info even if slightly outdated. Staleness indicator maintains transparency.

**Tradeoff:** Users may see outdated stock/pricing during extended outages. Mitigated by visible staleness indicator.

---

## 2026-05-19: D-17 — SHA-256 Policy Change Detection (Phase 4)

**Considered:** Timestamp-based vs content-length comparison vs SHA-256 content hashing.

**Chose:** SHA-256 via `crypto.subtle.digest('SHA-256')`.

**Because:** Timestamps unreliable (clock drift, CDN caching). Content hashing detects actual changes regardless of metadata. Works consistently across different sources.

**Tradeoff:** Slightly more CPU per check (negligible for text). Requires async digest computation.

---

## 2026-05-19: D-18 — Context-Aware Suggested Action Chips (Phase 5)

**Considered:** Static chips (never change) vs context-aware chips vs no chips.

**Chose:** Context-aware via `SuggestedActionsService` with 6 contexts: `initial`, `product_search`, `stock_check`, `order_tracking`, `policy_query`, `escalation_offer`. Each renders different chips guiding next logical action.

**Because:** Static chips become noise mid-conversation — "Track Order" after product question is unhelpful. Context-aware reduces cognitive load by surfacing only relevant steps. 6 contexts cover full lifecycle: first open → product → stock → order → policy → escalation. Chips as `<button>` elements below input, Berkeley Mono aesthetic.

**Tradeoff:** More complex context determination. Each transition requires chip re-render. 67 new tests cover all transitions and behaviors.

---

## 2026-05-19: D-19 — Prefix-Matching Autocomplete (Phase 5)

**Considered:** No autocomplete vs Levenshtein fuzzy matching vs prefix matching (starts-with) for product names and order numbers.

**Chose:** Prefix matching via `AutocompleteService`. Triggers after 2+ characters, up to 5 results. Matches against product names and order number patterns.

**Because:** Prefix matching is fast, deterministic, predictable — users understand why results appear. 2-character threshold prevents premature suggestions. 5-result cap keeps dropdown manageable. Reduces typing effort and prevents misspelled queries. Works offline — no network, matches loaded catalog.

**Tradeoff:** "clasic hoodie" won't match "Classic Hoodie" (mid-word typos). Mitigated by semantic router's typo tolerance on the actual query.

---

## 2026-05-19: D-20 — Adaptive Onboarding with localStorage (Phase 5)

**Considered:** Persistent tooltip (must dismiss) vs one-time never reappears vs adaptive with time-based expiry.

**Chose:** localStorage-based adaptive onboarding. Subtle hint on first open. Fades after 3s or first interaction. 7-day expiry returns after a week.

**Because:** Respects D-14 (no welcome message) — no popup, no forced interaction. 3-second fade is fast enough not to annoy, slow enough to read. 7-day expiry balances occasional vs daily users. Interaction-based dismissal means engaged users never see fade-out. Namespaced localStorage key avoids collisions.

**Tradeoff:** Users clearing localStorage see onboarding again. Shared/public device users may see repeatedly. Acceptable.

---

## 2026-05-20: D-01 — Return Service Enabled by Default (v1.1)

**Considered:** Keep feature-flagged (disabled) vs enable by default vs keep disabled with explicit opt-in.

**Chose:** Enable by default — `enableReturnService` defaults to `true` in ChatWidget constructor.

**Because:** Manual testing revealed "item is defective", "wrong size", "changed my mind" all fell to generic fallback. ReturnService already has the keyword detection and eligibility logic — it just wasn't wired in. Enabling it closes the biggest response quality gap.

**Tradeoff:** Return flow requires order number + email — users without order context get prompted for it. Acceptable — better than fallback.

Source: `shopify-widget/src/ChatWidget.ts` line 154.

---

## 2026-05-20: D-02 — Compound Query Handling (v1.1)

**Considered:** Split on "and"/"but" and process separately vs detect dual intent and answer both vs ignore second part.

**Chose:** Detect queries with BOTH catalog AND policy intent, process catalog first, append policy response.

**Because:** "is the hoodie in stock and can I return it" was losing the catalog part because policy check caught "return" first and returned early. Dual-intent detection preserves both answers.

**Tradeoff:** Adds regex overhead per query. Only triggers when both intents present — negligible impact.

Source: `shopify-widget/src/ChatWidget.ts` lines 792-825.

---

## 2026-05-20: D-03 — Warranty Keyword Mapping (v1.1)

**Considered:** Map defect/damaged to return policy vs warranty policy vs generic fallback.

**Chose:** Map "defective", "damaged", "broken", "not working", "malfunction" → warranty response with 1-year coverage details.

**Because:** Defective items are a warranty issue, not just a return. Users need to know about warranty coverage first. Response includes both warranty info and return option.

**Tradeoff:** Some users may want immediate return without warranty discussion. Response mentions both paths.

Source: `shopify-widget/src/ChatWidget.ts` lines 745-748.

---

## 2026-05-20: D-04 — Order Number Format Expansion (v1.1)

**Considered:** Keep `#1234` only vs add `ORD-XXXX` vs support all Shopify formats.

**Chose:** Add `ORD-XXXX` pattern to both detection regex and extraction patterns.

**Because:** Shopify order numbers come in multiple formats. `ORD-5678` was not recognized, causing fallback. Both `#1234` and `ORD-5678` now work.

**Tradeoff:** Still doesn't cover all possible Shopify formats (e.g., custom prefixes). Covers the two most common.

Source: `src/services/orderIntentDetector.ts` lines 42, 204-223.

---

## 2026-05-20: D-05 — Context Limit Increased to 20 Turns (v1.1)

**Considered:** Keep 3-turn limit vs increase to 10 vs increase to 20.

**Chose:** 20 turns with 5-minute TTL.

**Because:** 3 turns was too restrictive for natural conversations — users refining product queries or going through order auth flow often exceeded it. 20 turns covers realistic support interactions while still having a bound.

**Tradeoff:** More memory per conversation. 5-minute TTL still prevents stale context.

Source: `src/services/catalogIntentDetector.ts` line 28, `src/services/orderIntentDetector.ts` line 28.

---

## 2026-05-20: D-06 — HTML Sanitizer Class Whitelist (v1.1)

**Considered:** Keep stripping all classes vs allow specific classes vs switch to DOMPurify.

**Chose:** Whitelist approach — allow order card classes (`oc-*`), response surface classes (`rs-*`), and product card classes (`pc-*`) through the sanitizer.

**Because:** The sanitizer was stripping ALL CSS classes from OrderCard HTML, turning styled cards into plain unstyled text. Whitelist is safer than disabling sanitization entirely, more targeted than DOMPurify for now.

**Tradeoff:** New component classes must be added to whitelist. DOMPurify still recommended for production.

Source: `shopify-widget/src/renderers/renderMessage.ts` lines 4-37.

---

## 2026-05-20: D-07 — Action Chip Context Awareness (v1.1)

**Considered:** Keep static chips vs inject product/order names dynamically vs full AI-generated suggestions.

**Chose:** Inject product name into stock check chip, order number into return chip based on last result.

**Because:** "Is this in stock?" is vague after viewing a specific product. "Is Classic Hoodie in stock?" is clearer. Same for returns — "return items from order #1001" beats generic "start a return".

**Tradeoff:** Requires passing last result through the pipeline. Added `_lastResult` field to ChatWidget.

Source: `src/services/suggestedActions.ts`, `shopify-widget/src/ChatWidget.ts`.

---

## 2026-05-20: D-08 — Policy Routing Priority Fix (v1.1)

**Considered:** Keep order detection before policy vs check policy keywords first vs semantic routing only.

**Chose:** Check policy keywords (shipping, return, warranty, etc.) BEFORE order tracking.

**Because:** "shipping" queries were hitting order flow instead of policy flow — "shipping" matched order tracking intent. Policy check first prevents this misrouting.

**Tradeoff:** Policy check adds one more pipeline step for order queries. Negligible.

Source: `shopify-widget/src/ChatWidget.ts` lines 864-873.

---

## 2026-05-19: D-21 — Live-by-Default Data Sources Enforced (Phase 9)

**Considered:** Keep D-15 as declared but not fully wired vs re-affirm and wire end-to-end vs keep mock default for demo.

**Chose:** Re-affirm D-15 and enforce end-to-end. Demo `index.html` passes `proxyUrl`, `hmacSecret`, `storeDomain`, `storefrontToken` with placeholder values and comments. `dataSource` defaults to mock only as fallback when proxy unavailable.

**Because:** Phase 4 declared live-by-default but demo was `new ChatWidget()` with no options — mock was still effective default. Phase 9 closes the gap: developer replaces placeholders and gets live data immediately. Fallback to mock (D-06) remains for offline dev and test isolation.

**Tradeoff:** Demo page has placeholder credentials needing manual replacement. Widget silently falls back to mock if proxy fails.

Source: `shopify-widget/index.html`, `.planning/phases/09-gap-closure/09-02-PLAN.md` (W5 fix).

---

## 2026-05-19: D-22 — Stale Cache Preservation Refined (Phase 9)

**Considered:** Keep D-16 as-is vs add staleness indicators to UI vs clear cache for accuracy.

**Chose:** Retain D-16's stale cache preservation. Phase 9 verified it works correctly with live sources — sync managers retain last-known cache on failure, widget continues serving cached data with no visible staleness indicator (per D-14).

**Because:** Phase 4 decision was sound — empty UI worse than stale data. Phase 9 confirmed sync managers handle failures gracefully and widget doesn't break when live sources are unavailable.

**Tradeoff:** No visible staleness indicator (per D-14). Users can't tell data status during outage.

Source: `src/services/catalogSyncManager.ts`, `src/services/policySyncManager.ts`.

---

## 2026-05-19: D-23 — SHA-256 Policy Change Detection Verified (Phase 9)

**Considered:** Keep D-17 as-is vs switch to timestamp-based vs add content-length pre-check.

**Chose:** Retain D-17's SHA-256 approach. Phase 9 verified `crypto.subtle.digest('SHA-256')` works correctly with live policy fetch and hash comparison detects changes. No changes needed.

**Because:** Content hashing is more reliable than timestamps (no clock drift, no CDN caching issues). Phase 9's semantic policy routing (D-24/W4) works with same policy data — hash detection ensures both router and service use same version.

**Tradeoff:** Async digest per check (negligible for text). No fast pre-check — full SHA-256 every time.

Source: `src/services/policyService.ts`, `src/services/policySyncManager.ts`.

---

## 2026-05-19: D-24 — Gap Closure: Auto-Fix vs Manual Review (Phase 9)

**Considered:** Manual review (slower, safer) vs auto-fix all at once (fast, risky) vs categorized (auto-fix blockers, manual review warnings) vs hybrid (plan each fix, execute autonomously, verify with tests).

**Chose:** Hybrid — each gap planned individually (09-01-PLAN.md, 09-02-PLAN.md), executed autonomously by subagents, verified against full test suite (607 tests). Blockers (B1: missing import, B2: HTML rendering) fixed first. Warnings (W2: grounding, W4: semantic routing, W5: proxy wiring, W6: emoji replacement) second. Dead code removal last.

**Because:** Blockers needed immediate attention — TypeScript compilation failing (B1), order cards broken (B2). Each fix had clear verification (grep patterns, test pass rate). Autonomous execution with tests ensured no regressions. Plan-then-execute allowed deviations (e.g., `classifyFromPhrases()` instead of `classify()` when plan's approach proved incompatible with SemanticRouter API). 607 tests passing after both plans confirmed no regressions.

**Tradeoff:** Two-plan approach took longer than single auto-fix pass. Categorization prevented cascading failures — B1 fix ensured compilation before touching rendering.

Source: `.planning/phases/09-gap-closure/09-01-PLAN.md`, `09-01-SUMMARY.md`, `09-02-PLAN.md`, `09-02-SUMMARY.md`.

---

## v1.1 Milestone Summary

**Shipped:** 2026-05-20 | **Duration:** 1 day (May 20) | **Commits:** 7 | **Changes:** 12

### What Changed

A focused UX polish pass addressing response quality gaps found during manual testing:
- **Return flow enabled** — `enableReturnService` defaults to `true`, return keywords (defective, wrong size, changed my mind) now trigger return flow instead of fallback
- **Compound query handling** — queries with both catalog AND policy intent (e.g., "is the hoodie in stock and can I return it") now answer both parts
- **Warranty keyword mapping** — "defective", "damaged", "broken", "not working" → warranty response instead of fallback
- **Order number format** — `ORD-XXXX` pattern now recognized alongside `#1234`
- **Context-aware chips** — action chips now reflect specific product/order being discussed
- **Order card rendering** — CSS class whitelist in sanitizer allows styled order cards through
- **Conversational responses** — catalog templates rewritten for natural tone
- **Context limit** — increased from 3 to 20 turns for longer conversations
- **Refresh button** — chat header now has reset button
- **Policy routing fix** — policy keywords checked before order tracking to prevent "shipping" misrouting
- **Off-topic fixes** — word-boundary regex prevents substring false positives
- **Size synonyms** — full size names added to synonym table to prevent "extra large" matching "Large"

---

## v1.0 Milestone Summary

**Shipped:** 2026-05-19 | **Duration:** 7 days (May 12–19) | **Phases:** 9 | **Commits:** 141 | **Tests:** 607 passing (30 files) | **Lines:** ~8,000+ TypeScript

### What Was Built

A "Store-Native" Shopify AI customer support agent with hybrid architecture:
- **In-browser semantic routing** — MiniLM embeddings via transformer.js handle typos, synonyms, natural phrasing
- **Zero-hallucination data retrieval** — all product lookups, stock checks, policy answers use deterministic code, zero LLM calls
- **Live human handoff** — Supabase Realtime WebSocket replaces simulated agents with genuine bidirectional comms
- **Live-by-default data sources** — Shopify Storefront API + Cloudflare Worker proxy for production-grade lookups
- **Context-aware UX** — dynamic action chips, prefix-matching autocomplete, adaptive onboarding

### Requirements Coverage

| ID | Description | Status |
|----|-------------|--------|
| CORE-01 | Live catalog intelligence | SATISFIED |
| CORE-02 | Policy grounding | SATISFIED (grounding enforced in Phase 9) |
| CORE-03 | Off-topic guard | SATISFIED |
| WORK-01 | Order tracking workflow | SATISFIED |
| SAFE-01 | Graceful human handoff | SATISFIED |
| SAFE-02 | UI error handling | SATISFIED |
| SAFE-03 | Network failure handling | SATISFIED |
| JUDGE-01 | Semantic routing | SATISFIED |
| JUDGE-02 | Typo resilience | SATISFIED |
| JUDGE-03 | Natural language variation | SATISFIED (semantic policy routing in Phase 9) |
| JUDGE-04 | Client-side data security | SATISFIED |
| JUDGE-05 | Dynamic store sync | SATISFIED |
| JUDGE-06 | No hardcoded arrays | SATISFIED |
| JUDGE-07 | UI affordances | SATISFIED |
| JUDGE-08 | Real handoff | SATISFIED |
| JUDGE-09 | Demo video | DEFERRED (user handles post-code-freeze) |
| UX-01 | Context-aware actions | SATISFIED (static SUGGESTION_MAP) |
| UX-02 | Autocomplete | SATISFIED |
| UX-03 | Adaptive onboarding | SATISFIED |
| UX-04 | Terminal aesthetic | SATISFIED |
| UX-05 | Zero LLM calls | SATISFIED |

**Score:** 20/21 satisfied, 1 deferred (demo video)

### Known Tech Debt

- ChatWidget is a god class (1,500+ lines) — split into smaller modules
- Hand-rolled HTML sanitization — use DOMPurify for production
- Supabase credentials hardcoded — use env vars / build-time injection
- `as any` assertions in some test files — use proper types

---
