---
phase: 07-security-live-data
plan: 01
subsystem: api
tags: [cloudflare-workers, shopify, hmac, graphql, serverless, proxy, security]
requires:
  - phase: 04-order-tracking-workflow
    provides: OrderDataSource interface, OrderCard rendering
  - phase: 06-semantic-ai-router
    provides: SemanticRouter integration pipeline
provides:
  - HMAC-authenticated serverless order lookup proxy
  - Shopify Admin GraphQL API integration for order status
  - Parameterized GraphQL queries (no string interpolation)
  - CORS-enabled proxy endpoint (POST /api/order-lookup)
  - Email hash verification for order ownership
  - Zero client-side exposure of Admin API token
affects:
  - phase: 07-security-live-data
    plan: 02
    description: ShopifyOrderProxyDataSource client implementation
  - phase: 08-ux-demo
    description: Full order lookup via proxy in ChatWidget

tech-stack:
  added:
    - wrangler ^4.92.0 (Cloudflare Workers CLI)
    - @cloudflare/workers-types ^4.20260518.1 (Worker type definitions)
    - vitest ^4.1.6 (test runner, also in root project)
  patterns:
    - HMAC request signing with crypto.subtle.verify() constant-time comparison
    - Shopify Admin GraphQL with parameterized $query variables
    - Proxy response mapping filtering to status-only fields
    - Environment-based config via .env for local dev, wrangler secrets for production

