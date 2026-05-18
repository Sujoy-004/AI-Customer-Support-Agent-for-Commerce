import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker, { Env } from '../src/worker';

const MOCK_ENV: Env = {
  SHOPIFY_ADMIN_TOKEN: 'test-admin-token',
  SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com',
  HMAC_SECRET: 'test-hmac-secret-key-32-bytes-long!!',
};

async function signHmac(
  payload: { orderNumber: number; emailHash: string; timestamp: number },
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${payload.orderNumber}${payload.emailHash}${payload.timestamp}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function makeSignedRequest(
  orderNumber: number,
  emailHash: string,
  secret: string,
  timestampOverride?: number,
) {
  const timestamp = timestampOverride ?? Date.now();
  const payload = { orderNumber, emailHash, timestamp };
  return signHmac(payload, secret).then((hmac) => ({
    orderNumber,
    emailHash,
    timestamp,
    hmac,
  }));
}

const MOCK_SHOPIFY_ORDER = {
  data: {
    orders: {
      edges: [
        {
          node: {
            id: 'gid://shopify/Order/123',
            name: '#1001',
            displayFulfillmentStatus: 'FULFILLED',
            displayFinancialStatus: 'PAID',
            createdAt: '2026-05-01T10:00:00Z',
            estimatedDeliveryDate: '2026-05-10',
            customer: { email: 'customer@example.com' },
            timelineItems: {
              edges: [
                { node: { date: '2026-05-02', message: 'Order shipped', location: 'Warehouse A' } },
                { node: { date: '2026-05-05', message: 'Out for delivery' } },
              ],
            },
          },
        },
      ],
    },
  },
};

// Global mock setup — applies to ALL describe blocks
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('worker POST /api/order-lookup', () => {
  it('accepts a correctly signed request and returns order data', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SHOPIFY_ORDER), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(data.found).toBe(true);
    expect(data.status).toBe('FULFILLED');
    expect(data.estimatedDelivery).toBe('2026-05-10');
    expect(Array.isArray(data.timeline)).toBe(true);
    expect((data.timeline as Array<Record<string, string>>).length).toBe(2);
  });

  it('returns 401 for incorrect HMAC signature', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, 'wrong-secret');

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(data.error).toBe(true);
    expect(data.code).toBe('invalid_hmac');
  });

  it('returns 401 for expired timestamp (>5 min)', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const expiredTimestamp = Date.now() - 6 * 60 * 1000;
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET, expiredTimestamp);

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(data.error).toBe(true);
    expect(data.code).toBe('invalid_hmac');
  });

  it('returns 400 for missing required fields', async () => {
    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 1001 }),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(data.error).toBe(true);
    expect(data.code).toBe('invalid_request');
  });

  it('returns 400 for invalid emailHash format (not 64-char hex)', async () => {
    const body = await makeSignedRequest(1001, 'not-a-valid-hash', MOCK_ENV.HMAC_SECRET);

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(data.code).toBe('invalid_request');
  });

  it('returns 404 email_mismatch when email hash does not match order', async () => {
    const wrongEmailHash = await sha256Hex('wrong@example.com');
    const body = await makeSignedRequest(1001, wrongEmailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SHOPIFY_ORDER), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(404);
    expect(data.error).toBe(true);
    expect(data.code).toBe('email_mismatch');
  });

  it('returns 404 not_found when Shopify API returns no orders', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: { orders: { edges: [] } } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(404);
    expect(data.error).toBe(true);
    expect(data.code).toBe('not_found');
  });

  it('returns 500 proxy_error when Shopify API returns errors', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errors: [{ message: 'Internal error' }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(data.error).toBe(true);
    expect(data.code).toBe('proxy_error');
  });

  it('returns 500 proxy_error when Shopify API request fails', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response('Server Error', { status: 502 }),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(data.error).toBe(true);
    expect(data.code).toBe('proxy_error');
  });

  it('returns 405 for non-POST methods', async () => {
    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'GET',
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(405);
    expect(data.error).toBe(true);
    expect(data.code).toBe('invalid_request');
  });

  it('returns 404 for unknown routes', async () => {
    const request = new Request('http://localhost:8787/api/other', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(404);
    expect(data.error).toBe(true);
    expect(data.code).toBe('not_found');
  });

  it('returns 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(data.error).toBe(true);
    expect(data.code).toBe('invalid_request');
  });
});

describe('CORS headers', () => {
  it('returns CORS headers on OPTIONS preflight', async () => {
    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'OPTIONS',
    });

    const response = await worker.fetch(request, MOCK_ENV);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });

  it('includes CORS headers on POST response', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });
});

describe('Admin API query construction', () => {
  it('sends parameterized GraphQL query with correct variables', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SHOPIFY_ORDER), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    await worker.fetch(request, MOCK_ENV);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test-store.myshopify.com/admin/api/2025-07/graphql.json',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const fetchCall = fetchMock.mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body as string);

    expect(fetchBody.query).toContain('$query: String!');
    expect(fetchBody.query).toContain('orders(first: 1, query: $query)');
    expect(fetchBody.variables).toEqual({ query: 'name:1001' });
    expect(fetchBody.query).not.toMatch(/name:1001/);
  });

  it('includes Admin API token in request headers', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SHOPIFY_ORDER), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    await worker.fetch(request, MOCK_ENV);

    const fetchCall = fetchMock.mock.calls[0];
    const headers = fetchCall[1].headers as Record<string, string>;

    expect(headers['X-Shopify-Access-Token']).toBe('test-admin-token');
  });
});

describe('Response mapping', () => {
  it('maps Shopify order to proxy response shape', async () => {
    const emailHash = await sha256Hex('customer@example.com');
    const body = await makeSignedRequest(1001, emailHash, MOCK_ENV.HMAC_SECRET);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SHOPIFY_ORDER), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = new Request('http://localhost:8787/api/order-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await worker.fetch(request, MOCK_ENV);
    const data = (await response.json()) as Record<string, unknown>;

    expect(data).toEqual({
      found: true,
      status: 'FULFILLED',
      estimatedDelivery: '2026-05-10',
      timeline: [
        { date: '2026-05-02', message: 'Order shipped', location: 'Warehouse A' },
        { date: '2026-05-05', message: 'Out for delivery', location: undefined },
      ],
    });
  });
});
