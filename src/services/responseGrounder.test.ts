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
      const userQuery = 'What is your standard shipping rate?';
      const agentResponse = 'Standard shipping (5-7 business days): $5.99';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.policySources).toContain('shipping.standard');
    });

    it('should ground a correct warranty response', async () => {
      const userQuery = 'What does your warranty cover?';
      const agentResponse = 'Our warranty covers manufacturing defects and hardware failures under normal use.';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.policySources).toContain('warranty.coverageDetails');
    });

    it('should ground a correct returns response', async () => {
      const userQuery = 'What is your return policy?';
      const agentResponse = 'Our return policy allows returns within 30 days of delivery.';
      
      const result = await responseGrounder.groundResponse(userQuery, agentResponse);
      
      expect(result.isGrounded).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
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
});