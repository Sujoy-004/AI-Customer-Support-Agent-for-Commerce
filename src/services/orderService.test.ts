import { describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from './orderService';
import { MockOrderDataSource } from './mockOrderData';
import type { Order, OrderStatus, TrackingEvent, OrderLineItem, OrderDataSource } from './types';

function createService(): OrderService {
  const dataSource = new MockOrderDataSource();
  return new OrderService(dataSource);
}

let service: OrderService;

beforeEach(() => {
  service = createService();
});

describe('OrderService', () => {
  describe('getOrder', () => {
    it('returns order for valid orderId', async () => {
      const order = await service.getOrder('ord-001');
      expect(order).not.toBeNull();
      expect(order!.orderId).toBe('ord-001');
      expect(order!.orderNumber).toBe(1001);
    });

    it('returns null for non-existent orderId', async () => {
      const order = await service.getOrder('ord-999');
      expect(order).toBeNull();
    });

    it('throws error for empty orderId', async () => {
      await expect(service.getOrder('')).rejects.toThrow('Order ID is required');
    });

    it('throws error for whitespace-only orderId', async () => {
      await expect(service.getOrder('   ')).rejects.toThrow('Order ID is required');
    });
  });

  describe('getOrdersByEmail', () => {
    it('returns orders for valid email', async () => {
      const orders = await service.getOrdersByEmail('john@example.com');
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.every(o => o.email === 'john@example.com')).toBe(true);
    });

    it('returns empty array for unknown email', async () => {
      const orders = await service.getOrdersByEmail('unknown@example.com');
      expect(orders).toEqual([]);
    });

    it('throws error for empty email', async () => {
      await expect(service.getOrdersByEmail('')).rejects.toThrow('Email is required');
    });

    it('throws error for whitespace-only email', async () => {
      await expect(service.getOrdersByEmail('   ')).rejects.toThrow('Email is required');
    });
  });
});

describe('Order types', () => {
  it('OrderStatus covers all required statuses', () => {
    const statuses: OrderStatus[] = [
      'confirmed', 'processing', 'shipped', 'in_transit',
      'out_for_delivery', 'delivered', 'cancelled', 'returned', 'on_hold',
    ];
    expect(statuses.length).toBe(9);
  });

  it('TrackingEvent has required fields', () => {
    const event: TrackingEvent = { date: '2026-05-15', description: 'Shipped', location: 'Warehouse' };
    expect(event.date).toBeDefined();
    expect(event.description).toBeDefined();
    expect(event.location).toBeDefined();
  });

  it('OrderLineItem has required fields', () => {
    const item: OrderLineItem = { productId: 'p1', title: 'Test', variantTitle: 'M', quantity: 1, price: 10 };
    expect(item.productId).toBeDefined();
    expect(item.title).toBeDefined();
    expect(item.variantTitle).toBeDefined();
    expect(item.quantity).toBeGreaterThan(0);
    expect(item.price).toBeGreaterThan(0);
  });

  it('Order has all required fields', () => {
    const order: Order = {
      orderId: 'ord-001',
      orderNumber: 1001,
      email: 'test@example.com',
      createdAt: '2026-05-15',
      status: 'delivered',
      items: [],
      fulfillmentStatus: 'fulfilled',
      financialStatus: 'paid',
      trackingNumber: '123',
      carrier: 'UPS',
      estimatedDelivery: '2026-05-18',
      timeline: [],
    };
    expect(order.orderId).toBeDefined();
    expect(order.orderNumber).toBeGreaterThan(0);
    expect(order.email).toContain('@');
    expect(Array.isArray(order.items)).toBe(true);
    expect(Array.isArray(order.timeline)).toBe(true);
  });

  it('OrderDataSource interface is implementable', () => {
    const ds: OrderDataSource = new MockOrderDataSource();
    expect(ds).toBeDefined();
    expect(typeof ds.getOrder).toBe('function');
    expect(typeof ds.getOrdersByEmail).toBe('function');
  });
});

describe('MockOrderDataSource', () => {
  let dataSource: MockOrderDataSource;

  beforeEach(() => {
    dataSource = new MockOrderDataSource();
  });

  it('returns correct order for valid ID', async () => {
    const order = await dataSource.getOrder('ord-001');
    expect(order).not.toBeNull();
    expect(order!.orderId).toBe('ord-001');
  });

  it('returns null for non-existent ID', async () => {
    const order = await dataSource.getOrder('ord-999');
    expect(order).toBeNull();
  });

  it('returns correct orders for valid email', async () => {
    const orders = await dataSource.getOrdersByEmail('john@example.com');
    expect(orders.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array for unknown email', async () => {
    const orders = await dataSource.getOrdersByEmail('unknown@example.com');
    expect(orders).toEqual([]);
  });

  it('includes orders covering all required statuses', async () => {
    const orders = await dataSource.getOrdersByEmail('john@example.com');
    const statuses = new Set(orders.map(o => o.status));
    expect(statuses.has('delivered')).toBe(true);
    expect(statuses.has('processing')).toBe(true);
  });

  it('includes timeline events on shipped orders', async () => {
    const order = await dataSource.getOrder('ord-001');
    expect(order!.timeline.length).toBeGreaterThan(0);
    expect(order!.timeline[0].date).toBeDefined();
    expect(order!.timeline[0].description).toBeDefined();
    expect(order!.timeline[0].location).toBeDefined();
  });

  it('shipped orders have tracking number and carrier', async () => {
    const order = await dataSource.getOrder('ord-002');
    expect(order!.trackingNumber).not.toBe('');
    expect(order!.carrier).not.toBe('');
  });

  it('unshipped orders have empty tracking fields', async () => {
    const order = await dataSource.getOrder('ord-003');
    expect(order!.trackingNumber).toBe('');
    expect(order!.carrier).toBe('');
  });
});
