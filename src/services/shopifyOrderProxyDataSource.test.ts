import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShopifyOrderProxyDataSource } from './shopifyOrderProxyDataSource';
import type { Order } from './types';

function createDataSource(email?: string): ShopifyOrderProxyDataSource {
  return new ShopifyOrderProxyDataSource({
    proxyUrl: 'https://proxy.example.com',
    hmacSecret: 'test-secret',
    email,
  });
}

describe('ShopifyOrderProxyDataSource', () => {
  let dataSource: ShopifyOrderProxyDataSource;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dataSource = createDataSource('test@example.com');
    mockFetch = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== SHA-256 Hashing ====================

  describe('SHA-256 email hashing', () => {
    it('produces a 64-character hex string', async () => {
      const hash = await (dataSource as any).sha256('test@example.com');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });

    it('produces deterministic output for same input', async () => {
      const hash1 = await (dataSource as any).sha256('alice@example.com');
      const hash2 = await (dataSource as any).sha256('alice@example.com');
      expect(hash1).toBe(hash2);
    });

    it('produces different output for different inputs', async () => {
      const hash1 = await (dataSource as any).sha256('alice@example.com');
      const hash2 = await (dataSource as any).sha256('bob@example.com');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ==================== HMAC Signing ====================

  describe('HMAC signing', () => {
    it('produces a 64-character hex string', async () => {
      const emailHash = await (dataSource as any).sha256('test@example.com');
      const hmac = await (dataSource as any).signHmac({
        orderNumber: 1001,
        emailHash,
        timestamp: 1_700_000_000,
      });
      expect(hmac).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hmac)).toBe(true);
    });

    it('produces different signatures for different payloads', async () => {
      const emailHash = await (dataSource as any).sha256('test@example.com');
      const hmac1 = await (dataSource as any).signHmac({
        orderNumber: 1001,
        emailHash,
        timestamp: 1_700_000_000,
      });
      const hmac2 = await (dataSource as any).signHmac({
        orderNumber: 1002,
        emailHash,
        timestamp: 1_700_000_000,
      });
      expect(hmac1).not.toBe(hmac2);
    });
  });

  // ==================== Input validation ====================

  describe('input validation', () => {
    it('returns null for non-positive order numbers', async () => {
      expect(await dataSource.getOrderByNumber(0)).toBeNull();
      expect(await dataSource.getOrderByNumber(-1)).toBeNull();
      expect(await dataSource.getOrderByNumber(NaN)).toBeNull();
      expect(await dataSource.getOrderByNumber(Infinity)).toBeNull();
    });
  });

  // ==================== Error response handling ====================

  describe('error response handling', () => {
    it('returns null on invalid_hmac error code', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: true, code: 'invalid_hmac', message: 'Invalid signature' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await dataSource.getOrderByNumber(1001);
      expect(result).toBeNull();
    });
  });

  // ==================== getOrderByNumber request shape ====================

  describe('getOrderByNumber request', () => {
    it('makes POST request to proxy URL with correct body shape', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ found: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await dataSource.getOrderByNumber(1001);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://proxy.example.com/api/order-lookup');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('orderNumber', 1001);
      expect(body).toHaveProperty('emailHash');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('hmac');
      expect(typeof body.emailHash).toBe('string');
      expect(body.emailHash).toHaveLength(64);
      expect(typeof body.hmac).toBe('string');
      expect(body.hmac).toHaveLength(64);
    });
  });

  // ==================== Successful proxy response ====================

  describe('successful proxy response mapping', () => {
    it('maps successful proxy response to Order type', async () => {
      const timeline = [
        { date: '2026-05-13', description: 'Order placed', location: 'Online' },
        { date: '2026-05-14', description: 'Shipped', location: 'Warehouse' },
      ];

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            found: true,
            status: 'shipped',
            estimatedDelivery: '2026-05-18',
            timeline,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await dataSource.getOrderByNumber(1001);

      expect(result).not.toBeNull();
      expect(result!.orderId).toBe('proxy-1001');
      expect(result!.orderNumber).toBe(1001);
      expect(result!.email).toBe('test@example.com');
      expect(result!.status).toBe('shipped');
      expect(result!.fulfillmentStatus).toBe('shipped');
      expect(result!.financialStatus).toBe('paid');
      expect(result!.estimatedDelivery).toBe('2026-05-18');
      expect(result!.timeline).toEqual(timeline);
      expect(result!.items).toEqual([]);
    });
  });

  // ==================== found: false ====================

  describe('order not found', () => {
    it('returns null when proxy returns found: false', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ found: false }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await dataSource.getOrderByNumber(9999);
      expect(result).toBeNull();
    });
  });

  // ==================== getOrder stub ====================

  describe('getOrder', () => {
    it('returns null (not supported via proxy)', async () => {
      const result = await dataSource.getOrder('ord-001');
      expect(result).toBeNull();
    });
  });

  // ==================== getOrdersByEmail stub ====================

  describe('getOrdersByEmail', () => {
    it('returns empty array (not supported via proxy)', async () => {
      const result = await dataSource.getOrdersByEmail('test@example.com');
      expect(result).toEqual([]);
    });
  });

  // ==================== Retry logic ====================

  describe('retry logic', () => {
    it('retries after 2s delay on 5xx response', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: true, code: 'proxy_error' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ found: true, status: 'shipped' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );

      const start = Date.now();
      const result = await dataSource.getOrderByNumber(1001);
      const duration = Date.now() - start;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('shipped');
      expect(duration).toBeGreaterThanOrEqual(1900);
    }, 10000);

    it('returns null after all retries exhausted on persistent 5xx', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ error: true, code: 'proxy_error' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await dataSource.getOrderByNumber(1001);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    }, 10000);
  });

  // ==================== proxyUrl normalization ====================

  describe('proxyUrl normalization', () => {
    it('removes trailing slash from proxyUrl', async () => {
      const dsWithSlash = new ShopifyOrderProxyDataSource({
        proxyUrl: 'https://proxy.example.com/',
        hmacSecret: 'test-secret',
        email: 'test@example.com',
      });
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ found: false }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await dsWithSlash.getOrderByNumber(1001);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://proxy.example.com/api/order-lookup');
    });

    it('does not double-slash when proxyUrl has no trailing slash', async () => {
      const dsNoSlash = new ShopifyOrderProxyDataSource({
        proxyUrl: 'https://proxy.example.com',
        hmacSecret: 'test-secret',
        email: 'test@example.com',
      });
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ found: false }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await dsNoSlash.getOrderByNumber(1001);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://proxy.example.com/api/order-lookup');
    });
  });

  // ==================== Network error ====================

  describe('network error handling', () => {
    it('returns null after retries on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const result = await dataSource.getOrderByNumber(1001);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    }, 10000);
  });

  // ==================== setEmail ====================

  describe('setEmail', () => {
    it('updates the email used for request signing', async () => {
      dataSource.setEmail('updated@example.com');

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ found: true, status: 'processing' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await dataSource.getOrderByNumber(2002);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.orderNumber).toBe(2002);

      // Verify email hash changed from original by using updated email
      const expectedHash = await (dataSource as any).sha256('updated@example.com');
      expect(body.emailHash).toBe(expectedHash);
    });

    it('sets email used in returned Order object', async () => {
      dataSource.setEmail('new-user@example.com');

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ found: true, status: 'delivered' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await dataSource.getOrderByNumber(3003);
      expect(result).not.toBeNull();
      expect(result!.email).toBe('new-user@example.com');
    });
  });

});
