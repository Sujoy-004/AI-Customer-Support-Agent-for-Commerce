import { describe, it, expect } from 'vitest';
import { formatOrderResponse } from './orderResponseFormatter';
import type { OrderQuery } from './orderIntentDetector';
import type { Order } from './types';

const sampleOrder: Order = {
  orderId: 'ord-002',
  orderNumber: 1002,
  email: 'jane@example.com',
  createdAt: '2026-05-13T14:00:00Z',
  status: 'shipped',
  items: [
    { productId: 'prod-3', title: 'Running Shoes', variantTitle: '10 / Blue', quantity: 1, price: 89.99 },
  ],
  fulfillmentStatus: 'fulfilled',
  financialStatus: 'paid',
  trackingNumber: '9400111899223456789012',
  carrier: 'USPS',
  estimatedDelivery: '2026-05-18',
  timeline: [
    { date: '2026-05-13', description: 'Order placed', location: 'Online' },
    { date: '2026-05-14', description: 'Shipped', location: 'Portland, OR' },
  ],
};

describe('formatOrderResponse', () => {
  it('returns HTML for order_found', () => {
    const result: OrderQuery = { type: 'order_found', order: sampleOrder, email: 'jane@example.com' };
    const output = formatOrderResponse(result);
    expect(output).toContain('order-card');
    expect(output).toContain('Order #1002');
    expect(output).toContain('Shipped');
  });

  it('returns error text for order_not_found', () => {
    const result: OrderQuery = { type: 'order_not_found', message: 'Order was not found' };
    const output = formatOrderResponse(result);
    expect(output).toBe('Order was not found');
  });

  it('returns prompt for needs_email', () => {
    const result: OrderQuery = { type: 'needs_email', orderNumber: 1001, message: 'What email did you use?' };
    const output = formatOrderResponse(result);
    expect(output).toBe('What email did you use?');
  });

  it('returns prompt for needs_order_number', () => {
    const result: OrderQuery = { type: 'needs_order_number', message: 'What is your order number?' };
    const output = formatOrderResponse(result);
    expect(output).toBe('What is your order number?');
  });

  it('returns prompt for email_mismatch', () => {
    const result: OrderQuery = { type: 'email_mismatch', orderNumber: 1001, message: 'Email does not match' };
    const output = formatOrderResponse(result);
    expect(output).toBe('Email does not match');
  });

  it('returns empty string for not_order', () => {
    const result: OrderQuery = { type: 'not_order', reason: 'Not an order query' };
    const output = formatOrderResponse(result);
    expect(output).toBe('');
  });

  it('returns context_expired message', () => {
    const result: OrderQuery = { type: 'context_expired', message: 'Session expired. Please start over.' };
    const output = formatOrderResponse(result);
    expect(output).toBe('Session expired. Please start over.');
  });
});
