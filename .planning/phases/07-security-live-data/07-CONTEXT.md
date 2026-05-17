# Phase 7: Security & Live Data - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Move sensitive operations behind a serverless backend proxy. Connect catalog and policy data to live Shopify Storefront API. Eliminates the two most serious production-readiness gaps identified by the judge: client-side data exposure and hardcoded static arrays.

**What this phase IS:**
- Serverless order lookup proxy (Cloudflare Worker or Vercel function) — browser sends orderId + email, proxy returns order status
- Shopify Storefront API integration — replaces MockCatalogDataSource and hardcoded policy text
- Wire new data sources into OrderService, CatalogService, PolicyService
- Update tests to work with both mock and live data sources

**What this phase IS NOT:**
- Not changing the semantic router from Phase 6 (already integrated)
- Not changing the ChatWidget pipeline logic
- Not adding a full backend application server — lightweight serverless functions only
- Not storing order data in a database — proxying to Shopify Admin API
- Not handling auth beyond basic request validation on the proxy

</domain>

<decisions>
## Implementation Decisions

### D-01: Serverless vs. full backend
**Decision:** Serverless functions (Cloudflare Worker / Vercel function). Not a full backend server.
**Reasoning:**
- Hackathon submission must be demonstrable — serverless is deployable in 30 minutes
- No infrastructure to manage — Cloudflare Workers free tier is generous
- The project was designed as browser-side — a full backend would be disproportionate
- Serverless proxy provides the security boundary the judge requires without over-engineering

### D-02: Order lookup flow
**Decision:**
```
Browser ChatWidget
  → POST /api/order-lookup { orderNumber, emailHash }
  → Cloudflare Worker validates HMAC signature (proves request came from our widget)
  → Worker calls Shopify Admin API (REST /orders.json)
  → Returns only non-sensitive fields (status, timeline, items)
  → Browser receives order status — never sees Admin API keys or raw customer data
```
**Reasoning:**
- HMAC signature prevents arbitrary third parties from using the proxy
- Email is hashed client-side — the proxy never sees plaintext email
- Response is filtered to only what the UI needs (status, timeline, item names)
- Admin API key lives only in the Worker environment variable

### D-03: Shopify Storefront API for catalog
**Decision:** Use Shopify Storefront API (public, no auth required) for catalog reads.
**Reasoning:**
- Storefront API is designed for public-facing store data — no key required for basic queries
- Supports GraphQL for efficient product queries (title, description, variants, inventory)
- Inventory data is real-time — no more 2-min cache TTL concerns
- Products, variants, options all available through a single query

### D-04: Fallback to mock data
**Decision:** Keep mock data sources as fallback. Toggle via environment flag or URL parameter.
**Reasoning:**
- Demo environment may not have a live Shopify store configured
- Tests still use mock data (deterministic, fast, no network dependency)
- `useMockData: true/false` option in ChatWidget constructor

### D-05: Policy data source
**Decision:** Fetch policy text from a markdown file hosted alongside the widget, or from Shopify Metaobjects if available.
**Reasoning:**
- Shopify doesn't have a native policies API via Storefront
- Simplest approach: merchant edits a markdown file in the widget config
- Future: could use Shopify Metaobjects (custom structured data)
- For the hackathon: the policy file approach is sufficient and realistic

### D-06: No user authentication system
**Decision:** The proxy validates request authenticity (HMAC) but does not authenticate individual users.
**Reasoning:**
- A full auth system (login, sessions, OTP) is outside hackathon scope
- Order lookup already requires order number + email match (existing behavior)
- The proxy prevents token/API-key theft, which is the judge's actual concern
- HMAC prevents replay attacks from unauthorized clients

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth
- `user_verdict.md` — Sections "Secure Order Lookup", "Dynamic Store Content Sync", "Important security note", "What the Live Shopify API Does and Does Not Solve"
- `hackathon.md` — Shopify setup instructions (Partners account, dev store, Admin API, Storefront API)

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 7 — Goal, success criteria, dependencies
- `.planning/STATE.md` — Current project state

### Existing Code — What Gets Modified
- `src/services/orderService.ts` — Gets configurable OrderDataSource (mock vs live proxy)
- `src/services/mockOrderData.ts` — Stays as fallback. Add `ShopifyOrderProxyDataSource`
- `src/services/catalogService.ts` — Gets configurable CatalogDataSource (mock vs Storefront)
- `src/services/mockCatalogData.ts` — Stays as fallback. Add `ShopifyStorefrontDataSource`
- `src/services/policyService.ts` — Gets configurable policy source (hardcoded vs file/API)
- `shopify-widget/src/ChatWidget.ts` — Passes data source selection from constructor options

