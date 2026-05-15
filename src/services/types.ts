// src/services/types.ts
/**
 * Type definitions for policy service
 */

/**
 * Interface for policy data structure
 */
export interface PolicyData {
  shipping: {
    standard: string;
    express: string;
    international: string;
    freeShippingThreshold: number;
    processingTime: string;
  };
  warranty: {
    standardPeriod: string;
    extendedOptions: string[];
    coverageDetails: string;
    claimProcess: string;
  };
  returns: {
    returnWindow: string;
    conditionRequirements: string;
    refundMethod: string;
    exchangePolicy: string;
    restockingFee: string;
  };
}

/**
 * Enum for policy types
 */
export const PolicyType = {
  SHIPPING: 'shipping',
  WARRANTY: 'warranty',
  RETURNS: 'returns'
} as const;

export type PolicyType = typeof PolicyType[keyof typeof PolicyType];