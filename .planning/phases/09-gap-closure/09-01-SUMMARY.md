---
phase: 09-gap-closure
plan: 01
subsystem: chat-widget
tags: [gap-closure, bugfix, security, semantic-routing]
dependency_graph:
  requires: []
  provides: [working-chat-widget, grounded-policy-responses, semantic-policy-routing]
  affects: [ChatWidget, SemanticRouter]
tech-stack:
  added: []
  patterns: [conditional-innerHTML, sanitization, semantic-routing-with-keyword-fallback, grounding-enforcement]
key-files:
  created: []
  modified:
    - shopify-widget/src/ChatWidget.ts
    - shopify-widget/src/core/semanticRouter.ts
decisions:
  - "Used classifyFromPhrases() wrapper instead of raw classify() — classify() requires pre-computed embeddings, phrases need on-the-fly computation"
  - "Grounding enforcement added to both _handlePolicyQuery and _generateAgentResponse for defense in depth"
  - "No new dependencies — sanitization uses regex-based script/event handler stripping"
metrics:
  duration_minutes: 12
  completed: "2026-05-19T19:12:00Z"
  tests_before: 609
  tests_after: 609
  test_pass_rate: "100%"
---

# Phase 9 Plan 01: Gap Closure Summary

**One-liner:** Fixed 4 critical gaps in ChatWidget.ts — missing ReturnService import, OrderCard HTML rendering as escaped text, silently ignored grounding violations, and keyword-only policy detection replaced with semantic routing.

## Files Modified

| File | Changes |
|------|---------|
| `shopify-widget/src/ChatWidget.ts` | B1: Added `import type { ReturnService }`; B2: Conditional innerHTML with sanitization; W2: Grounding enforcement with fallback; W4: SemanticRouter-based policy routing |
| `shopify-widget/src/core/semanticRouter.ts` | Added `classifyFromPhrases()` method for dynamic phrase-based classification |

## Gaps Fixed

### B1 (BLOCKER): Missing ReturnService Import
- **Issue:** `private _returnService: ReturnService | undefined` referenced a type that was never imported, causing TypeScript compilation failure
- **Fix:** Added `import type { ReturnService } from '../../src/services/returnService';` at line 25
- **Impact:** Pure type import — no runtime impact, resolves compilation failure

### B2 (MAJOR): OrderCard HTML Rendered as Escaped Text
- **Issue:** `content.textContent = msg.text` escaped ALL HTML, making OrderCard.render() output appear as raw text instead of DOM elements
- **Fix:** Conditional rendering — agent messages containing `<` use `innerHTML` with sanitization; user messages and plain text use `textContent`
- **Sanitization:** Strips `<script>` tags, event handler attributes (`on*=`), and `javascript:` URIs
- **Impact:** Order cards now render as styled DOM elements; XSS prevented via sanitization + textContent for user content

### W2 (WARNING): Silently Ignored ResponseGrounder Violations
- **Issue:** `if (!grounding.isGrounded && grounding.violations.length > 0) { }` had an empty body — ungrounded responses passed through silently
- **Fix:** All 5 grounding checks now return a fallback message: "I'm sorry, I couldn't verify the policy details. Please check our store policies page or contact support for accurate information."
- **Locations:** 4 in `_handlePolicyQuery` (semantic path + 3 keyword fallbacks) + 1 defensive check in `_generateAgentResponse`
- **Impact:** Hallucinated or unverified policy responses are caught and replaced with safe fallback

### W4 (WARNING): Keyword-Only Policy Detection
- **Issue:** Policy queries matched only via `lower.includes('shipping')` etc., failing on natural language like "how long does delivery take"
- **Fix:** Added `classifyFromPhrases()` to SemanticRouter for on-the-fly phrase embedding computation. `_handlePolicyQuery` now uses semantic routing (threshold >= 0.6) with keyword fallback
- **Impact:** Natural language policy queries now match via embedding similarity; keyword fallback provides belt-and-suspenders reliability

## Deviations from Plan

### Deviation 1: classifyFromPhrases() instead of classify()
- **Found during:** Task 2 implementation
- **Issue:** Plan proposed `this._semanticRouter.classify(query, policyCategories)` with string arrays, but `classify()` requires `Record<string, ReferenceCategory>` with pre-computed embeddings (384-dim vectors)
- **Fix:** Added `classifyFromPhrases()` method to SemanticRouter that computes embeddings on-the-fly from phrase strings, then applies the same cosine similarity logic
- **Why:** Pre-computed embeddings require running the MiniLM model at build time; phrase-based approach is more flexible for dynamic policy categories
- **Files modified:** `shopify-widget/src/core/semanticRouter.ts` (+36 lines)

## Test Results

| Metric | Value |
|--------|-------|
| Test files | 30 passed |
| Total tests | 609 passed |
| Pass rate | 100% |
| Regressions | 0 |

## Verification Checklist

- [x] `import type { ReturnService }` — 1 match in ChatWidget.ts
- [x] `content.innerHTML` — 1 match (conditional branch for agent HTML messages)
- [x] `!grounding.isGrounded` — 5 matches (4 in _handlePolicyQuery + 1 defensive in _generateAgentResponse)
- [x] `classifyFromPhrases` — 1 match in _handlePolicyQuery
- [x] No empty grounding if blocks
- [x] All 609 tests pass
- [x] No new dependencies added

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag:injection | shopify-widget/src/ChatWidget.ts | Agent HTML rendered via innerHTML — mitigated by regex sanitization (script tags, event handlers, javascript: URIs) per T-09-01 |
| threat_flag:spoofing | shopify-widget/src/ChatWidget.ts | Grounding validation prevents hallucinated policy info from reaching users per T-09-02 |

## Commits

- `8565218`: feat(09-01): fix B1 ReturnService import and B2 OrderCard HTML rendering
- `e45c96b`: feat(09-01): fix W2 grounding enforcement and W4 semantic policy routing