### Existing Code — What Stays
- `src/services/types.ts` — Data source interfaces (CatalogDataSource, OrderDataSource) already designed for swappable implementations
- `src/services/catalogIntentDetector.ts` — Intent detection logic (Phase 6 handles this)
- `src/services/orderIntentDetector.ts` — Intent detection logic
- All test files — Tests use mock data sources, continue passing

### Architecture References
- `TECHNICAL_DOC.md` §1 — Architecture overview shows data layer with swappable sources
- `TECHNICAL_DOC.md` §5 — Data flow diagrams (will need update for proxy)

### Source Code - Key Interfaces
From `src/services/types.ts`:
```typescript
export interface CatalogDataSource {
  loadProducts(): Promise<Product[]>;
}

// OrderDataSource is in src/services/orderService.ts or mockOrderData.ts
```

### Prior Phase Context
- `.planning/phases/04-order-tracking-workflow/04-CONTEXT.md` — Order service layer design, interface pattern
- `.planning/phases/03-live-catalog-intelligence/03-CONTEXT.md` — Catalog service layer, data source pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Data Source Interface Pattern (Already Designed)
The project already uses interface-first design for swappable data sources:

```typescript
// CatalogDataSource interface (src/services/mockCatalogData.ts or types.ts)
export interface CatalogDataSource {
  loadProducts(): Promise<Product[]>;
}

// Used by CatalogService (constructor injection)
export class CatalogService {
  constructor(private dataSource: CatalogDataSource) { }
  // ...
}
```

This means adding `ShopifyStorefrontDataSource` implementing `CatalogDataSource` is purely additive — no existing code needs to change.

### Mock Data Details
- `MockCatalogDataSource` — 7 products, 52 variants, 6 product options (Size, Color, Material)
- `MockOrderDataSource` — 8 orders across 9 statuses
- Both are in-memory arrays with async load methods

### Storefront API Query Shape
```graphql
{
  products(first: 50) {
    edges {
      node {
        id
        title
        description
        options { name values }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              inventoryQuantity
              selectedOptions { name value }
            }
          }
        }
      }
    }
  }
}
```

### Order Lookup via Admin REST API
```
GET /admin/api/2024-04/orders.json?name=1001&email=test@example.com
Headers: X-Shopify-Access-Token: {access_token}
```

### Cloudflare Worker Template
```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    // 1. Verify HMAC signature
    // 2. Parse { orderNumber, emailHash } from request body
    // 3. Call Shopify Admin API
    // 4. Filter response to safe fields
    // 5. Return { found, status, timeline, items }
  }
}
```

</code_context>

<specifics>
## Specific Implementation Ideas

### Two data source modes
```typescript
type DataSourceMode = 'mock' | 'live';

interface ChatWidgetOptions {
  // ... existing options
  dataSource?: {
    catalog?: DataSourceMode;
    order?: DataSourceMode;
    policy?: DataSourceMode;
  };
  proxyUrl?: string;  // URL to the serverless proxy (for live mode)
}
```

### Proxy response shape
```typescript
interface ProxyOrderResponse {
  found: boolean;
  reason?: 'not_found' | 'email_mismatch';
  status?: string;
  estimatedDelivery?: string;
  trackingEvents?: TrackingEvent[];
  items?: { name: string; quantity: number; price: number }[];
}
```

### Storefront data source
- No API key needed — uses Shopify Storefront API (public)
- Just need the store's myshopify.com domain
- Use the unauthenticated Storefront API for product queries
- Inventory data via `inventoryQuantity` field on variants

</specifics>

<deferred>
## Deferred Ideas

- **OTP verification for order lookup** — Judged as out of scope for hackathon. Email match is sufficient authentication for the submission.
- **Database storage** — No database. Proxy passes through to Shopify APIs.
- **Rate limiting on proxy** — Cloudflare Workers have built-in rate limiting. No custom implementation needed.
- **Multi-store support** — Proxy handles one store for the demo. Configurable for post-hackathon.
- **Custom Shopify app** — Using Admin API via a custom app is sufficient. No public app distribution needed.

</deferred>

---

*Phase: 07-security-live-data*
*Context gathered: 2026-05-17*
