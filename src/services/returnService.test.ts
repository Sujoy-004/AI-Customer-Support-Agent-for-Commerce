import { describe, it, expect } from 'vitest';
import { ReturnService, MockReturnDataSource } from './returnService';
import { PolicyService } from './policyService';
import { OrderService } from './orderService';
import { MockOrderDataSource } from './mockOrderData';

function createServices() {
  const policyService = new PolicyService();
  const orderService = new OrderService(new MockOrderDataSource());
  const returnDataSource = new MockReturnDataSource();
  const returnService = new ReturnService(policyService, orderService, returnDataSource);
  return { returnService, returnDataSource };
}

describe('ReturnService', () => {
  describe('detectReturnIntent', () => {
    it('should detect return intent with "return" keyword', () => {
      const { returnService } = createServices();
      expect(returnService.detectReturnIntent('I want to return an item')).toBe(true);
    });

    it('should detect return intent with "refund" keyword', () => {
      const { returnService } = createServices();
      expect(returnService.detectReturnIntent('I need a refund')).toBe(true);
    });

    it('should detect return intent with "exchange" keyword', () => {
      const { returnService } = createServices();
      expect(returnService.detectReturnIntent('Can I exchange this?')).toBe(true);
    });

    it('should detect return intent with "defective" keyword', () => {
      const { returnService } = createServices();
      expect(returnService.detectReturnIntent('The item is defective')).toBe(true);
    });

    it('should not detect return intent for unrelated queries', () => {
      const { returnService } = createServices();
      expect(returnService.detectReturnIntent('is the hoodie in stock?')).toBe(false);
    });

    it('should not detect return intent for order tracking queries', () => {
      const { returnService } = createServices();
      expect(returnService.detectReturnIntent('track my order')).toBe(false);
    });
  });

  describe('checkEligibility', () => {
    it('should return eligible for a delivered order', async () => {
      const { returnService } = createServices();
      const result = await returnService.checkEligibility(1001, 'john@example.com');
      expect(result.type).toBe('return_eligible');
      if (result.type === 'return_eligible') {
        expect(result.orderNumber).toBe(1001);
        expect(result.items.length).toBeGreaterThan(0);
      }
    });

    it('should reject if order not found', async () => {
      const { returnService } = createServices();
      const result = await returnService.checkEligibility(9999, 'test@example.com');
      expect(result.type).toBe('return_not_eligible');
      if (result.type === 'return_not_eligible') {
        expect(result.reason).toBe('not_found');
      }
    });

    it('should reject if email does not match', async () => {
      const { returnService } = createServices();
      const result = await returnService.checkEligibility(1001, 'wrong@example.com');
      expect(result.type).toBe('return_not_eligible');
      if (result.type === 'return_not_eligible') {
        expect(result.reason).toBe('email_mismatch');
      }
    });

    it('should reject if order is not delivered', async () => {
      const { returnService } = createServices();
      const result = await returnService.checkEligibility(1003, 'john@example.com');
      expect(result.type).toBe('return_not_eligible');
      if (result.type === 'return_not_eligible') {
        expect(result.reason).toBe('not_delivered');
      }
    });

    it('should reject for cancelled orders', async () => {
      const { returnService } = createServices();
      const result = await returnService.checkEligibility(1005, 'alice@example.com');
      expect(result.type).toBe('return_not_eligible');
      if (result.type === 'return_not_eligible') {
        expect(result.reason).toBe('not_delivered');
      }
    });
  });

  describe('MockReturnDataSource', () => {
    it('should store and retrieve returns', async () => {
      const { returnService, returnDataSource } = createServices();
      const result = await returnService.checkEligibility(1001, 'john@example.com');
      expect(result.type).toBe('return_eligible');

      const submitResult = await returnService.submitReturn(
        1001,
        'john@example.com',
        [{ title: 'Classic Hoodie', variantTitle: 'L / Black', quantity: 1, reason: 'Wrong size' }],
      );

      expect(submitResult.type).toBe('return_submitted');
      if (submitResult.type === 'return_submitted') {
        expect(submitResult.returnRequest.status).toBe('pending');
        expect(submitResult.returnRequest.orderNumber).toBe(1001);
      }

      const stored = await returnDataSource.getReturnsByEmail('john@example.com');
      expect(stored.length).toBe(1);
      expect(stored[0].orderNumber).toBe(1001);
    });
  });
});
