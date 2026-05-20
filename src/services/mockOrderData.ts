// MOCK DATA — for testing only. Use ShopifyOrderProxyDataSource in production.
import type { Order, OrderStatus, OrderDataSource } from './types';

function buildMockOrders(): Order[] {
  return [
    {
      orderId: 'ord-001',
      orderNumber: 1001,
      email: 'sujoy@example.com',
      createdAt: '2026-05-10T10:30:00Z',
      status: 'delivered' as OrderStatus,
      items: [
        { productId: 'prod-1', title: 'Classic Hoodie', variantTitle: 'L / Black / Cotton', quantity: 1, price: 3999 },
        { productId: 'prod-6', title: 'Denim Jacket', variantTitle: 'M / Blue', quantity: 2, price: 5999 },
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
        { date: '2026-05-12', description: 'Shipped', location: 'Mumbai, MH' },
        { date: '2026-05-13', description: 'In transit', location: 'Delhi, DL' },
        { date: '2026-05-14', description: 'Out for delivery', location: 'Kolkata, WB' },
        { date: '2026-05-14', description: 'Delivered', location: 'Kolkata, WB' },
      ],
    },
    {
      orderId: 'ord-002',
      orderNumber: 1002,
      email: 'sparsh@example.com',
      createdAt: '2026-05-13T14:00:00Z',
      status: 'shipped' as OrderStatus,
      items: [
        { productId: 'prod-2', title: 'Running Shoes', variantTitle: '10 / Black', quantity: 1, price: 7999 },
      ],
      fulfillmentStatus: 'fulfilled',
      financialStatus: 'paid',
      trackingNumber: '9400111899223456789012',
      carrier: 'Delhivery',
      estimatedDelivery: '2026-05-18',
      timeline: [
        { date: '2026-05-13', description: 'Order placed', location: 'Online' },
        { date: '2026-05-13', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-14', description: 'Shipped', location: 'Bangalore, KA' },
      ],
    },
    {
      orderId: 'ord-003',
      orderNumber: 1003,
      email: 'sujoy@example.com',
      createdAt: '2026-05-15T09:00:00Z',
      status: 'processing' as OrderStatus,
      items: [
        { productId: 'prod-6', title: 'Denim Jacket', variantTitle: 'L / Black', quantity: 1, price: 5999 },
        { productId: 'prod-5', title: 'Wool Scarf', variantTitle: 'Gray / Wool', quantity: 1, price: 3499 },
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
      email: 'sparsh@example.com',
      createdAt: '2026-05-08T11:00:00Z',
      status: 'in_transit' as OrderStatus,
      items: [
        { productId: 'prod-3', title: 'Leather Belt', variantTitle: 'Brown / Genuine Leather', quantity: 1, price: 2499 },
      ],
      fulfillmentStatus: 'fulfilled',
      financialStatus: 'paid',
      trackingNumber: '1ZX1234567890123456',
      carrier: 'Blue Dart',
      estimatedDelivery: '2026-05-17',
      timeline: [
        { date: '2026-05-08', description: 'Order placed', location: 'Online' },
        { date: '2026-05-09', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-09', description: 'Shipped', location: 'Chennai, TN' },
        { date: '2026-05-11', description: 'Arrived at sort facility', location: 'Hyderabad, TG' },
        { date: '2026-05-13', description: 'In transit', location: 'Hyderabad, TG' },
      ],
    },
    {
      orderId: 'ord-005',
      orderNumber: 1005,
      email: 'sujoy@example.com',
      createdAt: '2026-05-01T08:00:00Z',
      status: 'cancelled' as OrderStatus,
      items: [
        { productId: 'prod-4', title: 'Canvas Tote', variantTitle: 'Olive', quantity: 1, price: 1999 },
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
      email: 'sparsh@example.com',
      createdAt: '2026-04-20T12:00:00Z',
      status: 'returned' as OrderStatus,
      items: [
        { productId: 'prod-2', title: 'Running Shoes', variantTitle: '9 / White', quantity: 1, price: 7999 },
        { productId: 'prod-7', title: 'Aviator Sunglasses', variantTitle: 'Silver', quantity: 1, price: 2499 },
      ],
      fulfillmentStatus: 'returned',
      financialStatus: 'refunded',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: '',
      timeline: [
        { date: '2026-04-20', description: 'Order placed', location: 'Online' },
        { date: '2026-04-21', description: 'Shipped', location: 'Pune, MH' },
        { date: '2026-04-24', description: 'Delivered', location: 'Jaipur, RJ' },
        { date: '2026-04-28', description: 'Return requested', location: 'Online' },
        { date: '2026-04-29', description: 'Return received', location: 'Pune, MH' },
        { date: '2026-05-01', description: 'Refund issued', location: 'Online' },
      ],
    },
    {
      orderId: 'ord-007',
      orderNumber: 1007,
      email: 'sujoy@example.com',
      createdAt: '2026-05-14T16:00:00Z',
      status: 'confirmed' as OrderStatus,
      items: [
        { productId: 'prod-7', title: 'Aviator Sunglasses', variantTitle: 'Gold', quantity: 1, price: 2499 },
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
      email: 'sparsh@example.com',
      createdAt: '2026-05-12T13:00:00Z',
      status: 'on_hold' as OrderStatus,
      items: [
        { productId: 'prod-1', title: 'Classic Hoodie', variantTitle: 'XL / Navy / Polyester', quantity: 1, price: 4699 },
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
    {
      orderId: 'ord-009',
      orderNumber: 1009,
      email: 'sujoy@example.com',
      createdAt: '2026-05-16T07:30:00Z',
      status: 'out_for_delivery' as OrderStatus,
      items: [
        { productId: 'prod-2', title: 'Running Shoes', variantTitle: '11 / Black', quantity: 1, price: 7999 },
      ],
      fulfillmentStatus: 'out_for_delivery',
      financialStatus: 'paid',
      trackingNumber: '1Z999AA10987654321',
      carrier: 'UPS',
      estimatedDelivery: '2026-05-19',
      timeline: [
        { date: '2026-05-16', description: 'Order placed', location: 'Online' },
        { date: '2026-05-16', description: 'Payment confirmed', location: 'Online' },
        { date: '2026-05-17', description: 'Shipped', location: 'Mumbai, MH' },
        { date: '2026-05-18', description: 'In transit', location: 'Nagpur, MH' },
        { date: '2026-05-19', description: 'Out for delivery', location: 'Kolkata, WB' },
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
