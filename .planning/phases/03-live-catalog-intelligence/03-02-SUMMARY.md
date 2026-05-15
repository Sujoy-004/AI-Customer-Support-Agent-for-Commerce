---
phase: 03-live-catalog-intelligence
plan: 03-02
subsystem: Catalog Intents & Integration
tags: [catalog, intent-detection, chat-widget, integration]
tech-stack:
  added: [CatalogIntentDetector, formatCatalogResponse]
  patterns: [Discriminated union types, Keyword pre-filter, Structured parsing, Cross-turn context]
key-files:
  created:
    - src/services/catalogIntentDetector.ts (488 lines)
    - src/services/catalogIntentDetector.test.ts (341 lines)
    - shopify-widget/tests/ChatWidget.integration.test.ts (118 lines)
  modified:
    - shopify-widget/src/ChatWidget.ts (+10 lines)
    - src/services/offTopicDetector.ts (+3/-1 lines)
decisions:
  - 'have' keyword removed from product_search intent group (too generic, caused false positives)
  - Single-char option values (S, M, L) require word-boundary matching to avoid false matches
  - Exclusion guard uses count comparison (exclusion >= catalog keywords) to handle mixed queries
metrics:
  duration: 1h 10min
  completed: 2026-05-15
  tests_added: 44
  tests_total: 92
  test_failures: 0
commit_count: 4
---

# Phase 3 Plan 02: Catalog Integration & Intent Detection — Summary

Hybrid intent classifier with keyword pre-filter and structured parsing that routes catalog queries (stock, sizing, product search) to the CatalogService before the mock response fallback, with cross-turn context resolution.

## One-liner

CatalogIntentDetector with 4 intent types (stock_check, sizing_inquiry, product_search, variant_lookup), exclusion guards, synonym-aware option extraction, 5min/3turn cross-turn context, and ChatWidget integration producing rich formatted responses.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/services/catalogIntentDetector.ts` | 488 | Hybrid intent classifier with keyword pre-filter, structured parsing, cross-turn context, and response formatting |
| `src/services/catalogIntentDetector.test.ts` | 341 | 36 unit tests covering all intent types, edge cases, context management |
| `shopify-widget/tests/ChatWidget.integration.test.ts` | 118 | 8 integration tests for ChatWidget catalog pipeline |

## Files Modified

| File | Changes |
|------|---------|
| `shopify-widget/src/ChatWidget.ts` | Added catalog import, injectable constructor options, catalog branch in _generateAgentResponse after off-topic check |
| `src/services/offTopicDetector.ts` | Added 'stock', 'available', 'backorder', 'restock' to ON_TOPIC_KEYWORDS; removed 'stock' from OFF_TOPIC_KEYWORDS (Rule 2) |

## Architecture

### CatalogIntentDetector Layers
1. **Context expiry check** — 5min TTL or 3 turns
2. **Exclusion guard** — order/return/refund keywords → not_catalog
3. **Intent detection** — keyword pre-filter with per-group excludes
4. **Product search** — multi-strategy search (full query → word-level with scoring)
5. **Option extraction** — synonym-aware, word-boundary safe for single-char values
6. **Cross-turn merge** — accumulate options across turns, reprompt for missing options

### ResolvedQuery Discriminated Union
`exact | partial | product_only | search_results | ambiguous | not_found | context_expired | not_catalog`

## Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| catalogService.test.ts | 26 | ✓ All pass |
| catalogIntentDetector.test.ts | 36 | ✓ All pass |
| offTopicDetector.test.ts | 9 | ✓ All pass (with 'stock' fix) |
| policyService.test.ts | 8 | ✓ All pass |
| refusalResponses.test.ts | 6 | ✓ All pass |
| responseGrounder.test.ts | 6 | ✓ All pass |
| ChatWidget.integration.test.ts | 8 | ✓ All pass |
| **Total** | **92** | **✓ 0 failures** |

## Deviations from Plan

### Rule 2 — Auto-fix: 'stock' keyword blocked by off-topic detector

**Found during:** Task 2 (ChatWidget integration test debugging)

**Issue:** The OffTopicDetector had 'stock' in its OFF_TOPIC_KEYWORDS list (under "Finance/Investment" category). This caused ANY stock-related catalog query (e.g., "is the hoodie in stock") to be rejected as off-topic before reaching the CatalogIntentDetector. This is a pre-existing bug affecting all catalog stock inquiries.

**Fix:** Added 'stock', 'available', 'backorder', 'restock' to ON_TOPIC_KEYWORDS and removed 'stock' from OFF_TOPIC_KEYWORDS in `src/services/offTopicDetector.ts`.

**Files modified:** `src/services/offTopicDetector.ts`

### Design Decision: 'have' keyword removed from product_search

**Reason:** The word 'have' is too generic and appeared in many non-catalog queries. For example, "how many hoodies do you have" would match 'have' (product_search) AND 'how many' (stock_check), with product_search often winning on score. Changed 'do you' to 'do you have' and 'do you carry' as multi-word phrases, and removed standalone 'have'.

## Potential Issues

- There's a pre-existing bug where `ResponseGrounder` is constructed without a `PolicyService` argument in `ChatWidget.ts`, causing non-catalog responses that reach the grounding step to crash with `Cannot read properties of undefined`. This was not addressed in this plan as it predates the catalog integration work.
- Single-character option values (S, M, L) use word-boundary regex which should prevent false matches, but may fail for edge cases like "S size".

## Commit Log

```
a122855 Add CatalogIntentDetector with hybrid intent classification
876c3f5 Integrate CatalogIntentDetector into ChatWidget
9169103 Fix off-topic detector preventing catalog stock queries
```
