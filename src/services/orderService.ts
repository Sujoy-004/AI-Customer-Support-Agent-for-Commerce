import type { Order, OrderDataSource } from './types';

export class OrderService {
  private dataSource: OrderDataSource;

  constructor(dataSource: OrderDataSource) {
    this.dataSource = dataSource;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error('Order ID is required');
    }
    return this.dataSource.getOrder(orderId.trim());
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }
    return this.dataSource.getOrdersByEmail(email.trim());
  }

  async getOrderByNumber(orderNumber: number): Promise<Order | null> {
    if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
      throw new Error('Valid order number is required');
    }
    return this.dataSource.getOrderByNumber(orderNumber);
  }
}
