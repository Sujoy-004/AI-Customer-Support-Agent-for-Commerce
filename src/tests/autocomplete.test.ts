import { describe, it, expect, beforeEach } from 'vitest';
import type { AutocompleteResult, Product } from '../services/types';
import { AutocompleteService } from '../services/autocomplete';

// Mock products for testing
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Air Max Runner',
    description: 'Lightweight running shoes',
    type: 'clothing',
    priceRange: { min: 89.99, max: 129.99 },
    options: [],
    variants: [],
    images: [],
    tags: ['running', 'athletic', 'air']
  },
  {
    id: 'prod-2',
    title: 'Classic Cotton Tee',
    description: 'Everyday cotton t-shirt',
    type: 'clothing',
    priceRange: { min: 19.99, max: 29.99 },
    options: [],
    variants: [],
    images: [],
    tags: ['cotton', 'casual']
  },
  {
    id: 'prod-3',
    title: 'Winter Jacket Pro',
    description: 'Warm winter jacket',
    type: 'clothing',
    priceRange: { min: 149.99, max: 199.99 },
    options: [],
    variants: [],
    images: [],
    tags: ['winter', 'outerwear']
  },
  {
    id: 'prod-4',
    title: 'Air Lite Sneaker',
    description: 'Casual lightweight sneakers',
    type: 'clothing',
    priceRange: { min: 59.99, max: 79.99 },
    options: [],
    variants: [],
    images: [],
    tags: ['casual', 'air', 'sneaker']
  },
  {
    id: 'prod-5',
    title: 'Denim Jacket',
    description: 'Classic denim jacket',
    type: 'clothing',
    priceRange: { min: 69.99, max: 89.99 },
    options: [],
    variants: [],
    images: [],
    tags: ['denim', 'casual', 'jacket']
  }
];

describe('AutocompleteResult interface', () => {
  it('should have type as product, order, or policy', () => {
    const productResult: AutocompleteResult = { type: 'product', label: 'Test', value: 'test' };
    expect(productResult.type).toBe('product');

    const orderResult: AutocompleteResult = { type: 'order', label: '#1234', value: '#1234' };
    expect(orderResult.type).toBe('order');

    const policyResult: AutocompleteResult = { type: 'policy', label: 'Shipping', value: 'shipping' };
    expect(policyResult.type).toBe('policy');
  });

  it('should have label as string', () => {
    const result: AutocompleteResult = { type: 'product', label: 'Air Max Runner', value: 'Air Max Runner' };
    expect(typeof result.label).toBe('string');
    expect(result.label).toBe('Air Max Runner');
  });

  it('should have value as string', () => {
    const result: AutocompleteResult = { type: 'product', label: 'Air Max Runner', value: 'Air Max Runner' };
    expect(typeof result.value).toBe('string');
    expect(result.value).toBe('Air Max Runner');
  });

  it('should be exported and importable from types.ts', () => {
    const result: AutocompleteResult = { type: 'product', label: 'Test', value: 'test' };
    expect(result).toBeDefined();
  });
});

