// src/services/policyService.ts
/**
 * Policy Service for loading and parsing Shopify store policies
 * Handles shipping, warranty, and returns policies
 */

import { PolicyType } from './types';
import type { PolicyData } from './types';

/**
 * Service class for managing store policies
 */
export class PolicyService {
  private policies: PolicyData | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Load policies from Shopify store
   * In a real implementation, this would fetch from Shopify Admin API
   * For now, we'll simulate with mock data
   */
  async loadPolicies(): Promise<PolicyData> {
    // Check if we have cached policies that are still valid
    if (this.policies && this.cacheTimestamp) {
      const now = Date.now();
      if (now - this.cacheTimestamp < this.CACHE_TTL_MS) {
        return this.policies;
      }
    }

    // Simulate fetching from Shopify
    // In production, this would be:
    // const response = await fetch('/admin/api/2023-04/policies.json');
    // const data = await response.json();
    
    // Mock policy data based on typical Shopify store policies
    const mockPolicies: PolicyData = {
      shipping: {
        standard: 'Standard shipping (5-7 business days): $5.99',
        express: 'Express shipping (2-3 business days): $12.99',
        international: 'International shipping (7-14 business days): Calculated at checkout',
        freeShippingThreshold: 75,
        processingTime: 'Orders processed within 1-2 business days'
      },
      warranty: {
        standardPeriod: '1 year limited warranty',
        extendedOptions: ['2-year extension ($19.99)', '3-year extension ($29.99)'],
        coverageDetails: 'Covers manufacturing defects and hardware failures under normal use',
        claimProcess: 'Contact support with order number and issue description for RMA'
      },
      returns: {
        returnWindow: '30 days from delivery date',
        conditionRequirements: 'Items must be in original condition with all accessories',
        refundMethod: 'Refund issued to original payment method within 5-7 business days',
        exchangePolicy: 'Free exchanges within 30 days, subject to availability',
        restockingFee: 'No restocking fee for returns in original condition'
      }
    };

    this.policies = mockPolicies;
    this.cacheTimestamp = Date.now();
    
    return this.policies;
  }

  /**
   * Get specific policy by type
   */
  async getPolicy(type: PolicyType): Promise<any> {
    const policies = await this.loadPolicies();
    return policies[type];
  }

  /**
   * Get all policies
   */
  async getAllPolicies(): Promise<PolicyData> {
    return this.loadPolicies();
  }

  /**
   * Clear policy cache
   */
  clearCache(): void {
    this.policies = null;
    this.cacheTimestamp = null;
  }
}

/**
 * Default export for convenience
 */
export default new PolicyService();