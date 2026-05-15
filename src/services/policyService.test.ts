// src/services/policyService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import policyServiceInstance from './policyService';
import { PolicyData, PolicyType } from './types';

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