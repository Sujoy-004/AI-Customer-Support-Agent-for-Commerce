// src/services/responseGrounder.ts
/**
 * Response Grounding Mechanism
 * Validates answers against policy data to prevent hallucinations
 */

import { PolicyService, PolicyData } from './policyService';
import { PolicyType } from './types';

/**
 * Interface for grounding validation results
 */
export interface GroundingResult {
  isGrounded: boolean;
  confidence: number; // 0-1 score
  policySources: string[]; // Which policies were referenced
  violations: string[]; // Any policy contradictions found
  suggestions: string[]; // Suggested corrections if not grounded
}

/**
 * Service class for grounding responses in policy data
 */
export class ResponseGrounder {
  private policyService: PolicyService;

  constructor(policyService: PolicyService) {
    this.policyService = policyService;
  }

  /**
   * Validate a response against policy data
   */
  async groundResponse(
    userQuery: string,
    agentResponse: string
  ): Promise<GroundingResult> {
    // Load policies
    const policies = await this.policyService.getAllPolicies();
    
    // Initialize result
    const result: GroundingResult = {
      isGrounded: false,
      confidence: 0,
      policySources: [],
      violations: [],
      suggestions: []
    };

    // Check if query is policy-related
    const policyRelevance = this._assessPolicyRelevance(userQuery);
    if (!policyRelevance.isRelevant) {
      // Not a policy question - no grounding needed
      result.isGrounded = true;
      result.confidence = 1.0;
      return result;
    }

    // Ground the response based on policy type
    switch (policyRelevance.policyType) {
      case PolicyType.SHIPPING:
        return this._groundShippingResponse(agentResponse, policies.shipping, result);
      case PolicyType.WARRANTY:
        return this._groundWarrantyResponse(agentResponse, policies.warranty, result);
      case PolicyType.RETURNS:
        return this._groundReturnsResponse(agentResponse, policies.returns, result);
      default:
        // Unknown policy type - conservative approach
        result.isGrounded = false;
        result.confidence = 0;
        result.suggestions.push('Unable to determine policy type for grounding');
        return result;
    }
  }

  /**
   * Assess if a query is related to policies and which type
   */
  private _assessPolicyRelevance(query: string): { 
    isRelevant: boolean; 
    policyType?: PolicyType; 
  } {
    const lowerQuery = query.toLowerCase();
    
    // Shipping keywords
    const shippingKeywords = [
      'ship', 'delivery', 'shipping', 'deliver', 'freight', 'transit',
      'standard', 'express', 'international', 'tracking', 'arrive'
    ];
    
    // Warranty keywords
    const warrantyKeywords = [
      'warranty', 'guarantee', 'defect', 'broken', 'repair', 'replace',
      'guarantee', 'coverage', 'claim', 'rma', 'malfunction'
    ];
    
    // Returns keywords
    const returnsKeywords = [
      'return', 'refund', 'exchange', 'send back', 'give back',
      'money back', 'restock', 'return window', 'return policy'
    ];
    
    // Check for matches
    const shippingMatch = shippingKeywords.some(keyword => lowerQuery.includes(keyword));
    const warrantyMatch = warrantyKeywords.some(keyword => lowerQuery.includes(keyword));
    const returnsMatch = returnsKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Determine relevance and type
    if (shippingMatch && !warrantyMatch && !returnsMatch) {
      return { isRelevant: true, policyType: PolicyType.SHIPPING };
    }
    if (warrantyMatch && !shippingMatch && !returnsMatch) {
      return { isRelevant: true, policyType: PolicyType.WARRANTY };
    }
    if (returnsMatch && !shippingMatch && !warrantyMatch) {
      return { isRelevant: true, policyType: PolicyType.RETURNS };
    }
    
    // Multiple matches - check for strongest signal
    const matches = [shippingMatch, warrantyMatch, returnsMatch].filter(Boolean).length;
    if (matches > 1) {
      // Count keyword occurrences for tie-breaking
      const shippingCount = shippingKeywords.filter(k => lowerQuery.includes(k)).length;
      const warrantyCount = warrantyKeywords.filter(k => lowerQuery.includes(k)).length;
      const returnsCount = returnsKeywords.filter(k => lowerQuery.includes(k)).length;
      
      if (shippingCount >= warrantyCount && shippingCount >= returnsCount) {
        return { isRelevant: true, policyType: PolicyType.SHIPPING };
      }
      if (warrantyCount >= shippingCount && warrantyCount >= returnsCount) {
        return { isRelevant: true, policyType: PolicyType.WARRANTY };
      }
      return { isRelevant: true, policyType: PolicyType.RETURNS };
    }
    
    // No clear policy relevance
    return { isRelevant: false };
  }

