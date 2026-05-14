# Domain Pitfalls

**Domain:** Shopify Store-Native AI Support Agent
**Researched:** May 14 2026
**Overall Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause financial loss, severe brand damage, or catastrophic user experience.

### Pitfall 1: Hallucinating Policies and Inventory (The "Stochastic Parrot" Trap)
**What goes wrong:** The agent confidently promises refunds outside the actual return window, claims out-of-stock items are available, or invents non-existent shipping speeds.
**Why it happens:** Relying on the LLM's parametric memory or stale cached documents instead of querying live Shopify data, or missing explicit "I don't know" boundaries in the system prompt.
**Consequences:** Financial liability (honoring false promises), angry customers, immediate loss of trust.
**Prevention:**
1. **Zero-Trust Context:** System prompt must explicitly ban answering from parametric memory.
2. **Real-time lookup:** Enforce live Shopify Admin/Storefront API queries for stock, pricing, and active policies before answering context-specific questions.
3. **Data Parity:** If the API fails, the agent must fail gracefully ("I am having trouble checking stock right now"), not guess.
**Phase to Address:** Phase 2 (Shopify Data Integration) & Phase 3 (Active Workflows)

### Pitfall 2: Action Execution Without Authentication (The "Rogue Agent")
**What goes wrong:** A random visitor types "Cancel order #12345" and the AI happily executes the cancellation, or initiates a return, without verifying the user actually placed the order.
**Why it happens:** Connecting the LLM to Shopify mutation APIs without inserting a hard identity verification loop.
**Consequences:** Targeted griefing, privacy violations, unauthorized order tampering.
**Prevention:** Require Email/OTP verification, or confirm identity via logged-in customer session tokens before exposing mutations (returns, cancellations). The LLM tool schema must require an authenticated `customerId` or verified token to execute the action.
**Phase to Address:** Phase 3 (Active Workflows - Returns/Order Status)

### Pitfall 3: AI Purgatory (Failed Human Handoff)
**What goes wrong:** A frustrated customer explicitly asks for a human, but the AI keeps apologizing and offering irrelevant automated help. Or, the handoff happens, but the live agent receives zero context and makes the customer repeat everything.
**Why it happens:** Poor intent routing, missing sentiment thresholds, or disjointed state management between the AI widget and the live chat inbox.
**Consequences:** Maximum customer frustration and churn.
**Prevention:**
1. **Hard Triggers:** Immediately escalate on keywords ("human", "agent", "real person") or consecutive negative sentiment detection.
2. **State Hydration:** The handoff payload must include a summarized TL;DR of the issue *and* the full transcript for the live agent.
3. **Graceful Degradation:** If no human is online, automatically transition to an asynchronous ticket/email workflow.
**Phase to Address:** Phase 4 (Graceful Handoff Flow)

## Moderate Pitfalls

Mistakes that degrade performance or system stability.

### Pitfall 4: Shopify API Rate Limit Exhaustion
**What goes wrong:** The agent starts failing to fetch catalog data or order statuses during high-traffic events, returning errors to the user.
**Why it happens:** Making a live HTTP call to Shopify's GraphQL/REST APIs for *every single chat turn* or generic product question, hitting the store's bucket limits.
**Prevention:** Implement a localized, webhook-synced cache (e.g., Redis or a local DB) for static/slow-changing data (catalog, policies, FAQ). Only hit live Shopify APIs for real-time mutations and user-specific order checks. Ensure exponential backoff and retry logic on API wrappers.
**Phase to Address:** Phase 2 (Shopify Data Integration)

### Pitfall 5: Tool Choice Paralysis & Loop Failures
**What goes wrong:** The agent gets stuck in a loop calling the same failed Shopify GraphQL query multiple times because it doesn't know how to handle an API error.
**Why it happens:** Vague tool descriptions or lack of error-handling instructions in the system prompt.
**Prevention:** 
1. Map tool outputs strictly. If `searchOrders` returns empty, the prompt must explicitly state: "If an order is not found, ask the user to verify the email and order number."
2. Implement strict turn-limits (max tool calls per turn) in the orchestrator.
**Phase to Address:** Phase 3 (Active Workflows)

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Data Integration** (Phase 2) | Stale catalog data feeding wrong answers | Webhook sync for products; live query for stock before answering. |
| **Order Status** (Phase 3) | Leaking PII to unverified users | Mandate order number + email match verification before showing tracking data. |
| **Returns** (Phase 3) | Processing returns outside the policy window | Hard-code policy validation in the API layer; don't trust the LLM to do date math. |
| **Handoff** (Phase 4) | Dropping context during escalation | Pass serialized conversation state to the inbox webhook. |

## Sources

- General AI Engineering patterns for E-Commerce
- Shopify API Rate Limits & Webhook Documentation
- UX Post-mortems from early-gen Customer Support Bots