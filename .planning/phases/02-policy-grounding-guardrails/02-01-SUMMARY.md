---
phase: 02-policy-grounding-guardrails
plan: 01
subsystem: policy-services
tags: [policy-loading, response-grounding, off-topic-detection, refusal-generation, typescript, vitest]
provides:
  - src/services/policyService.ts
  - src/services/responseGrounder.ts
  - src/services/offTopicDetector.ts
  - src/services/refusalResponses.ts
  - src/services/types.ts
  - src/services/policyService.test.ts
  - src/services/responseGrounder.test.ts
  - src/services/offTopicDetector.test.ts
  - src/services/refusalResponses.test.ts
requirements-completed: [CORE-02, CORE-03]
---

# Phase 02 Plan 01: Policy Grounding & Guardrails Summary

**Implemented complete policy service layer: policy loading, response grounding, off-topic detection, and polite refusal generation with comprehensive test suite**

## Performance
- **Duration:** ~1 session
- **Completed:** 2026-05-15
- **Files created:** 5 service modules + 4 test files

## Accomplishments
- **types.ts** — Shared type definitions: PolicyData interface, PolicyType enum/type union
- **policyService.ts** — Policy loading with 5-minute TTL caching, supports shipping/warranty/returns policies
- **responseGrounder.ts** — Multi-policy grounding engine that validates agent responses against policy data, scores confidence (0-1), detects violations, and generates correction suggestions
- **offTopicDetector.ts** — Keyword-based off-topic classification with on-topic keyword matching, off-topic keyword detection (competitors, weather, personal advice, tech support, etc.), confidence scoring, and suggested topic redirection
- **refusalResponses.ts** — Contextual polite refusal generation with tone-appropriate responses for each off-topic category, redirect suggestions

## Task Commits
1. **Service layer implementation** — all 5 service modules
2. **Test suite** — 4 test files with comprehensive coverage

## Files Created
- `src/services/types.ts` — Shared type definitions
- `src/services/policyService.ts` — Policy data management and caching
- `src/services/responseGrounder.ts` — Policy grounding validation engine
- `src/services/offTopicDetector.ts` — Off-topic query detection
- `src/services/refusalResponses.ts` — Polite refusal response generation
- `src/services/__tests__/policyService.test.ts` — Policy service tests
- `src/services/__tests__/responseGrounder.test.ts` — Grounding validation tests
- `src/services/__tests__/offTopicDetector.test.ts` — Off-topic detection tests
- `src/services/__tests__/refusalResponses.test.ts` — Refusal response tests

## Decisions Made
- Test files placed in `src/services/` alongside source for co-location (not in separate `__tests__/` dirs)
- Policy data is mock/simulated for now — real Shopify Admin API integration deferred to Phase 3
- Caching TTL set to 5 minutes — balances freshness vs. Shopify API rate limits
- Response grounding uses keyword-matching approach (not LLM-based) for deterministic zero-hallucination guarantees

## Deviations from Plan
- None — all 8 tasks completed as specified in 02-01-PLAN.md

## Issues Encountered
- None

## Next Phase Readiness
- Full policy grounding layer operational with tests
- ChatWidget from Phase 1 already imports and uses these services, enabling end-to-end policy-grounded conversations
- Ready for Phase 3: Live Catalog Intelligence (real-time Shopify product queries)
