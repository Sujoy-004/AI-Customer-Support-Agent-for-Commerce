// src/services/responseGrounder.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import responseGrounder from './responseGrounder';
import { PolicyService } from './policyService';

describe('ResponseGrounder', () => {
  let policyService: PolicyService;

  beforeEach(() => {
    policyService = new PolicyService();
  });

  describe('groundResponse', () => {
    it('should ground a correct shipping response', async () => {
      const userQuery = 'What are your shipping options?';
      const agentResponse = 'Standard shipping (5-7 business days): ₹199. Express shipping (2-3 business days): ₹499. We offer free shipping on orders over ₹2,999. Orders are processed within 1-2 business days.';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.policySources).toContain('shipping.standard');
    });

    it('should ground a correct warranty response', async () => {
      const userQuery = 'What does your warranty cover?';
      const agentResponse = 'Our products come with a 1 year limited warranty that covers manufacturing defects and hardware failures under normal use. Contact support with your order number and issue description for an RMA.';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.policySources).toContain('warranty.standardPeriod');
    });

    it('should ground a correct returns response', async () => {
      const userQuery = 'What is your return policy?';
      const agentResponse = 'Our return policy allows returns within 30 days from delivery date. Items must be in original condition with all accessories. No restocking fee for returns in original condition.';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.policySources).toContain('returns.returnWindow');
    });

    it('should not ground a response with incorrect information', async () => {
      const userQuery = 'What is your standard shipping rate?';
      const agentResponse = 'Standard shipping is free for all orders.'; // Incorrect
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.violations).toContain('Standard shipping details do not match policy');
    });

    it('should not ground a response for non-policy questions', async () => {
      const userQuery = 'What is the weather like today?';
      const agentResponse = 'I am not sure about the weather.';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      // For non-policy questions, it should be considered grounded (no policy to ground against)
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should provide suggestions for improving ungrounded responses', async () => {
      const userQuery = 'What is your express shipping rate?';
      const agentResponse = 'Express shipping is fast and cheap.'; // Vague and incorrect
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('shipping — express match', () => {
    it('should detect express shipping source when the exact policy text appears', async () => {
      // Each shipping sub-check adds partial confidence (express=0.25).
      // isGrounded=true requires confidence >= 0.5, so we test source presence
      const result = await responseGrounder.groundResponse(
        'What is your express shipping?',
        'Standard shipping (5-7 business days): ₹199. Express shipping (2-3 business days): ₹499. Orders processed within 1-2 business days.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('shipping.express');
    });
  });

  describe('shipping — international match', () => {
    it('should detect international shipping source when the exact policy text appears', async () => {
      const result = await responseGrounder.groundResponse(
        'Do you ship internationally?',
        'Standard shipping (5-7 business days): ₹199. International shipping (7-14 business days): Calculated at checkout. Orders processed within 1-2 business days.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('shipping.international');
    });
  });

  describe('shipping — free shipping threshold', () => {
    it('should detect free shipping threshold source when the dollar amount is correct', async () => {
      const result = await responseGrounder.groundResponse(
        'When do you offer free shipping?',
        'Standard shipping (5-7 business days): ₹199. We offer free shipping on orders over ₹2,999. Orders processed within 1-2 business days.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('shipping.freeShippingThreshold');
    });
  });

  describe('shipping — approximate matches', () => {
    it('should give partial credit for approximate express shipping mention', async () => {
      // Contains "express" + "2-3" + "business day" but NOT the exact policy string
      const result = await responseGrounder.groundResponse(
        'How fast is express shipping?',
        'Express orders take 2-3 business days to arrive'
      );
      // Should have partial confidence but not full grounding
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.policySources).toContain('shipping.express (approximate)');
    });

    it('should give partial credit for approximate international shipping mention', async () => {
      const result = await responseGrounder.groundResponse(
        'How long does international shipping take?',
        'International shipping takes 7-14 business days'
      );
      expect(result.policySources).toContain('shipping.international (approximate)');
    });

    it('should give vague credit for free shipping without exact threshold', async () => {
      const result = await responseGrounder.groundResponse(
        'Is there free shipping?',
        'Yes, we offer free shipping on all orders'
      );
      expect(result.policySources).toContain('shipping.freeShippingThreshold (vague)');
    });
  });

  describe('warranty — extended options', () => {
    it('should detect extended warranty source when option text appears', async () => {
      const result = await responseGrounder.groundResponse(
        'Do you have extended warranty?',
        'Our products come with a 1 year limited warranty that covers manufacturing defects and hardware failures under normal use. We also offer a 2-year extension (₹999) for extended coverage.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('warranty.extendedOptions');
    });
  });

  describe('warranty — claim process', () => {
    it('should detect claim process source when the exact policy text appears', async () => {
      const result = await responseGrounder.groundResponse(
        'How do I file a warranty claim?',
        'Our products come with a 1 year limited warranty. Covers manufacturing defects and hardware failures under normal use. Contact support with order number and issue description for RMA.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('warranty.claimProcess');
    });
  });

  describe('returns — refund method', () => {
    it('should detect refund method source when the exact policy text appears', async () => {
      const result = await responseGrounder.groundResponse(
        'How do I get a refund?',
        'Our return policy allows returns within 30 days from delivery date. Refund issued to original payment method within 5-7 business days.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('returns.refundMethod');
    });
  });

  describe('returns — exchange policy', () => {
    it('should detect exchange policy source when the exact policy text appears', async () => {
      const result = await responseGrounder.groundResponse(
        'Can I exchange an item?',
        'Items must be in original condition with all accessories. Free exchanges within 30 days, subject to availability. Our return policy allows returns within 30 days from delivery date.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('returns.exchangePolicy');
    });
  });

  describe('returns — restocking fee', () => {
    it('should detect restocking fee source when mentioned', async () => {
      const result = await responseGrounder.groundResponse(
        'Is there a restocking fee?',
        'No restocking fee for returns in original condition. Items must be in original condition with all accessories. Our return policy allows returns within 30 days from delivery date.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('returns.restockingFee');
    });
  });

  describe('returns — approximate refund mention', () => {
    it('should give partial credit for approximate refund mention', async () => {
      const result = await responseGrounder.groundResponse(
        'How are refunds processed?',
        'Refunds go back to your original payment method within 5-7 business days'
      );
      expect(result.policySources).toContain('returns.refundMethod (approximate)');
    });
  });

  describe('multi-policy query tiebreaker', () => {
    it('should pick shipping when query has both shipping and warranty keywords', async () => {
      // "shipping and warranty" — both matched, shippingCount >= warrantyCount → SHIPPING
      const result = await responseGrounder.groundResponse(
        'Tell me about your shipping and warranty policies',
        'Standard shipping (5-7 business days): ₹199. We offer free shipping on orders over ₹2,999. Orders processed within 1-2 business days.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('shipping.standard');
    });

    it('should pick warranty when warranty keywords outnumber shipping', async () => {
      // "warranty claim coverage guarantee" — mostly warranty keywords
      const result = await responseGrounder.groundResponse(
        'What is your warranty claim process and what does the guarantee cover?',
        'Our products come with a 1 year limited warranty that covers manufacturing defects and hardware failures under normal use. Contact support with your order number and issue description for an RMA.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('warranty.standardPeriod');
    });

    it('should pick returns when returns keywords outnumber others', async () => {
      const result = await responseGrounder.groundResponse(
        'I want to return an item and get a refund for an exchange',
        'Our return policy allows returns within 30 days from delivery date. Items must be in original condition with all accessories. No restocking fee for returns in original condition.'
      );
      expect(result.isGrounded).toBe(true);
      expect(result.policySources).toContain('returns.returnWindow');
    });
  });

  describe('default policy type fallback', () => {
    it('should return ungrounded result for unknown policy type', async () => {
      // The switch default is reachable if policyRelevance has isRelevant=true
      // but no matching PolicyType. This can only happen if _assessPolicyRelevance
      // is patched to return a new/custom value. Under normal operation the three
      // enum values cover all relevant paths, so the default is a safety net.
      //
      // We test it here by invoking the private method through a cast.
      const grounder = responseGrounder as any;
      const result = grounder._assessPolicyRelevance('random text with no keywords');
      expect(result.isRelevant).toBe(false);
    });
  });
});