key-files:
  created:
    - shopify-proxy/package.json — Proxy project config with wrangler, vitest deps
    - shopify-proxy/wrangler.toml — Worker deployment config (name: shopify-order-proxy)
    - shopify-proxy/tsconfig.json — TypeScript strict mode config targeting ES2022
    - shopify-proxy/vitest.config.ts — Vitest test runner config for test/*.test.ts
    - shopify-proxy/.env.example — Template for SHOPIFY_ADMIN_TOKEN, STORE_DOMAIN, HMAC_SECRET
    - shopify-proxy/src/worker.ts — HMAC-authenticated order proxy worker (283 lines)
    - shopify-proxy/test/worker.test.ts — 17 test cases for all proxy behaviors (455 lines)
  modified:
    - package.json — Added dev:proxy script (cd shopify-proxy && npx wrangler dev)

key-decisions:
  - "Cloudflare Workers over Vercel Edge Functions: better free tier (100k req/day), native Web Crypto API, simpler wrangler dev DX"
  - "crypto.subtle.verify() for constant-time HMAC verification preventing timing side-channel attacks"
  - "Admin GraphQL API with $query parameterized variables — no string interpolation against SQL/NoSQL injection"
  - "Proxy response limited to {found, status, estimatedDelivery, timeline} — no raw Shopify data exposed"
  - "Email hash (SHA-256) verification for order ownership — proxy never sees raw email"
  - "5-minute timestamp window for replay attack prevention without server-side state"

patterns-established:
  - "Shopify Admin API calls use parameterized GraphQL variables, never string concatenation"
  - "All proxy errors return both HTTP status code and structured JSON {error, code, message}"
  - "CORS headers (Allow-Origin: *, Allow-Methods: POST/OPTIONS, Allow-Headers: Content-Type) on every response"
  - "OPTIONS preflight handler returns 200 with CORS headers for browser cross-origin requests"

requirements-completed: [JUDGE-04]

duration: 1h 21m
completed: 2026-05-18
---

# Phase 7 Plan 1: Shopify Proxy Foundation — Summary

**Cloudflare Workers serverless proxy with HMAC-authenticated order lookup, Shopify Admin GraphQL integration, parameterized queries, and constant-time crypto verification — addressing JUDGE-04 (client-side data exposure).**

## Performance

- **Duration:** 1h 21m (81 min)
- **Started:** 2026-05-18T13:01:18Z
- **Completed:** 2026-05-18T14:21:53Z
- **Tasks:** 3 (3 completed)
- **Files modified:** 10

## Accomplishments

- Scaffolded `shopify-proxy/` directory as a standalone Cloudflare Workers project with `wrangler.toml`, `tsconfig.json`, `vitest.config.ts`, and `.env.example`
- Implemented HMAC-authenticated `POST /api/order-lookup` endpoint with constant-time `crypto.subtle.verify()` — prevents timing side-channel attacks
- Integrated Shopify Admin GraphQL API with parameterized query variables — no string interpolation, preventing injection attacks
- Added email hash (SHA-256) verification matching request emailHash against order's customer email — prevents unauthorized access to orders
- Enforced 5-minute timestamp window for replay attack prevention without server-side state
- Created 17 comprehensive unit tests covering: valid HMAC, invalid HMAC, expired timestamp, missing fields, email mismatch, CORS headers, GraphQL query construction, error codes, route handling, and preflight OPTIONS
- All responses include CORS headers for cross-origin browser access
- Admin API token (`SHOPIFY_ADMIN_TOKEN`) stored only in worker environment secrets — never logged or exposed to client

## Threat Model Compliance

| ID | Threat | Severity | Mitigation Status |
|----|--------|----------|-------------------|
| T-07-01 | HMAC spoofing | HIGH | ✅ `crypto.subtle.verify()` constant-time comparison with 32-byte secret |
| T-07-02 | Replay attack | HIGH | ✅ Timestamp check rejects requests outside ±5 minute window |
| T-07-03 | Admin API token disclosure | HIGH | ✅ Token in `env.Secrets`. Never logged or returned in responses |
| T-07-04 | Excessive data exposure | HIGH | ✅ Proxy response explicitly maps to `{found, status, estimatedDelivery, timeline}`. No raw Shopify response. |
| T-07-05 | GraphQL injection | MEDIUM | ✅ Parameterized `$query: String!` variables. No string interpolation. |
| T-07-06 | DoS via repeated requests | LOW | ✅ Accepted risk — CF Workers built-in rate limiting sufficient for hackathon |

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold shopify-proxy directory** — `a80afcf` (feat)
   - Created package.json, wrangler.toml, tsconfig.json, vitest.config.ts, .env.example
   - Added dev:proxy script to root package.json
   - Installed npm dependencies (wrangler, @cloudflare/workers-types, vitest)

2. **Task 2: Implement worker.ts** — `7d9a523` (feat)
   - HMAC-verified order proxy with constant-time crypto.subtle.verify()
   - Shopify Admin GraphQL integration with parameterized queries
   - Email hash verification, timestamp expiry, CORS headers, structured error codes

3. **Task 3: Write proxy unit tests** — `e5c5917` (test)
   - 17 test cases across 4 describe blocks
   - Covers: valid HMAC, invalid HMAC, expired timestamp, missing fields, invalid emailHash, email mismatch, not_found, proxy_error, GraphQL query construction, CORS preflight, POST headers, route/method handling

## Files Created/Modified

- `shopify-proxy/package.json` — Project config with wrangler (^4.92.0), vitest (^4.1.6), @cloudflare/workers-types (^4.20260518.1)
- `shopify-proxy/wrangler.toml` — Worker name `shopify-order-proxy`, compatibility_date 2026-05-18, production env vars
- `shopify-proxy/tsconfig.json` — ES2022 target, strict mode, @cloudflare/workers-types, bundler module resolution
- `shopify-proxy/vitest.config.ts` — Test runner config: globals, node environment, test/**.test.ts include pattern
- `shopify-proxy/.env.example` — Template for SHOPIFY_ADMIN_TOKEN, SHOPIFY_STORE_DOMAIN, HMAC_SECRET
- `shopify-proxy/src/worker.ts` — Core proxy worker (283 lines): HMAC verification, Admin GraphQL, email hash check, CORS, error handling
- `shopify-proxy/test/worker.test.ts` — Test suite (455 lines, 17 tests): full coverage of all proxy behaviors
- `package.json` — Added `"dev:proxy": "cd shopify-proxy && npx wrangler dev"` script

### Key Implementation Details

**HMAC Verification Flow:**
```
Client → POST /api/order-lookup → Worker:
1. Parse JSON body (orderNumber, emailHash, timestamp, hmac)
2. Validate: orderNumber is number, emailHash is 64-char hex, timestamp is number, hmac is string
3. Timestamp check: |Date.now() - timestamp| > 300_000 → 401 invalid_hmac
4. HMAC verify: crypto.subtle.verify('HMAC', key, hexToBytes(hmac), encoder.encode(orderNumber+emailHash+timestamp))
5. If invalid → 401 invalid_hmac
6. Parameterized GraphQL query to Shopify Admin API
7. Email hash match against order's customer.email (SHA-256)
8. Map response to {found, status, estimatedDelivery, timeline}
9. Return with CORS headers
```

**Error Codes:**
| HTTP | Code | When |
|------|------|------|
| 400 | `invalid_request` | Missing/invalid fields, invalid JSON, invalid emailHash format |
| 401 | `invalid_hmac` | Expired timestamp or invalid HMAC signature |
| 404 | `not_found` | Order not found in Shopify |
| 404 | `email_mismatch` | Email hash does not match order's customer email |
| 405 | `invalid_request` | Non-POST method |
| 500 | `proxy_error` | Shopify API request failed or returned errors |

## Decisions Made

- **Proxy platform**: Cloudflare Workers over Vercel Edge Functions — better free tier, native Web Crypto API, simpler `wrangler dev` DX
- **Constant-time verification**: Used `crypto.subtle.verify()` instead of string comparison — prevents timing side-channel attacks on HMAC comparison
- **Parameterized GraphQL**: Used `$query: String!` variable in Admin API queries — prevents injection attacks compared to string interpolation
- **Minimal response shape**: Proxy returns only `{found, status, estimatedDelivery, timeline}` — no raw Shopify data or PII exposed
- **Email verification**: SHA-256 hash comparison for order ownership — proxy never sees raw customer email
- **5-minute expiry**: Timestamp window prevents replay attacks without requiring server-side state storage

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Ready for Plan 07-02: ShopifyOrderProxyDataSource client-side implementation (HMAC signing, retry logic, OrderDataSource interface implementation)
- Ready for integration testing with ChatWidget and OrderService
- Worker tested with 17 passing tests — deploy via `cd shopify-proxy && wrangler deploy` after setting credentials

## Self-Check: PASSED

- ✅ All 8 key files exist (package.json, wrangler.toml, tsconfig.json, vitest.config.ts, .env.example, worker.ts, worker.test.ts, SUMMARY.md)
- ✅ All 4 commits exist (a80afcf, 7d9a523, e5c5917, c22bc0e)
- ✅ All 17 tests pass (1 test file, 0 failures, 505ms)

---

*Phase: 07-security-live-data*
*Completed: 2026-05-18*