  /**
   * Ground shipping-related responses
   */
  private _groundShippingResponse(
    response: string,
    shippingPolicy: any,
    result: GroundingResult
  ): GroundingResult {
    const lowerResponse = response.toLowerCase();
    let confidence = 0;
    const sources: string[] = [];
    const violations: string[] = [];
    
    // Check for standard shipping mention
    if (lowerResponse.includes('standard') || lowerResponse.includes('5-7 business days') || 
        lowerResponse.includes('$5.99')) {
      if (response.includes(shippingPolicy.standard)) {
        confidence += 0.25;
        sources.push('shipping.standard');
      } else {
        // Check if it's close but not exact
        if (lowerResponse.includes('standard') && 
            (lowerResponse.includes('5-7') || lowerResponse.includes('business day'))) {
          confidence += 0.15; // Partial credit
          sources.push('shipping.standard (approximate)');
        } else {
          violations.append('Standard shipping details do not match policy');
        }
      }
    }
    
    // Check for express shipping mention
    if (lowerResponse.includes('express') || lowerResponse.includes('2-3 business days') || 
        lowerResponse.includes('$12.99')) {
      if (response.includes(shippingPolicy.express)) {
        confidence += 0.25;
        sources.push('shipping.express');
      } else {
        if (lowerResponse.includes('express') && 
            (lowerResponse.includes('2-3') || lowerResponse.includes('business day'))) {
          confidence += 0.15;
          sources.push('shipping.express (approximate)');
        } else {
          violations.append('Express shipping details do not match policy');
        }
      }
    }
    
    // Check for international shipping mention
    if (lowerResponse.includes('international') || lowerResponse.includes('7-14 business days')) {
      if (response.includes(shippingPolicy.international)) {
        confidence += 0.2;
        sources.push('shipping.international');
      } else {
        if (lowerResponse.includes('international') && 
            lowerResponse.includes('7-14')) {
          confidence += 0.1;
          sources.push('shipping.international (approximate)');
        } else {
          violations.append('International shipping details do not match policy');
        }
      }
    }
    
    // Check for free shipping threshold
    if (lowerResponse.includes('free shipping') || lowerResponse.includes('free ship')) {
      const thresholdMatch = response.includes(`$${shippingPolicy.freeShippingThreshold}`) || 
                           response.includes(`${shippingPolicy.freeShippingThreshold} dollars`);
      if (thresholdMatch) {
        confidence += 0.15;
        sources.push('shipping.freeShippingThreshold');
      } else if (lowerResponse.includes('free') && 
                (lowerResponse.includes('order') || lowerResponse.includes('purchase'))) {
        confidence += 0.05; // Vague free shipping mention
        sources.push('shipping.freeShippingThreshold (vague)');
      } else {
        violations.append('Free shipping threshold does not match policy');
      }
    }
    
    // Check for processing time
    if (lowerResponse.includes('processing') || lowerResponse.includes('processed')) {
      if (response.includes(shippingPolicy.processingTime)) {
        confidence += 0.15;
        sources.push('shipping.processingTime');
      } else if (lowerResponse.includes('1-2') && lowerResponse.includes('business day')) {
        confidence += 0.1;
        sources.push('shipping.processingTime (approximate)');
      } else {
        violations.append('Processing time does not match policy');
      }
    }
    
    // Determine if grounded (threshold for confidence)
    result.isGrounded = confidence >= 0.5;
    result.confidence = Math.min(confidence, 1.0);
    result.policySources = sources;
    
    // Generate suggestions if not well grounded
    if (!result.isGrounded) {
      if (sources.length === 0) {
        result.suggestions.append('Reference specific policy details from shipping policy');
      } else {
        result.suggestions.append('Increase specificity of policy references');
      }
    }
    
    return result;
  }

  /**
   * Ground warranty-related responses
   */
  private _groundWarrantyResponse(
    response: string,
    warrantyPolicy: any,
    result: GroundingResult
  ): GroundingResult {
    const lowerResponse = response.toLowerCase();
    let confidence = 0;
    const sources: string[] = [];
    const violations: string[] = [];
    
    // Check for standard warranty period
    if (lowerResponse.includes('1 year') || lowerResponse.includes('one year') || 
        lowerResponse.includes('year warranty')) {
      if (response.includes(warrantyPolicy.standardPeriod)) {
        confidence += 0.3;
        sources.push('warranty.standardPeriod');
      } else {
        if (lowerResponse.includes('1 year') || lowerResponse.includes('one year')) {
          confidence += 0.15;
          sources.push('warranty.standardPeriod (approximate)');
        } else {
          violations.append('Warranty period does not match policy');
        }
      }
    }
    
    // Check for extended warranty options
    if (lowerResponse.includes('extended') || lowerResponse.includes('extension')) {
      const hasExtended = warrantyPolicy.extendedOptions.some(option => 
        lowerResponse.includes(option.toLowerCase()) || 
        option.toLowerCase().includes(lowerResponse)
      );
      
      if (hasExtended) {
        confidence += 0.2;
        sources.push('warranty.extendedOptions');
      } else if (lowerResponse.includes('extended') && 
                (lowerResponse.includes('2-year') || lowerResponse.includes('3-year'))) {
        confidence += 0.1;
        sources.push('warranty.extendedOptions (approximate)');
      } else {
        violations.append('Extended warranty options do not match policy');
      }
    }
    
    // Check for coverage details
    if (lowerResponse.includes('coverage') || lowerResponse.includes('covers') || 
        lowerResponse.includes('defect')) {
      if (response.includes(warrantyPolicy.coverageDetails)) {
        confidence += 0.25;
        sources.push('warranty.coverageDetails');
      } else if (lowerResponse.includes('manufacturing defect') || 
                lowerResponse.includes('hardware failure')) {
        confidence += 0.15;
        sources.push('warranty.coverageDetails (approximate)');
      } else {
        violations.append('Coverage details do not match policy');
      }
    }
    
    // Check for claim process
    if (lowerResponse.includes('claim') || lowerResponse.includes('process') || 
        lowerResponse.includes('rma') || lowerResponse.includes('contact')) {
      if (response.includes(warrantyPolicy.claimProcess)) {
        confidence += 0.25;
        sources.push('warranty.claimProcess');
      } else if (lowerResponse.includes('contact support') && 
                (lowerResponse.includes('order number') || lowerResponse.includes('issue'))) {
        confidence += 0.15;
        sources.push('warranty.claimProcess (approximate)');
      } else {
        violations.append('Claim process does not match policy');
      }
    }
    
    // Determine if grounded
    result.isGrounded = confidence >= 0.5;
    result.confidence = Math.min(confidence, 1.0);
    result.policySources = sources;
    
    // Generate suggestions if not well grounded
    if (!result.isGrounded) {
      if (sources.length === 0) {
        result.suggestions.append('Reference specific policy details from warranty policy');
      } else {
        result.suggestions.append('Increase specificity of policy references');
      }
    }
    
    return result;
  }

