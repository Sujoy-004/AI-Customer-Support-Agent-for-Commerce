# Phase 7: Security & Live Data - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Move sensitive operations behind a serverless backend proxy. Connect catalog and policy data to live Shopify Storefront API. Eliminates the two most serious production-readiness gaps identified by the judge: client-side data exposure and hardcoded static arrays.

**What this phase IS:**
- Serverless order lookup proxy (Cloudflare Worker) — browser sends orderId + emailHash + HMAC, proxy verifies and calls Shopify Admin API
- Shopify Storefront API integration — replaces MockCatalogDataSource for live catalog reads
- Dynamic policy fetching — markdown config file with frontmatter YAML, fetched client-side
- New `ShopifyOrderProxyDataSource` and `ShopifyStorefrontDataSource` implementing existing interfaces
- Update tests to work with both mock and live data sources

**What this phase IS NOT:**
- Not changing the semantic router from Phase 6 (already integrated)
- Not changing the ChatWidget pipeline logic
- Not adding a full backend application server — lightweight serverless functions only
- Not storing order data in a database — proxying to Shopify Admin API
- Not handling auth beyond basic HMAC request validation on the proxy
- Not adding user authentication (OTP, sessions, etc.)
</domain>

<decisions>
## Implementation Decisions

### D-01: Proxy platform
**Decision:** Cloudflare Workers. TypeScript + `wrangler` CLI. Standalone `shopify-proxy/` directory at project root with its own `package.json`, `wrangler.toml`, and `src/worker.ts`.
**Reasoning:** Free tier (100k req/day). `wrangler dev` for local development. Edge-native deployment. Existing CONTEXT.md examples already use CF Worker syntax.

### D-02: HMAC request authentication
**Decision:** Include HMAC signing. Widget signs requests with a shared secret before sending. Worker verifies the HMAC before processing. This prevents arbitrary third parties from using the proxy.
**Reasoning:** Directly addresses the judge's concern about client-side data exposure. HMAC shared secret passed via ChatWidget constructor option.

### D-03: Shopify Admin API protocol
**Decision:** Shopify Admin GraphQL API (not REST). Worker queries orders via GraphQL Admin endpoint.
**Reasoning:** GraphQL allows querying only the exact fields needed (status, timeline). More efficient than REST for filtered responses.

### D-04: Shopify Storefront API for catalog
**Decision:** Use Shopify Storefront API (public, no auth required) for catalog reads. GraphQL for efficient product queries (title, description, variants, inventory).
**Reasoning:** Storefront API is designed for public-facing store data — no key required for basic queries. Inventory data is real-time.

### D-05: Policy data source
**Decision:** Markdown config file with frontmatter YAML. `policies.md` hosted alongside the widget. Merchant edits a markdown file. PolicyService takes a `policyUrl` option (default: `./policies.md` relative to widget). Fetched directly client-side via `fetch()` — no proxy needed since policies are public data.
**Reasoning:** Simplest approach that works offline and has no API dependency. Frontmatter YAML gives structured fields for the widget to use programmatically.

### D-06: Fallback to mock data
**Decision:** Keep mock data sources as fallback. Toggle via `useMockData: true/false` option in ChatWidget constructor.
**Reasoning:** Demo environment may not have a live Shopify store configured. Tests still use mock data (deterministic, fast, no network dependency).

### D-07: Proxy request contract
**Decision:** Request body: `{ orderNumber, emailHash, timestamp, hmac }`. Email hash is SHA-256 (via browser SubtleCrypto API). Timestamp prevents replay attacks (5-min window). HMAC signs `orderNumber + emailHash + timestamp`.
**Reasoning:** SHA-256 is standard, built into browsers. Timestamp + HMAC provides replay protection without requiring server-side session state.

