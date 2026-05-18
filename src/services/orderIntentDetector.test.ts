import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderIntentDetector } from './orderIntentDetector';
import { OrderService } from './orderService';
import { MockOrderDataSource } from './mockOrderData';
import type { OrderQuery } from './orderIntentDetector';
import { SemanticRouter } from '../../shopify-widget/src/core/semanticRouter';

function createDetector(): OrderIntentDetector {
  const dataSource = new MockOrderDataSource();
  const service = new OrderService(dataSource);
  const semanticRouter = SemanticRouter.getInstance();
  vi.spyOn(semanticRouter, 'classify').mockResolvedValue({ intent: null, confidence: 0 });
  return new OrderIntentDetector(service, semanticRouter);
}

let detector: OrderIntentDetector;

beforeEach(() => {
  detector = createDetector();
});

describe('OrderIntentDetector', () => {
  describe('intent detection', () => {
    it.each([
      'order status',
      'track my order',
      'where is my order',
      'tracking number',
      'track package',
      'track shipment',
      'order update',
      'shipping status',
      'when will my order arrive',
      'my order',
      'my package',
    ])('detects order_status intent from "%s"', async (query) => {
      const result = await detector.resolveQuery(query);
      expect(result.type === 'needs_order_number' || result.type === 'needs_email' || result.type === 'order_not_found').toBe(true);
    });

    it('returns not_order for catalog-related queries', async () => {
      const result = await detector.resolveQuery('is the hoodie in stock');
      expect(result.type).toBe('not_order');
    });

    it('returns not_order for off-topic queries', async () => {
      const result = await detector.resolveQuery('what is the weather today');
      expect(result.type).toBe('not_order');
    });
  });

  describe('single-message full query', () => {
    it('returns order_found for valid order ID and email', async () => {
      const result = await detector.resolveQuery('track order #1001 for john@example.com');
      expect(result.type).toBe('order_found');
      if (result.type === 'order_found') {
        expect(result.order.orderNumber).toBe(1001);
        expect(result.email).toBe('john@example.com');
      }
    });
  });

  describe('multi-turn authentication', () => {
    it('returns needs_order_number when no order number given', async () => {
      const result = await detector.resolveQuery('track my order');
      expect(result.type).toBe('needs_order_number');
    });

    it('returns needs_email after order number is provided', async () => {
      const result1 = await detector.resolveQuery('order #1002');
      expect(result1.type).toBe('needs_email');
      if (result1.type === 'needs_email') {
        expect(result1.orderNumber).toBe(1002);
      }
    });

    it('completes authentication after email is provided', async () => {
      await detector.resolveQuery('order #1001');
      const result = await detector.resolveQuery('john@example.com');
      expect(result.type).toBe('order_found');
      if (result.type === 'order_found') {
        expect(result.order.orderNumber).toBe(1001);
      }
    });

    it('returns email_mismatch when email does not match', async () => {
      const result = await detector.resolveQuery('track order #1001 for wrong@example.com');
      expect(result.type).toBe('email_mismatch');
      if (result.type === 'email_mismatch') {
        expect(result.orderNumber).toBe(1001);
      }
    });
  });

  describe('order not found', () => {
    it('returns order_not_found for non-existent order', async () => {
      const result = await detector.resolveQuery('track order #9999 for john@example.com');
      expect(result.type).toBe('order_not_found');
    });
  });

  describe('context expiry', () => {
    it('clears context and returns context_expired after TTL', async () => {
      vi.useFakeTimers();
      detector = createDetector();
      await detector.resolveQuery('order #1001');

      vi.advanceTimersByTime(300001);

      const result = await detector.resolveQuery('john@example.com');
      expect(result.type).toBe('context_expired');
    });

    it('returns context_expired after exceeding turn limit', async () => {
      detector = createDetector();
      await detector.resolveQuery('order #1001');    // turn 1: needs_email
      await detector.resolveQuery('order #1002');    // turn 2: needs_email (still in auth)
      await detector.resolveQuery('order #1003');    // turn 3: needs_email
      const result = await detector.resolveQuery('anything else'); // turn 4: turnCount>=3 → expires
      expect(result.type).toBe('context_expired');
    });
  });

  describe('full 3-turn auth chain', () => {
    it('completes needs_number → needs_email → order_found on same instance', async () => {
      detector = createDetector();

      const turn1 = await detector.resolveQuery('where is my order');
      expect(turn1.type).toBe('needs_order_number');

      const turn2 = await detector.resolveQuery('order #1002');
      expect(turn2.type).toBe('needs_email');
      if (turn2.type === 'needs_email') {
        expect(turn2.orderNumber).toBe(1002);
      }

      const turn3 = await detector.resolveQuery('jane@example.com');
      expect(turn3.type).toBe('order_found');
      if (turn3.type === 'order_found') {
        expect(turn3.order.orderNumber).toBe(1002);
      }
    });
  });
});
