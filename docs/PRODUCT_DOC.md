<!-- generated-by: gsd-doc-writer -->
# Product Document: AI Customer Support Agent for Commerce

> **Track:** Kasparro Agentic Commerce Hackathon — Track 4
> **Stack:** TypeScript, Vitest, Playwright, @huggingface/transformers, Supabase Realtime
> **Status:** v1.1 — UX polish, return flow, compound queries (May 20, 2026)

## Problem

Shopify store owners need customer support that knows their business — not a generic FAQ bot. Customers ask about specific products, store policies, and want to complete workflows (track an order, start a return) without leaving the chat.

Current solutions: (1) generic FAQ wrappers with keyword-match bots that don't know inventory and hallucinate policies, (2) full LLM agents that are expensive, unpredictable, and prone to hallucination.

This product takes a third path: **deterministic ground truth for everything verifiable**, AI only for NLU (intent detection, query parsing). No LLM touches a price, stock count, or policy term.

## Why the Rebuild

The original 8-phase submission scored 58/100 (Bronze). Key feedback: mock data treated as production-ready, human handoff used simulated agents, live data sources feature-flagged off. The 9-phase rebuild set production-grade defaults: live data sources are standard, Supabase Realtime powers genuine handoff, mock data is test-only, semantic AI routing handles natural language. **v1.0 shipped May 19, 2026 — 607 tests passing, 141 commits over 7 days.**

## Users

**Primary: Shopify Store Owners** — accurate answers from live data, reduced support load, no hallucinated policy promises, branded widget.

**Secondary: Store Customers** — instant answers about products/sizing/stock, in-chat workflows (order tracking, returns), polite off-topic redirection, never wrong info on prices/availability/policies.

## Differentiator

| Aspect | Generic Chatbot | This Product |
|--------|----------------|--------------|
| Catalog data | Static FAQ / LLM hallucination | Live product data, structured pipeline |
| Stock levels | "Check our website" | Real-time `checkStock()` — never cached |
| Policy grounding | Vague summaries | Exact policy strings, ResponseGrounder-validated |
| Intent detection | LLM (expensive, variable) | Semantic embeddings + keyword fallback (free, deterministic) |
| Hallucination risk | High | Zero — verifiable data only |
| LLM cost per query | $0.01–0.10 | $0.00 for catalog/policy paths |
| Human handoff | Simulated / canned scripts | Supabase Realtime to live agent console |

All data retrieval uses **zero LLM calls** — product lookup, variant resolution, stock check, order lookup, policy lookup all go through deterministic parsing. AI is used only for intent routing via MiniLM embeddings. Human handoff is real — messages flow through a Supabase Realtime channel to a live agent console and back.

## Workflows

1. **Product search** — "do you have a leather belt?" → product details with stock summary
2. **Stock check** — "is the classic hoodie in stock?" → per-variant availability
3. **Sizing inquiry** — "what sizes does the denim jacket come in?" → option listing
4. **Variant lookup** — "classic hoodie medium black" → exact SKU with price + stock
5. **Multi-turn refinement** — cross-turn context (20 turns / 5-min expiry)
6. **Policy queries** — grounded policy response with semantic routing
7. **Off-topic refusal** — polite refusal with redirect suggestions
8. **Order tracking** — rich order card with timeline via CF Worker proxy
9. **Live human handoff** — escalation → Supabase Realtime → real agent
10. **Return initiation** — eligibility check → item selection → in-chat submission
11. **Autocomplete** — 2+ char prefix matching for products/order numbers
12. **Context-aware suggestions** — dynamic action chips (6 contexts)
13. **Adaptive onboarding** — first-run hint, 7-day localStorage expiry, no popup
14. **Network resilience** — offline detection, message queuing, auto-reconnect

## User Experience

Chat widget loads as `[+] Support` toggle, bottom-right. Opens to empty message area (no welcome message — deliberate D-14 decision). Berkeley Mono typography, cream background (`#fdfcfc`), hairline borders, ASCII bracket markers. Auto-growing textarea.

## Current Limitations

1. **Browser-side only** — all services in browser; new instances per page load
2. **Mock data is test-only** — production uses live Shopify data sources by default
3. **No persistent conversation history** — context expires after 5 min / 20 turns
4. **ChatWidget is a god class** — 1400+ lines, needs splitting
5. **Hand-rolled HTML sanitization** — whitelist-based, adequate for demo
6. **Static suggestion map** — partially dynamic (product/order context injected)
7. **Supabase credentials hardcoded** — should use env vars / build-time injection

## Roadmap

### v1.1 — UX Polish & Response Quality (Shipped May 20, 2026)
| Change | Status |
|--------|--------|
| Return service enabled by default | Complete |
| Compound query handling (catalog + policy) | Complete |
| Warranty keyword mapping (defective, damaged, broken) | Complete |
| Order number regex for ORD-XXXX format | Complete |
| Context-aware action chips | Complete |
| Order card CSS class whitelist in sanitizer | Complete |
| Conversational response templates | Complete |
| Context limit increased to 20 turns | Complete |
| Refresh button in chat header | Complete |
| Policy routing priority fix | Complete |
| Off-topic word-boundary fixes | Complete |
| Size synonym full-name matching | Complete |

### Hackathon Submission (v1.0 — Shipped May 19, 2026)
| Phase | Status |
|-------|--------|
| 1. UI Foundation | Complete |
| 2. Policy Grounding & Guardrails | Complete |
| 3. Catalog Intelligence + Realtime Handoff | Complete |
| 4. Dynamic Store Sync | Complete |
| 5. Graceful Escalation | Complete |
| 5.1 UX Refinement | Complete |
| 6. Semantic AI Router | Complete |
| 7. Security & Live Data | Complete |
| 8. UX & Demo | Complete |
| 9. Gap Closure | Complete |

### Post-Hackathon
- Server-side service architecture (Shopify App backend)
- Persistent conversation storage
- Multi-store support
- Analytics dashboard
