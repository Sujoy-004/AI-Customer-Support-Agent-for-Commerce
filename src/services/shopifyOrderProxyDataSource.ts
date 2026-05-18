import type { OrderDataSource, Order, OrderStatus, TrackingEvent } from './types';

interface ProxyOrderResponse {
  found: boolean;
  status?: string;
  estimatedDelivery?: string;
  timeline?: TrackingEvent[];
}

interface ProxyErrorBody {
  error?: boolean;
  code?: string;
}

interface SignPayload {
  orderNumber: number;
  emailHash: string;
  timestamp: number;
}

export interface ShopifyOrderProxyDataSourceOptions {
  proxyUrl: string;
  hmacSecret: string;
  email?: string;
}

export class ShopifyOrderProxyDataSource implements OrderDataSource {
  private proxyUrl: string;
  private hmacSecret: string;
  private currentEmail: string;

  constructor(options: ShopifyOrderProxyDataSourceOptions) {
    const baseUrl = options.proxyUrl.replace(/\/$/, '');
    this.proxyUrl = `${baseUrl}/api/order-lookup`;
    this.hmacSecret = options.hmacSecret;
    this.currentEmail = options.email ?? '';
  }

  setEmail(email: string): void {
    this.currentEmail = email;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return null;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return [];
  }

  async getOrderByNumber(orderNumber: number): Promise<Order | null> {
    if (!Number.isFinite(orderNumber) || orderNumber <= 0) return null;

    try {
      const result = await this.lookupWithRetry(orderNumber);
      if (!result.found) return null;

      return {
        orderId: `proxy-${orderNumber}`,
        orderNumber,
        email: this.currentEmail,
        createdAt: '',
        status: (result.status as OrderStatus) || 'processing',
        items: [],
        fulfillmentStatus: result.status || 'unknown',
        financialStatus: 'paid',
        trackingNumber: '',
        carrier: '',
        estimatedDelivery: result.estimatedDelivery || '',
        timeline: result.timeline || [],
      };
    } catch {
      return null;
    }
  }

  private async lookupWithRetry(
    orderNumber: number,
    retries = 1
  ): Promise<ProxyOrderResponse> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }
      try {
        return await this.signAndSend(orderNumber);
      } catch {
        if (attempt < retries) continue;
        throw new Error('Proxy unreachable');
      }
    }
    throw new Error('Proxy unreachable');
  }

  private async signAndSend(
    orderNumber: number
  ): Promise<ProxyOrderResponse> {
    const emailHash = await this.sha256(this.currentEmail);
    const timestamp = Math.floor(Date.now() / 1000);
    const hmac = await this.signHmac({ orderNumber, emailHash, timestamp });

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, emailHash, timestamp, hmac }),
    });

    // Throw on 5xx to trigger retry in lookupWithRetry
    if (response.status >= 500) {
      throw new Error(`Proxy returned ${response.status}`);
    }

    return response.json();
  }

  private async signHmac(payload: SignPayload): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(
      `${payload.orderNumber}${payload.emailHash}${payload.timestamp}`
    );
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.hmacSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
