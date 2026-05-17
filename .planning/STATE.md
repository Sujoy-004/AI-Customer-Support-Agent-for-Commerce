# Project State

## Project Reference
**Core Value**: Zero-hallucination, high-fidelity customer resolution grounded strictly in live Shopify data, powered by deterministic data retrieval augmented with semantic understanding.
**Current Focus**: Phase 6 — Semantic AI Router

## Current Position
**Phase**: 06-semantic-ai-router
**Plan**: Not yet planned
**Status**: Phase 5 complete. Phase 6 ready for discussion.

## Progress:
[███████████████████████████████░░] 62% (5/8 phases)

## Performance Metrics
- **Test Coverage**: 325+ tests across 19+ suites (all passing)
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
- Phase 6: Semantic AI Router — in-browser semantic intent detection with transformer.js/ONNX Runtime Web, replacing keyword matching across all intent detectors.
- Phase 7: Security & Live Data — serverless order proxy (Cloudflare Worker / Vercel function), Shopify Storefront API integration, dynamic policy fetching.
- Phase 8: UX & Demo — quick action chips, Supabase Realtime handoff, demo video recording, doc updates.
- All existing deterministic data services (CatalogService, OrderService, PolicyService) preserved — only the intent detection layer changes.
- Zero-hallucination guarantee remains: semantic understanding layer routes intent, but all data retrieval stays deterministic.

### Completed Work
- Phase 1: UI Foundation & Error Handling — ChatWidget, NetworkDetector, CSS design system
- Phase 2: Policy Grounding & Guardrails — PolicyService, ResponseGrounder, OffTopicDetector, RefusalResponses
- Phase 3: Live Catalog Intelligence — CatalogService, CatalogIntentDetector, synonym resolver, mock data (7 products, 52 variants)
- Phase 4: Order Tracking Workflow — OrderService, OrderIntentDetector, OrderCard, mock data (8 orders, 9 statuses)
- Phase 5: Graceful Escalation — EscalationDetector, EscalationStateMachine, queue simulator, transfer handler, human agent simulator

### Requirements completed
- Policy Execution (Phase 2) — Built ✓
- Product Intelligence (Phase 3) — Built ✓
- Order Tracking Workflow (Phase 4) — Built ✓
- Graceful Handoff (Phase 5) — Built ✓

### Remaining phases
- Phase 6: Semantic AI Router — NOT started
- Phase 7: Security & Live Data — NOT started
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
Phase 5 complete. Judge verdict received. Roadmap realigned. Phase 6 ready for discussion.
