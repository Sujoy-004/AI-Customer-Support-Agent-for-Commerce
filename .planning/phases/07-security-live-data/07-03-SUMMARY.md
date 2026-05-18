---
phase: 07-security-live-data
plan: 07-03
subsystem: services
tags: [policyservice, chatwidget, live-data, storefront-api, hmac-auth, policy-markdown]

requires:
  - phase: 07-01
    provides: Cloudflare Workers proxy foundation (worker.ts, HMAC verification, Admin GraphQL)
  - phase: 07-02
    provides: ShopifyStorefrontDataSource, ShopifyOrderProxyDataSource (live API clients)

provides:
  - PolicyService with live markdown fetch and YAML frontmatter parsing
  - ChatWidget constructor options (proxyUrl, hmacSecret, policyUrl, storeDomain, storefrontToken, dataSource selection)
  - Data source integration tests for canvas, order, policy modes
  - Documentation (TECHNICAL_DOC.md §10, DECISION_LOG.md D-01–D-14)

affects: [08-ux-demo]

tech-stack:
  added: [frontmatter-yaml-parser (custom), policies.md config format]
  patterns: [silent data source selection, markdown-frontmatter-as-config, SHA-256 email hashing for privacy]

key-files:
  created:
    - policies.md: Example policy config at project root with YAML frontmatter
  modified:
    - src/services/policyService.ts: PolicyServiceOptions, loadPolicies() live fetch + frontmatter parsing
    - src/services/policyService.test.ts: 20 new tests (frontmatter parsing, fetch error, caching)
    - shopify-widget/src/ChatWidget.ts: New options fields, data source selection logic
    - shopify-widget/tests/ChatWidget.integration.test.ts: 20 new test cases covering data source options
    - src/services/shopifyStorefrontDataSource.test.ts: 20 new test cases
    - src/services/shopifyOrderProxyDataSource.test.ts: Added 4 new test cases (HMAC, proxyUrl normalization)

key-decisions:
  - "D-06: Keep mock data as default, live data as opt-in via dataSource config"
  - "D-13: On policy fetch failure, show fallback text: 'Please check our store policies for the most current information.'"
  - "D-14: Silent data source mode — no UI indicator of which backend is active"

patterns-established:
  - dataSource toggle pattern: per-service enum ('mock' | 'live') in ChatWidgetOptions
  - Markdown frontmatter config: YAML frontmatter in policies.md for structured policy data

requirements-completed: [JUDGE-04, JUDGE-06]

duration: ~45min
completed: 2026-05-18
---

# Phase 7 Plan 3: PolicyService + ChatWidget Integration Summary

**PolicyService live markdown fetch with YAML frontmatter parsing, ChatWidget data source options integration, and 426 passing tests**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-05-18T14:10:00Z
- **Completed:** 2026-05-18T14:55:00Z
- **Tasks:** 4 (0 TDD)
- **Files modified:** 11

## Accomplishments

- PolicyService now supports live markdown config file fetch with YAML frontmatter parsing (JUDGE-06)
- ChatWidget constructor accepts proxyUrl, hmacSecret, policyUrl, storeDomain, storefrontToken, and dataSource selection (catalog/order/policy: 'mock' | 'live')
- Frontmatter parser handles nested section keys (e.g., shipping.standard), arrays, booleans, and numbers
- Created `policies.md` example config file at project root
- 20 PolicyService tests, 20 ChatWidget integration tests, 20 StorefrontDataSource tests, 4 OrderProxyDataSource tests added
- All 426 tests pass across 22 test files
- Documentation updated with Phase 7 architecture (TECHNICAL_DOC.md §10), key decisions (DECISION_LOG.md D-01–D-14), product updates (PRODUCT_DOC.md), and README.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Update PolicyService for live markdown fetch** — `1a00c75` (feat)
2. **Task 2: Update ChatWidget constructor options** — `52594a7` (feat)
3. **Task 3: Integration tests for new data sources** — `b99863b` (test)
4. **Task 4: Update documentation** — `3753466` (docs)

**Plan metadata:** `3753466` (docs: complete plan 07-03)

## Files Created/Modified

- `policies.md` — Example policy config with YAML frontmatter, supporting nested keys, arrays, booleans, numbers
- `src/services/policyService.ts` — PolicyServiceOptions interface, loadPolicies() with fetch + frontmatter parsing, caching
- `src/services/policyService.test.ts` — 20 tests: frontmatter parsing, fetch error, mock fallback, caching, edge cases
- `shopify-widget/src/ChatWidget.ts` — New options fields: proxyUrl, hmacSecret, policyUrl, storeDomain, storefrontToken, dataSource; _policyService property; _handlePolicyQuery with module-level fallback
- `shopify-widget/tests/ChatWidget.integration.test.ts` — 20 tests: data source options for catalog live/mock, order live/mock, policy live/mock, combined modes, Canvas provider forwarding
- `src/services/shopifyStorefrontDataSource.test.ts` — 20 tests: GraphQL query construction, parameter escaping, mapProducts, error handling
- `src/services/shopifyOrderProxyDataSource.test.ts` — 4 new tests: invalid HMAC handling, proxyUrl normalization with/without trailing slash
- `README.md` — Updated project structure, test counts, proxy dev section, phases table
- `docs/TECHNICAL_DOC.md` — Added §10 Phase 7 Architecture (proxy, live data sources, PolicyService fetch, ChatWidget options, HMAC auth, error handling)
- `docs/DECISION_LOG.md` — Added D-01 through D-14 covering proxy platform, HMAC auth, Storefront API, policy frontmatter, error handling
- `docs/PRODUCT_DOC.md` — Updated Current Limitations and roadmap table

## Decisions Made

- **D-06: Mock data as default, live as opt-in** — `dataSource: { catalog: 'mock', order: 'mock', policy: 'mock' }` default ensures backward compatibility
- **D-13: Policy fallback text** — On fetch failure, PolicyService throws Error with "Please check our store policies for the most current information." caught by ChatWidget's try/catch
- **D-14: Silent data source mode** — No UI badge/indicator shown to the user. Widget works identically regardless of backend
- **Frontmatter parser maintains backward compatibility** — PolicyService uses `useMockData: true` by default; existing code importing `policyService` singleton gets unchanged mock behavior
- **ChatWidget._policyService** — Instantiated as class property in constructor; `_handlePolicyQuery` uses `this._policyService` with module-level fallback for safety

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: config-exposure | shopify-widget/src/ChatWidget.ts | proxyUrl, hmacSecret, storeDomain, storefrontToken embedded in widget bundle. Mitigated: hmacSecret is deployment-specific, proxy returns minimal data per JUDGE-04. Accepted per plan's threat model T-07-12. |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PolicyService with live fetch ready for merchant configuration
- ChatWidget accepts all Phase 7 data source options
- All data source interfaces wired for mock ↔ live toggle
- Ready for Phase 8 (UX & Demo) — ChatWidget has all options needed for demo configuration

## Self-Check: PASSED

- ✅ All 6 key files exist (policies.md, policyService.ts, ChatWidget.ts, TECHNICAL_DOC.md, DECISION_LOG.md, PRODUCT_DOC.md)
- ✅ All 4 commits exist (1a00c75, 52594a7, b99863b, 3753466)
- ✅ All 426 tests pass (22 test files, 0 failures, 22.39s)

---

*Phase: 07-security-live-data*
*Completed: 2026-05-18*