  /**
   * Ground returns-related responses
   */
  private _groundReturnsResponse(
    response: string,
    returnsPolicy: any,
    result: GroundingResult
  ): GroundingResult {
    const lowerResponse = response.toLowerCase();
    let confidence = 0;
    const sources: string[] = [];
    const violations: string[] = [];
    
    // Check for return window
    if (lowerResponse.includes('30 day') || lowerResponse.includes('thirty day') || 
        lowerResponse.includes('month return')) {
      if (response.includes(returnsPolicy.returnWindow)) {
        confidence += 0.3;
        sources.push('returns.returnWindow');
      } else {
        if (lowerResponse.includes('30') && lowerResponse.includes('day')) {
          confidence += 0.15;
          sources.push('returns.returnWindow (approximate)');
        } else {
          violations.append('Return window does not match policy');
        }
      }
    }
    
    // Check for condition requirements
    if (lowerResponse.includes('condition') || lowerResponse.includes('original') || 
        lowerResponse.includes('accessory')) {
      if (response.includes(returnsPolicy.conditionRequirements)) {
        confidence += 0.25;
        sources.push('returns.conditionRequirements');
      } else if (lowerResponse.includes('original condition') && 
                lowerResponse.includes('accessory')) {
        confidence += 0.15;
        sources.push('returns.conditionRequirements (approximate)');
      } else {
        violations.append('Condition requirements do not match policy');
      }
    }
    
    // Check for refund method
    if (lowerResponse.includes('refund') || lowerResponse.includes('payment method') || 
        lowerResponse.includes('original payment')) {
      if (response.includes(returnsPolicy.refundMethod)) {
        confidence += 0.2;
        sources.push('returns.refundMethod');
      } else if (lowerResponse.includes('original payment method') && 
                lowerResponse.includes('5-7')) {
        confidence += 0.1;
        sources.push('returns.refundMethod (approximate)');
      } else {
        violations.append('Refund method does not match policy');
      }
    }
    
    // Check for exchange policy
    if (lowerResponse.includes('exchange') || lowerResponse.includes('exchange policy')) {
      if (response.includes(returnsPolicy.exchangePolicy)) {
        confidence += 0.15;
        sources.push('returns.exchangePolicy');
      } else if (lowerResponse.includes('free exchange') && 
                lowerResponse.includes('30 day')) {
        confidence += 0.1;
        sources.push('returns.exchangePolicy (approximate)');
      } else {
        violations.append('Exchange policy does not match policy');
      }
    }
    
    // Check for restocking fee
    if (lowerResponse.includes('restock') || lowerResponse.includes('fee') || 
        lowerResponse.includes('restocking')) {
      if (response.includes(returnsPolicy.restockingFee)) {
        confidence += 0.1;
        sources.push('returns.restockingFee');
      } else if (lowerResponse.includes('no restocking fee') || 
                lowerResponse.includes('no fee')) {
        confidence += 0.05;
        sources.push('returns.restockingFee (approximate)');
      } else {
        violations.append('Restocking fee does not match policy');
      }
    }
    
    // Determine if grounded
    result.isGrounded = confidence >= 0.5;
    result.confidence = Math.min(confidence, 1.0);
    result.policySources = sources;
    
    // Generate suggestions if not well grounded
    if (!result.isGrounded) {
      if (sources.length === 0) {
        result.suggestions.append('Reference specific policy details from returns policy');
      } else {
        result.suggestions.append('Increase specificity of policy references');
      }
    }
    
    return result;
  }
}

/**
 * Default export for convenience
 */
export default new ResponseGrounder(new PolicyService());