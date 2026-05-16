# Phase 5: Graceful Escalation - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users facing complex issues or expressing frustration are seamlessly transferred to a human agent. The escalation flow includes explicit handoff requests (keyword-triggered), frustration detection (keyword + message count), queue simulation, transfer state machine, connected confirmation, and human agent message simulation.

</domain>

<decisions>
## Implementation Decisions

### Escalation Detection
- **D-01:** Simple keyword list for escalation triggers (same pattern as OffTopicDetector, not intent-detector). Keywords: "talk to human", "speak to agent", "representative", "real person", "human support", "talk to staff", "customer service", and similar explicit handoff intent phrases.
- **D-02:** Frustration detection is hybrid — strong frustration keywords OR 3+ non-resolving messages in a single session. Non-resolving = messages that didn't result in a successful lookup (order found, product found, policy answered).

### Frustration Keywords
- **D-03:** Moderate approach — strong keywords ("useless", "terrible", "worst", "horrible", "waste of time", "I give up") plus repeated negative sentiment across 2+ messages.

### Queue Simulation
- **D-04:** Dynamic queue position (random 1-5). Position can change over time (simulating other customers connecting/disconnecting). A refresh button sits beside the queue position text — user can manually refresh to see updated position.
- **D-05:** No real backend — all queue logic is simulated in-memory.

### State Machine & Persistence
- **D-06:** Full escalation state persisted in localStorage — survives page refresh or navigation away. States: IDLE, OFFERED, CONFIRMING, TRANSFERRING, QUEUED, CONNECTED, CANCELLED.
- **D-07:** Cancellation (user cancels from queue or declines offer) resets to IDLE. No alternatives offered — clean reset.
- **D-08:** Duplicate escalation requests (user asks for escalation while already in queue or after cancelling) are ignored.

### Transfer Failure
- **D-09:** 20s timeout before declaring transfer failure. On failure, user is asked if they want to retry. If yes, one retry attempt. If retry also fails, show error and suggest contacting support@store.com directly.
- **D-10:** Error messages per UI-SPEC: "no agents available" and "system error" variants.

### Human Agent Simulation
- **D-11:** After connected, a canned script sequence plays: "Thanks for reaching out. Let me look into that for you." → "I can see your account..." → "Is there anything else?" Fixed script, not generative.

### Context Preservation
- **D-12:** Last 3 user messages + last agent response are included in the escalation handoff context. Human agent (simulated) can reference what was discussed.

### Audit
- **D-13:** No escalation audit trail. No logging.

### Pipeline Integration
- **D-14:** Escalation detection runs after off-topic check, BEFORE order tracking (so a user asking for help doesn't get overridden by order/catalog detection). If escalation is already in OFFERED or CONFIRMING state, pipeline short-circuits.

### OpenCode's Discretion
- Exact keyword list for escalation detection (user provided signal phrases, OpenCode fills the full list)
- Exact canned script sequence for human agent simulation
- Queue position change timing (how often position refreshes)
- Frustration keyword list exact entries
- localStorage key naming and schema design
- CSS animation details per UI-SPEC spec

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI & Design Contract
- `.planning/phases/05-graceful-escalation/05-UI-SPEC.md` — Complete visual and interaction design contract: all bubble components, color tokens, spacing, typography, copywriting, state machine, CSS classes.

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 5 — Goal ("seamless human handoff for complex or frustrated intents") and success criteria
- `.planning/requirements/TRACK_4_SUPPORT.md` — Graceful Handoff requirement, quality constraints
- `.planning/STATE.md` — Current project state, known ResponseGrounder bug

### Prior Phase Context
- `.planning/phases/04-order-tracking-workflow/04-CONTEXT.md` — Interface-driven service pattern, ChatWidget pipeline pattern, test structure

### Architecture & Codebase
- `.planning/codebase/ARCHITECTURE.md` — Pipeline architecture, ChatWidget flow
- `.planning/codebase/STRUCTURE.md` — File organization

### Source Code References
- `shopify-widget/src/ChatWidget.ts` — Pipeline integration point (insert after off-topic check, line ~388, before order detection at line ~398)
- `src/services/offTopicDetector.ts` — Pattern for keyword-based escalation detection (same approach, keyword list + scoring)
- `src/services/types.ts` — Location to add escalation types (ChatMessage role 'system', EscalationState, EscalationChatMessage)
- `src/services/orderIntentDetector.ts` — Pattern for how escalation detection could short-circuit pipeline
- `src/services/conversationContext.ts` — Reusable cross-turn context pattern

### Existing Tests
- `src/services/offTopicDetector.test.ts` — Test patterns for keyword detection
- `src/services/catalogIntentDetector.test.ts` — Test patterns for intent detection

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **OffTopicDetector** (`src/services/offTopicDetector.ts`) — Keyword list + scoring approach. EscalationDetector should mirror this exactly for trigger keyword detection.
- **ChatMessage type** (`shopify-widget/src/ChatWidget.ts:20-26`) — Current union type `'user' | 'agent' | 'error'`. Needs extension to include `'system'` per UI-SPEC.
- **ChatWidget._renderMessage()** (`shopify-widget/src/ChatWidget.ts:266-306`) — Message rendering pipeline. Needs branching for `'system'` role with subtype-based component selection.
- **ChatWidget._generateAgentResponse()** (`shopify-widget/src/ChatWidget.ts:385-431`) — Pipeline: off-topic check → order → catalog → policy → greeting → fallback. Escalation detection inserts after off-topic check.
- **localStorage** — Already used in existing patterns (no examples in current codebase, but standard browser API).

### Established Patterns
- **Keyword-based detection** — OffTopicDetector uses simple keyword matching with confidence scoring. EscalationDetector should use the same.
- **Interface-first design** — Each service has a clean interface. EscalationDetector doesn't need a service interface (no data source), but follows the same module pattern.
- **src/services/ organization** — Each service in its own `.ts` module with `.test.ts` alongside.
- **ChatWidget pipeline** — Sequential step-through with short-circuit on first match. Escalation is step 2 (after off-topic, before order).
- **UI-SPEC component classes** — All CSS classes already defined in 05-UI-SPEC.md. Only implementation needed.

### Integration Points
- **ChatWidget._generateAgentResponse()** (`shopify-widget/src/ChatWidget.ts:388`) — Insert escalation detection between off-topic check (line ~396) and order detection (line ~398).
- **ChatWidget._renderMessage()** (`shopify-widget/src/ChatWidget.ts:266`) — Add handling for `role: 'system'` messages with subtype-based rendering (offer card, transferring, queue, connected).
- **ChatMessage interface** (`shopify-widget/src/ChatWidget.ts:20`) — Add `'system'` to role union type.
- **ChatWidget constructor** (`shopify-widget/src/ChatWidget.ts:63`) — Add EscalationDetector as injectable option, parallel to order/catalog services (lines 76-89).
- **ChatWidgetOptions** (`shopify-widget/src/ChatWidget.ts:28`) — Add escalation service options, parallel to catalog/order (lines 32-35).
- **types.ts** — Add `EscalationState`, `EscalationTrigger`, `EscalationChatMessage` types.

</code_context>

<specifics>
## Specific Ideas

- Queue position should feel alive — random position (1-5), changes over time, refresh button to manually check
- "You're already in the queue. An agent will be with you shortly." — duplicate request handling
- Cancelled flow: "Escalation cancelled." — no extra offers, clean reset
- Human agent simulation: 3 canned messages in sequence, not generative
- Transfer failure: 20s timeout, user-confirmed retry, then email fallback

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-graceful-escalation*
*Context gathered: 2026-05-17*
