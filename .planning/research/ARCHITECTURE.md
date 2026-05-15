# Architecture Research

**Domain:** Shopify Store-Native AI Support Agent
**Researched:** May 14 2026
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client / UI Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│  │ Chat Widget     │ │ Headless UI     │ │ Handoff Portal │ │
│  └───────┬─────────┘ └───────┬─────────┘ └───────┬────────┘ │
├──────────┼───────────────────┼───────────────────┼──────────┤
│          │                   │                   │          │
│  ┌───────▼───────────────────▼───────────────────▼───────┐  │
│  │               Agent Orchestration Layer                │  │
│  │  (Intent Router, Tool Execution, Context Management)   │  │
│  └───────┬───────────────────┬───────────────────┬───────┘  │
│          │                   │                   │          │
├──────────┼───────────────────┼───────────────────┼──────────┤
│  ┌───────▼─────────┐ ┌───────▼─────────┐ ┌───────▼─────────┐│
│  │ Shopify API     │ │ RAG / Knowledge │ │ Notification /  ││
│  │ Integration     │ │ Base (Policies) │ │ Ticketing System││
│  └───────┬─────────┘ └───────┬─────────┘ └─────────────────┘│
├──────────┼───────────────────┼────────────────────────────────┤
│  ┌───────▼─────────┐ ┌───────▼─────────┐                      │
│  │ Live Store Data │ │ Vector DB /     │                      │
│  │ (Admin &        │ │ Context7        │                      │
│  │  Storefront)    │ │                 │                      │
│  └─────────────────┘ └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Client UI** | Real-time chat interface, streaming responses, rendering rich cards (e.g., product thumbnails, return labels). | React, Tailwind, Vercel AI SDK (useChat). |
| **Agent Orchestrator** | Intent classification, conversation state management, strict tool-calling to prevent hallucinations. | LangChain/LlamaIndex or Vercel AI SDK Core with specialized prompts. |
| **Shopify Adapter** | Standardized, typed methods for fetching products, checking stock, pulling orders, and processing returns. | Shopify Admin GraphQL API and Storefront API. |
| **RAG/Policy Engine** | Retrieving store-specific unstructured data (Shipping, Returns, Warranty policies) with high precision. | Vector DB (Pinecone, Weaviate) or Context7, embeddings API. |
| **Escalation Manager**| Graceful human handoff: detecting anger, complex edge cases, or explicit requests, pausing AI, routing context. | Webhooks to Gorgias, Zendesk, or Shopify Inbox. |

## Recommended Project Structure

```
src/
├── app/                  # Next.js/React frontend entry points (Chat widget API)
├── core/
│   ├── agent/            # Agent orchestration, system prompts, intent routing
│   ├── context/          # Context7 integration for latent stability and RAG
│   └── tools/            # AI-callable functions (e.g., checkOrderStatus)
├── integrations/
│   ├── shopify/          # Shopify API clients (Admin, Storefront, Webhooks)
│   └── helpdesk/         # Handoff integrations (Zendesk, Gorgias)
├── workflows/            # Specific active workflows
│   ├── order-tracking/   # Order status logic
│   ├── returns/          # Return initiation and validation logic
│   └── handoff/          # Escalation state machine
└── types/                # Strict TypeScript definitions for all Shopify responses
```

### Structure Rationale

- **`core/tools/`:** Isolates the exact functions the LLM is allowed to call, ensuring zero-hallucination guardrails are strictly enforced before hitting real APIs.
- **`integrations/shopify/`:** Keeps third-party API specifics separate from the core business logic, making it easier to mock for TDD.
- **`workflows/`:** Groups domain-specific logic together. A return involves policies (RAG), checking order dates, and generating draft returns. Keeping this together allows targeted phase execution.

## Architectural Patterns

### Pattern 1: Tool-Gated Live Data (Zero-Hallucination)

**What:** The LLM is never allowed to "guess" catalog availability or order status. It must execute a discrete tool call (e.g., `lookupProductInventory`) which returns hard, deterministic data.
**When to use:** Crucial for all e-commerce interactions to prevent selling out-of-stock items or inventing fake order statuses.
**Trade-offs:** Increases latency slightly due to the multi-step reasoning (LLM -> Tool -> API -> LLM -> User).

### Pattern 2: Separation of Read and Write APIs

**What:** Using Shopify's Storefront API (GraphQL, fast, unauthenticated read-only) for catalog/inventory checks, and the Admin API (Authenticated, privileged) for retrieving customer orders and writing returns.
**When to use:** Default approach for Shopify native apps.
**Trade-offs:** Requires managing two sets of credentials and different API rate limits, but drastically improves security.

