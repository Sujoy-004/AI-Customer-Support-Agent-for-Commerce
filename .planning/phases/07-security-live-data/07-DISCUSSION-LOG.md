# Phase 7: Security & Live Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 07-security-live-data
**Areas discussed:** Proxy Platform, Policy Data Source, Proxy API Contract, Local Dev Workflow, Shopify Credentials, Error Handling

---

## Proxy Platform

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Workers (Recommended) | wrangler CLI, edge-native, free tier 100k req/day | ✓ |
| Vercel Functions | vercel dev, adds Vercel project dependency | |
| Standalone dir in this repo | shopify-proxy/ at root, own package.json | |
| Same workspace as widget | Add to existing shopify-widget/ | |
| TypeScript + wrangler (Recommended) | Standard CF Workers stack | ✓ |
| TypeScript + nodejs_compat | CF nodejs_compat flag | |
| Include HMAC (Recommended) | Ships more complete proxy, addresses judge's concern | ✓ |
| Skip HMAC for now | Simpler proxy, no request auth | |
| ChatWidget constructor option (Recommended) | hmacSecret passed as widget option | ✓ |
| Auto-generated at build time | Generate random secret during build | |
| Shopify Admin REST API | /admin/api/2024-04/orders.json | |
| Shopify Admin GraphQL API | GraphQL endpoint, query only needed fields | ✓ |

**User's choice:** Cloudflare Workers, standalone dir, TS+wrangler, HMAC included, HMAC secret via constructor, GraphQL Admin API
**Notes:** User chose GraphQL Admin API over REST for more efficient queries.

---

## Policy Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown config file (Recommended) | policies.md with frontmatter YAML | ✓ |
| Shopify Metaobjects API | Custom structured data in Shopify Admin | |
| HTML meta tags in store | Scrape from store page DOM | |
| URL config option in ChatWidget (Recommended) | PolicyService takes policyUrl option | ✓ |
| Bundled with widget | Policies built into widget bundle | |
| Frontmatter YAML + Markdown (Recommended) | Structured fields + display text | ✓ |
| Flat JSON file | policies.json, machine-optimal | |
| Markdown only | Plain markdown parsed by headings | |
| Direct client-side fetch (Recommended) | Widget fetches policies.md via fetch() | ✓ |
| Through the proxy | Proxy serves policy file | |

**User's choice:** Markdown config file with frontmatter YAML, URL config option, direct client-side fetch
**Notes:** — 

---

## Proxy API Contract

| Option | Description | Selected |
|--------|-------------|----------|
| orderNumber + email hash + timestamp + HMAC (Recommended) | Full request body with replay protection | ✓ |
| orderNumber + email + HMAC | Simpler, email in plaintext | |
| orderNumber only | No email verification | |
| SHA-256 (Recommended) | Standard, built into SubtleCrypto | ✓ |
| SHA-256 + salt | Rainbow table protection | |
| Status only (Recommended) | { found, status, estimatedDelivery, timeline } | ✓ |
| Status + item names | Add item names and quantities | |
| Full order with filtered fields | Return most Order fields except PII | |
| Structured JSON error | { error, code, message } | |
| HTTP status code only | 404/401/500 | |
| Both — HTTP status + JSON body (Recommended) | Combined approach | ✓ |

**User's choice:** Full request with HMAC + timestamp, SHA-256, status-only response, both HTTP status + JSON error body
**Notes:** — 

---

## Local Dev Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| wrangler dev (Recommended) | Standard CF Workers approach, localhost:8787 | ✓ |
| wrangler dev + --remote | Connects to live CF environment | |
| Single npm script at root (Recommended) | dev:proxy script alongside existing dev command | ✓ |
| Separate terminal sessions | Manual, no orchestration | |
| concurrently | npm package for parallel runs | |
| wrangler.toml [vars] | Non-secret config in toml, secrets via wrangler secret | |
| .env file only (Recommended) | Everything in .env | ✓ |

**User's choice:** wrangler dev, single npm script at root, .env for config
**Notes:** — 

---

## Shopify Credentials

| Option | Description | Selected |
|--------|-------------|----------|
| Custom app + Admin API key (Recommended) | Standard approach per hackathon.md | ✓ |
| OAuth 2.0 with PKCE | Full OAuth flow, overkill for hackathon | |

**User's choice:** Custom app + Admin API token per hackathon.md setup flow
**Notes:** User referenced docs/hackathon.md §"Getting Started with Shopify" — Partners account → dev store → custom app → Admin API access token. Storefront API is public (no auth needed).

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fallback to mock data | Silently switch to MockOrderDataSource | |
| Show a user-visible error | "Order lookup is temporarily unavailable" | |
| Retry once, then fallback to mock (Recommended) | Retry after 2s, then mock | ✓ |
| Fallback to mock catalog | Silently switch to MockCatalogDataSource | |
| Show error + cached products | Last fetched products from cache | |
| Show error message (Recommended) | "Product catalog is temporarily unavailable" | ✓ |
| Show fallback text (Recommended) | Built-in policy fallback text | ✓ |
| Use cached policy text | Cache last successful fetch in localStorage | |
| Show error message | "Policy information is temporarily unavailable" | |
| Silent — no indication (Recommended) | Widget works identically regardless of backend | ✓ |
| Subtle badge (dev only) | Mock badge visible in dev mode | |
| Status dot in corner | Green/yellow/red API status indicator | |

**User's choice:** Order: retry → mock; Catalog: show error; Policy: show fallback text; No source indicator
**Notes:** Consistent tiered approach — critical functionality (order) gets fallback, informational (catalog) shows error, policy shows safe fallback text.

---

## OpenCode's Discretion

- Exact directory structure of `shopify-proxy/` (package.json, wrangler.toml, src layout)
- Exact GraphQL query shapes (Admin API + Storefront API)
- `ShopifyStorefrontDataSource` and `ShopifyOrderProxyDataSource` implementation details
- `PolicyService` frontmatter parsing implementation
- ChatWidget options interface updates
- Test structure and additions

## Deferred Ideas

- OTP verification for order lookup — out of scope for hackathon
- Database storage — no DB, proxy passes through to Shopify
- Rate limiting on proxy — Cloudflare Workers built-in
- Multi-store support — one store for demo
- Custom Shopify app distribution — Admin API custom app is sufficient
- OAuth 2.0 with PKCE — custom app + token is simpler for hackathon scope
