# Project State

## Project Reference
**Core Value**: Zero-hallucination, high-fidelity customer resolution grounded strictly in live Shopify data, powered by deterministic data retrieval augmented with semantic understanding.
**Current Focus**: Phase 7 — Security & Live Data

## Current Position
**Phase**: 07-security-live-data
**Plan**: 07-02 (Live Data Sources)
**Status**: Plan 07-02 complete. ShopifyStorefrontDataSource (CatalogDataSource) and ShopifyOrderProxyDataSource (OrderDataSource) with HMAC-signed proxy requests, 16 tests. 398 total tests across 21 suites.

## Progress:
[████████████████████████████████████] 88% (15/17 plans, 7/8 phases)

## Performance Metrics
- **Test Coverage**: 398 tests across 21 suites (all passing)
- **Build Passing**: Yes
- **Judge Score**: 58/100 — Bronze Tier (hackathon submission)

## Why the Pivot

The hackathon judge returned a verdict (user_verdict.md) scoring the project 58/100. The critical gap: the project brands itself as "AI" but uses purely keyword-based intent detection. The judge's specific findings:

1. **No real semantic routing** — intent detection is exact substring matching, breaks on typos and natural phrasing
2. **Security risk** — order data lives in client-side memory with no backend boundary
3. **Handoff is simulated** — queue/escalation uses fake timers, not a live channel
4. **UX is decorative** — terminal aesthetic with no onboarding, no action affordances

The original Phase 6 (Return Initiation) is deferred. The project needs fundamental architectural fixes before adding more workflows. The rebuild follows the judge's recommended target architecture: semantic router → authenticated backend → realtime support channel.

## Accumulated Context

### Decisions
- Roadmap realigned from 6 phases to 8 phases. Original Phase 6 (Return Initiation) deferred in favor of architectural rewrite.
- Phase 6: Semantic AI Router — In-browser semantic intent detection with transformer.js, replacing keyword matching across all intent detectors. COMPLETE.
- Phase 7: Security & Live Data — Serverless order proxy (Cloudflare Worker), Shopify Storefront API integration, markdown config policies. Context captured.
- Phase 8: UX & Demo — quick action chips, Supabase Realtime handoff, demo video recording, doc updates.
- All existing deterministic data services (CatalogService, OrderService, PolicyService) preserved — only the intent detection layer changes.
- Zero-hallucination guarantee remains: semantic understanding layer routes intent, but all data retrieval stays deterministic.

### Completed Work
- Phase 1: UI Foundation & Error Handling — ChatWidget, NetworkDetector, CSS design system
- Phase 2: Policy Grounding & Guardrails — PolicyService, ResponseGrounder, OffTopicDetector, RefusalResponses
- Phase 3: Live Catalog Intelligence — CatalogService, CatalogIntentDetector, synonym resolver, mock data (7 products, 52 variants)
- Phase 4: Order Tracking Workflow — OrderService, OrderIntentDetector, OrderCard, mock data (8 orders, 9 statuses)
- Phase 5: Graceful Escalation — EscalationDetector, EscalationStateMachine, queue simulator, transfer handler, human agent simulator
- Phase 6: Semantic AI Router — SemanticRouter class, build-time embeddings, all 3 detectors upgraded, first-query UX, feature flags
- Phase 7 (Plan 07-01): Shopify Proxy Foundation — CF Worker with HMAC verification, Admin GraphQL integration, email hash matching, CORS, 17 tests
- Phase 7 (Plan 07-02): Live Data Sources — ShopifyStorefrontDataSource (catalog), ShopifyOrderProxyDataSource (order lookup), HMAC signing, retry logic, 16 tests

### Requirements completed
- Policy Execution (Phase 2) — Built ✓
- Product Intelligence (Phase 3) — Built ✓
- Order Tracking Workflow (Phase 4) — Built ✓
- Graceful Handoff (Phase 5) — Built ✓
- Semantic AI Router (Phase 6) — Built (4/4 plans) ✓
- JUDGE-04 — Shopify Proxy Foundation (Plan 07-01): HMAC-authenticated serverless proxy prevents client-side data exposure ✓
- JUDGE-04 — ShopifyOrderProxyDataSource (Plan 07-02): HMAC-signed proxy client with SHA-256 email hashing and retry logic ✓
- JUDGE-05 — ShopifyStorefrontDataSource (Plan 07-02): Live Storefront GraphQL API integration replacing mock catalog data ✓

### Remaining phases
- Phase 7: Security & Live Data — Plans 07-01 and 07-02 complete. 07-03 remaining.
- Phase 8: UX & Demo — NOT started

### Mandatory docs
- PRODUCT_DOC.md — Created ✓ (needs update after rewrite)
- TECHNICAL_DOC.md — Created ✓ (needs update after rewrite)
- DECISION_LOG.md — Created ✓
- README.md — Created ✓ (needs update)

## Key Reference Files

| File | Purpose |
|------|---------|
| `user_verdict.md` | Judge's verdict and rebuild brief — the single most important reference for Phases 6-8 |
| `hackathon.md` | Hackathon rules, rubric, deadlines (submission: May 20, 2026 11:59 PM IST) |
| `.planning/ROADMAP.md` | Updated roadmap with Phase 6-7-8 structure |
| `.planning/phases/06-semantic-ai-router/06-CONTEXT.md` | Phase 6 detailed context |
| `.planning/phases/07-security-live-data/07-CONTEXT.md` | Phase 7 detailed context |
| `.planning/phases/08-ux-demo/08-CONTEXT.md` | Phase 8 detailed context |

## Session Continuity
Plan 07-02 complete (2026-05-18). Live data sources built: ShopifyStorefrontDataSource (catalog) and ShopifyOrderProxyDataSource (order lookup), 16 tests. 398 total tests across 21 suites. Ready for Plan 07-03 (PolicyService live fetch + ChatWidget integration).
Resume file: `.planning/phases/07-security-live-data/07-02-SUMMARY.md`
