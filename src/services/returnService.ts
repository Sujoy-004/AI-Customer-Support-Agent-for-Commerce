import { PolicyService } from './policyService';
import { OrderService } from './orderService';
import type { Order, ReturnQuery, ReturnRequest, ReturnDataSource } from './types';

const RETURN_KEYWORDS = [
  'return', 'refund', 'exchange', 'want to send back',
  'not satisfied', 'defective', 'damaged', 'wrong item',
  'wrong size', 'doesn\'t fit', 'changed my mind',
  'cancel order', 'return request', 'start a return',
  'return policy', 'how to return', 'return an item',
];

const ORDERED_STATUSES = ['delivered', 'returned'];

export class ReturnService {
  private policyService: PolicyService;
  private orderService: OrderService;
  private dataSource: ReturnDataSource;

  constructor(
    policyService: PolicyService,
    orderService: OrderService,
    dataSource: ReturnDataSource,
  ) {
    this.policyService = policyService;
    this.orderService = orderService;
    this.dataSource = dataSource;
  }

  detectReturnIntent(query: string): boolean {
    const lower = query.toLowerCase();
    return RETURN_KEYWORDS.some(k => lower.includes(k));
  }

  async checkEligibility(orderNumber: number, email: string): Promise<ReturnQuery> {
    const order = await this.orderService.getOrderByNumber(orderNumber);
    if (!order) {
      return { type: 'return_not_eligible', message: `Order #${orderNumber} wasn't found.`, reason: 'not_found' };
    }

    if (order.email.toLowerCase() !== email.toLowerCase()) {
      return { type: 'return_not_eligible', message: 'The email doesn\'t match this order.', reason: 'email_mismatch' };
    }

    if (!ORDERED_STATUSES.includes(order.status)) {
      return { type: 'return_not_eligible', message: `Order #${orderNumber} hasn't been delivered yet. Returns are only available for delivered items.`, reason: 'not_delivered' };
    }

    const policies = await this.policyService.getAllPolicies();
    const returnPolicy = policies.returns;

    return {
      type: 'return_eligible',
      orderNumber,
      items: order.items.map(i => ({ title: i.title, variantTitle: i.variantTitle })),
    };
  }

  async submitReturn(
    orderNumber: number,
    email: string,
    items: { title: string; variantTitle: string; quantity: number; reason: string }[],
  ): Promise<ReturnQuery> {
    const request: Omit<ReturnRequest, 'id' | 'createdAt'> = {
      orderNumber,
      email,
      items,
      status: 'pending',
      reason: items.map(i => `${i.title} (${i.variantTitle}): ${i.reason}`).join('; '),
    };

    const submitted = await this.dataSource.submitReturn(request);
    const policies = await this.policyService.getAllPolicies();
    const returnPolicy = policies.returns;

    return {
      type: 'return_submitted',
      returnRequest: submitted,
      message: `Return initiated for order #${orderNumber}. ${returnPolicy.refundMethod}`,
    };
  }
}

export class MockReturnDataSource implements ReturnDataSource {
  private returns: ReturnRequest[] = [];

  async submitReturn(request: Omit<ReturnRequest, 'id' | 'createdAt'>): Promise<ReturnRequest> {
    const newReturn: ReturnRequest = {
      ...request,
      id: `ret-${this.returns.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    this.returns.push(newReturn);
    return newReturn;
  }

  async getReturnsByEmail(email: string): Promise<ReturnRequest[]> {
    return this.returns.filter(r => r.email.toLowerCase() === email.toLowerCase());
  }
}
