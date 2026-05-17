# Phase 8: UX & Demo - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the user experience, replace the fake queue simulation with a real realtime handoff, and produce the demo video. This is the visible layer — what judges see first in the submission.

**What this phase IS:**
- Quick action chips (Track Order, Check Stock, Return Item, View Policies) below the input
- Autocomplete / suggested actions on first open (users never see a blank screen)
- Supabase Realtime / WebSocket integration for live human handoff
- Simple agent console page for receiving handoffs
- Demo video (3-4 minutes, screen recording with narration)
- Update PRODUCT_DOC.md, TECHNICAL_DOC.md, README.md to describe the hybrid architecture
- Update DECISION_LOG.md with the Phase 6-7-8 decisions

**What this phase IS NOT:**
- Not redesigning the terminal aesthetic (keep Berkeley Mono, cream canvas, bracket markers)
- Not adding animations or visual flourishes (keep it functional)
- Not changing the ChatWidget pipeline logic
- Not adding new features beyond what's needed for the demo
- Not a full production agent console (minimal MVP for demo purposes)

</domain>

<decisions>
## Implementation Decisions

### D-01: Quick action chips placement
**Decision:** Render 4 action chips as inline `<button>` elements in a flex row below the textarea input.
**Reasoning:**
- Always visible — users can tap a chip at any time
- Below input — follows the natural F-pattern (read output → type → see suggestions)
- Terminal aesthetic preserved — chips use same Berkeley Mono font, hairline borders
- Chips disappear once user sends the first message (reduces noise for returning users)

### D-02: Onboarding state
**Decision:** On very first open (no conversation history in localStorage), show a subtle hint text in the message area: "[+] Ask about products, track orders, or check policies. Type naturally — I understand typos."
**Reasoning:**
- Addresses the judge's "blank screen leaves users stranded" finding
- Single line, no popup, no dismissable welcome message (respects D-14 from Phase 1: no welcome message)
- Sets expectations: the widget handles natural language

### D-03: Realtime channel choice
**Decision:** Supabase Realtime (WebSocket-based, generous free tier, simple API).
**Reasoning:**
- Free tier: 50 concurrent connections, 2GB bandwidth — more than enough for a demo
- WebSocket-based — no polling, no fake timers
- Simple API: `supabase.channel('support').subscribe()` on client side
- Agent console subscribes to the same channel — real bidirectional communication
- Can be deployed in 30 minutes with a free Supabase account

### D-04: Agent console scope
**Decision:** Single HTML page that lists active handoff requests, shows chat history, and lets the agent type responses.
**Reasoning:**
- MVP — not a full helpdesk dashboard
- Shows the judge that handoff is real (not simulated)
- Built as a standalone HTML file (no framework needed)
- Uses the same Supabase channel to send responses back to the widget

### D-05: Demo video structure
**Decision:** 4-minute video with this exact structure:
1. **0:00-0:30** — Introduction: "This is an AI customer support agent for Shopify."
2. **0:30-1:30** — Semantic understanding: "avialable?", "where's my stuff", "got medium blue pants?" — demonstrate typo/synonym handling
3. **1:30-2:30** — Product lookup → order tracking flow: full customer journey
4. **2:30-3:30** — Live human handoff: user requests agent, Supabase handoff, agent responds
5. **3:30-4:00** — Architecture summary: "Semantic router → deterministic data → zero hallucinations"

**Reasoning:**
- Hits every rubric dimension in 4 minutes
- Starts with the most impressive part (semantic understanding = real AI)
- Shows the full customer journey (business relevance)
- Ends with the architecture story (technical execution)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth
- `user_verdict.md` — Sections "Real Human Handoff", "Better UI Affordances", "Acceptance Criteria"
- `hackathon.md` — Demo video requirements (3-5 min, unlisted YouTube/Drive, screen recording with narration), submission form link

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 8 — Goal, success criteria, dependencies
- `.planning/STATE.md` — Current project state

### Existing Code — What Gets Modified
- `shopify-widget/src/ChatWidget.ts` — Add quick action chips, onboarding hint, Supabase client integration
- `shopify-widget/src/styles/widget.css` — Add chip styles, onboarding hint styles
- `src/services/escalationDetector.ts` — Integrate with Supabase channel for real handoff
- `src/services/escalationQueueSimulator.ts` — Replace with real queue via Supabase
- `src/services/escalationHumanAgent.ts` — Replace with real agent messages from Supabase
- `index.html` or new `agent-console.html` — Agent console page

