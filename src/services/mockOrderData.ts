import type { Order, OrderStatus } from './types';

function buildMockOrders(): Order[] {
  return [
    {
      orderId: 'ord-001',
      orderNumber: 1001,
      email: 'john@example.com',
      createdAt: '2026-05-10T10:30:00Z',
      status: 'delivered' as OrderStatus,
      items: [
        { productId: 'prod-1', title: 'Classic Hoodie', variantTitle: 'L / Black', quantity: 1, price: 59.99 },
        { productId: 'prod-2', title: 'Cotton T-Shirt', variantTitle: 'M / White', quantity: 2, price: 29.99 },
      ],
      fulfillmentStatus: 'fulfilled',
      financialStatus: 'paid',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
      estimatedDelivery: '2026-05-14',
      timeline: [
        { date: '2026-05-10', description: 'Order placed', location: 'Online' },
        { date: '2026-05-11', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-11', description: 'Order confirmed', location: 'Warehouse' },
        { date: '2026-05-12', description: 'Shipped', location: 'Los Angeles, CA' },
        { date: '2026-05-13', description: 'In transit', location: 'Memphis, TN' },
        { date: '2026-05-14', description: 'Out for delivery', location: 'Austin, TX' },
        { date: '2026-05-14', description: 'Delivered', location: 'Austin, TX' },
      ],
    },
    {
      orderId: 'ord-002',
      orderNumber: 1002,
      email: 'jane@example.com',
      createdAt: '2026-05-13T14:00:00Z',
      status: 'shipped' as OrderStatus,
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
        { date: '2026-05-13', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-14', description: 'Shipped', location: 'Portland, OR' },
      ],
    },
    {
      orderId: 'ord-003',
      orderNumber: 1003,
      email: 'john@example.com',
      createdAt: '2026-05-15T09:00:00Z',
      status: 'processing' as OrderStatus,
      items: [
        { productId: 'prod-4', title: 'Denim Jacket', variantTitle: 'L / Indigo', quantity: 1, price: 120.00 },
        { productId: 'prod-5', title: 'Wool Beanie', variantTitle: 'One Size / Charcoal', quantity: 1, price: 24.99 },
      ],
      fulfillmentStatus: 'unfulfilled',
      financialStatus: 'paid',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: '',
      timeline: [
        { date: '2026-05-15', description: 'Order placed', location: 'Online' },
        { date: '2026-05-15', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-15', description: 'Processing', location: 'Warehouse' },
      ],
    },
    {
      orderId: 'ord-004',
      orderNumber: 1004,
      email: 'bob@example.com',
      createdAt: '2026-05-08T11:00:00Z',
      status: 'in_transit' as OrderStatus,
      items: [
        { productId: 'prod-6', title: 'Leather Wallet', variantTitle: 'Brown', quantity: 1, price: 45.00 },
      ],
      fulfillmentStatus: 'fulfilled',
      financialStatus: 'paid',
      trackingNumber: '1ZX1234567890123456',
      carrier: 'UPS',
      estimatedDelivery: '2026-05-17',
      timeline: [
        { date: '2026-05-08', description: 'Order placed', location: 'Online' },
        { date: '2026-05-09', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-09', description: 'Shipped', location: 'Chicago, IL' },
        { date: '2026-05-11', description: 'Arrived at sort facility', location: 'Dallas, TX' },
        { date: '2026-05-13', description: 'In transit', location: 'Dallas, TX' },
      ],
    },
    {
      orderId: 'ord-005',
      orderNumber: 1005,
      email: 'alice@example.com',
      createdAt: '2026-05-01T08:00:00Z',
      status: 'cancelled' as OrderStatus,
      items: [
        { productId: 'prod-7', title: 'Yoga Mat', variantTitle: 'Standard / Purple', quantity: 1, price: 39.99 },
      ],
      fulfillmentStatus: 'unfulfilled',
      financialStatus: 'refunded',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: '',
      timeline: [
        { date: '2026-05-01', description: 'Order placed', location: 'Online' },
        { date: '2026-05-01', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-02', description: 'Cancelled', location: 'Online' },
        { date: '2026-05-02', description: 'Refund issued', location: 'Online' },
      ],
    },
    {
      orderId: 'ord-006',
      orderNumber: 1006,
      email: 'carol@example.com',
      createdAt: '2026-04-20T12:00:00Z',
      status: 'returned' as OrderStatus,
      items: [
        { productId: 'prod-3', title: 'Running Shoes', variantTitle: '9 / Red', quantity: 1, price: 89.99 },
        { productId: 'prod-8', title: 'Athletic Socks', variantTitle: 'L / 3-Pack', quantity: 1, price: 14.99 },
      ],
      fulfillmentStatus: 'returned',
      financialStatus: 'refunded',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: '',
      timeline: [
        { date: '2026-04-20', description: 'Order placed', location: 'Online' },
        { date: '2026-04-21', description: 'Shipped', location: 'Seattle, WA' },
        { date: '2026-04-24', description: 'Delivered', location: 'Denver, CO' },
        { date: '2026-04-28', description: 'Return requested', location: 'Online' },
        { date: '2026-04-29', description: 'Return received', location: 'Seattle, WA' },
        { date: '2026-05-01', description: 'Refund issued', location: 'Online' },
      ],
    },
    {
      orderId: 'ord-007',
      orderNumber: 1007,
      email: 'dave@example.com',
      createdAt: '2026-05-14T16:00:00Z',
      status: 'confirmed' as OrderStatus,
      items: [
        { productId: 'prod-9', title: 'Wireless Headphones', variantTitle: 'Black', quantity: 1, price: 149.99 },
      ],
      fulfillmentStatus: 'unfulfilled',
      financialStatus: 'pending',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: '',
      timeline: [
        { date: '2026-05-14', description: 'Order placed', location: 'Online' },
      ],
    },
    {
      orderId: 'ord-008',
      orderNumber: 1008,
      email: 'eve@example.com',
      createdAt: '2026-05-12T13:00:00Z',
      status: 'on_hold' as OrderStatus,
      items: [
        { productId: 'prod-10', title: 'Limited Edition Print', variantTitle: '24x36 / Framed', quantity: 1, price: 199.99 },
      ],
      fulfillmentStatus: 'on_hold',
      financialStatus: 'paid',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: '',
      timeline: [
        { date: '2026-05-12', description: 'Order placed', location: 'Online' },
        { date: '2026-05-12', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-13', description: 'On hold — address verification', location: 'Customer Service' },
      ],
    },
  ];
}

export class MockOrderDataSource implements OrderDataSource {
  private orders: Order[] | null = null;

  async getOrder(orderId: string): Promise<Order | null> {
    if (!this.orders) {
      this.orders = buildMockOrders();
    }
    return this.orders.find(o => o.orderId === orderId) ?? null;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    if (!this.orders) {
      this.orders = buildMockOrders();
    }
    return this.orders.filter(o => o.email.toLowerCase() === email.toLowerCase());
  }

  async getOrderByNumber(orderNumber: number): Promise<Order | null> {
    if (!this.orders) {
      this.orders = buildMockOrders();
    }
    return this.orders.find(o => o.orderNumber === orderNumber) ?? null;
  }
}

export { buildMockOrders };
