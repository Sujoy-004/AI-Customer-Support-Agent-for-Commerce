---
phase: 08-ux-demo
plan: 01
subsystem: ui
tags: [chat-widget, action-chips, onboarding, css, vitest]

# Dependency graph
requires: []
provides:
  - Action chips (4 quick-action buttons below textarea)
  - Onboarding hint (subtle hint text in message area on first open)
  - Integration tests for chips and hint behavior
affects: [08-ux-demo]

# Tech tracking
tech-stack:
  added: []
  patterns: [flag-based visibility (_hasSentMessage), immediate vs textarea-fill chip routing, chips-as-inline-buttons]

key-files:
  created: []
  modified:
    - shopify-widget/src/ChatWidget.ts
    - shopify-widget/src/styles/widget.css
    - shopify-widget/tests/ChatWidget.integration.test.ts

key-decisions:
  - 'D-01: Chips rendered below textarea between messageList and inputContainer'
  - 'D-07: Track Order/Check Stock fill textarea; Return Item/View Policies send immediately'
  - 'D-08: Chips reappear on page refresh until first message sent (simple _hasSentMessage flag, no localStorage)'

patterns-established:
  - 'Chip behavior: immediate chips call _sendImmediate() → sets textarea value → calls _sendMessage(); textarea-fill chips set textarea value, focus, auto-grow, update send button'
  - 'Visibility: _hasSentMessage boolean + state.messages.length guard; chips and hint re-render on _toggle() and remove in _sendMessage()'

requirements-completed: [JUDGE-07]

# Metrics
duration: 12 min
completed: 2026-05-19
---

# Phase 8: UX & Demo — Plan 1 Summary

**Quick action chips (Track Order, Check Stock, Return Item, View Policies) below textarea + onboarding hint in message area — never a blank screen on first open**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-19T10:20:00Z
- **Completed:** 2026-05-19T10:32:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- 4 action chips render below textarea when widget opens with no messages sent
- Chips disappear after user sends first message
- Track Order fills textarea with "track order #"; Check Stock fills with "check stock for "
- Return Item immediately sends "I'd like to start a return"; View Policies sends "what are your policies?"
- Onboarding hint shows in message area on first open: "[+] Ask about products..."
- Onboarding hint removed after first message sent
- All 46 existing tests still pass (zero regressions)

## Task Commits

Each task was committed atomically:

1. **task 1: add action chips DOM rendering and click handling** - `33dbd7c` (feat)
2. **task 2: add onboarding hint rendering and CSS** - `bbaf5ad` (feat)
3. **task 3: add integration tests for action chips and onboarding hint** - `c9c45aa` (test)

## Files Created/Modified

- `shopify-widget/src/ChatWidget.ts` — Added `_hasSentMessage`, `_chipContainer`, `_onboardingHint` fields; `_renderActionChips()`, `_removeActionChips()`, `_handleChipClick()`, `_sendImmediate()`, `_renderOnboardingHint()`, `_removeOnboardingHint()` methods; wired into `_toggle()` and `_sendMessage()`
- `shopify-widget/src/styles/widget.css` — Added `.action-chips`, `.action-chip`, `.action-chip:hover`, `.action-chip:active`, `.chat-onboarding-hint` CSS rules
- `shopify-widget/tests/ChatWidget.integration.test.ts` — Added 8 action chip tests and 2 onboarding hint tests

## Decisions Made

Followed D-01, D-02, D-07, D-08 from 08-CONTEXT.md exactly:
- Chips below textarea, between message list and input container
- Onboarding hint as subtle centered text in message area
- Track Order/Check Stock → textarea fill; Return Item/View Policies → immediate send
- Chips reappear on page refresh until first message (simple boolean flag, no persistence)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Verification Results

- ✅ `npx vitest run tests/ChatWidget.integration.test.ts -t "action chips"` — 8 passed
- ✅ `npx vitest run tests/ChatWidget.integration.test.ts -t "onboarding hint"` — 2 passed
- ✅ `cd shopify-widget && npx vitest run` — 46 passed across 3 test files (zero regressions)
- ✅ All chip and hint methods exist in ChatWidget.ts (confirmed via grep)
- ✅ Action chip CSS classes exist in widget.css

## Next Phase Readiness

Ready for Plan 2 (Supabase Realtime handoff) or Plan 3 (agent console). Action chips and onboarding hint are self-contained — no dependencies on other plans in this phase.

## Self-Check: PASSED

- ✅ All 4 files exist on disk
- ✅ All 3 commits found in git log
- ✅ Full test suite passes (46 tests, zero regressions)

---

*Phase: 08-ux-demo*
*Plan: 01*
*Completed: 2026-05-19*
