# Project Roadmap

## Phases

- [x] **Phase 1: UI Foundation & Error Handling** - Chat interface setup with DESIGN.md aesthetics and robust failure fallbacks
- [x] **Phase 2: Policy Grounding & Guardrails** - Agent restricted to store policies and actively refusing off-topic prompts
- [x] **Phase 3: Live Catalog Intelligence** - Real-time Shopify queries for catalog, sizing, and stock without hallucinations
- [x] **Phase 4: Order Tracking Workflow** - Secure retrieval and explanation of customer order status
- [ ] **Phase 5: Graceful Escalation** - Seamless human handoff for complex or frustrated intents
- [ ] **Phase 6: Return Initiation Workflow** - Full in-chat execution of product returns

## Phase Details

### Phase 1: UI Foundation & Error Handling
**Goal**: Users experience a robust, aesthetically accurate chat interface that gracefully handles systemic failures
**Depends on**: Nothing
**Requirements**: SAFE-02, SAFE-03
**Success Criteria** (what must be TRUE):
  1. User views chat interface styled exactly to DESIGN.md (Berkeley Mono, flat cream canvas, hairline borders)
  2. User receives a friendly fallback message when simulating a network or API timeout
**Plans**: 01-01, 01-02
**UI hint**: yes

**Plans:**
- [x] 01-01-PLAN.md — Scaffold + CSS design system + test infrastructure + demo page
- [x] 01-02-PLAN.md — Core widget engine: ChatWidget, NetworkDetector, CSS design system

### Phase 2: Policy Grounding & Guardrails
**Goal**: Users receive accurate, strict answers based solely on store policies, with no hallucinated or off-topic responses
**Depends on**: Phase 1
**Requirements**: CORE-02, CORE-03
**Success Criteria** (what must be TRUE):
   1. User receives accurate shipping and warranty details sourced directly from store policies
   2. User asking out-of-domain questions (e.g., general trivia, competitors) receives a polite refusal
**Plans:**
- [x] 02-01-PLAN.md — Policy service, response grounding, off-topic detection, refusal responses

### Phase 3: Live Catalog Intelligence
**Goal**: Users can query real-time product catalogs, sizing, and stock without the agent guessing or hallucinating
**Depends on**: Phase 2
**Requirements**: CORE-01
**Success Criteria** (what must be TRUE):
   1. User can ask if a specific variant is in stock and get a real-time answer
   2. User is informed correctly when an item is out of stock instead of a hallucinated availability

**Plans:**
- [x] 03-01-PLAN.md — Catalog Service Layer: types, mock data, product/variant/stock resolution
- [x] 03-02-PLAN.md — Catalog Integration & Intent Detection: ChatWidget pipeline, intent routing

### Phase 4: Order Tracking Workflow
**Goal**: Users can securely authenticate and retrieve the current status of their past orders
**Depends on**: Phase 3
**Requirements**: WORK-01
**Success Criteria** (what must be TRUE):
  1. User can provide order information and see its current fulfillment or shipping status
  2. User sees accurate tracking information natively rendered in the chat UI
**Plans**: 2 plans
**UI hint**: yes

**Plans:**
- [x] 04-01-PLAN.md — Order Service Layer: types, interface, mock data, service, tests
- [x] 04-02-PLAN.md — Order Intent Detection & ChatWidget Integration: intent detector, response formatter, OrderCard, pipeline

### Phase 5: Graceful Escalation
**Goal**: Users facing complex issues or expressing frustration are seamlessly transferred to a human agent
**Depends on**: Phase 4
**Requirements**: SAFE-01
**Success Criteria** (what must be TRUE):
  1. User explicitly requesting a human is immediately routed to the escalation flow
  2. User expressing frustration triggers an automatic offer to transfer to a human agent
**Plans**: TBD

### Phase 6: Return Initiation Workflow
**Goal**: Users can initiate and submit a valid return request completely within the conversation
**Depends on**: Phase 4, Phase 5
**Requirements**: WORK-02
**Success Criteria** (what must be TRUE):
  1. User can successfully request and confirm a return for an eligible order directly in chat
  2. User attempting to return an item outside the valid policy window is politely denied based on store rules
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. UI Foundation & Error Handling | 2/2 | Complete | 2026-05-14 |
| 2. Policy Grounding & Guardrails | 1/1 | Complete | 2026-05-15 |
| 3. Live Catalog Intelligence | 2/2 | Complete | 2026-05-15 |
| 4. Order Tracking Workflow | 2/2 | Complete | 2026-05-16 |
| 5. Graceful Escalation | 0/0 | Not started | - |
| 6. Return Initiation Workflow | 0/0 | Not started | - |