### D-08: Proxy response contract
**Decision:** Return only status-related fields: `{ found, status, estimatedDelivery, timeline }`. Minimal data exposure — widget already knows how to render this via OrderCard. On error: both HTTP status code + JSON body `{ error: true, code: 'not_found'|'email_mismatch'|'proxy_error'|'invalid_hmac', message: '...' }`.
**Reasoning:** Status-only is sufficient for the OrderCard widget. Structured error codes let the widget handle each case specifically.

### D-09: Local development workflow
**Decision:** `wrangler dev` runs the worker locally on `localhost:8787`. Root `package.json` gets a `dev:proxy` npm script. Configuration via `.env` file (not `wrangler.toml [vars]`).
**Reasoning:** `.env` is more portable and familiar. `wrangler dev` is the standard CF Workers local dev approach.

### D-10: Shopify credential setup
**Decision:** Follow `docs/hackathon.md` §"Getting Started with Shopify" — create a Shopify Partners account, dev store, custom app for Admin API access token. Token stored as `SHOPIFY_ADMIN_TOKEN` in worker `.env`. Store domain configured similarly.
**Reasoning:** Custom app + Admin API token is the standard, non-OAuth approach for server-to-server integrations. Per hackathon setup instructions.

### D-11: Error handling — order lookup
**Decision:** Automatic retry once after 2s on proxy failure. If retry also fails, silently fall back to MockOrderDataSource. User still gets an order status response.
**Reasoning:** Best UX — user isn't blocked by transient API issues. Mock data may be stale but order lookup is primarily about showing the experience.

### D-12: Error handling — catalog
**Decision:** Show user-visible error message: "Product catalog is temporarily unavailable." No fallback to mock catalog data.
**Reasoning:** Catalog data changes frequently. Showing stale mock data could mislead users about actual product availability.

### D-13: Error handling — policy
**Decision:** Show built-in fallback text: "Please check our store policies for the most current information."
**Reasoning:** Policy text is relatively stable. Fallback text is truthful and directs users to the authoritative source.

### D-14: Data source mode indication
**Decision:** Silent — no data source indicator shown to the user. Widget works identically regardless of backend.
**Reasoning:** Users don't need to know whether data comes from live API or mock. The experience is the same.

### OpenCode's Discretion
- Exact directory structure of `shopify-proxy/` (package.json, wrangler.toml, src layout)
- Exact GraphQL query shape for Admin API order lookup (fields to request)
- Exact GraphQL query shape for Storefront API catalog fetch
- `ShopifyStorefrontDataSource` implementation details (mapping API response → Product/Variant types)
- `ShopifyOrderProxyDataSource` implementation (fetch, HMAC signing, response parsing)
- `PolicyService` frontmatter parsing implementation
- CSS for error message display
- ChatWidget options interface updates
- Test updates and additions
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth — The Judge's Verdict
- `user_verdict.md` — Sections "Secure Order Lookup", "Dynamic Store Content Sync", "Important security note", "What the Live Shopify API Does and Does Not Solve"
- `docs/hackathon.md` §"Getting Started with Shopify" — Shopify Partners account, dev store, custom app, Admin API setup

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 7 — Goal, success criteria, dependencies
- `.planning/STATE.md` — Current project state

### Prior Phase Context
- `.planning/phases/06-semantic-ai-router/06-CONTEXT.md` — Semantic router decisions, feature flag pattern for data sources
- `.planning/phases/05-graceful-escalation/05-CONTEXT.md` — Pipeline integration pattern
- `.planning/phases/04-order-tracking-workflow/04-CONTEXT.md` — Interface-driven service pattern, ChatWidget pipeline

### Existing Code — Key Interfaces
- `src/services/types.ts` — `CatalogDataSource` interface (line 124), `OrderDataSource` interface (line 173), `Order` type, `Product` type, `Variant` type, `PolicyData` type
- `src/services/orderService.ts` — Constructor takes `OrderDataSource`, delegates all lookups. No changes needed to the service itself.
- `src/services/catalogService.ts` — Constructor takes `CatalogDataSource`. 2-min cache. No changes needed to the service itself.
- `src/services/policyService.ts` — Currently hardcoded mock data. Needs configurable source (markdown file URL).

