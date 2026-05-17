# Phase 6: Semantic AI Router - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 06-semantic-ai-router
**Areas discussed:** Transformer.js integration, Reference embedding strategy, SemanticRouter class API, Semantic off-topic detection, Failure handling, Return service code cleanup, Build-time embedding script, Phased rollout order, Integration test scope

---

## Transformer.js Integration

| Option | Description | Selected |
|--------|-------------|----------|
| npm bundler import | Standard npm install @xenova/transformers, bundled via build step | ✓ |
| CDN dynamic import | Load from CDN via dynamic import() — no build change | |
| Service worker cache | Download model via service worker in background thread | |

**User's choice:** npm bundler import
**Notes:** Model storage in IndexedDB via transformer.js auto-caching. Loading state text: "Loading AI model…". First query queued during model load, processed after ready.

---

## Reference Embedding Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-computed build-time constants | Build script generates embedding JSON, bundled as .json | ✓ |
| Compute on first model load | Compute once when model first loads | |
| Hybrid: pre-computed + on-load update | Ship defaults, recompute on load | |

**User's choice:** Pre-computed build-time constants
**Notes:** Config lives in src/config/semantic/ directory. 5-8 reference phrases per intent. Build-time script in prebuild hook. Fail build on failure. embeddings.json in .gitignore. No fallback — build always required. Flat JSON format with intent→{phrases[], embeddings[]}.

---

## SemanticRouter Class API

| Option | Description | Selected |
|--------|-------------|----------|
| Single classify() method | semanticRouter.classify(query, categoryRefs) | ✓ |
| Low-level embed() + classify() | Separate methods for flexibility | |
| Per-detector wrapper | Router wraps each detector individually | |

**User's choice:** Single classify() method
**Notes:** 0.6 confidence threshold. Singleton pattern shared across all detectors. Highest confidence wins for hybrid conflict resolution.

---

## Semantic Off-Topic Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Semantic on-topic check | Reference embeddings for 3 domains (products, orders, policies) | ✓ |
| Keep pure keyword for off-topic | Only semantic for catalog and order | |
| Full semantic binary classifier | Two reference sets — on-topic and off-topic | |

**User's choice:** Semantic on-topic check
**Notes:** Three on-topic clusters: products, orders, policies. Keep full ON_TOPIC_KEYWORDS and OFF_TOPIC_KEYWORDS as fallback.

---

## Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Silent fallback to keyword | If model fails, fall back to original keyword-only logic | ✓ |
| Error state with retry | Show error message with retry button | |
| Both: graceful degradation + logging | Silent fallback + console.error | |

**User's choice:** Silent fallback to keyword matching
**Notes:** Retry once on download failure. Queue first query, process after model loads. If both retries fail, keyword fallback for session.

---

## Return Service Code Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Leave as-is | Don't modify return code | |
| Wrap in a feature flag | Config flag enableReturnService: false | ✓ |
| Remove the return block | Strip out lines 612-638 entirely | |

**User's choice:** Wrap in a feature flag
**Notes:** Skip import entirely when disabled — reduces bundle size.

---

## Build-Time Embedding Script

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone Node script | Script using @xenova/transformers, run manually | |
| Inline in build pipeline | Prebuild hook, always runs during npm build | ✓ |
| Manual CLI tool | Developer runs manually when phrases change | |

**User's choice:** Inline in build pipeline (prebuild hook)
**Notes:** Fail build on generation failure. embeddings.json in .gitignore, always regenerated. No fallback committed. Flat JSON format.

---

## Phased Rollout Order

| Option | Description | Selected |
|--------|-------------|----------|
| All at once | Replace all 3 detectors in one PR | ✓ |
| Catalog first, then order, then off-topic | Incremental rollout by detector | |
| Catalog + order first, off-topic later | Split by architecture type | |

**User's choice:** All at once

---

## Integration Test Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Typo resilience + natural phrasing | 5-7 scenarios per detector | |
| Full regression against existing eval tests | Run all eval scenarios through semantic pipeline | ✓ |
| Model loading lifecycle tests | Test model load, caching, fallback | |

**User's choice:** Full regression against existing eval tests
**Notes:** Extend existing eval test file (catalogIntelligence.eval.test.ts).

---

## OpenCode's Discretion

- Exact reference phrases for each intent category (5-8 per intent)
- Exact format of embeddings.json (key names, nesting)
- SemanticRouter internal implementation details (embedding normalization, pipeline)
- Widget integration details (how to show "Loading AI model…" state)
- Exact npm script name for embedding generation
- Build tool configuration for prebuild hook

## Deferred Ideas

- Multilingual support — post-hackathon
- Model fine-tuning — post-hackathon
- Embedding quantization (int8) — polish phase
- Progressive enhancement fallback (outdated browsers)
- Return initiation — feature-flagged off, activate in dedicated phase
