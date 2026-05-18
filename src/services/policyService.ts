// src/services/policyService.ts
/**
 * Policy Service for loading and parsing Shopify store policies
 * Handles shipping, warranty, and returns policies
 */

import { PolicyType } from './types';
import type { PolicyData } from './types';

/**
 * Options for configuring PolicyService behavior
 */
export interface PolicyServiceOptions {
  policyUrl?: string;
  useMockData?: boolean;
}

/**
 * Parsed frontmatter result
 */
export interface FrontmatterResult {
  data: Record<string, any>;
  content: string;
}

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(markdown: string): FrontmatterResult {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, content: markdown.trim() };

  const yamlBlock = match[1];
  const content = match[2].trim();
  const data: Record<string, any> = {};

  // Multi-line YAML parser that handles nested keys
  const lines = yamlBlock.split('\n');
  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trimEnd();
    if (trimmedLine === '') continue;

    // Top-level key with no value (section header like "shipping:")
    const sectionMatch = trimmedLine.match(/^(\w[\w-]*):\s*$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      data[currentSection] = {};
      continue;
    }

    // Top-level key with value
    const topLevelMatch = trimmedLine.match(/^(\w[\w-]*):\s*(.+)$/);
    if (topLevelMatch) {
      const key = topLevelMatch[1];
      let value: any = topLevelMatch[2].trim();
      value = parseYamlValue(value);
      data[key] = value;
      currentSection = null;
      continue;
    }

    // Nested key under section
    const nestedMatch = trimmedLine.match(/^\s{2,}(\w[\w-]*):\s*(.*)$/);
    if (nestedMatch && currentSection) {
      const key = nestedMatch[1];
      const rawValue = nestedMatch[2].trim();
      if (rawValue === '' || rawValue === '""') {
        // Empty value — could be a sub-section or list
        if (!data[currentSection][key]) {
          data[currentSection][key] = {};
        }
      } else {
        data[currentSection][key] = parseYamlValue(rawValue);
      }
      continue;
    }

    // Array items under section or nested key
    const listMatch = trimmedLine.match(/^\s{4,}-\s+(.*)$/);
    if (listMatch && currentSection) {
      // Could be list items in a section — find the parent key
      const itemValue = listMatch[1].replace(/^(['"])(.*)\1$/, '$2');
      // Append to the last-nested array or create one
      const lastKey = Object.keys(data[currentSection]).pop();
      if (lastKey && Array.isArray(data[currentSection][lastKey])) {
        data[currentSection][lastKey].push(itemValue);
      }
      continue;
    }
  }

  return { data, content };
}

/**
 * Parse a YAML value string into its typed equivalent
 */
function parseYamlValue(value: string): any {
  // Parse arrays: [item1, item2]
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(s =>
      s.trim().replace(/^['"]|['"]$/g, '')
    );
  }
  // Parse quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  // Parse booleans
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Parse numbers
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}

/**
 * Map parsed frontmatter data to PolicyData structure
 */
function mapFrontmatterToPolicyData(data: Record<string, any>): PolicyData {
  const shipping = data.shipping || {};
  return {
    shipping: {
      standard: `Standard shipping (${shipping.standard || '5-7 business days'}): $5.99`,
      express: `Express shipping (${shipping.express || '2-3 business days'}): $12.99`,
      international: 'International shipping (7-14 business days): Calculated at checkout',
      freeShippingThreshold: shipping.free_threshold ?? 75,
      processingTime: 'Orders processed within 1-2 business days',
    },
    warranty: {
      standardPeriod: `${data.warranty_months || 12}-month warranty`,
      extendedOptions: [],
      coverageDetails: 'Covers manufacturing defects and hardware failures under normal use',
      claimProcess: 'Contact support with order number and issue description for RMA',
    },
    returns: {
      returnWindow: `${data.return_window_days || 30} days from delivery date`,
      conditionRequirements: 'Items must be in original condition with all accessories',
      refundMethod: 'Refund issued to original payment method within 5-7 business days',
      exchangePolicy: 'Free exchanges within 30 days, subject to availability',
      restockingFee: 'No restocking fee for returns in original condition',
    },
  };
}

/**
 * Service class for managing store policies
 */
export class PolicyService {
  private policies: PolicyData | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private policyUrl: string;
  private useMockData: boolean;

  constructor(options?: PolicyServiceOptions) {
    this.policyUrl = options?.policyUrl ?? './policies.md';
    this.useMockData = options?.useMockData ?? true;
  }

  /**
   * Load policies from live markdown file or mock data
   */
  async loadPolicies(): Promise<PolicyData> {
    // Check cache first
    if (this.policies && this.cacheTimestamp) {
      const now = Date.now();
      if (now - this.cacheTimestamp < this.CACHE_TTL_MS) {
        return this.policies;
      }
    }

    if (this.useMockData) {
      return this.loadMockPolicies();
    }

    try {
      const response = await fetch(this.policyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      const { data } = parseFrontmatter(markdown);
      this.policies = mapFrontmatterToPolicyData(data);
      this.cacheTimestamp = Date.now();
      return this.policies;
    } catch (err) {
      this.policies = null;
      this.cacheTimestamp = null;
      throw new Error('Please check our store policies for the most current information.');
    }
  }

  /**
   * Load mock policy data (existing behavior)
   */
  private loadMockPolicies(): PolicyData {
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
 * Default export for convenience (uses mock data)
 */
export default new PolicyService();