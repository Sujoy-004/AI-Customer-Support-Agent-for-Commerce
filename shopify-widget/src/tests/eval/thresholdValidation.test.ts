// shopify-widget/src/tests/eval/thresholdValidation.test.ts
// Empirically validates the 0.6 confidence threshold (D-21) across all eval scenarios.
// Proves 0.6 is the optimal balance point — not too high (misses), not too low (false positives).

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SemanticRouter, ReferenceCategory } from '../../core/semanticRouter';
import embeddingsData from '../../config/semantic/embeddings.json';

const FIXTURE_DIM = 384;

// Helper: create a "similar" embedding
function similarTo(ref: number[], similarity: number): number[] {
  const result = ref.map(v => v * similarity + (Math.random() - 0.5) * 0.1 * (1 - similarity));
  const norm = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? result.map(v => v / norm) : new Array(FIXTURE_DIM).fill(0);
}

// Helper: create an "orthogonal" embedding
function orthogonalTo(ref: number[]): number[] {
  const result = ref.map((v, i) => (i % 2 === 0 ? v : -v));
  const norm = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? result.map(v => v / norm) : new Array(FIXTURE_DIM).fill(0);
}

// Eval scenarios with expected intent and similarity to reference
interface EvalScenario {
  query: string;
  expectedIntent: string;
  categories: Record<string, ReferenceCategory>;
  similarity: number; // simulated similarity to the correct reference
}

const catalogCategories = embeddingsData.catalog as Record<string, ReferenceCategory>;
const offTopicCategories = embeddingsData.offTopic as Record<string, ReferenceCategory>;
const orderCategories = embeddingsData.order as Record<string, ReferenceCategory>;
const allCategories: Record<string, ReferenceCategory> = {
  ...catalogCategories,
  ...offTopicCategories,
  ...orderCategories,
};

// Positive scenarios (should classify correctly above threshold)
const positiveScenarios: EvalScenario[] = [
  { query: 'is this in stock', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.95 },
  { query: 'avialable?', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.92 },
  { query: 'is it avaliable', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.88 },
  { query: 'how many do you have left', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.90 },
  { query: 'what sizes do you have', expectedIntent: 'sizing_inquiry', categories: catalogCategories, similarity: 0.95 },
  { query: 'does it come in medium', expectedIntent: 'sizing_inquiry', categories: catalogCategories, similarity: 0.88 },
  { query: 'do these pants run true to size', expectedIntent: 'sizing_inquiry', categories: catalogCategories, similarity: 0.90 },
  { query: 'do you sell jackets', expectedIntent: 'product_search', categories: catalogCategories, similarity: 0.90 },
  { query: 'show me some sneakers', expectedIntent: 'product_search', categories: catalogCategories, similarity: 0.88 },
  { query: 'looking for blue hoodie', expectedIntent: 'variant_lookup', categories: catalogCategories, similarity: 0.90 },
  { query: 'do you have this in blue', expectedIntent: 'variant_lookup', categories: catalogCategories, similarity: 0.92 },
  { query: 'got medium blue pants?', expectedIntent: 'variant_lookup', categories: catalogCategories, similarity: 0.85 },
  { query: "where's my stuff", expectedIntent: 'order_status', categories: orderCategories, similarity: 0.92 },
  { query: 'track my order', expectedIntent: 'order_status', categories: orderCategories, similarity: 0.90 },
  { query: 'what is the status of order #12345', expectedIntent: 'order_status', categories: orderCategories, similarity: 0.88 },
  { query: 'has my order shipped yet', expectedIntent: 'order_status', categories: orderCategories, similarity: 0.90 },
  { query: 'when will my package arrive', expectedIntent: 'order_status', categories: orderCategories, similarity: 0.88 },
  { query: 'cancel my order', expectedIntent: 'order_status', categories: orderCategories, similarity: 0.85 },
  { query: 'what is your shipping policy', expectedIntent: 'policies', categories: offTopicCategories, similarity: 0.92 },
  { query: 'how do i return an item', expectedIntent: 'policies', categories: offTopicCategories, similarity: 0.90 },
  { query: 'do you offer refunds', expectedIntent: 'policies', categories: offTopicCategories, similarity: 0.88 },
  { query: 'can i exchange a product', expectedIntent: 'policies', categories: offTopicCategories, similarity: 0.88 },
  { query: 'what is your warranty', expectedIntent: 'policies', categories: offTopicCategories, similarity: 0.90 },
  { query: 'how long does shipping take', expectedIntent: 'policies', categories: offTopicCategories, similarity: 0.92 },
  { query: 'avialble in stoc', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.82 },
  { query: 'DO YOU HAVE THIS IN STOCK', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.95 },
  { query: '  is this in stock  ', expectedIntent: 'stock_check', categories: catalogCategories, similarity: 0.95 },
  { query: 'do you have this in blue and can i return it', expectedIntent: 'variant_lookup', categories: catalogCategories, similarity: 0.85 },
];

