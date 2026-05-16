# Phase 5: Graceful Escalation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 05-graceful-escalation
**Areas discussed:** escalation detection approach, frustration detection threshold, queue simulation behavior, state persistence, cancellation behavior, transfer failure handling, human agent simulation, audit trail, multiple escalation requests, frustration keyword aggressiveness, context preservation

---

## Escalation Trigger Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Simple keyword list | Keyword matching same as OffTopicDetector pattern | ✓ |
| Intent detector pattern | Keyword groups + structured parsing like CatalogIntentDetector | |

**User's choice:** Simple keyword list
**Notes:** Said clearly — "simple keyword list, same pattern as OffTopicDetector"

---

## Frustration Detection Threshold

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit keyword sentiment | Detect frustration keywords | |
| Count-only | 3+ messages that didn't result in successful lookup | |
| Hybrid | Either frustration keywords OR 3+ non-resolving messages | ✓ |

**User's choice:** Hybrid
**Notes:** Said "hybrid" — combines both signals

---

## Queue Simulation Behavior

| Consideration | Outcome |
|--------|---------|
| User wanted flexibility | Real queue position shown, position can change over time |
| Refresh button | "There should be a working refresh button beside 'You're #N in queue'" |

**User's choice:** Dynamic position (1-5) + refresh button

---

## State Persistence Across Sessions

| Option | Description | Selected |
|--------|-------------|----------|
| Session-only | In-memory, lost on refresh | |
| localStorage | Full state persistence across refreshes | ✓ |
| Hybrid | Persist for display, not for critical path | |

**User's choice:** localStorage

---

## Cancellation Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Just reset to IDLE | Clean reset, no follow-up | ✓ |
| Offer to continue helping | "Escalation cancelled. I can still help..." | |
| Reset + suggested topics | Show "What else can I help with?" | |

**User's choice:** Just reset to IDLE

---

## Transfer Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| 30s + 1 retry | 30s timeout, one auto-retry | |
| 15s no retry | 15s timeout, no retry | |
| 20s + user retry | 20s timeout, user-confirmed retry | ✓ |

**User's choice:** 20s timeout + user-confirmed retry
**Notes:** "user-confirmed retry" was important — not automatic

---

## Human Agent Simulation

| Option | Description | Selected |
|--------|-------------|----------|
| Canned script sequence | Pre-written responses in fixed sequence | ✓ |
| Generic reply to any input | Responds to anything with slight variation | |
| Silent — just status messages | No fake messages, honest about simulation | |

**User's choice:** Canned script sequence

---

## Escalation Audit Trail

| Option | Description | Selected |
|--------|-------------|----------|
| Persist to localStorage | Timestamp, trigger type, final state | |
| In-memory only | Lost on refresh | |
| Skip logging | No logging at all | ✓ |

**User's choice:** Skip logging

---

## Multiple Escalation Requests

| Option | Description | Selected |
|--------|-------------|----------|
| Acknowledge if in queue | "You're already in the queue" | |
| Re-offer every time | Fresh offer card each time | |
| Ignore duplicate requests | Prevent noise | ✓ |

**User's choice:** Ignore duplicate requests

---

## Frustration Keyword List

| Option | Description | Selected |
|--------|-------------|----------|
| Aggressive | Catches mild frustration, higher false positives | |
| Conservative | Only strong signals, fewer false positives | |
| Moderate with sentiment | Strong keywords + repeated negative sentiment | ✓ |

**User's choice:** Moderate with sentiment

---

## Context Preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Include last 3 messages | Last 3 user + last agent response in handoff | ✓ |
| Last query only | Minimal context | |
| No context | Fresh start each escalation | |

**User's choice:** Include last 3 messages

---

## OpenCode's Discretion

- Exact keyword list for escalation detection (signal phrases provided)
- Exact canned script sequence for human agent simulation
- Queue position change timing logic
- Frustration keyword list exact entries
- localStorage key naming and schema design
- CSS animation detail implementation

## Deferred Ideas

None — discussion stayed within phase scope
