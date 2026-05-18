// src/services/policyService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import policyServiceInstance, { PolicyService, parseFrontmatter } from './policyService';
import { PolicyType } from './types';
import type { PolicyData } from './types';

describe('PolicyService', () => {
  let policyService: typeof policyServiceInstance;

  beforeEach(() => {
    policyService = policyServiceInstance;
  });

  describe('loadPolicies', () => {
    it('should load policies successfully', async () => {
      const policies = await policyService.loadPolicies();
      
      expect(policies).toBeDefined();
      expect(policies.shipping).toBeDefined();
      expect(policies.warranty).toBeDefined();
      expect(policies.returns).toBeDefined();
    });

    it('should return cached policies when within TTL', async () => {
      // Load policies first time
      const policies1 = await policyService.loadPolicies();
      
      // Load policies second time (should use cache)
      const policies2 = await policyService.loadPolicies();
      
      expect(policies1).toBe(policies2); // Same object reference
    });

    it('should refresh cache after TTL expires', async () => {
      // Load policies first time
      await policyService.loadPolicies();
      
      // Manually set cache timestamp to past
      (policyService as any).cacheTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      
      // Load policies again (should refresh cache)
      const policies = await policyService.loadPolicies();
      
      expect(policies).toBeDefined();
    });
  });

  describe('getPolicy', () => {
    it('should return shipping policy when requested', async () => {
      const shippingPolicy = await policyService.getPolicy('shipping');
      
      expect(shippingPolicy).toBeDefined();
      expect(shippingPolicy.standard).toBeDefined();
      expect(shippingPolicy.express).toBeDefined();
    });

    it('should return warranty policy when requested', async () => {
      const warrantyPolicy = await policyService.getPolicy('warranty');
      
      expect(warrantyPolicy).toBeDefined();
      expect(warrantyPolicy.standardPeriod).toBeDefined();
      expect(warrantyPolicy.extendedOptions).toBeDefined();
    });

    it('should return returns policy when requested', async () => {
      const returnsPolicy = await policyService.getPolicy('returns');
      
      expect(returnsPolicy).toBeDefined();
      expect(returnsPolicy.returnWindow).toBeDefined();
      expect(returnsPolicy.conditionRequirements).toBeDefined();
    });
  });

  describe('getAllPolicies', () => {
    it('should return all policy types', async () => {
      const allPolicies = await policyService.getAllPolicies();
      
      expect(allPolicies).toHaveProperty('shipping');
      expect(allPolicies).toHaveProperty('warranty');
      expect(allPolicies).toHaveProperty('returns');
    });
  });

  describe('clearCache', () => {
    it('should clear the policy cache', async () => {
      // Load policies to populate cache
      await policyService.loadPolicies();
      expect((policyService as any).policies).toBeDefined();
      
      // Clear cache
      policyService.clearCache();
      expect((policyService as any).policies).toBeNull();
      expect((policyService as any).cacheTimestamp).toBeNull();
    });
  });
});

describe('parseFrontmatter', () => {
  describe('valid frontmatter', () => {
    it('should parse key-value pairs from frontmatter', () => {
      const markdown = `---
key1: value1
key2: value2
---

# Content`;
      const result = parseFrontmatter(markdown);
      expect(result.data.key1).toBe('value1');
      expect(result.data.key2).toBe('value2');
      expect(result.content).toBe('# Content');
    });

    it('should parse numeric values', () => {
      const markdown = `---
count: 42
price: 19.99
---

# Content`;
      const result = parseFrontmatter(markdown);
      expect(result.data.count).toBe(42);
      expect(result.data.price).toBe(19.99);
    });

    it('should parse boolean values', () => {
      const markdown = `---
enabled: true
disabled: false
---

# Content`;
      const result = parseFrontmatter(markdown);
      expect(result.data.enabled).toBe(true);
      expect(result.data.disabled).toBe(false);
    });

    it('should parse array values', () => {
      const markdown = `---
items: ["a", "b", "c"]
---

# Content`;
      const result = parseFrontmatter(markdown);
      expect(Array.isArray(result.data.items)).toBe(true);
      expect(result.data.items).toEqual(['a', 'b', 'c']);
    });

    it('should parse nested section keys', () => {
      const markdown = `---
shipping:
  standard: "5-7 days"
  express: "2-3 days"
---

# Content`;
      const result = parseFrontmatter(markdown);
      expect(result.data.shipping).toBeDefined();
      expect(result.data.shipping.standard).toBe('5-7 days');
      expect(result.data.shipping.express).toBe('2-3 days');
    });
  });

  describe('no frontmatter', () => {
    it('should return empty data and full content when no frontmatter', () => {
      const markdown = '# Just content';
      const result = parseFrontmatter(markdown);
      expect(result.data).toEqual({});
      expect(result.content).toBe('# Just content');
    });

    it('should return empty data for content with no delimiters', () => {
      const markdown = 'plain text without frontmatter';
      const result = parseFrontmatter(markdown);
      expect(result.data).toEqual({});
      expect(result.content).toBe('plain text without frontmatter');
    });
  });

  describe('complex policy frontmatter', () => {
    it('should parse the example policies.md structure', () => {
      const markdown = `---
shipping:
  standard: "5-7 business days"
  express: "2-3 business days"
  free_threshold: 50
return_window_days: 30
warranty_months: 12
supported_countries: ["US", "CA", "UK", "DE", "FR", "AU", "JP"]
accepts_returned_items: true
---

# Store Policies`;
      const result = parseFrontmatter(markdown);
      expect(result.data.shipping.standard).toBe('5-7 business days');
      expect(result.data.shipping.express).toBe('2-3 business days');
      expect(result.data.shipping.free_threshold).toBe(50);
      expect(result.data.return_window_days).toBe(30);
      expect(result.data.warranty_months).toBe(12);
      expect(result.data.supported_countries).toEqual(['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP']);
      expect(result.data.accepts_returned_items).toBe(true);
      expect(result.content).toBe('# Store Policies');
    });
  });
});

describe('PolicyService with live fetch', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useMockData: true', () => {
    it('should return existing mock data when useMockData is true', async () => {
      const service = new PolicyService({ useMockData: true });
      const policies = await service.loadPolicies();
      expect(policies.shipping).toBeDefined();
      expect(policies.warranty).toBeDefined();
      expect(policies.returns).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('fetch error handling', () => {
    it('should throw fallback error when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const service = new PolicyService({ useMockData: false, policyUrl: './policies.md' });

      await expect(service.loadPolicies()).rejects.toThrow(
        'Please check our store policies for the most current information.'
      );
    });

    it('should throw fallback error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Not found', { status: 404 })
      );
      const service = new PolicyService({ useMockData: false, policyUrl: './policies.md' });

      await expect(service.loadPolicies()).rejects.toThrow(
        'Please check our store policies for the most current information.'
      );
    });
  });

  describe('successful fetch', () => {
    it('should parse and return policy data from fetched markdown', async () => {
      const markdown = `---
shipping:
  standard: "5-7 business days"
  express: "2-3 business days"
  free_threshold: 50
return_window_days: 30
warranty_months: 12
---

# Store Policies`;

      mockFetch.mockResolvedValueOnce(
        new Response(markdown, {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' },
        })
      );

      const service = new PolicyService({ useMockData: false, policyUrl: './policies.md' });
      const policies = await service.loadPolicies();

      expect(policies.shipping).toBeDefined();
      expect(policies.shipping.freeShippingThreshold).toBe(50);
      expect(policies.returns.returnWindow).toContain('30 days');
    });
  });
});