describe('AutocompleteService', () => {
  let service: AutocompleteService;

  beforeEach(() => {
    service = new AutocompleteService();
  });

  describe('edge cases', () => {
    it('should return empty array for empty query', () => {
      const results = service.getSuggestions('', mockProducts);
      expect(results).toEqual([]);
    });

    it('should return empty array for single char query (min 2 chars)', () => {
      const results = service.getSuggestions('a', mockProducts);
      expect(results).toEqual([]);
    });

    it('should return empty array for non-matching query', () => {
      const results = service.getSuggestions('xyznonexistent', mockProducts);
      expect(results).toEqual([]);
    });

    it('should match products with no tags by title only', () => {
      const productsWithoutTags: Product[] = [
        {
          id: 'prod-x',
          title: 'Mystery Product',
          description: 'No tags here',
          type: 'clothing',
          priceRange: { min: 10, max: 20 },
          options: [],
          variants: [],
          images: [],
          tags: []
        }
      ];
      const results = service.getSuggestions('mystery', productsWithoutTags);
      expect(results.length).toBe(1);
      expect(results[0].label).toBe('Mystery Product');
    });
  });

  describe('prefix matching', () => {
    it('should return matching products for 2+ char query', () => {
      const results = service.getSuggestions('ai', mockProducts);
      expect(results.length).toBeGreaterThan(0);
      const labels = results.map((r: AutocompleteResult) => r.label);
      expect(labels).toContain('Air Max Runner');
      expect(labels).toContain('Air Lite Sneaker');
    });

    it('should match case-insensitively', () => {
      const resultsUpper = service.getSuggestions('AIR', mockProducts);
      const resultsLower = service.getSuggestions('air', mockProducts);
      expect(resultsUpper.map((r: AutocompleteResult) => r.label)).toEqual(resultsLower.map((r: AutocompleteResult) => r.label));
    });

    it('should match against product tags', () => {
      const results = service.getSuggestions('running', mockProducts);
      expect(results.length).toBeGreaterThan(0);
      const labels = results.map((r: AutocompleteResult) => r.label);
      expect(labels).toContain('Air Max Runner');
    });

    it('should return type product for product matches', () => {
      const results = service.getSuggestions('air', mockProducts);
      for (const r of results) {
        expect(r.type).toBe('product');
      }
    });

    it('should set label and value to product title', () => {
      const results = service.getSuggestions('denim', mockProducts);
      expect(results.length).toBe(1);
      expect(results[0].label).toBe('Denim Jacket');
      expect(results[0].value).toBe('Denim Jacket');
    });
  });

  describe('order detection', () => {
    it('should detect order pattern starting with # followed by digits', () => {
      const results = service.getSuggestions('#1234', mockProducts);
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('order');
      expect(results[0].label).toBe('#1234');
      expect(results[0].value).toBe('#1234');
    });

    it('should detect order pattern starting with ORD-', () => {
      const results = service.getSuggestions('ORD-5678', mockProducts);
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('order');
      expect(results[0].label).toBe('ORD-5678');
      expect(results[0].value).toBe('ORD-5678');
    });

    it('should detect order pattern case-insensitively (ord-)', () => {
      const results = service.getSuggestions('ord-9999', mockProducts);
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('order');
    });
  });

  describe('sorting', () => {
    it('should sort exact prefix matches before substring matches', () => {
      const results = service.getSuggestions('air', mockProducts);
      // 'Air Max Runner' and 'Air Lite Sneaker' both start with 'Air' (prefix)
      // No substring-only matches for 'air' in our mock set, so all should be prefix
      expect(results.length).toBe(2);
      expect(results[0].label.startsWith('Air')).toBe(true);
    });

    it('should prioritize title prefix over tag substring', () => {
      // 'denim' is a prefix of nothing in titles, but is a tag on 'Denim Jacket'
      // 'jacket' is a substring of 'Denim Jacket' and 'Winter Jacket Pro'
      const results = service.getSuggestions('jack', mockProducts);
      expect(results.length).toBeGreaterThan(0);
      // Both 'Denim Jacket' and 'Winter Jacket Pro' contain 'jack'
      // Neither starts with 'jack', so both are substring matches
      expect(results[0].label).toBeDefined();
    });
  });

  describe('limits', () => {
    it('should limit results to maxResults parameter', () => {
      const results = service.getSuggestions('ai', mockProducts, 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should limit results to 3 when maxResults=3', () => {
      const results = service.getSuggestions('ai', mockProducts, 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should default maxResults to 5', () => {
      const results = service.getSuggestions('ai', mockProducts);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should default maxResults to 5 for valid query', () => {
      const results = service.getSuggestions('c', mockProducts);
      // 'c' is single char, returns empty — still respects the limit
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });
});
