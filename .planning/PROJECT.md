# AI Customer Support Agent for Commerce

## What This Is

A "Store-Native" Shopify AI customer support agent for the Kasparro Agentic Commerce Hackathon (Track 4). Uses hybrid architecture: in-browser semantic understanding (MiniLM embeddings) for intent routing + deterministic data retrieval for zero-hallucination answers.

## Core Value

Zero-hallucination, high-fidelity customer resolution grounded strictly in live Shopify data.

## Current State

**Shipped:** v1.0 — 2026-05-19
**Tests:** 607 passing across 30 files
**Commits:** 141 over 7 days
**Tech Stack:** TypeScript, Vitest, Playwright, @huggingface/transformers, Supabase Realtime, Cloudflare Workers

## Requirements

### Validated

- ✓ CORE-01: Live catalog intelligence — v1.0
- ✓ CORE-02: Policy grounding — v1.0 (grounding enforced in Phase 9)
- ✓ CORE-03: Off-topic guard — v1.0
- ✓ WORK-01: Order tracking workflow — v1.0
- ✓ SAFE-01: Graceful human handoff — v1.0
- ✓ SAFE-02: UI error handling — v1.0
- ✓ SAFE-03: Network failure handling — v1.0
- ✓ JUDGE-01: Semantic routing — v1.0
- ✓ JUDGE-02: Typo resilience — v1.0
- ✓ JUDGE-03: Natural language variation — v1.0 (semantic policy routing added)
- ✓ JUDGE-04: Client-side data security — v1.0
- ✓ JUDGE-05: Dynamic store sync — v1.0
- ✓ JUDGE-06: No hardcoded arrays — v1.0
- ✓ JUDGE-07: UI affordances — v1.0
- ✓ JUDGE-08: Real handoff — v1.0
- ✓ UX-01: Context-aware actions — v1.0 (static map, query-aware deferred)
- ✓ UX-02: Autocomplete — v1.0
- ✓ UX-03: Adaptive onboarding — v1.0
- ✓ UX-04: Terminal aesthetic — v1.0
- ✓ UX-05: Zero LLM calls — v1.0

### Out of Scope (v1.0)

- JUDGE-09 (Demo video) — per D-14, handled by user post-code-freeze
- Mobile responsiveness — web-first approach
- Multi-store support — post-hackathon feature
- Persistent conversation history — future milestone

## Key Decisions

| Decision | Outcome | Status |
|----------|---------|--------|
| Berkeley Mono typography, flat cream canvas, hairline borders | Implemented with JetBrains Mono fallback | ✓ Good |
| No welcome message — widget opens clean | Implemented, reduces friction | ✓ Good |
| Keyword-based off-topic detection | Implemented, predictable and testable | ✓ Good |
| Hybrid semantic + keyword intent detection | SemanticRouter as primary, keyword fallback | ✓ Good |
| Supabase Realtime for handoff | Replaced simulators with live WebSocket | ✓ Good |
| Live-by-default data sources | Production uses Shopify APIs, tests use mock | ✓ Good |
| SHA-256 policy change detection | Reliable vs timestamps | ✓ Good |
| Context-aware action chips | Static map, query-aware refinement deferred | ⚠️ Revisit |

## Constraints

- All services run in-browser — no backend required
- Zero LLM calls for data retrieval
- TypeScript strict mode, no `any` types
- 2-space indentation, single quotes, semicolons
- Immutable data patterns (spread operators, no direct mutation)

## Known Tech Debt

- ChatWidget is a god class (1500+ lines) — should be split
- Hand-rolled HTML sanitization — should use DOMPurify
- Supabase credentials hardcoded — should use env vars
- `as any` type assertions in some test files

---

*Last updated: 2026-05-19 after v1.0 milestone*
