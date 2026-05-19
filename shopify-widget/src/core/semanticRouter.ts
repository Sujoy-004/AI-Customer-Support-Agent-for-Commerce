// src/core/semanticRouter.ts
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

export interface ReferenceCategory {
  phrases: string[];
  embeddings: number[][];
}

export interface ClassificationResult {
  intent: string | null;
  confidence: number;
}

export class SemanticRouter {
  private static _instance: SemanticRouter | null = null;
  private _extractorPromise: Promise<any> | null = null;
  private _embedCache: Map<string, { embedding: number[]; timestamp: number }> = new Map();
  private _modelLoaded = false;
  private _modelError: Error | null = null;
  private _loadPromise: Promise<void> | null = null;

  private readonly CACHE_TTL_MS = 300000; // 5 minutes, matching CONTEXT_TTL_MS
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private readonly MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
  private readonly EMBEDDING_DIM = 384;

  static getInstance(): SemanticRouter {
    if (!SemanticRouter._instance) {
      SemanticRouter._instance = new SemanticRouter();
    }
    return SemanticRouter._instance;
  }

  isLoaded(): boolean {
    return this._modelLoaded;
  }

  getLoadError(): Error | null {
    return this._modelError;
  }

  private async _ensureModel(): Promise<void> {
    if (this._modelLoaded) return;
    if (this._loadPromise) return this._loadPromise;

    // D-28: Retry once on download failure. If both fail, silent fallback.
    this._loadPromise = pipeline(
      'feature-extraction',
      this.MODEL_ID,
      { dtype: 'q8' },
    ).catch(async (firstErr) => {
      console.error('[SemanticRouter] First pipeline() attempt failed:', firstErr);
      console.debug('[SemanticRouter] Retrying pipeline() once...');
      return pipeline(
        'feature-extraction',
        this.MODEL_ID,
        { dtype: 'q8' },
      );
    }).then(async (extractor) => {
      // Warm up — compute one embedding to verify model works
      await extractor('warmup', { pooling: 'mean', normalize: true });
      this._extractorPromise = Promise.resolve(extractor);
      this._modelLoaded = true;
      console.debug('[SemanticRouter] Model loaded successfully');
    }).catch((err) => {
      // D-28: Both attempts failed — silent fallback, don't throw
      this._modelError = err as Error;
      console.error('[SemanticRouter] Model load failed after retry:', err);
    });

    return this._loadPromise;
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this._modelLoaded) {
      try {
        await this._ensureModel();
      } catch {
        return null;
      }
    }

    const normalized = text.toLowerCase().trim();
    if (!normalized) return null;

    // Check cache (per D-05: exact string key match, 5-min TTL)
    const cached = this._embedCache.get(normalized);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.embedding;
    }

    const extractor = await this._extractorPromise!;
    const tensor = await extractor(normalized, {
      pooling: 'mean',
      normalize: true,
    });

    // tolist() returns number[][]; [0] gives the first (only) sentence vector
    // AI-SPEC §4b.2: tolist() is synchronous (just converts internal buffer)
    const embedding: number[] = tensor.tolist()[0];

    // Validate dimension (per RESEARCH.md Pitfall 1 safeguard)
    if (embedding.length !== this.EMBEDDING_DIM) {
      console.error(`[SemanticRouter] Unexpected embedding dimension: ${embedding.length}`);
      return null;
    }

    // Cache it
    this._embedCache.set(normalized, {
      embedding,
      timestamp: Date.now(),
    });

    return embedding;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    // Since normalize:true produces unit vectors, this is just dot product
    // AI-SPEC §4 line 218: for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; }
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  async classify(
    query: string,
    categories: Record<string, ReferenceCategory>,
  ): Promise<ClassificationResult> {
    const queryEmbedding = await this.embed(query);
    if (!queryEmbedding) {
      return { intent: null, confidence: 0 };
    }

    let bestIntent: string | null = null;
    let bestScore = 0;

    for (const [intentName, category] of Object.entries(categories)) {
      for (const refEmbedding of category.embeddings) {
        const score = this.cosineSimilarity(queryEmbedding, refEmbedding);
        if (score > bestScore) {
          bestScore = score;
          bestIntent = intentName;
        }
      }
    }

    if (bestScore < this.CONFIDENCE_THRESHOLD) {
      return { intent: null, confidence: bestScore };
    }

    return { intent: bestIntent, confidence: bestScore };
  }

  /**
   * Classify a query against phrase-based categories (computes embeddings on-the-fly).
   * Convenience wrapper around classify() for cases where pre-computed embeddings
   * are not available (e.g., dynamic policy categories).
   */
  async classifyFromPhrases(
    query: string,
    phraseCategories: Record<string, string[]>,
  ): Promise<ClassificationResult> {
    const queryEmbedding = await this.embed(query);
    if (!queryEmbedding) {
      return { intent: null, confidence: 0 };
    }

    let bestIntent: string | null = null;
    let bestScore = 0;

    for (const [intentName, phrases] of Object.entries(phraseCategories)) {
      for (const phrase of phrases) {
        const refEmbedding = await this.embed(phrase);
        if (!refEmbedding) continue;
        const score = this.cosineSimilarity(queryEmbedding, refEmbedding);
        if (score > bestScore) {
          bestScore = score;
          bestIntent = intentName;
        }
      }
    }

    if (bestScore < this.CONFIDENCE_THRESHOLD) {
      return { intent: null, confidence: bestScore };
    }

    return { intent: bestIntent, confidence: bestScore };
  }

  pruneCache(): void {
    const now = Date.now();
    for (const [key, entry] of this._embedCache) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this._embedCache.delete(key);
      }
    }
  }
}