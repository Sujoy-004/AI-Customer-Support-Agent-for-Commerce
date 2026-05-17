import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SemanticRouter, ReferenceCategory } from './semanticRouter';

// Shared fixture: 384-dim vector for test purposes
// D-07: Unit tests use pre-computed embedding fixtures (static arrays)
const FIXTURE_DIM = 384;
function makeFixture(value: number): number[] {
  return new Array(FIXTURE_DIM).fill(value);
}

// Create a normalized unit vector (each element = value, normalized to unit length)
function makeUnitVector(value: number): number[] {
  const raw = new Array(FIXTURE_DIM).fill(value);
  const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0));
  return raw.map(v => v / norm);
}

// Helper to create a ReferenceCategory from fixture embeddings
function makeCategory(phrases: string[], values: number[]): ReferenceCategory {
  return { phrases, embeddings: [values] };
}

describe('SemanticRouter', () => {
  let router: SemanticRouter;

  beforeEach(() => {
    router = new SemanticRouter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Cosine Similarity ────────────────────────────────────

  it('should return 1 for identical vectors', () => {
    const a = makeUnitVector(0.5);
    expect(router.cosineSimilarity(a, a)).toBeCloseTo(1, 5);
  });

  it('should return 0 for orthogonal vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(router.cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it('should handle 384-dim unit vectors correctly', () => {
    const a = makeUnitVector(0.1);
    const b = makeUnitVector(0.2);
    const result = router.cosineSimilarity(a, b);
    // Two vectors with all positive elements should have similarity ~1.0
    expect(result).toBeGreaterThan(0.9);
    expect(result).toBeCloseTo(1, 4);
  });

  it('should throw on dimension mismatch', () => {
    expect(() => router.cosineSimilarity([1, 0], [1, 0, 0])).toThrow('Dimension mismatch');
  });

  // ── classify with fixture categories ─────────────────────

  it('should return null intent and 0 confidence when embed returns null', async () => {
    vi.spyOn(router, 'embed').mockResolvedValue(null);

    const result = await router.classify('test', {
      stock_check: makeCategory(['available'], makeUnitVector(0.1)),
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('should return best matching intent above threshold', async () => {
    // Create distinct vectors: query matches stock_check, not sizing_inquiry
    const queryEmbedding = makeUnitVector(1);
    // stock_check ref: all positive (same direction as query)
    const stockRef = makeUnitVector(1);
    // sizing_inquiry ref: alternating positive/negative (orthogonal-ish)
    const sizingRef = new Array(FIXTURE_DIM).fill(0).map((_, i) => (i % 2 === 0 ? 1 : -1));
    const sNorm = Math.sqrt(sizingRef.reduce((s, v) => s + v * v, 0));
    const normalizedSizingRef = sizingRef.map(v => v / sNorm);

    vi.spyOn(router, 'embed').mockResolvedValue(queryEmbedding);

    const result = await router.classify('in stock?', {
      stock_check: makeCategory(['available'], stockRef),
      sizing_inquiry: makeCategory(['size chart'], normalizedSizingRef),
    });

    expect(result.intent).toBe('stock_check');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('should return null intent when below 0.6 threshold', async () => {
    const queryEmbedding = makeUnitVector(1);
    const refEmbedding = new Array(FIXTURE_DIM).fill(0).map((_, i) => (i % 2 === 0 ? 1 : -1));
    const refNorm = Math.sqrt(refEmbedding.reduce((s, v) => s + v * v, 0));
    const normalizedRef = refEmbedding.map(v => v / refNorm);

    vi.spyOn(router, 'embed').mockResolvedValue(queryEmbedding);

    const result = await router.classify('unrelated', {
      stock_check: makeCategory(['available'], normalizedRef),
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBeLessThan(0.6);
  });

  // ── Embedding cache ──────────────────────────────────────

  it('should use cached embedding within TTL', async () => {
    const fakeEmbedding = makeUnitVector(0.5);

    // Set up router as if model is loaded (so embed() skips model loading)
    (router as any)._modelLoaded = true;
    // Set extractor to a mock that would fail if called (cache should prevent this)
    const mockExtractor = vi.fn().mockRejectedValue(new Error('Extractor should not be called'));
    (router as any)._extractorPromise = Promise.resolve(mockExtractor);

    // Pre-populate cache with valid entry
    (router as any)._embedCache.set('test query', {
      embedding: fakeEmbedding,
      timestamp: Date.now(),
    });

    const result = await router.embed('test query');
    expect(result).toEqual(fakeEmbedding);
    expect(mockExtractor).not.toHaveBeenCalled();
  });

  it('should recompute embedding after TTL expiry', async () => {
    const fakeEmbedding = makeUnitVector(0.5);

    // Set up router as if model is loaded
    (router as any)._modelLoaded = true;
    const mockExtractor = vi.fn().mockResolvedValue({
      tolist: () => [fakeEmbedding],
    });
    (router as any)._extractorPromise = Promise.resolve(mockExtractor);

    // Pre-populate cache with an expired entry
    const oldTimestamp = Date.now() - 310000; // 5min + 10s
    (router as any)._embedCache.set('query', {
      embedding: makeUnitVector(0.3), // different value to verify recomputation
      timestamp: oldTimestamp,
    });

    const result = await router.embed('query');
    expect(result).toEqual(fakeEmbedding);
    expect(mockExtractor).toHaveBeenCalledTimes(1);
  });

  // ── Singleton pattern ────────────────────────────────────

  it('should return the same instance via getInstance', () => {
    const a = SemanticRouter.getInstance();
    const b = SemanticRouter.getInstance();
    expect(a).toBe(b);
  });

  // ── isLoaded / getLoadError ──────────────────────────────

  it('should return false for isLoaded before model load', () => {
    expect(router.isLoaded()).toBe(false);
  });

  it('should return null for getLoadError before any load attempt', () => {
    expect(router.getLoadError()).toBeNull();
  });

  // ── pruneCache ───────────────────────────────────────────

  it('should remove expired entries from cache', () => {
    const fresh = { embedding: makeUnitVector(0.1), timestamp: Date.now() };
    const expired = { embedding: makeUnitVector(0.2), timestamp: Date.now() - 310000 };
    (router as any)._embedCache.set('fresh', fresh);
    (router as any)._embedCache.set('expired', expired);

    router.pruneCache();

    expect((router as any)._embedCache.has('fresh')).toBe(true);
    expect((router as any)._embedCache.has('expired')).toBe(false);
  });
});