### Existing Code — What Gets New Implementations
- `src/services/mockOrderData.ts` — Stays as fallback. Add `ShopifyOrderProxyDataSource` alongside.
- `src/services/mockCatalogData.ts` — Stays as fallback. Add `ShopifyStorefrontDataSource` alongside.
- `shopify-widget/src/ChatWidget.ts` — Constructor options for data source selection and proxy URL

### Existing Code — What Stays
- `src/services/catalogIntentDetector.ts` — No changes (Phase 6 handles semantic routing)
- `src/services/orderIntentDetector.ts` — No changes
- `src/services/types.ts` — Existing interfaces are already designed for swappable data sources
- All test files — Tests use mock data, continue passing

### Architecture References
- `TECHNICAL_DOC.md` §1 — Architecture overview shows data layer with swappable sources
- `.planning/codebase/ARCHITECTURE.md` — System architecture patterns
- `.planning/codebase/CONVENTIONS.md` — Code conventions (2-space indent, semicolons, single quotes, etc.)
- `.planning/codebase/STACK.md` — Technology stack
- `.planning/codebase/CONCERNS.md` §17-19 — Known concerns about Shopify integration, Zero Hallucination compliance

### Shopify API Documentation
- Shopify Admin API (GraphQL): shopify.dev/docs/api/admin-graphql
- Shopify Storefront API: shopify.dev/docs/api/storefront
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ChatWidget constructor options** (`shopify-widget/src/ChatWidget.ts:28-35`) — Existing pattern for injectable services. Phase 7 adds `proxyUrl`, `hmacSecret`, `policyUrl`, and per-service `DataSourceMode` options.
- **OrderCard component** (`shopify-widget/src/ChatWidget.ts`) — Renders order status, timeline, items. Response from live proxy returns the same shape as mock data. Zero UI changes needed.
- **CatalogService** (`src/services/catalogService.ts`) — Already takes `CatalogDataSource` via constructor. Adding `ShopifyStorefrontDataSource` is purely additive.
- **OrderService** (`src/services/orderService.ts`) — Already takes `OrderDataSource` via constructor. Adding `ShopifyOrderProxyDataSource` is purely additive.

### Established Patterns
- **Interface-first design** — Each data source implements a clean interface (`CatalogDataSource`, `OrderDataSource`). Live implementations are drop-in replacements.
- **src/services/ organization** — Each service in its own `.ts` module with `.test.ts` alongside. New data sources follow the same pattern: `shopifyStorefrontDataSource.ts`, `shopifyOrderProxyDataSource.ts`.
- **ChatWidget constructor injection** — Services passed via options object. Phase 7 adds data source selection flags.
- **Mock data as default** — Widget works with mock data out of the box. Live data is opt-in via constructor options.
- **SemanticRouter singleton** (Phase 6) — Intent-only, data-source-agnostic. No changes needed.

### Integration Points
- **ChatWidget constructor** — Add `proxyUrl`, `hmacSecret`, `policyUrl`, `dataSource: { catalog, order, policy }` options
- **ChatWidget._generateAgentResponse()** — Data source selection happens at construction, not per-request. Pipeline logic unchanged.
- **PolicyService constructor** — Add `policyUrl` option for markdown config file
- **New files:** `shopify-proxy/src/worker.ts`, `src/services/shopifyStorefrontDataSource.ts`, `src/services/shopifyOrderProxyDataSource.ts`

### Shopify Admin GraphQL Order Query (decided during discussion)
```graphql
query OrderLookup($query: String!) {
  orders(first: 1, query: $query) {
    edges {
      node {
        id
        name
        displayFulfillmentStatus
        displayFinancialStatus
        createdAt
        estimatedDeliveryDate
        fulfillmentStatus
        timelineItems(first: 10) {
          edges {
            node {
              date
              message
              location
            }
          }
        }
      }
    }
  }
}
```