### Pattern 3: State-Machine Workflows for Transactions

**What:** Instead of letting the LLM purely converse its way through a return, the LLM triggers a deterministic "Return Workflow" state machine. The LLM collects the required parameters (Order ID, Email, Reason), and the state machine handles the actual API mutations.
**When to use:** For high-stakes operations (Return Initiation, Order Cancellations).
**Trade-offs:** Reduces conversational flexibility but guarantees transactional safety and compliance with store policies.

## Data Flow

### Request Flow: Order Status Tracking

```
[User Action: "Where is my order?"]
    ↓
[Chat UI] → [Agent Orchestrator (Intent: Order Lookup)]
    ↓
[Tool: getOrderStatus] → [Shopify Adapter] → [Shopify Admin API]
    ↓                                              ↓
[LLM Formatter] ← [Validated Order Data] ← [GraphQL Response]
    ↓
[Chat UI: "Your order #123 is out for delivery!"]
```

### Request Flow: Return Initiation

```
[User Action: "I want to return these shoes"]
    ↓
[Agent Orchestrator (Intent: Return)] → [RAG Engine: Fetch Return Policy]
    ↓
[Tool: validateReturnEligibility] → [Shopify Adapter] → [Shopify Admin API]
    ↓ (If eligible)                                        ↓
[Tool: initiateDraftReturn] → [Shopify Adapter] → [Shopify Admin API (Mutate)]
    ↓
[Response: Return label generated & emailed]
```

### Build Order (Dependencies)

To successfully implement this architecture, the recommended build order is:
1. **Infrastructure & Types (Phase 1):** Set up the Shopify Adapter (Admin/Storefront) and strict TypeScript definitions. (Dependency for everything).
2. **Policy RAG Layer (Phase 2):** Implement Context7/Vector retrieval for store policies.
3. **Core Agent Orchestrator (Phase 3):** Build the base LLM loop with basic intent routing.
4. **Order Tracking Workflow (Phase 4):** Combine Orchestrator + Shopify Adapter for read-only tracking.
5. **Return Initiation Workflow (Phase 5):** The most complex piece—combines Orchestrator, Policy RAG (are they within 30 days?), and Shopify Admin mutations.
6. **Graceful Handoff & UI (Phase 6):** Build the escalation pathways and finalize the high-fidelity UI constraints from `DESIGN.md`.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Vercel Serverless functions, standard Shopify API rate limits. |
| 1k-100k users | Implement Redis caching for Storefront queries (catalog data). |
| 100k+ users | Move from HTTP polling to Webhooks for live order status updates; implement dedicated queue (BullMQ/SQS) for processing returns. |

### Scaling Priorities

1. **First bottleneck:** LLM API rate limits and latency. Fix by streaming responses and using smaller, faster models for intent classification.
2. **Second bottleneck:** Shopify API rate limits (Admin GraphQL uses calculated cost). Fix by heavily caching product catalog data and utilizing the Storefront API wherever possible.

## Anti-Patterns

### Anti-Pattern 1: Training the model on the catalog

**What people do:** Embedding the entire Shopify catalog into the LLM's prompt or fine-tuning it.
**Why it's wrong:** Stock and sizing change by the minute. The LLM will hallucinate that an item is in stock when it just sold out.
**Do this instead:** Use Tool Calling. The LLM must call a live API to check inventory at the exact moment of the user's question.

### Anti-Pattern 2: Permissive API Keys in the Client

**What people do:** Putting Shopify Admin API tokens in the frontend chat widget to make direct calls.
**Why it's wrong:** Complete security compromise; allows malicious actors to read all customer data or modify orders.
**Do this instead:** All Shopify API calls must run through the secure Backend Orchestration Layer.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Shopify Admin API** | Backend GraphQL calls | Requires robust error handling for API rate limits (Cost tracking). |
| **LLM Provider (OpenAI/Anthropic)** | Streaming REST/SDK | Must enforce strict schema validation for tool outputs. |
| **Helpdesk (e.g., Zendesk)** | Webhooks / REST | Required for the Graceful Handoff protocol. Pass the entire chat transcript. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Agent ↔ Shopify Adapter | Strictly Typed Function Calls | Never pass raw natural language to the adapter; extract structured arguments first. |

## Sources

- Shopify.dev: Admin API and Storefront API documentation
- AI Agent design patterns (Tool Calling, RAG)
- Hackathon `PROJECT.md` requirements (Store-native, zero-hallucinations, active workflows)

---
*Architecture research for: Shopify Store-Native AI Support Agent*
*Researched: May 14 2026*