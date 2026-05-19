---
phase: 05-ux-refinement
plan: 01
subsystem: ux
tags: [typescript, vitest, suggested-actions, action-chips, conversation-state]

# Dependency graph
requires:
  - phase: 03-live-catalog-intelligence
    provides: ResolvedQuery type used by getSuggestions
provides:
  - SuggestedAction interface and ConversationState type in types.ts
  - SuggestedActionsService class with context-aware chip generation
  - 40 unit tests covering all context states, edge cases, and immutability
affects: [ChatWidget integration, action chip rendering, 05-02, 05-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure service pattern — no DOM access, no side effects
    - Record-based context-to-chips mapping with fallback
    - Immutable return via spread copy

key-files:
  created:
    - src/services/suggestedActions.ts
    - src/tests/suggestedActions.test.ts
  modified:
    - src/services/types.ts

key-decisions:
  - "Used Record<string, SuggestedAction[]> for context mapping — simple, testable, no class state"
  - "Service returns new array instances via .map(s => ({ ...s })) — guarantees immutability"
  - "Unknown context falls back to initial chips — safe default"
  - "lastResult parameter accepted but unused (prefixed with _) — reserved for future context-aware refinement"

patterns-established:
  - "Pure service: input state + lastResult → output array, no side effects"
  - "MAX_CHIPS constant enforces 4-chip ceiling across all contexts"

requirements-completed:
  - UX-01
  - UX-05

# Metrics
duration: 8min
completed: 2026-05-19
---

# Phase 05 Plan 01: SuggestedActionsService Summary

**Context-aware action chip service with 6 conversation states, max-4 enforcement, and 40 passing unit tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-19T17:18:00Z
- **Completed:** 2026-05-19T17:26:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added SuggestedAction interface and ConversationState type to types.ts
- Implemented SuggestedActionsService with 6 context-specific chip arrays
- Wrote 40 unit tests — all passing, covering all states, edge cases, and immutability

## Task Commits

Each task was committed atomically:

1. **task 1: Add SuggestedAction interface to types.ts** - `7b775bf` (feat)
2. **task 2: Create SuggestedActionsService with context rules** - `4da6ac5` (feat)
3. **task 3: Write unit tests for SuggestedActionsService** - `944593e` (test)

## Files Created/Modified

- `src/services/types.ts` — Added SuggestedAction interface (label, query, icon?) and ConversationState union type (8 states)
- `src/services/suggestedActions.ts` — New pure service with getSuggestions method, 6 context mappings, max-4 enforcement
- `src/tests/suggestedActions.test.ts` — 40 tests: 4 interface tests, 8 type tests, 28 service tests

## Decisions Made

- Used Record<string, SuggestedAction[]> for context-to-chips mapping — simple, deterministic, easy to test
- Service returns new array instances on every call via `.map(s => ({ ...s }))` — prevents caller mutation
- Unknown context strings fall back to initial/default chips — safe, predictable behavior
- `lastResult` parameter accepted but currently unused (prefixed with `_`) — reserved for future context-aware refinement based on ResolvedQuery data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test expecting query text in label assertion**
- **Found during:** task 3 (test execution)
- **Issue:** stock_check label test expected "I'd like to add this to cart" (query text) instead of "Add to Cart" (label text)
- **Fix:** Corrected test to check for actual label values: 'Add to Cart', 'View Similar', 'Check Another Product'
- **Files modified:** src/tests/suggestedActions.test.ts
- **Verification:** All 40 tests pass after fix
- **Committed in:** 944593e (task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix in test)
**Impact on plan:** Test bug fix only — no change to implementation or scope.

## Known Stubs

None — all chips have concrete labels and queries. No placeholder text or empty values.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: input-injection | src/services/suggestedActions.ts | `getSuggestions` accepts `lastResult: unknown` — caller must ensure ResolvedQuery data is trusted before use in future refinements. Plan T-05-02 disposition: accept (pure function, low-value target). |

## Issues Encountered

- PowerShell `head` command not available — used `Select-Object -First` instead
- Test file couldn't load initially because service module didn't exist — created stub service first (standard TDD flow)

## Next Phase Readiness

- SuggestedActionsService is ready for ChatWidget integration (05-02 or 05-03)
- Service is pure and fully tested — can be imported without side effects
- ConversationState type provides clear contract for widget-to-service communication

---

*Phase: 05-ux-refinement*
*Completed: 2026-05-19*
