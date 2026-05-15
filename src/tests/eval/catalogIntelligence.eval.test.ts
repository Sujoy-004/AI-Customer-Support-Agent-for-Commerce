// src/tests/eval/catalogIntelligence.eval.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogIntentDetector, ResolvedQuery } from '../../services/catalogIntentDetector';
import { CatalogService } from '../../services/catalogService';
import { MockCatalogDataSource } from '../../services/mockCatalogData';
import testData from './catalogData.json';

interface TestCase {
  query: string;
  expectedIntent: string;
  expectedType: string;
  contextQuery?: string;
}

let detector: CatalogIntentDetector;

beforeEach(() => {
  const dataSource = new MockCatalogDataSource();
  const service = new CatalogService(dataSource);
  detector = new CatalogIntentDetector(service);
});

describe('Catalog Intelligence Eval', () => {
  const cases = testData as TestCase[];

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];

    if (tc.contextQuery) {
      it(`[${i + 1}] follow-up: "${tc.query}" after context "${tc.contextQuery}"`, async () => {
        // Establish context with first query
        await detector.resolveQuery(tc.contextQuery);

        const result = await detector.resolveQuery(tc.query);
        if (result.type !== 'not_catalog' && result.type !== 'context_expired' && result.type !== 'not_found') {
          expect((result as any).intent).toBe(tc.expectedIntent);
        }
        expect(result.type).toBe(tc.expectedType);
      });
    } else {
      it(`[${i + 1}] "${tc.query}" → ${tc.expectedType}/${tc.expectedIntent}`, async () => {
        const result = await detector.resolveQuery(tc.query);
        if (result.type !== 'not_catalog' && result.type !== 'context_expired' && result.type !== 'not_found') {
          expect((result as any).intent).toBe(tc.expectedIntent);
        }
        expect(result.type).toBe(tc.expectedType);
      });
    }
  }
});
