# Project State

## Project Reference
**Core Value**: Zero-hallucination, high-fidelity customer resolution grounded strictly in live Shopify data, powered by deterministic data retrieval augmented with semantic understanding.
**Current Focus**: Phase 8 — UX & Demo (Complete)

## Current Position
**Phase**: 05-ux-refinement (Plan 01 complete)
**Plan**: 05-01 — SuggestedActionsService with 40 tests
**Status**: Phase 5 UX Refinement plan 01 complete. SuggestedActionsService implemented with 6 context states, max-4 chip enforcement, 40 unit tests passing. Plans 05-02 and 05-03 pending.

## Progress:
[████████████████████████████████████] 100% (17/17 plans, 8/8 phases)

## Performance Metrics
- **Test Coverage**: 517 tests across 24 test files (467 main + 50 widget, all passing)
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
- Phase 5 UX Refinement: SuggestedActionsService replaces static action chips with context-aware suggestions. Pure service, no DOM access.
- Phase 6: Semantic AI Router — In-browser semantic intent detection with transformer.js, replacing keyword matching across all intent detectors. COMPLETE.
- Phase 7: Security & Live Data — Serverless order proxy (Cloudflare Worker), Shopify Storefront API integration, markdown config policies. Context captured.
- Phase 8: UX & Demo — quick action chips, Supabase Realtime handoff, agent console, doc updates. Complete.
- Plan 07-03: PolicyService live markdown fetch, ChatWidget data source options, 426 tests. Complete.
- Plan 08-01: Action chips (4 chips: Track Order, Check Stock, Return Item, View Policies) + onboarding hint. Complete.
- Plan 08-02: Supabase Realtime handoff replacing fake queue simulators. Complete. JUDGE-08 resolved.
- All existing deterministic data services (CatalogService, OrderService, PolicyService) preserved — only the intent detection layer changes.
- Zero-hallucination guarantee remains: semantic understanding layer routes intent, but all data retrieval stays deterministic.

### Completed Work
- Phase 1: UI Foundation & Error Handling — ChatWidget, NetworkDetector, CSS design system
- Phase 2: Policy Grounding & Guardrails — PolicyService, ResponseGrounder, OffTopicDetector, RefusalResponses
- Phase 3: Live Catalog Intelligence — CatalogService, CatalogIntentDetector, synonym resolver, mock data (7 products, 52 variants)
- Phase 4: Order Tracking Workflow — OrderService, OrderIntentDetector, OrderCard, mock data (8 orders, 9 statuses)
- Phase 5: Graceful Escalation — EscalationDetector, EscalationStateMachine, queue simulator, transfer handler, human agent simulator
- Phase 5 UX Refinement (Plan 05-01): SuggestedActionsService — context-aware action chips, 6 states, 40 tests
- Phase 6: Semantic AI Router — SemanticRouter class, build-time embeddings, all 3 detectors upgraded, first-query UX, feature flags
- Phase 7 (Plan 07-01): Shopify Proxy Foundation — CF Worker with HMAC verification, Admin GraphQL integration, email hash matching, CORS, 17 tests
- Phase 7 (Plan 07-02): Live Data Sources — ShopifyStorefrontDataSource (catalog), ShopifyOrderProxyDataSource (order lookup), HMAC signing, retry logic, 16 tests
- Phase 7 (Plan 07-03): PolicyService + ChatWidget Integration — PolicyService live markdown fetch + YAML frontmatter parsing, ChatWidget data source selection options, policies.md, documentation update
- Phase 8 (Plan 08-01): Action chips (Track Order, Check Stock, Return Item, View Policies) + onboarding hint on first open
- Phase 8 (Plan 08-02): Supabase Realtime handoff — handoff_request/accepted/agent_message events, simulators deleted, 50 tests
- Phase 8 (Plan 08-03): Agent console (split view, accept-first flow, Supabase broadcast) + doc updates (PRODUCT_DOC, TECHNICAL_DOC, DECISION_LOG, README)

### Requirements completed
- Policy Execution (Phase 2) — Built ✓
- Product Intelligence (Phase 3) — Built ✓
- Order Tracking Workflow (Phase 4) — Built ✓
- Graceful Handoff (Phase 5) — Built ✓
- Semantic AI Router (Phase 6) — Built (4/4 plans) ✓
- JUDGE-04 — Shopify Proxy Foundation (Plan 07-01): HMAC-authenticated serverless proxy prevents client-side data exposure ✓
- JUDGE-04 — ShopifyOrderProxyDataSource (Plan 07-02): HMAC-signed proxy client with SHA-256 email hashing and retry logic ✓
- JUDGE-05 — ShopifyStorefrontDataSource (Plan 07-02): Live Storefront GraphQL API integration replacing mock catalog data ✓
- JUDGE-06 — PolicyService live markdown fetch + YAML frontmatter parsing (Plan 07-03): Policy data dynamically fetched from policies.md ✓
- JUDGE-07 — Action chips + onboarding hint (Plan 08-01): Quick action chips and first-open guidance ✓
- JUDGE-08 — Supabase Realtime handoff (Plan 08-02): Fake queue simulators replaced with live WebSocket broadcast channels ✓
- JUDGE-09 — Agent console + docs (Plan 08-03): Standalone agent console with accept-first flow, all 4 docs updated ✓

### Remaining phases
- Phase 7: Security & Live Data — All 3 plans complete.
- Phase 8: UX & Demo — Complete. All 3 plans executed.

### Mandatory docs
- PRODUCT_DOC.md — Updated ✓
- TECHNICAL_DOC.md — Updated ✓ (Phase 7 architecture added)
- DECISION_LOG.md — Updated ✓ (D-01 through D-14 added)
- README.md — Updated ✓ (Project structure, test counts, proxy dev)

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
Last session: 2026-05-19
Stopped at: Phase 5 UX Refinement Plan 05-01 complete. SuggestedActionsService with 40 tests. Plans 05-02, 05-03 pending.

Next: Phase 5 Plans 05-02 and 05-03 (ChatWidget integration of SuggestedActionsService).
