# AI Customer Support Agent for Commerce — Judge Verdict + Rebuild Brief

## Purpose

1. Record the senior judge's verdict on the current submission.
2. Define minimum architectural changes so AI coding agents can rebuild without guessing.

Treat this as an execution brief, not marketing copy.

---

## Project Context

**Project:** AI Customer Support Agent for Commerce (Shopify Chat Widget)
**Judging:** Kasparro Senior Engineering Panel
**Date:** May 17, 2026
**Test coverage:** 19 Vitest files (325/325 unit tests), 12/12 Playwright E2E
**Score:** 58 / 100 — Bronze Tier

---

## Judge Summary

Visually polished but functionally weak. The project is branded as **AI** but is mostly **rule-based** — no real semantic routing, no LLM-backed reasoning, no secure backend for sensitive actions. Do not let an agent reinterpret this into "mostly fine."

---

## Core Findings

1. **Product Scope Problem** — claims AI-driven, behaves like a scripted chatbot
2. **Technical Fragility** — hardcoded keyword matching breaks on typos, synonyms, natural phrasing
3. **Security Risk** — customer/order data must not live in client-side memory
4. **Handoff Is Simulated** — queue/escalation is local simulation, not live support
5. **UX Is Decorative** — terminal style alone is insufficient; needs onboarding and action affordances

---

## What Live Shopify API Does / Does Not Solve

**Solves:** live catalog/inventory freshness, fewer redeploys for content changes.

**Does not solve:** semantic typo tolerance, AI routing, secure order lookup, human handoff, authentication.

**Security note:** Do not expose Shopify Admin credentials in browser code. Sensitive lookups must go through a backend proxy.

---

## Required Rebuild Direction

Four real capabilities:
1. **Semantic intent routing**
2. **Secure backend order handling**
3. **Live human handoff**
4. **Dynamic store content sync**

If the project remains purely rule-based, it should not be labeled as AI.

---

## Target Architecture

```
User Input → Semantic Router
  ├─ Catalog/Policy → Grounded Retrieval Layer → Response Grounder
  ├─ Order Status → Authenticated Backend API → Protected Order Data Source
  └─ Human Handoff → Realtime Support Channel → Live Agent Console
```

---

## Re-Engineering Plan

### 1. Semantic Typo Resilience
Replace brittle keyword checks with a real semantic router.
- **Goal:** Handle typos, synonyms, natural phrasing
- **Direction:** ONNX Runtime Web + sentence embedding model, or server-side LLM router
- **Result:** "avialable?", "in stock?", "got medium blue pants?" route correctly without hardcoded cases

### 2. Secure Order Lookup
Move order lookup behind a backend service.
- **Goal:** Prevent client-side data exposure; require verification for sensitive lookups
- **Direction:** Serverless backend proxy with request authentication (OTP or similar)
- **Result:** Browser never holds raw order databases or privileged tokens

### 3. Real Human Handoff
Replace fake queue simulation with live support routing.
- **Goal:** Transfer to a real agent, not a local timer
- **Direction:** WebSockets, Supabase Realtime, or similar realtime channel + separate agent console
- **Result:** Support agent can join the conversation live

### 4. Dynamic Store Content Sync
Fetch catalog and policy from live store sources.
- **Goal:** No hardcoded text/arrays; current stock and prices
- **Direction:** Shopify Storefront API for public data, backend for privileged operations
- **Result:** Merchants don't edit TS arrays and redeploy for routine updates

### 5. Better UI Affordances
Keep terminal aesthetic, reduce confusion.
- **Goal:** Preserve visual identity, improve first-use clarity
- **Direction:** Quick command chips (track order, check stock, return item), autocomplete/suggested actions
- **Result:** Interface feels intentional, not decorative

---

## Non-Negotiable Constraints

- Don't call this AI unless it includes actual semantic routing
- Don't expose Admin API keys or customer data in client-side code
- Don't fake live support with timeouts
- Don't rely on exact substring matching for intent
- Don't force developers to hand-edit static arrays for core updates

---

## Acceptance Criteria

- Queries routed by semantics, not only keywords
- Order lookup authenticated and server-side
- Human handoff via real realtime channel
- Catalog/policy data dynamically fetched
- System robust to typos and natural language variation
- Product can honestly be described as AI-assisted

---

## Implementation Priority

1. Fix security first
2. Replace brittle routing second
3. Add realtime support third
4. Connect live catalog data fourth
5. Polish UX last

Do not reverse this order.

---

## Final Note

The current build fails because the core engine is too brittle, too exposed, and too heavily simulated — not because of styling. The rebuild must be: semantically aware, secure by design, connected to live services, and honest about what it does.
