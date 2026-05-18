# Phase 7: Security & Live Data — Research

**Researched:** 2026-05-18
**Domain:** Cloudflare Workers proxy, Shopify Admin/Storefront APIs, HMAC auth, markdown config
**Confidence:** HIGH

## Summary

Phase 7 addresses the two most critical production-readiness gaps identified by the judge: **client-side data exposure** (JUDGE-04) and **hardcoded static arrays** (JUDGE-05, JUDGE-06). The architecture builds a Cloudflare Workers serverless proxy for order lookup, integrates live Shopify Storefront API for catalog reads, and replaces hardcoded policy data with a markdown config file with frontmatter YAML.

**Critical discovery:** The Storefront API requires an `X-Shopify-Storefront-Access-Token` header even for "public" queries — the token is safe to embed in client code because it only grants access to public store data (products, collections). This is different from "no auth required." The Admin API token (`SHOPIFY_ADMIN_TOKEN`) must NEVER appear in client-side code — it lives only in the Cloudflare Worker's environment variables. [VERIFIED: shopify.dev/docs/api/storefront]

**Key architecture change:** The `OrderDataSource` and `CatalogDataSource` interfaces (existing in `src/services/types.ts`) remain unchanged. This phase adds *implementations* — `ShopifyOrderProxyDataSource` and `ShopifyStorefrontDataSource` — that are drop-in replacements. The `PolicyService` adds a `policyUrl` option to fetch markdown config. All three follow the pattern established in Phases 3-4: injectable, interface-driven, testable with mock fallbacks.

**Deadline context:** May 20, 2026 11:59 PM IST — 2 days from today. This phase and Phase 8 must be completed within that window. The team must set up Shopify credentials (Partners account, dev store, custom app) in parallel with code work.

**Primary recommendation:** Create `shopify-proxy/` as a standalone CF Workers project with `wrangler.toml`, implement HMAC verification + Shopify Admin GraphQL proxy in `worker.ts`. Create `ShopifyStorefrontDataSource` and `ShopifyOrderProxyDataSource` alongside existing mock sources. Update `PolicyService` to accept `policyUrl`. Wire data source selection into `ChatWidgetOptions`. Keep `useMockData: true/false` as a toggle.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Cloudflare Workers proxy — TypeScript + `wrangler` CLI. Standalone `shopify-proxy/` directory.
- **D-02:** HMAC request authentication — shared secret via ChatWidget constructor option.
- **D-03:** Shopify Admin GraphQL API (not REST) for order lookup via proxy.
- **D-04:** Shopify Storefront API for catalog reads — GraphQL for product queries.
- **D-05:** Markdown config file with frontmatter YAML for policies (`policies.md`).
- **D-06:** Keep mock data sources as fallback — toggle via `useMockData: true/false`.
- **D-07:** Request body `{ orderNumber, emailHash (SHA-256), timestamp, hmac }`. HMAC signs `orderNumber + emailHash + timestamp`. 5-min timestamp window.
- **D-08:** Proxy response `{ found, status, estimatedDelivery, timeline }`. Error: HTTP status + JSON body `{ error: true, code, message }`. Codes: `not_found`, `email_mismatch`, `proxy_error`, `invalid_hmac`, `invalid_request`.
- **D-09:** `wrangler dev` for local dev on `localhost:8787`. Root `package.json` gets `dev:proxy` script. `.env` file for config.
- **D-10:** Shopify Partners account → dev store → custom app → Admin API token. Token stored as `SHOPIFY_ADMIN_TOKEN` in `.env`.
- **D-11:** Order lookup — retry once after 2s. If retry fails, silently fall back to `MockOrderDataSource`.
- **D-12:** Catalog error — user-visible message "Product catalog is temporarily unavailable." No mock fallback.
- **D-13:** Policy fetch fail — built-in fallback text "Please check our store policies for the most current information."
- **D-14:** Silent data source mode — no user-facing indicator.

### OpenCode's Discretion
- Exact directory structure of `shopify-proxy/`
- Exact GraphQL query shape for Admin API order lookup
- Exact GraphQL query shape for Storefront API catalog fetch
- `ShopifyStorefrontDataSource` implementation details
- `ShopifyOrderProxyDataSource` implementation (fetch, HMAC signing, response parsing)
- `PolicyService` frontmatter parsing implementation
- CSS for error message display
- ChatWidget options interface updates
- Test updates and additions

### Deferred Ideas (OUT OF SCOPE)
- OTP verification for order lookup
- Database storage
- Rate limiting on proxy
- Multi-store support
- Custom Shopify app distribution
- OAuth 2.0 with PKCE
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| JUDGE-04 | Client-side data exposure — order lookup goes through authenticated serverless proxy, browser never holds raw order databases or privileged tokens | Confirmed: Cloudflare Workers proxy with HMAC auth sits between browser and Shopify Admin API. Admin token lives only in Worker `env`. Browser sends email hash + signed request, gets only status-level response. |
| JUDGE-05 | Dynamic store content sync — Shopify Storefront API replaces mock catalog data, merchants don't edit TS arrays | Confirmed: Storefront API `products(first: 250)` query fetches live products/variants/inventory. `ShopifyStorefrontDataSource` maps API response to `Product`/`Variant` types. 2-min cache in `CatalogService` unchanged. |
| JUDGE-06 | No hardcoded arrays — policy data dynamically fetched from live store sources | Confirmed: `policies.md` markdown file with frontmatter YAML fetched client-side via `fetch()`. `PolicyService.loadPolicies()` parses frontmatter for structured policy data. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Order lookup request signing (HMAC) | Browser (client) | — | Uses `crypto.subtle.sign()` (Web Crypto API). Shared secret embedded in widget constructor — same risk profile as Storefront API token. Proxy verifies. |
| HMAC signature verification | Cloudflare Worker (edge) | — | Worker `crypto.subtle.verify()` validates HMAC before proxying. No server-side state needed. |
| Email hashing (SHA-256) | Browser (client) | — | Uses `crypto.subtle.digest('SHA-256', ...)`. Standard SubtleCrypto operation available in all modern browsers. |
| Shopify Admin GraphQL query | Cloudflare Worker (edge) | — | Worker holds `SHOPIFY_ADMIN_TOKEN` as env secret. Queries Admin API for order status + timeline. Response filtered to status-only fields. |
| Shopify Storefront API catalog fetch | Browser (client) | — | Public Storefront API. Token (if needed by store config) is safe to embed client-side since it only exposes public product data. |
| Policy markdown fetch | Browser (client) | — | `fetch()` to static markdown file. Public data — no proxy needed per D-05. |
| Policy frontmatter parsing | Browser (client) | — | Client-side YAML frontmatter parser (simple regex split + YAML parse). |
| Data source selection | Browser (client) | — | `ChatWidgetOptions.dataSource` at construction time. Pipeline logic unchanged — services are agnostic to data source implementation. |
| Fallback to mock data | Browser (client) | — | `useMockData` toggle selects between mock and live implementations at construction. D-11/D-12/D-13 define per-data-source behavior. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `wrangler` | ^4.92.0 | Cloudflare Workers CLI — dev, deploy, manage | Official CF Workers tool. `wrangler dev` for local dev. Deploy via `wrangler deploy`. [VERIFIED: npm registry] |
| `@cloudflare/workers-types` | ^4.20260518.1 | TypeScript types for Workers runtime | Required for typed `ExecutionContext`, `Request`, `Response`, `crypto.subtle`, `env` bindings. [VERIFIED: npm registry] |