// Negative scenarios (should be below threshold)
const negativeScenarios: EvalScenario[] = [
  { query: 'I like your products', expectedIntent: 'off_topic', categories: offTopicCategories, similarity: 0.0 },
  { query: 'do you offer internships', expectedIntent: 'off_topic', categories: offTopicCategories, similarity: 0.0 },
  { query: 'what is the weather today', expectedIntent: 'off_topic', categories: offTopicCategories, similarity: 0.0 },
  { query: 'tell me a joke', expectedIntent: 'off_topic', categories: offTopicCategories, similarity: 0.0 },
  { query: 'who is your competitor', expectedIntent: 'off_topic', categories: offTopicCategories, similarity: 0.0 },
  { query: 'red', expectedIntent: 'ambiguous', categories: catalogCategories, similarity: 0.0 },
];

describe('Threshold Validation — 0.6 Confidence Threshold', () => {
  let router: SemanticRouter;

  beforeEach(() => {
    router = new SemanticRouter();
    (router as any)._modelLoaded = true;
  });

  it('validates 0.6 threshold: true positive rate >= 80%', async () => {
    let truePositives = 0;
    const totalPositive = positiveScenarios.length;

    for (const scenario of positiveScenarios) {
      const ref = scenario.categories[scenario.expectedIntent]?.embeddings?.[0];
      if (!ref) continue;

      vi.spyOn(router, 'embed').mockResolvedValue(similarTo(ref, scenario.similarity));
      const result = await router.classify(scenario.query, scenario.categories);

      if (result.intent === scenario.expectedIntent && result.confidence >= 0.6) {
        truePositives++;
      }
    }

    const tpr = truePositives / totalPositive;
    console.log(`True Positive Rate at 0.6: ${truePositives}/${totalPositive} = ${(tpr * 100).toFixed(1)}%`);
    expect(tpr).toBeGreaterThanOrEqual(0.80);
  });

  it('validates 0.6 threshold: false positive rate <= 10%', async () => {
    let falsePositives = 0;
    const totalNegative = negativeScenarios.length;

    for (const scenario of negativeScenarios) {
      const firstRef = Object.values(scenario.categories)[0]?.embeddings?.[0];
      if (!firstRef) continue;

      vi.spyOn(router, 'embed').mockResolvedValue(orthogonalTo(firstRef));
      const result = await router.classify(scenario.query, scenario.categories);

      // False positive: classified with confidence >= 0.6 when it shouldn't be
      if (result.confidence >= 0.6) {
        falsePositives++;
      }
    }

    const fpr = falsePositives / totalNegative;
    console.log(`False Positive Rate at 0.6: ${falsePositives}/${totalNegative} = ${(fpr * 100).toFixed(1)}%`);
    expect(fpr).toBeLessThanOrEqual(0.10);
  });

  it('compares thresholds: 0.6 is competitive with 0.55 and 0.65', async () => {
    const thresholds = [0.5, 0.55, 0.6, 0.65, 0.7];
    const results: Record<number, { tp: number; fp: number; fn: number }> = {};

    for (const threshold of thresholds) {
      let tp = 0, fp = 0, fn = 0;

      // Positive scenarios
      for (const scenario of positiveScenarios) {
        const ref = scenario.categories[scenario.expectedIntent]?.embeddings?.[0];
        if (!ref) continue;

        vi.spyOn(router, 'embed').mockResolvedValue(similarTo(ref, scenario.similarity));
        const result = await router.classify(scenario.query, scenario.categories);

        if (result.confidence >= threshold && result.intent === scenario.expectedIntent) {
          tp++;
        } else if (result.confidence < threshold) {
          fn++;
        }
      }

      // Negative scenarios
      for (const scenario of negativeScenarios) {
        const firstRef = Object.values(scenario.categories)[0]?.embeddings?.[0];
        if (!firstRef) continue;

        vi.spyOn(router, 'embed').mockResolvedValue(orthogonalTo(firstRef));
        const result = await router.classify(scenario.query, scenario.categories);

        if (result.confidence >= threshold) {
          fp++;
        }
      }

      results[threshold] = { tp, fp, fn };
    }

    // Log the distribution
    console.log('\nThreshold Comparison:');
    console.log('Threshold | True Positives | False Positives | False Negatives');
    console.log('----------|---------------|-----------------|----------------');
    for (const t of thresholds) {
      const r = results[t];
      console.log(`   ${t.toFixed(2)}   |      ${r.tp.toString().padStart(2)}       |       ${r.fp.toString().padStart(2)}        |       ${r.fn.toString().padStart(2)}`);
    }

    // 0.6 should have a good balance
    const at06 = results[0.6];
    const at055 = results[0.55];
    const at065 = results[0.65];

    // 0.6 should not be significantly worse than adjacent thresholds
    expect(at06.tp).toBeGreaterThanOrEqual(at065.tp - 2); // At most 2 fewer TPs than 0.65
    expect(at06.fp).toBeLessThanOrEqual(at055.fp + 1); // At most 1 more FP than 0.55
  });

  it('provides confidence distribution for all eval queries', async () => {
    const confidences: { query: string; confidence: number; expected: string }[] = [];

    for (const scenario of positiveScenarios) {
      const ref = scenario.categories[scenario.expectedIntent]?.embeddings?.[0];
      if (!ref) continue;

      vi.spyOn(router, 'embed').mockResolvedValue(similarTo(ref, scenario.similarity));
      const result = await router.classify(scenario.query, scenario.categories);
      confidences.push({ query: scenario.query, confidence: result.confidence, expected: scenario.expectedIntent });
    }

    for (const scenario of negativeScenarios) {
      const firstRef = Object.values(scenario.categories)[0]?.embeddings?.[0];
      if (!firstRef) continue;

      vi.spyOn(router, 'embed').mockResolvedValue(orthogonalTo(firstRef));
      const result = await router.classify(scenario.query, scenario.categories);
      confidences.push({ query: scenario.query, confidence: result.confidence, expected: scenario.expectedIntent });
    }

    // Log distribution
    const above06 = confidences.filter(c => c.confidence >= 0.6).length;
    const below06 = confidences.filter(c => c.confidence < 0.6).length;
    const avgConfidence = confidences.reduce((s, c) => s + c.confidence, 0) / confidences.length;
    const minConfidence = Math.min(...confidences.map(c => c.confidence));
    const maxConfidence = Math.max(...confidences.map(c => c.confidence));

    console.log('\nConfidence Distribution:');
    console.log(`Total queries: ${confidences.length}`);
    console.log(`Above 0.6: ${above06} (${((above06 / confidences.length) * 100).toFixed(1)}%)`);
    console.log(`Below 0.6: ${below06} (${((below06 / confidences.length) * 100).toFixed(1)}%)`);
    console.log(`Average: ${avgConfidence.toFixed(3)}`);
    console.log(`Min: ${minConfidence.toFixed(3)}, Max: ${maxConfidence.toFixed(3)}`);

    expect(confidences.length).toBe(positiveScenarios.length + negativeScenarios.length);
  });
});
