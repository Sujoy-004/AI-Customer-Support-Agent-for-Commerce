# Project Roadmap

## Phases

- [x] **Phase 1: UI Foundation & Error Handling** - Chat interface setup with DESIGN.md aesthetics and robust failure fallbacks
- [x] **Phase 2: Policy Grounding & Guardrails** - Agent restricted to store policies and actively refusing off-topic prompts
- [x] **Phase 3: Live Catalog Intelligence** - Real-time Shopify queries for catalog, sizing, and stock without hallucinations
- [x] **Phase 4: Order Tracking Workflow** - Secure retrieval and explanation of customer order status
- [x] **Phase 5: Graceful Escalation** - Seamless human handoff for complex or frustrated intents
- [ ] **Phase 6: Semantic AI Router** - In-browser semantic intent detection replacing brittle keyword matching
- [ ] **Phase 7: Security & Live Data** - Serverless order proxy, live Shopify Storefront API integration
- [ ] **Phase 8: UX & Demo** - Quick action chips, live human handoff, demo video

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
**Plans**: 2 plans

**Plans:**
- [x] 05-01-PLAN.md — Core escalation services: types, detector, state machine with localStorage
- [x] 05-02-PLAN.md — Queue/transfer/human agent simulators, ChatWidget pipeline integration, CSS

### Phase 6: Semantic AI Router
**Goal**: Replace brittle keyword intent detection with real in-browser semantic routing. This is the single highest-impact change — transforms the project from "keyword bot" to "AI-augmented agent."
**Depends on**: Phase 5
**Requirements**: JUDGE-01 (semantic routing), JUDGE-02 (typo resilience), JUDGE-03 (natural language variation)
**Success Criteria** (what must be TRUE):
   1. User queries like "avialable?", "got medium blue pants?", "where's my stuff" route correctly without special-case keyword additions
   2. All three intent detectors (catalog, off-topic, order) use semantic embedding similarity as primary routing method, with keyword fallback
   3. The system can honestly be described as "AI-assisted" — semantic understanding layer + deterministic data retrieval
   4. Full test suite passes for typo resilience, synonym handling, and natural phrasing
**Plans**: 4 plans
**Context**: .planning/phases/06-semantic-ai-router/

**Plans:**
- [ ] 06-01-PLAN.md — Foundation: deps, config files, SemanticRouter class
- [ ] 06-02-PLAN.md — Build script + test suite (eval + unit)
- [ ] 06-03-PLAN.md — Semantic detector integration (all 3 detectors)
- [ ] 06-04-PLAN.md — ChatWidget pipeline integration, first-query UX, feature flag

### Phase 7: Security & Live Data
**Goal**: Move sensitive operations behind a serverless proxy. Connect catalog to live Shopify Storefront API. Eliminates the two most serious production-readiness gaps.
**Depends on**: Phase 6
**Requirements**: JUDGE-04 (client-side data exposure), JUDGE-05 (dynamic store sync), JUDGE-06 (no hardcoded arrays)
**Success Criteria** (what must be TRUE):
   1. Order lookup goes through an authenticated serverless proxy — browser never holds raw order databases or privileged tokens
   2. Shopify Storefront API integration replaces mock catalog data — merchants do not need to edit TS arrays for routine store updates
   3. Policy data is also dynamically fetched from live store sources
   4. All existing tests pass with the new data sources
**Plans**: TBD
**Context**: .planning/phases/07-security-live-data/

### Phase 8: UX & Demo
**Goal**: UI affordances, live handoff, demo video. This is the visible layer that judges see first.
**Depends on**: Phase 7
**Requirements**: JUDGE-07 (UI affordances), JUDGE-08 (real handoff), JUDGE-09 (demo video)
**Success Criteria** (what must be TRUE):
   1. Widget shows quick action chips ([Track Order], [Check Stock], [Return Item], [View Policies]) — users never face a blank screen
   2. Human handoff uses a real realtime channel (Supabase Realtime / WebSocket) — not setTimeout simulation
   3. Demo video (3-4 min) shows: typo resilience → product lookup → order tracking → live handoff
   4. All documentation updated to honestly describe the hybrid architecture
**Plans**: TBD
**Context**: .planning/phases/08-ux-demo/

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. UI Foundation & Error Handling | 2/2 | Complete | 2026-05-14 |
| 2. Policy Grounding & Guardrails | 1/1 | Complete | 2026-05-15 |
| 3. Live Catalog Intelligence | 2/2 | Complete | 2026-05-15 |
| 4. Order Tracking Workflow | 2/2 | Complete | 2026-05-16 |
| 5. Graceful Escalation | 2/2 | Complete | 2026-05-17 |
| 6. Semantic AI Router | 0/0 | Not started | - |
| 7. Security & Live Data | 0/0 | Not started | - |
| 8. UX & Demo | 0/0 | Not started | - |
