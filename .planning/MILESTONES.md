# Milestones

## v1.0 — Hackathon Submission

**Shipped:** 2026-05-19
**Phases:** 9 | **Plans:** 23 | **Tests:** 607 | **Commits:** 141
**Timeline:** 7 days (May 12-19, 2026)

A "Store-Native" Shopify AI customer support agent with hybrid architecture: in-browser semantic understanding (MiniLM embeddings) for intent routing + deterministic data retrieval for zero-hallucination answers.

### Key Accomplishments

1. Zero-hallucination architecture — all data retrieval uses zero LLM calls
2. In-browser semantic routing — MiniLM embeddings via transformer.js
3. Live human handoff — Supabase Realtime WebSocket channel
4. Live-by-default data sources — Shopify Storefront API + CF Worker proxy
5. 607 tests passing across 30 files with zero regressions
6. Context-aware UX — dynamic action chips, autocomplete, adaptive onboarding

### Known Gaps

- JUDGE-09 (Demo video) — handled by user post-code-freeze per D-14
- UX-01 (Context chips) — static SUGGESTION_MAP, query-aware refinement deferred

### Archive

- [v1-ROADMAP.md](milestones/v1-ROADMAP.md) — Full milestone details
