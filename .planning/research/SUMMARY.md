# Project Research Summary

**Project:** AI Customer Support Agent for Commerce
**Domain:** Shopify Store-Native AI Support Agent
**Researched:** May 14 2026
**Confidence:** HIGH

## Executive Summary

This product is a Shopify Store-Native AI Support Agent. It focuses on zero-hallucination, strictly grounded support using live catalog and policy data. Experts build this using a tool-gated approach where the LLM is restricted from using its parametric memory and instead must execute tools that query live Shopify Admin and Storefront APIs. The recommended approach is a Remix app using `@shopify/shopify-app-remix`, Prisma/PostgreSQL, and Vercel AI SDK for orchestrating the LLM and tool calling.

The key risks involve hallucinating policies or inventory, executing unauthorized actions (like returns without verification), and failing to hand off to a human gracefully. These are mitigated by strict system prompts, identity verification loops (like OTP or order number matching), and hard escalation triggers that pass full conversation context to human agents.

## Key Findings

### Recommended Stack

The stack relies on the official Shopify App standard (Remix) paired with modern AI orchestration and robust database solutions to ensure strict typing and state management.

**Core technologies:**
- **Remix & @shopify/shopify-app-remix**: Full-stack Web Framework & App Library — Official standard for Shopify App development. Native integration with Shopify App Bridge.
- **ai (Vercel AI SDK)**: LLM Orchestration — Standard protocol for streaming responses, managing conversation state, and tool calling with strict typing.
- **Prisma & PostgreSQL**: Database ORM & Primary Database — Strict typing, robust migrations, stores shop configurations, session states, and historical chat logs.

### Expected Features

**Must have (table stakes):**
- **Live Catalog Sync** — Essential to answer product questions accurately
- **Store Policy Parsing** — Handle common queries without escalation
- **Live Order Tracking** — High-value workflow to prove utility
- **Graceful Handoff** — Critical safety net for MVP

**Should have (competitive):**
- **In-Chat Return Initiation** — Low friction for users
- **Real-Time Stock & Sizing** — Prevent recommending out-of-stock items

**Defer (v2+):**
- Advanced analytics and ticket classification
- Multi-language support

### Architecture Approach

The architecture isolates the LLM from raw APIs, using strict tool-calling to ensure determinism and zero hallucinations. It separates read operations (Storefront API) from authenticated write operations (Admin API).

**Major components:**
1. **Client UI** — Real-time chat interface, streaming responses, rendering rich cards.
2. **Agent Orchestrator** — Intent classification, conversation state management, strict tool-calling.
3. **Shopify Adapter** — Standardized, typed methods for fetching products, checking stock, pulling orders.
4. **RAG/Policy Engine** — Retrieving store-specific unstructured data with high precision.
5. **Escalation Manager** — Graceful human handoff, routing context to helpdesks.

### Critical Pitfalls

1. **Hallucinating Policies and Inventory (The "Stochastic Parrot" Trap)** — Avoid by using a zero-trust context prompt, enforcing real-time tool lookups, and failing gracefully if APIs fail.
2. **Action Execution Without Authentication (The "Rogue Agent")** — Avoid by requiring Email/OTP verification or confirmed customer session tokens before exposing mutations like returns or cancellations.
3. **AI Purgatory (Failed Human Handoff)** — Avoid by using hard escalation triggers on keywords, passing full conversation transcripts to live agents, and falling back to async ticketing.
4. **Shopify API Rate Limit Exhaustion** — Avoid by caching static/slow-changing data (catalog, policies) via webhooks, saving live HTTP calls for real-time mutations.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Infrastructure & Types
**Rationale:** Foundation for all API interactions and strict typing.
**Delivers:** Setup of Remix app, Prisma, and Shopify Adapter (Admin/Storefront) with TypeScript definitions.
**Uses:** Remix, @shopify/shopify-app-remix, Prisma, PostgreSQL.
**Implements:** Shopify Adapter, Database connection.

### Phase 2: Data Integration & RAG Layer
**Rationale:** Needed before AI can answer questions without hallucination.
**Delivers:** Vector retrieval for store policies, webhook sync for product catalog to prevent rate limiting.
**Addresses:** Store Policy Parsing, Live Catalog Sync.
**Avoids:** Shopify API Rate Limit Exhaustion, Hallucinating Policies.

### Phase 3: Core Agent Orchestrator
**Rationale:** Builds the base conversation loop and intent routing required for any feature.
**Delivers:** The main chat interface and base LLM tool-calling loop.
**Uses:** Vercel AI SDK, React, zod.
**Implements:** Client UI, Agent Orchestrator.

### Phase 4: Order Tracking Workflow
**Rationale:** Proves utility with a read-only active workflow before attempting mutations.
**Delivers:** Ability to check live order status via Shopify API.
**Addresses:** Live Order Tracking.
**Avoids:** Action Execution Without Authentication (by adding email match verification).

### Phase 5: Graceful Handoff Flow
**Rationale:** Critical safety net required for MVP before adding complex mutations.
**Delivers:** Escalation pathways, routing to human agents with context, and fallback ticket creation.
**Addresses:** Graceful Handoff.
**Avoids:** AI Purgatory (Failed Human Handoff).

### Phase 6: Return Initiation Workflow
**Rationale:** Most complex workflow, requires all previous phases (policies, order context, agent logic).
**Delivers:** In-chat return initiation and label generation via Shopify Admin mutations.
**Addresses:** In-Chat Return Initiation.
**Avoids:** Action Execution Without Authentication.

### Phase Ordering Rationale

- Infrastructure and core integrations must come first to enable strict typing and secure tool-calling.
- RAG and Agent Orchestrator enable basic conversational capabilities.
- Read-only workflows (Order Tracking) precede write-heavy workflows (Returns) to minimize risk.
- Handoff flow must be established before returns, as return edge cases often require human intervention.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** RAG engine selection and webhook synchronization mechanics.
- **Phase 5:** Specific helpdesk API integrations (e.g., Zendesk vs Gorgias).
- **Phase 6:** Shopify Admin GraphQL mutation specifics for Draft Returns.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Standard Shopify App boilerplate.
- **Phase 3:** Vercel AI SDK standard usage.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on official Shopify recommendations and Vercel AI SDK documentation. |
| Features | HIGH | Aligned with industry standards and PROJECT.md constraints. |
| Architecture | HIGH | Clear separation of concerns, addresses rate limits and zero-hallucination. |
| Pitfalls | HIGH | Directly addresses known issues with LLM e-commerce bots. |

**Overall confidence:** HIGH

### Gaps to Address

- Selection of specific vector database or RAG provider (e.g., Context7 vs Pinecone).
- Target helpdesk platforms for the MVP handoff implementation.

## Sources

### Primary (HIGH confidence)
- Shopify Dev Docs: Remix App Template — Framework, Admin API, Storefront API, Webhooks
- Vercel AI SDK Docs — LLM orchestration and tool calling
- PROJECT.md — Project constraints (Store-native, zero-hallucinations, active workflows)

### Secondary (MEDIUM confidence)
- General AI Engineering patterns for E-Commerce — Tool Calling, RAG, Architecture scaling
- UX Post-mortems from early-gen Customer Support Bots — Handoff strategies, Action execution pitfalls

---
*Research completed: May 14 2026*
*Ready for roadmap: yes*