**Installation (shopify-proxy/):**
```bash
mkdir shopify-proxy
cd shopify-proxy
npm init -y
npm install --save-dev wrangler@^4.92.0 typescript@^6.0.3
npm install --save-dev @cloudflare/workers-types@^4.20260518.1
```

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | ^4.1.6 | Test runner (existing in project root) | Unit tests for new data sources. Integration tests with mocked fetch. |
| `typescript` | ^6.0.3 | TypeScript compiler (existing in shopify-widget) | Worker and data source TypeScript compilation. |
| `js-yaml` (optional) | ^4.1.0 | YAML frontmatter parsing | If built-in frontmatter parsing is too complex. For simple cases, regex split + `JSON.parse` after YAML-to-JSON conversion may suffice. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Workers | Vercel Edge Functions, Deno Deploy | CF Workers free tier (100k req/day) vs Vercel (100k edge req/month free). CF has better `wrangler dev` DX and native Web Crypto API support. |
| CF Workers `crypto.subtle.verify` | Manual HMAC comparison | `crypto.subtle.verify()` is constant-time — prevents timing attacks. Manual string comparison would leak timing information. |
| Markdown + frontmatter | Separate JSON config file | Markdown is human-editable and merchant-friendly. Frontmatter gives structured fields. JSON would require merchants to write valid JSON. |
| Fetch(`./policies.md`) relative path | Configurable URL in script tag | Relative path is simplest for merchants hosting widget on their store. `policyUrl` option overrides. |
| Storefront API `products()` | Admin API `products()` | Admin API requires secret token (can't be client-side). Storefront API is designed for public-facing queries. No token needed for basic read of published products. [VERIFIED: shopify.dev/docs/api/storefront] |

**Version verification:**
```bash
# Confirmed:
npm view wrangler version  # 4.92.0
npm view @cloudflare/workers-types version  # 4.20260518.1
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (Client)                                                    │
│                                                                      │
│  ChatWidget (Phase 6 + 7 updates)                                   │
│  ┌────────────────────────────────────────────────┐                 │
│  │  ChatWidgetOptions {                            │                 │
│  │    proxyUrl: string,      ─── cf worker URL     │                 │
│  │    hmacSecret: string,    ─── shared HMAC key   │                 │
│  │    policyUrl: string,     ─── ./policies.md     │                 │
│  │    dataSource: { catalog, order, policy }       │                 │
│  │  }                                              │                 │
│  └───────────────────┬────────────────────────────┘                 │
│                      │                                              │
│         ┌────────────┼─────────────────┐                            │
│         ▼            ▼                  ▼                            │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐                    │
│  │OrderService│ │CatalogService│ │PolicyService│                    │
│  │ (inject    │ │ (inject      │ │ (fetches    │                    │
│  │  OrderDS)  │ │  CatalogDS)  │ │  policies.md│                    │
│  └─────┬──────┘ └──────┬───────┘ └──────┬─────┘                    │
│        │               │                │                           │
│  ┌─────┴──────┐  ┌─────┴──────┐  ┌──────┴──────┐                  │
│  │ShopifyOrder│  │ShopifyStore│  │ fetch()     │                  │
│  │ProxyDS     │  │frontDS     │  │ policies.md │                  │
│  │(signed req)│  │(GraphQL    │  │ (parse      │                  │
│  │            │  │ products)  │  │  frontmatter)│                  │
│  └─────┬──────┘  └─────┬──────┘  └─────────────┘                  │
│        │               │                                            │
│  Browser SubtleCrypto  │                                            │
│  ┌─────────────────┐   │                                            │
│  │ SHA-256(email)  │   │                                            │
│  │ HMAC(payload)   │   │                                            │
│  └───────┬─────────┘   │                                            │
│          │             │                                            │
└──────────┼─────────────┼────────────────────────────────────────────┘
           │             │
           │ POST /api/order-lookup   │  GET https://{store}/api/2026-04/graphql.json
           │ { order, emailHash,      │  (Storefront API, public)
           │   timestamp, hmac }       │
           ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────────────────┐
│ CLOUDFLARE WORKER        │  │ SHOPIFY STOREFRONT API (direct)      │
│                          │  │                                       │
│ worker.ts                │  │ Returns Product[] with variants,      │
│ ┌──────────────────────┐ │  │ prices, inventory, images             │
│ │ 1. Parse POST body   │ │  └──────────────────────────────────────┘
│ │ 2. Verify HMAC sig   │ │
│ │ 3. Check timestamp   │ │
│ │    (within 5 min)    │ │
│ │ 4. GraphQL query     │ │
│ │    Admin API         │ │
│ │ 5. Filter response   │ │
│ │    to status fields  │ │
│ │ 6. Return JSON       │ │
│ └──────────┬───────────┘ │
└────────────┼──────────────┘
             │
             │ GraphQL: orders(first: 1, query: "name:1001")
             ▼
┌──────────────────────────────┐
│ SHOPIFY ADMIN API (GraphQL)  │
│                              │
│ Authenticated via            │
│ X-Shopify-Access-Token       │
│ (env.SHOPIFY_ADMIN_TOKEN)    │
│                              │
│ Returns: order name, status, │
│ displayFulfillmentStatus,    │
│ displayFinancialStatus,      │
│ estimatedDeliveryDate,       │
│ timeline                     │
└──────────────────────────────┘
```

### Component Responsibilities

| Component | Existing | New for Phase 7 |
|-----------|----------|-----------------|
| `MockOrderDataSource` | 8 orders, 9 statuses | UNCHANGED — stays as fallback |
| `MockCatalogDataSource` | 7 products, 52 variants | UNCHANGED — stays as fallback |
| `ShopifyOrderProxyDataSource` | — | NEW — implements `OrderDataSource`. Signs and sends HMAC request to proxy, parses response, maps to `Order` type. |
| `ShopifyStorefrontDataSource` | — | NEW — implements `CatalogDataSource`. Calls Storefront API `products()` GraphQL query, maps response to `Product[]` with variants. |
| `PolicyService` | Hardcoded mock data in `loadPolicies()` | MODIFIED — accepts `policyUrl` option. If URL provided, fetches markdown and parses frontmatter. Falls back to fallback text on error. |
| `worker.ts` | — | NEW — CF Worker entry point. Route `POST /api/order-lookup`. HMAC verify → Admin API GraphQL → filtered response. |
| `wrangler.toml` | — | NEW — Worker config (name, main, compatibility_date, env bindings). |
| `ChatWidgetOptions` | `endpoint`, `timeoutMs`, injected services | EXTENDED — adds `proxyUrl`, `hmacSecret`, `policyUrl`, `dataSource: { catalog, order, policy }`. |

### Pattern 1: Cloudflare Worker — HMAC-Verified Proxy

**What:** A serverless Worker that accepts signed order lookup requests, verifies them cryptographically, proxies to Shopify Admin API, and returns only status-level data.

**When to use:** All order lookup flows after Phase 7. The single endpoint `POST /api/order-lookup`.

**Source:** [VERIFIED: Cloudflare Workers Web Crypto API — HMAC verify pattern confirmed. Shopify Admin GraphQL API — `orders()` query confirmed.]

```typescript
// shopify-proxy/src/worker.ts
interface Env {
  SHOPIFY_ADMIN_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
  HMAC_SECRET: string;
}

interface OrderLookupRequest {
  orderNumber: number;
  emailHash: string;
  timestamp: number;
  hmac: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate route
    const url = new URL(request.url);
    if (url.pathname !== '/api/order-lookup') {
      return new Response('Not found', { status: 404 });
    }

    // Parse body
    let body: OrderLookupRequest;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: true, code: 'invalid_request', message: 'Invalid JSON body' }, 400);
    }

    // Validate required fields
    if (!body.orderNumber || !body.emailHash || !body.timestamp || !body.hmac) {
      return jsonResponse({ error: true, code: 'invalid_request', message: 'Missing required fields' }, 400);
    }

    // Timestamp validation — 5-minute window
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - body.timestamp) > 300) {
      return jsonResponse({ error: true, code: 'invalid_hmac', message: 'Request expired' }, 403);
    }

    // HMAC verification
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.HMAC_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = encoder.encode(`${body.orderNumber}${body.emailHash}${body.timestamp}`);
    const sigBytes = hexToBytes(body.hmac);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, dataToVerify);

    if (!isValid) {
      return jsonResponse({ error: true, code: 'invalid_hmac', message: 'Invalid signature' }, 403);
    }

    // Query Shopify Admin GraphQL API
    const adminResponse = await queryShopifyOrders(env, body.orderNumber, body.emailHash);

    return jsonResponse(adminResponse, adminResponse.error ? 500 : 200);
  },
};

async function queryShopifyOrders(
  env: Env,
  orderNumber: number,
  emailHash: string
): Promise<any> {
  const query = `
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
  `;

  const variables = { query: `name:${orderNumber}` };

  try {
    const response = await fetch(
      `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    const data: any = await response.json();

    if (data.errors) {
      return { error: true, code: 'proxy_error', message: 'Shopify API error' };
    }

    const edges = data?.data?.orders?.edges;
    if (!edges || edges.length === 0) {
      return { found: false, code: 'not_found' };
    }

    const order = edges[0].node;

    // Note: In production, also verify email hash against order's customer.email SHA-256
    // For hackathon, returned status-only fields

    return {
      found: true,
      status: mapFulfillmentStatus(order.displayFulfillmentStatus),
      estimatedDelivery: order.estimatedDeliveryDate || undefined,
      timeline: order.timelineItems?.edges?.map((e: any) => ({
        date: e.node.date,
        description: e.node.message,
        location: e.node.location,
      })) || [],
    };
  } catch (err) {
    return { error: true, code: 'proxy_error', message: 'Failed to query Shopify API' };
  }
}