### Proxy Response Shape
```typescript
interface ProxyOrderResponse {
  found: boolean;
  status?: string;
  estimatedDelivery?: string;
  timeline?: TrackingEvent[];
  error?: string;
  code?: 'not_found' | 'email_mismatch' | 'proxy_error' | 'invalid_hmac';
}
```

### ChatWidget Options Update
```typescript
interface ChatWidgetOptions {
  proxyUrl?: string;          // URL to Cloudflare Worker
  hmacSecret?: string;         // Shared HMAC secret
  policyUrl?: string;          // URL to policies.md (default: ./policies.md)
  dataSource?: {
    catalog?: 'mock' | 'live';
    order?: 'mock' | 'live';
    policy?: 'mock' | 'live';
  };
}
```

### Error Response from Proxy
```typescript
interface ProxyErrorResponse {
  error: true;
  code: 'not_found' | 'email_mismatch' | 'proxy_error' | 'invalid_hmac' | 'invalid_request';
  message: string;
}
```

### HMAC Signing (Browser-Side)
```typescript
async function signRequest(
  payload: { orderNumber: number; emailHash: string; timestamp: number },
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${payload.orderNumber}${payload.emailHash}${payload.timestamp}`);
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Deployment Config
- `shopify-proxy/.env`: `SHOPIFY_ADMIN_TOKEN=xxx`, `SHOPIFY_STORE_DOMAIN=xxx.myshopify.com`, `HMAC_SECRET=xxx`
- `shopify-proxy/wrangler.toml`: name, main, compatibility_date
</code_context>

<specifics>
## Specific Ideas

### Error handling per data source
```
Order lookup  → retry once (2s) → fallback to MockOrderDataSource
Catalog       → fail → "Product catalog is temporarily unavailable."
Policy        → fail → "Please check our store policies for the most current information."
Data source   → silent — no indication to user
```

### Proxy directory structure (OpenCode decides exact layout)
```
shopify-proxy/
├── package.json
├── wrangler.toml
├── .env.example
├── src/
│   └── worker.ts
└── test/
    └── worker.test.ts
```

### Sequence: Order lookup via proxy
```
Browser                    Cloudflare Worker           Shopify Admin API
  │                              │                           │
  │  POST /api/order-lookup      │                           │
  │  { orderNumber,              │                           │
  │    emailHash(SHA-256),       │                           │
  │    timestamp, hmac }         │                           │
  │─────────────────────────────>│                           │
  │                              │  Verify HMAC signature   │
  │                              │  Check timestamp (5m)    │
  │                              │                           │
  │                              │  GraphQL Admin API query │
  │                              │──────────────────────────>│
  │                              │                           │
  │                              │  { orders { edges {      │
  │                              │    node { name, status,  │
  │                              │    timeline } } }        │
  │                              │<──────────────────────────│
  │                              │                           │
  │  { found, status, timeline } │                           │
  │<─────────────────────────────│                           │
```
</specifics>

<deferred>
## Deferred Ideas

- **OTP verification for order lookup** — Judged as out of scope for hackathon. Email match + HMAC is sufficient.
- **Database storage** — No database. Proxy passes through to Shopify APIs.
- **Rate limiting on proxy** — Cloudflare Workers have built-in rate limiting. No custom implementation needed.
- **Multi-store support** — Proxy handles one store for the demo. Configurable for post-hackathon.
- **Custom Shopify app distribution** — Using Admin API via a custom app is sufficient. No public app distribution needed.
- **OAuth 2.0 with PKCE** — Custom app + Admin API token is simpler and appropriate for hackathon scope.
</deferred>

---

*Phase: 07-security-live-data*
*Context gathered: 2026-05-18*