### Existing Code — What Stays
- `src/services/escalationStateMachine.ts` — FSM logic stays (still manages state transitions)
- `src/services/escalationTransferHandler.ts` — Transfer timeout logic stays (real transfer may still timeout)
- `src/services/catalogIntentDetector.ts` — Already updated in Phase 6
- All service modules — No changes needed

### Documentation to Update
- `PRODUCT_DOC.md` — Add "Semantic Router" to AI/deterministic boundary section. Update feature list for Phase 6-7-8.
- `TECHNICAL_DOC.md` — Add SemanticRouter to architecture diagram. Add proxy layer. Update pipeline description.
- `DECISION_LOG.md` — Add decisions from Phases 6, 7, 8.
- `README.md` — Update setup instructions (Supabase keys, proxy URL). Add demo video link. Update status badges.

### Prior Phase Context
- `.planning/phases/05-graceful-escalation/05-CONTEXT.md` — Original escalation design, FSM, queue simulation
- `.planning/phases/06-semantic-ai-router/06-CONTEXT.md` — Semantic router decisions
- `.planning/phases/07-security-live-data/07-CONTEXT.md` — Live data source decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Escalation Architecture (to be upgraded)
```
Browser → EscalationDetector (keyword match)
        → EscalationStateMachine (FSM: IDLE → OFFERED → ... → CONNECTED)
        → EscalationQueueSimulator (random 1-5, setInterval refresh)
        → EscalationTransferHandler (20s setTimeout, retry)
        → HumanAgentSimulator (3-message canned script)
```

### Target Escalation Architecture (Phase 8)
```
Browser → EscalationDetector (keyword match, stays same)
        → EscalationStateMachine (FSM, stays same)
        → Supabase Realtime Channel (replaces queue simulator)
          → Agent Console (human receives handoff)
          → Agent types response → sent back via Supabase
          → Widget displays real agent response
```

### Quick Action Chips HTML Pattern
```html
<div class="action-chips">
  <button class="chip" data-action="track-order">[Track Order]</button>
  <button class="chip" data-action="check-stock">[Check Stock]</button>
  <button class="chip" data-action="return-item">[Return Item]</button>
  <button class="chip" data-action="view-policies">[View Policies]</button>
</div>
```

### Supabase Realtime Setup
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const channel = supabase.channel('support-queue', {
  config: { broadcast: { self: true } },
});

// Subscribe to handoff events
channel.on('broadcast', { event: 'handoff' }, (payload) => {
  // payload contains: { userId, transcript, timestamp }
  // Agent console receives this
}).subscribe();

// Send message to agent
channel.send({
  type: 'broadcast',
  event: 'handoff',
  payload: { userId: sessionId, transcript: conversationHistory, timestamp: Date.now() },
});
```

</code_context>

<specifics>
## Specific Implementation Ideas

### Chip click handlers
Each chip triggers a simulated user message (like the user typed it):
- Track Order → inserts "track order #" in textarea (user fills in the number)
- Check Stock → inserts "check stock for " in textarea
- Return Item → inserts "start a return" in textarea
- View Policies → immediately sends "what are your policies?"

### Agent console page
Standalone HTML file at `/agent-console.html`:
- Lists incoming handoff requests with user ID and conversation preview
- Click to accept → opens chat view with full transcript
- Agent types response → sent back via Supabase → appears in widget
- Shows connection status indicator

### Demo video notes
- Record using OBS or built-in screen recorder
- Upload as unlisted YouTube video
- Include link in README
- Use a Shopify dev store with real-looking products for the demo
- Narrate clearly — explain what's happening and why it matters
- End with the repo URL and contribution note

### Documentation update checklist
- [ ] PRODUCT_DOC.md — Add "Semantic Router" section, update phase table, update architecture diagram
- [ ] TECHNICAL_DOC.md — Add SemanticRouter class, add proxy layer, update pipeline flow, add Supabase Realtime, update test coverage numbers
- [ ] DECISION_LOG.md — Add all D-01 through D-XX from Phases 6, 7, 8
- [ ] README.md — Add demo video link, update setup with Supabase keys and proxy URL, update status

</specifics>

<deferred>
## Deferred Ideas

- **Voice input** — No. The hackathon is for chat.
- **Multi-language support** — No. English only for the submission.
- **Rich media responses** — No. Text and simple HTML order cards are sufficient.
- **Analytics dashboard** — No. Not required for the hackathon.
- **Toast notifications** — No. Keep the interface clean.
- **Dark mode** — No. The cream canvas is part of the design identity.
- **Mobile responsiveness** — Already works (textarea auto-grows, chips wrap). No major changes needed.

</deferred>

---

*Phase: 08-ux-demo*
*Context gathered: 2026-05-17*