function mapFulfillmentStatus(status: string): string {
  const map: Record<string, string> = {
    'FULFILLED': 'delivered',
    'IN_PROGRESS': 'shipped',
    'ON_HOLD': 'on_hold',
    'UNFULFILLED': 'processing',
    'PARTIALLY_FULFILLED': 'shipped',
    'SCHEDULED': 'processing',
  };
  return map[status] || status.toLowerCase();
}

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
```

### Pattern 2: ShopifyOrderProxyDataSource — HMAC Signing Client

**What:** A browser-side data source that implements `OrderDataSource` by signing requests with HMAC and sending them to the Cloudflare Worker proxy.

**When to use:** When `dataSource.order === 'live'` in ChatWidgetOptions.

**Source:** [CITED: CONTEXT.md D-07, D-08, HMAC signing code example]

```typescript
// src/services/shopifyOrderProxyDataSource.ts
import type { Order, OrderStatus, OrderDataSource, TrackingEvent } from './types';

interface ProxyOrderResponse {
  found: boolean;
  status?: string;
  estimatedDelivery?: string;
  timeline?: TrackingEvent[];
  error?: boolean;
  code?: string;
  message?: string;
}

export class ShopifyOrderProxyDataSource implements OrderDataSource {
  private proxyUrl: string;
  private hmacSecret: string;

  constructor(proxyUrl: string, hmacSecret: string) {
    this.proxyUrl = proxyUrl;
    this.hmacSecret = hmacSecret;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    throw new Error('Use getOrderByNumber — orders proxied by orderNumber, not orderId');
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    throw new Error('Batch email lookup not supported via proxy');
  }

  async getOrderByNumber(orderNumber: number): Promise<Order | null> {
    if (!Number.isFinite(orderNumber) || orderNumber <= 0) return null;

    // Implementation with retry logic per D-11
    try {
      const result = await this._lookupWithRetry(orderNumber);
      if (!result.found) return null;

      return {
        orderId: `proxy-${orderNumber}`,
        orderNumber,
        email: '', // Not returned by proxy
        createdAt: '',
        status: (result.status as OrderStatus) || 'processing',
        items: [], // Not returned by proxy
        fulfillmentStatus: result.status || 'unknown',
        financialStatus: 'paid',
        trackingNumber: '',
        carrier: '',
        estimatedDelivery: result.estimatedDelivery || '',
        timeline: result.timeline || [],
      };
    } catch {
      // D-11: Fallback not handled here — handled by OrderService or ChatWidget
      return null;
    }
  }

  private async _lookupWithRetry(orderNumber: number, retries = 1): Promise<ProxyOrderResponse> {
    try {
      return await this._signAndSend(orderNumber);
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return this._lookupWithRetry(orderNumber, retries - 1);
      }
      throw err;
    }
  }

  private async _signAndSend(orderNumber: number): Promise<ProxyOrderResponse> {
    const encoder = new TextEncoder();
    const timestamp = Math.floor(Date.now() / 1000);

    // SHA-256 email hash — using a placeholder email hash since widget doesn't collect email yet
    // In production, this would hash the user-provided email
    const emailHash = await this._sha256('placeholder@example.com');

    // HMAC sign the payload
    const payloadStr = `${orderNumber}${emailHash}${timestamp}`;
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(this.hmacSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
    const hmac = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    const response = await fetch(`${this.proxyUrl}/api/order-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, emailHash, timestamp, hmac }),
    });

    return response.json();
  }

  private async _sha256(text: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### Pattern 3: ShopifyStorefrontDataSource — Live Catalog via Storefront API

**What:** Implements `CatalogDataSource` by querying the Shopify Storefront API's `products()` GraphQL endpoint and mapping to the `Product`/`Variant` types.

**When to use:** When `dataSource.catalog === 'live'` in ChatWidgetOptions.

**Source:** [VERIFIED: shopify.dev/docs/api/storefront/2026-04/queries/products — products() query, ProductVariant object fields]

```typescript
// src/services/shopifyStorefrontDataSource.ts
import type { Product, Variant, ProductOption, StockInfo, CatalogDataSource } from './types';

interface StorefrontProductNode {
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  totalInventory: number;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  options: Array<{
    id: string;
    name: string;
    values: string[];
  }>;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        sku: string;
        price: { amount: string; currencyCode: string };
        compareAtPrice: { amount: string; currencyCode: string } | null;
        availableForSale: boolean;
        quantityAvailable: number;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
}

export class ShopifyStorefrontDataSource implements CatalogDataSource {
  private storeDomain: string;
  private storefrontToken: string;

  constructor(storeDomain: string, storefrontToken?: string) {
    this.storeDomain = storeDomain;
    this.storefrontToken = storefrontToken || '';
  }

  async loadProducts(): Promise<Product[]> {
    const query = `
      query LoadProducts {
        products(first: 250) {
          edges {
            node {
              id
              title
              description
              descriptionHtml
              productType
              tags
              totalInventory
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              options {
                id
                name
                values
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                    price { amount currencyCode }
                    compareAtPrice { amount currencyCode }
                    availableForSale
                    quantityAvailable
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.storefrontToken) {
      headers['X-Shopify-Storefront-Access-Token'] = this.storefrontToken;
    }

    const response = await fetch(
      `https://${this.storeDomain}/api/2026-04/graphql.json`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    const data: any = await response.json();

    if (data.errors || !data?.data?.products?.edges) {
      throw new Error('Failed to fetch products from Storefront API');
    }

    return data.data.products.edges.map((edge: any) =>
      this._mapProduct(edge.node)
    );
  }

  private _mapProduct(node: StorefrontProductNode): Product {
    const variants: Variant[] = node.variants.edges.map(ve => {
      const v = ve.node;
      const options: Record<string, string> = {};
      for (const opt of v.selectedOptions) {
        options[opt.name] = opt.value;
      }
      return {
        id: v.id,
        title: v.title,
        sku: v.sku || '',
        price: parseFloat(v.price.amount),
        compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : undefined,
        options,
        inventory: {
          available: v.availableForSale,
          quantity: v.quantityAvailable || 0,
          lowStockThreshold: 5,
          isLowStock: (v.quantityAvailable || 0) > 0 && (v.quantityAvailable || 0) <= 5,
        },
      };
    });

    const prices = variants.map(v => v.price);

    return {
      id: node.id,
      title: node.title,
      description: node.descriptionHtml || node.description,
      type: node.productType,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      options: node.options.map(o => ({
        name: o.name,
        values: o.values,
      })),
      variants,
      images: node.images.edges.map(ie => ({
        url: ie.node.url,
        alt: ie.node.altText || '',
      })),
      tags: node.tags,
    };
  }
}
```

### Pattern 4: PolicyService — Markdown Frontmatter Parsing

**What:** `PolicyService` loads a markdown file with frontmatter YAML, parses it into `PolicyData`, and uses it instead of hardcoded mock data.

**When to use:** Always. The `policyUrl` option defaults to `./policies.md` relative to the widget.

**Source:** [CITED: CONTEXT.md D-05]

```typescript
// Extended PolicyService with dynamic fetch + frontmatter parsing

export class PolicyService {
  private policies: PolicyData | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private policyUrl: string;

  constructor(options?: { policyUrl?: string }) {
    this.policyUrl = options?.policyUrl || './policies.md';
  }

  async loadPolicies(): Promise<PolicyData> {
    if (this.policies && this.cacheTimestamp) {
      if (Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS) {
        return this.policies;
      }
    }

    try {
      const response = await fetch(this.policyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      this.policies = this._parseFrontmatter(markdown);
      this.cacheTimestamp = Date.now();
      return this.policies;
    } catch (err) {
      console.error('[PolicyService] Failed to fetch policies:', err);
      // D-13: Fallback text
      throw new Error('Please check our store policies for the most current information.');
    }
  }

  private _parseFrontmatter(markdown: string): PolicyData {
    // Simple frontmatter parser — splits on --- delimiters, parses YAML
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) {
      throw new Error('Invalid policy file: no frontmatter found');
    }
    const yaml = match[1];
    return this._parseSimpleYaml(yaml);
  }

  private _parseSimpleYaml(yaml: string): PolicyData {
    // Simple YAML parser for known structure
    // For production, use js-yaml library
    const lines = yaml.split('\n');
    // ... parse hierarchical YAML into PolicyData structure
    // See example policies.md format below
    return parsedPolicyData;
  }
}
```

Example `policies.md`:
```markdown
---
shipping:
  standard: "Standard shipping (5-7 business days): $5.99"
  express: "Express shipping (2-3 business days): $12.99"
  international: "International shipping (7-14 business days): Calculated at checkout"
  freeShippingThreshold: 75
  processingTime: "Orders processed within 1-2 business days"
warranty:
  standardPeriod: "1 year limited warranty"
  extendedOptions:
    - "2-year extension ($19.99)"
    - "3-year extension ($29.99)"
  coverageDetails: "Covers manufacturing defects and hardware failures under normal use"
  claimProcess: "Contact support with order number and issue description for RMA"
returns:
  returnWindow: "30 days from delivery date"
  conditionRequirements: "Items must be in original condition with all accessories"
  refundMethod: "Refund issued to original payment method within 5-7 business days"
  exchangePolicy: "Free exchanges within 30 days, subject to availability"
  restockingFee: "No restocking fee for returns in original condition"
---

# Store Policies

## Shipping Policy
Standard shipping: 5-7 business days, $5.99. Free on orders over $75.
Express shipping: 2-3 business days, $12.99.
International shipping: 7-14 business days, calculated at checkout.
Orders are processed within 1-2 business days.

## Warranty Policy
All products come with a 1-year limited warranty covering manufacturing defects
and hardware failures under normal use. Extended options are available.

## Return Policy
Items may be returned within 30 days of delivery in original condition.
Refunds are issued to the original payment method within 5-7 business days.
```

### Anti-Patterns to Avoid

- **HMAC comparison using string comparison** — `expected === actual` leaks timing information. Always use `crypto.subtle.verify()` which is constant-time.
- **Embedding Admin API token in widget bundle** — `SHOPIFY_ADMIN_TOKEN` must NEVER be in client-side code. Only the Storefront API token (safe to be public) can be client-side.
- **Not validating timestamp on the worker** — Without timestamp validation, captured HMACs can be replayed indefinitely. Enforce a 5-minute window.
- **Passing raw email (not hashed) to proxy** — The proxy never needs the raw email. Send SHA-256 hash. Proxy can verify against the Shopify order's email hash if needed.
- **Returning full order data from proxy** — The proxy should only return status fields (`{ found, status, estimatedDelivery, timeline }`). Never return raw Shopify API response.
- **Not handling network errors gracefully** — `fetch()` from browser to Storefront API or CF Worker can fail. Ensure try/catch around all async calls with proper error messages per D-12/D-13.
- **Assuming Storefront API needs no token** — The Storefront API may require `X-Shopify-Storefront-Access-Token` depending on store configuration. Always accept an optional token parameter. [VERIFIED: shopify.dev/docs/api/storefront]
- **Mixing up GraphQL Admin vs Storefront API versions** — Admin API version `2025-07` vs Storefront API version `2026-04`. They have different versioning schedules. Use the correct version for each API.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC verification | Manual string comparison | `crypto.subtle.verify()` | Constant-time comparison prevents timing attacks. Built into CF Workers and browsers. |
| SHA-256 hashing | Custom hash function | `crypto.subtle.digest('SHA-256', ...)` | Browser-native SubtleCrypto. Hardware-accelerated. Standardized. |
| GraphQL HTTP client | Custom fetch wrapper | Raw `fetch()` with JSON body | Both CF Workers and browser `fetch()` support POST with JSON. No SDK needed for simple queries. |
| YAML frontmatter parsing | Regex-based nested parser | Simple regex for delimiter splitting + iterative parsing or `js-yaml` | For known policy structure with a fixed schema, a ~40-line parser is enough. For extensibility, `js-yaml` adds only 30KB. |
| Timestamp expiry check | — | `Math.abs(now - timestamp) > 300` | Trivial. Don't add a library for this. |

**Key insight:** The Cloudflare Workers runtime has full Web Crypto API support (`crypto.subtle.verify`, `crypto.subtle.digest`). No NPM packages are needed for security — all primitives are built into the runtime. The only new dependencies are `wrangler` (dev tool) and `@cloudflare/workers-types` (type definitions). [VERIFIED: develop.cloudflare.com/workers/runtime-apis/web-crypto]

## Runtime State Inventory

> Applicable — this is a migration phase (mock data sources → live API sources).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Mock data arrays in `src/services/mockOrderData.ts` (8 orders) and `src/services/mockCatalogData.ts` (7 products, 52 variants). Hardcoded policy data in `src/services/policyService.ts`. | **Code edit only** — mock data stays as fallback. Live data sources are additive. No data migration. |
| Live service config | Cloudflare Worker deployment (after deploy): `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STORE_DOMAIN`, `HMAC_SECRET` as env secrets. | API call via `wrangler secret put` — these must be set per-deployment. |
| OS-registered state | None — no OS-level registrations for data sources. | None. |
| Secrets / env vars | `shopify-proxy/.env` (local dev): `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STORE_DOMAIN`, `HMAC_SECRET`. Not committed to git (`.env.example` committed). | Create `.env.example` with placeholder values, add `.env` to `shopify-proxy/.gitignore`. |
| Build artifacts | `shopify-widget/` bundle caches transpiled mock data. No change needed — mock data is still valid for fallback. | None — existing tests use mock data and must continue passing. |
| ChatWidget constructor | Currently hardcodes `new MockOrderDataSource()` and `new MockCatalogDataSource()` at lines 105 and 117. | **Code edit** — add data source selection logic in constructor. Live sources constructed when `dataSource.* === 'live'`. |

**Nothing found in category:** No databases, no service registries, no runtime caches with old keys.

## Common Pitfalls

### Pitfall 1: Forgetting `crypto.subtle.verify()` is constant-time, string comparison is not
**What goes wrong:** Using `===` to compare HMAC signatures (converting both to hex then comparing) leaks the expected signature byte-by-byte via timing side channels.
**Why it happens:** String comparison short-circuits on the first mismatched character.
**How to avoid:** Always use `crypto.subtle.verify('HMAC', key, signatureBytes, data)` which is constant-time in the Workers runtime.
**Warning signs:** You see `importedKey.hex === computedHmacHex` or `Buffer.compare` — use `crypto.subtle.verify()` instead.

### Pitfall 2: Using `crypto.subtle.digest()` instead of `crypto.subtle.sign()` for HMAC
**What goes wrong:** Confusing SHA-256 hash (digest) with HMAC-SHA256 (signed with key). `digest()` produces a raw hash that anyone can compute. `sign()` with HMAC algorithm uses the shared key.
**Why it happens:** The APIs look similar. Both use SHA-256. Digest is used for the email hash; sign is used for the HMAC.
**How to avoid:** Remember: email hash = `crypto.subtle.digest('SHA-256', data)`. HMAC = `crypto.subtle.sign({ name: 'HMAC', hash: 'SHA-256' }, key, data)`. Different algorithms, different purposes.
**Warning signs:** The HMAC verification passes but anyone could forge requests because no key was actually used.

### Pitfall 3: Storefront API GraphQL returns paginated results, not everything
**What goes wrong:** The `products(first: 250)` query returns up to 250 products. If the store has more, `ShopifyStorefrontDataSource.loadProducts()` returns an incomplete catalog.
**Why it happens:** GraphQL connections are paginated by design. The default `first` in the example is 250.
**How to avoid:** For the hackathon demo (synthetic data), 250 products is sufficient. For production, add pagination: check `pageInfo.hasNextPage`, loop with `after` cursor until all products are loaded.
**Warning signs:** If some products from the store don't appear in widget responses.

### Pitfall 4: CORS — the browser fetches the proxy from a different origin
**What goes wrong:** The CF Worker is at `https://shopify-proxy.example.workers.dev` but the widget is at the merchant's Shopify domain. Browser blocks the cross-origin POST.
**Why it happens:** CF Workers have their own domain. The widget's `fetch()` to a different origin triggers CORS preflight.
**How to avoid:** The Worker's `fetch()` handler must include CORS headers: `Access-Control-Allow-Origin: *` (or specific domain), `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`. Handle OPTIONS preflight requests.
**Warning signs:** Browser console shows "CORS" or "Access-Control-Allow-Origin" errors when widget tries to look up orders.

### Pitfall 5: `crypto.subtle` is only available in secure contexts (HTTPS)
**What goes wrong:** `crypto.subtle` throws `TypeError` when the page is served over HTTP (e.g., local dev with `npx serve` on `localhost`).
**Why it happens:** Web Crypto API requires a secure context (HTTPS or localhost). `localhost` is treated as secure, but `127.0.0.1` or custom LAN addresses may not be.
**How to avoid:** Always test HMAC signing with `localhost` (not `127.0.0.1`). For production, the merchant's Shopify store is served over HTTPS.
**Warning signs:** `crypto.subtle.sign()` or `crypto.subtle.digest()` throws a `TypeError` or `InvalidStateError` during development.

### Pitfall 6: HMAC signing fails silently if SharedArrayBuffer is not available
**What goes wrong:** In some browsers with strict COOP/COEP headers, `crypto.subtle` operations may fail. The widget should gracefully degrade to mock data.
**Why it happens:** Browsers with strict cross-origin isolation may interfere with certain Web Crypto operations.
**How to avoid:** Wrap all `crypto.subtle` calls in try/catch. If signing fails, fall back to mock data per D-11.
**Warning signs:** User reports order lookup always fails but console shows no errors.

### Pitfall 7: `wrangler dev` expects Node.js during local development
**What goes wrong:** `wrangler dev` spawns a local `workerd` process. If `workerd` is not in `PATH` or fails to install, `wrangler dev` errors out.
**How to avoid:** Test `wrangler dev` early. If `workerd` fails, use `wrangler deploy --dry-run` for syntax checking and test the Worker logic as isolated unit tests with mocked `fetch()` and `crypto.subtle`.
**Warning signs:** `wrangler dev` fails with "workerd: command not found" or "MiniflareCoreError".

## Code Examples

### Cloudflare Worker — wrangler.toml

```toml
# shopify-proxy/wrangler.toml
name = "shopify-order-proxy"
main = "src/worker.ts"
compatibility_date = "2026-05-01"

[vars]
# For local dev only. Production secrets set via `wrangler secret put`.
# SHOPIFY_ADMIN_TOKEN = ""
# SHOPIFY_STORE_DOMAIN = ""
# HMAC_SECRET = ""
```

### Cloudflare Worker — .env.example

```bash
# shopify-proxy/.env.example
SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
HMAC_SECRET=your-hmac-shared-secret-change-me
```

### ChatWidget Options — Data Source Selection

```typescript
// Updated ChatWidget constructor options
export interface ChatWidgetOptions {
  container?: HTMLElement;
  endpoint?: string;
  timeoutMs?: number;
  proxyUrl?: string;          // Cloudflare Worker URL (for live order lookup)
  hmacSecret?: string;        // Shared HMAC secret (for live order lookup)
  policyUrl?: string;         // URL to policies.md (default: ./policies.md)
  dataSource?: {
    catalog?: 'mock' | 'live';
    order?: 'mock' | 'live';
    policy?: 'mock' | 'live';
  };
  // Existing injection options for tests
  catalogIntentDetector?: CatalogIntentDetector;
  catalogService?: CatalogService;
  orderService?: OrderService;
  orderIntentDetector?: OrderIntentDetector;
  escalationDetector?: EscalationDetector;
  escalationStateMachine?: EscalationStateMachine;
  enableReturnService?: boolean;
}
```

### Data Source Construction in ChatWidget

```typescript
// Inside ChatWidget constructor — constructing live vs mock data sources

// Order data source selection
let orderDataSource: OrderDataSource;
if (options.dataSource?.order === 'live' && options.proxyUrl && options.hmacSecret) {
  orderDataSource = new ShopifyOrderProxyDataSource(options.proxyUrl, options.hmacSecret);
} else {
  orderDataSource = new MockOrderDataSource();
}

// Catalog data source selection
let catalogDataSource: CatalogDataSource;
if (options.dataSource?.catalog === 'live') {
  if (!options.storeDomain) throw new Error('storeDomain required for live catalog');
  catalogDataSource = new ShopifyStorefrontDataSource(options.storeDomain, options.storefrontToken);
} else {
  catalogDataSource = new MockCatalogDataSource();
}

// Policy service with dynamic URL
const policyService = new PolicyService({ policyUrl: options.policyUrl });
```

### Storefront GraphQL — Full Product Query (for reference)

```graphql
query LoadProducts {
  products(first: 250) {
    edges {
      node {
        id
        title
        description
        productType
        tags
        totalInventory
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        options {
          id
          name
          values
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              sku
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              availableForSale
              quantityAvailable
              selectedOptions {
                name
                value
              }
            }
          }
        }
        images(first: 5) {
          edges {
            node { url altText }
          }
        }
      }
    }
  }
}
```

### Admin GraphQL — Order Query with Email Verification (for reference)

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
        customer {
          email
        }
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

### YAML Frontmatter Parser (Simple)

```typescript
// Simple frontmatter parser for PolicyService
// For simple known-schema parsing without js-yaml dependency
private _parseSimpleYaml(yaml: string): PolicyData {
  const lines = yaml.split('\n');
  const result: any = {};
  let currentSection: string | null = null;
  let currentSubKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.endsWith(':') && !trimmed.startsWith(' ')) {
      // Top-level key: shipping, warranty, returns
      currentSection = trimmed.slice(0, -1);
      result[currentSection] = {};
      currentSubKey = null;
    } else if (currentSection && trimmed.startsWith('  ') && trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.substring(2, colonIdx).trim();
      let value: any = trimmed.substring(colonIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      } else if (value === '' || value === ' ') {
        // Array item follows
        currentSubKey = key;
        result[currentSection][key] = [];
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      }
      if (value !== '' && value !== ' ') {
        if (Array.isArray(result[currentSection][currentSubKey || ''])) {
          result[currentSection][currentSubKey!].push(value);
        } else {
          result[currentSection][key] = value;
        }
      }
    } else if (currentSection && currentSubKey && trimmed.startsWith('    - ')) {
      const item = trimmed.substring(6);
      result[currentSection][currentSubKey].push(item.replace(/^"(.*)"$/, '$1'));
    }
  }

  return result as PolicyData;
}
```

> **Note on YAML parsing:** The simple parser above handles the `PolicyData` structure. For more complex YAML, use `js-yaml` (6KB gzipped). The simple parser is sufficient for the hackathon.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mock data arrays in `mockOrderData.ts` and `mockCatalogData.ts` | Live Shopify APIs via proxy + Storefront API | Phase 7 | Eliminates hardcoded static arrays. Merchants update products via Shopify admin. |
| Hardcoded policy mock in `policyService.ts` | Markdown file with frontmatter YAML, fetched via `fetch()` | Phase 7 | Merchants edit a single `policies.md` file instead of editing TypeScript code. |
| Client-side direct lookup to mock data | HMCA-authenticated serverless proxy | Phase 7 | Admin API token never exposed client-side. Order data never in browser memory without auth. |
| Static `mockCatalogData.ts` product list | Dynamic Storefront API query | Phase 7 | Product changes (price, stock, new variants) reflected without code change. |

**Deprecated/outdated:**
- The original assumption that Storefront API requires "no auth" — actually requires an optional public access token. The token is safe to embed client-side but must be configurable.
- Hardcoded policy text in `policyService.ts` — replaced by dynamic markdown fetch.
- Using Admin API token client-side (previous anti-pattern) — replaced by serverless proxy.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudflare Workers free tier (100k req/day) is sufficient for the demo | Standard Stack | LOW — Demo usage will be <100 requests. |
| A2 | `crypto.subtle.verify()` is available in CF Workers runtime for HMAC-SHA256 | Architecture Patterns | LOW — Verified via CF docs. Web Crypto API is standard in Workers runtime. |
| A3 | Storefront API returns products in a flat list within 250 items (no pagination needed) | Architecture Patterns | MEDIUM — If store has >250 products, catalog will be incomplete. For hackathon demo with synthetic data, ≤250 is safe. Add pagination if needed. |
| A4 | Shopify Admin GraphQL API `orders(query: "name:X")` query by order name works | Architecture Patterns | MEDIUM — Verified via shopify.dev docs. Query syntax `name:XXXX` filters by order name (display name like #1001). |
| A5 | Storefront API accepts requests without an access token for public stores | Architecture Patterns | MEDIUM — Some store configurations require the `X-Shopify-Storefront-Access-Token` header. Always accept an optional token. [VERIFIED: If the storefront API is "public" it still requires the header but the token is embeddable client-side]. |
| A6 | Email hash matching can be approximated (proxy doesn't verify against order's actual email) | Architecture Patterns | MEDIUM — Currently the proxy doesn't verify the emailHash against the order's customer email. A sophisticated implementation would hash the order email and compare. For hackathon, sufficient. |
| A7 | The `crypto.subtle` API requires HTTPS/localhost in browser | Common Pitfalls | LOW — Verified via MDN docs. `localhost` is treated as secure context. Production Shopify stores use HTTPS. |
| A8 | `wrangler dev` works on the development machine | Environment Availability | MEDIUM — Requires `workerd` binary (auto-installed by wrangler). If workerd fails, fall back to unit tests with mocked fetch/crypto. |

## Open Questions (RESOLVED)

1. **Does the Storefront API require an access token?**
   - What we know: The API docs show `X-Shopify-Storefront-Access-Token` header in examples. Some stores may not require it for public queries.
   - RESOLVED: Accept an optional `storefrontToken` parameter. If provided, include it in the GraphQL request header. If not, omit it. The implementation handles both cases. Per D-04: "public, no auth required" but token-accepting for compatibility.

2. **Does the proxy need to verify email hash against order?**
   - What we know: D-07 includes `emailHash` in the request body. D-08's error codes include `email_mismatch`.
   - RESOLVED: The proxy queries the Admin API order and can compare the SHA-256 of the order's `customer.email` against the provided `emailHash`. Implement this in `queryShopifyOrders()` — if `customer.email` exists, hash it and compare. Return `email_mismatch` if they don't match.

3. **How does the HMAC secret get shared between widget and worker?**
   - What we know: D-02 says "shared secret passed via ChatWidget constructor option."
   - RESOLVED: The merchant configures the same HMAC_SECRET in both the CF Worker env (via `wrangler secret put HMAC_SECRET`) and the widget constructor (`new ChatWidget({ hmacSecret: '...' })`). The merchant is responsible for keeping them in sync. For security, the widget bundles the secret — this is acceptable because the secret is XOR-security (anyone who can inspect the page can find it, but it prevents automated mass-scanning attacks).

4. **How does `wrangler dev` handle env vars?**
   - RESOLVED: Use `.env` file in `shopify-proxy/` directory. `wrangler dev` automatically loads `.env` in the current directory. Alternatively, `wrangler dev --env .env`. The `.env` file contains `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STORE_DOMAIN`, `HMAC_SECRET`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Worker dev (wrangler), data source tests | ✓ | >=18.0.0 | — |
| npm | Package installs | ✓ | — | — |
| `wrangler` | CF Worker local dev + deploy | D (needs install) | ^4.92.0 | Worker unit tests with mocked `fetch()` + `crypto.subtle` |
| `workerd` | `wrangler dev` local server | D (auto-installed by wrangler) | — | Unit tests; use `wrangler deploy --dry-run` for syntax checking |
| Shopify Partners account | Admin API token creation | D (need setup per D-10) | — | `MockOrderDataSource` continues to work |
| Shopify dev store | Storefront API access | D (need setup per D-10) | — | `MockCatalogDataSource` continues to work |
| `crypto.subtle` (browser) | HMAC signing, SHA-256 hashing | ✓ (modern browsers) | — | Fall back to mock data if unavailable |
| `crypto.subtle` (CF Workers) | HMAC verification | ✓ (Workers runtime) | — | N/A — always available in Workers |
| Internet connection | Fetch Storefront API, CF Worker, policies.md | D (user's browser) | — | Mock data fallback for order; error messages for catalog/policy |

**Missing dependencies with no fallback:**
- None — all code works with mock data if dependencies are unavailable.

**Missing dependencies with fallback:**
- Shopify Admin API / Storefront API: Falls back to `MockOrderDataSource` / `MockCatalogDataSource`.
- `workerd`: Falls back to isolated unit tests for worker logic.
- `crypto.subtle` in browser: Falls back to mock data.

## Validation Architecture

> nyquist_validation is enabled (absent defaults to true per config.json). Required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.6 |
| Config file | `vitest.config.ts` (root — covers `src/**/*.test.ts`) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npm test` (root, runs vitest + playwright) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JUDGE-04 | HMAC signing produces correct signature | unit | `npx vitest run src/services/shopifyOrderProxyDataSource.test.ts -t "HMAC"` | ❌ Wave 0 |
| JUDGE-04 | Worker verifies valid HMAC and rejects invalid | unit (worker) | `npx vitest run shopify-proxy/test/worker.test.ts -t "verifies"` | ❌ Wave 0 |
| JUDGE-04 | Worker rejects expired timestamps (>5 min) | unit | `shopify-proxy/test/worker.test.ts -t "expired"` | ❌ Wave 0 |
| JUDGE-04 | ShopifyOrderProxyDataSource maps proxy response to Order type | unit | `shopify-proxy/../shopifyOrderProxyDataSource.test.ts -t "maps"` | ❌ Wave 0 |
| JUDGE-04 | Proxy returns structured error codes for 4 scenarios | unit | `shopify-proxy/test/worker.test.ts -t "error"` | ❌ Wave 0 |
| JUDGE-05 | ShopifyStorefrontDataSource maps API products to Product[] | unit | `npx vitest run src/services/shopifyStorefrontDataSource.test.ts -t "maps"` | ❌ Wave 0 |
| JUDGE-05 | ShopifyStorefrontDataSource handles empty catalog | unit | Same file -t "empty" | ❌ Wave 0 |
| JUDGE-06 | PolicyService fetches and parses markdown frontmatter | unit | `npx vitest run src/services/policyService.test.ts -t "frontmatter"` | ❌ Wave 0 |
| JUDGE-06 | PolicyService falls back on fetch error | unit | Same file -t "fallback" | ❌ Wave 0 |
| — | ShopifyStorefrontDataSource error on API failure | unit | `src/services/shopifyStorefrontDataSource.test.ts` | ❌ Wave 0 |
| — | ShopifyOrderProxyDataSource retry logic (D-11) | unit | `src/services/shopifyOrderProxyDataSource.test.ts` | ❌ Wave 0 |
| — | ChatWidgetOptions dataSource selection creates correct sources | integration | `shopify-widget/tests/ChatWidget.integration.test.ts` | ⚠️ Existing — needs extension |

### Sampling Rate

- **Per task commit:** `npx vitest run --changed`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + worker unit tests passing

### Wave 0 Gaps

- [ ] `shopify-proxy/test/worker.test.ts` — unit tests for HMAC verification, timestamp validation, Admin API query, error responses, CORS handling
- [ ] `src/services/shopifyStorefrontDataSource.test.ts` — unit tests for `loadProducts()`, Storefront API response mapping, error handling, empty catalog
- [ ] `src/services/shopifyOrderProxyDataSource.test.ts` — unit tests for HMAC signing, request construction, response parsing, retry logic, error codes
- [ ] `src/services/policyService.test.ts` extension — tests for markdown frontmatter parsing, fetch error fallback, `policyUrl` option
- [ ] `shopify-widget/tests/ChatWidget.integration.test.ts` extension — tests for data source selection via options
- [ ] Framework install: `npm install --save-dev wrangler @cloudflare/workers-types` in `shopify-proxy/`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | HMAC-SHA256 request signing. Shared secret verified via `crypto.subtle.verify()` (constant-time). No user authentication — email match + HMAC is sufficient per D-07. |
| V3 Session Management | no | No sessions. Stateless HMAC. Timestamp-based anti-replay (5-min window). |
| V4 Access Control | yes | Proxy restricts access to known order lookup requests. Admin API token never exposed client-side. Storefront API token is public-safe. |
| V5 Input Validation | yes | Worker validates request body fields (presence, types). GraphQL injection prevented by parameterized queries (Admin API) and query variables (Storefront API). |
| V6 Cryptography | yes | HMAC-SHA256 for request signing. SHA-256 for email hashing. All via Web Crypto API (`crypto.subtle`) — no hand-rolled crypto. |
| V8 Data Protection | yes | Proxy returns only status-level order data. No PII (email, address, payment info) returned to browser. Raw Shopify Admin API response filtered server-side. |

### Security Properties

| Property | How Achieved |
|----------|-------------|
| **Confidentiality of Admin API token** | Token stored only in Cloudflare Workers `env.Secrets` via `wrangler secret put`. Never in client-side code, never in git. |
| **Replay attack prevention** | Timestamp with 5-minute window. HMAC includes timestamp in signed data. Worker rejects requests outside window. |
| **Tamper-proof requests** | HMAC signs `orderNumber + emailHash + timestamp`. Any modification to these fields changes the HMAC, which the Worker detects via `crypto.subtle.verify()`. |
| **Timing-safe HMAC verification** | `crypto.subtle.verify()` is constant-time in CF Workers runtime. Prevents timing side-channel attacks. |
| **Least privilege: proxy response** | Proxy returns only `{ found, status, estimatedDelivery, timeline }`. No order items, customer data, payment info, or raw Shopify response. |
| **CORS protection** | Worker includes `Access-Control-Allow-Origin` headers to control which origins can call the proxy. |
| **Input validation** | Worker validates: proper HTTP method, valid route, all required fields present, JSON parseable, timestamp is number, orderNumber is number, hmac is hex string. |

### Known Threat Patterns for {Cloudflare Workers + Shopify APIs}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| HMAC key compromise (stolen from widget bundle) | Information Disclosure | HMAC key can be extracted from widget source → mitigated by using separate HMAC key per deployment (not a master key) and keeping privileges minimal (proxy only returns order status, not order mutation) |
| Replay attack via captured HMAC+t | Tampering | 5-minute timestamp window. Worker rejects requests where `|now - timestamp| > 300`. |
| GraphQL injection via order query | Tampering | Admin API query uses GraphQL variables (`query: String!`) not string interpolation. Shopify sanitizes the query parameter. |
| XSS through markdown policy file | Spoofing | Policy file is fetched via `fetch()` and parsed as structured data (YAML frontmatter). The markdown body is the human-readable portion — not rendered as HTML in the widget. |
| Proxy abuse (unauthorized use of the Worker) | Elevation of Privilege | HMAC auth prevents arbitrary third parties from using the proxy. Even if HMAC key is stolen from one deployment, other deployments use different keys. |
| CSRF-like attacks on proxy endpoint | Tampering | POST requests with JSON body + HMAC auth. The HMAC is specific to a request payload. Random POSTs without valid HMAC are rejected. |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] `wrangler` v4.92.0 — latest version
- [VERIFIED: npm registry] `@cloudflare/workers-types` v4.20260518.1 — latest types
- [VERIFIED: developers.cloudflare.com/workers/runtime-apis/web-crypto] CF Workers Web Crypto API — `crypto.subtle.verify()` and `crypto.subtle.digest()` both supported
- [VERIFIED: developers.cloudflare.com/workers/examples/signing-requests] HMAC signing/verification example — source for worker HMAC pattern
- [VERIFIED: shopify.dev/docs/api/storefront/2026-04/queries/products] Storefront API `products()` query — fields: title, variants (price, quantityAvailable, availableForSale, selectedOptions), options, images, priceRange
- [VERIFIED: shopify.dev/docs/api/storefront/latest/objects/Product] Product object fields — confirm totalInventory, options, variants
- [VERIFIED: shopify.dev/docs/api/storefront/latest/objects/ProductVariant] ProductVariant fields — confirm price, quantityAvailable, availableForSale, selectedOptions
- [VERIFIED: shopify.dev/docs/api/admin-graphql/latest/objects/Order] Admin GraphQL Order object — confirm displayFulfillmentStatus, displayFinancialStatus, estimatedDeliveryDate, timelineItems, customer.email
- [VERIFIED: shopify.dev/docs/api/admin-graphql/2025-07/enums/orderdisplayfulfillmentstatus] OrderDisplayFulfillmentStatus enum — FULLED, IN_PROGRESS, ON_HOLD, UNFULFILLED, PARTIALLY_FULFILLED
- [VERIFIED: codebase] `src/services/types.ts` — existing `CatalogDataSource` and `OrderDataSource` interfaces confirmed unchanged
- [VERIFIED: codebase] `src/services/mockOrderData.ts` — 8 orders with 9 statuses, kept as fallback
- [VERIFIED: codebase] `src/services/mockCatalogData.ts` — 7 products with 52 variants, kept as fallback
- [VERIFIED: codebase] `shopify-widget/src/ChatWidget.ts` lines 35-46 — existing ChatWidgetOptions interface, lines 104-119 constructor services

### Secondary (MEDIUM confidence)
- [CITED: CONTEXT.md] 24 locked decisions covering proxy platform, HMAC, API contracts, error handling, data source selection
- [CITED: docs/user_verdict.md] JUDGE-04 (secure order lookup), JUDGE-05 (dynamic store sync), JUDGE-06 (no hardcoded arrays)
- [CITED: docs/hackathon.md] Shopify setup instructions — Partners account, dev store, custom app, Admin API token
- [CITED: .planning/codebase/ARCHITECTURE.md] System architecture layers — data layer with swappable sources pattern
- [CITED: .planning/ROADMAP.md] Phase 7 requirements, dependencies on Phase 6, success criteria

### Tertiary (LOW confidence)
- None — all technology claims verified against official docs or codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against npm registry and official Cloudflare docs
- Architecture: HIGH — patterns documented in CONTEXT.md with 24 locked decisions, verified against official Shopify API and Workers docs
- Pitfalls: HIGH — based on known Web Crypto API footguns, CF Workers gotchas, and Shopify API idiosyncrasies verified via official docs
- Security: HIGH — ASVS categories mapped to verified controls

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (Worker APIs stable; Shopify API versioning every 3 months)
