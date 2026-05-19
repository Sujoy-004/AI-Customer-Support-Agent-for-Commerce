export interface Env {
  SHOPIFY_ADMIN_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
  HMAC_SECRET: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
}

interface OrderLookupRequest {
  orderNumber: number;
  emailHash: string;
  timestamp: number;
  hmac: string;
}

interface TrackingEvent {
  date: string;
  message: string;
  location?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();

interface ProxyOrderResponse {
  found: boolean;
  status?: string;
  estimatedDelivery?: string;
  timeline?: TrackingEvent[];
}

interface ProxyError {
  error: true;
  code: 'not_found' | 'email_mismatch' | 'proxy_error' | 'invalid_hmac' | 'invalid_request';
  message: string;
}

interface ShopifyOrderNode {
  id: string;
  name: string;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  createdAt: string;
  estimatedDeliveryDate?: string;
  fulfillmentStatus: string;
  customer?: { email: string };
  timelineItems: {
    edges: { node: TrackingEvent }[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getCorsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  if (!origin || !allowedOrigins.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    ...corsHeaders,
  };
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
}

function jsonResponse(data: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function checkRateLimit(
  clientIp: string,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(clientIp);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_STORE.set(clientIp, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count += 1;
  const remaining = Math.max(0, maxRequests - entry.count);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining };
}

function sanitizeOrderNumber(input: number): number {
  return Math.floor(Math.abs(input));
}

function validateEmailHash(input: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(input);
}

// Request logging utility
function logRequest(
  level: 'info' | 'warn' | 'error',
  clientIp: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    clientIp,
    message,
    ...(metadata && { metadata }),
  };
  
  switch (level) {
    case 'info':
      console.log('[Shopify Proxy]', JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn('[Shopify Proxy]', JSON.stringify(logEntry));
      break;
    case 'error':
      console.error('[Shopify Proxy]', JSON.stringify(logEntry));
      break;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function verifyHmac(
  payload: { orderNumber: number; emailHash: string; timestamp: number },
  secret: string,
  hmac: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${payload.orderNumber}${payload.emailHash}${payload.timestamp}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sigBytes = hexToBytes(hmac);
  return crypto.subtle.verify('HMAC', key, sigBytes, data);
}

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function mapOrderResponse(node: ShopifyOrderNode): ProxyOrderResponse {
  return {
    found: true,
    status: node.displayFulfillmentStatus,
    estimatedDelivery: node.estimatedDeliveryDate,
    timeline: node.timelineItems.edges.map((edge) => ({
      date: edge.node.date,
      message: edge.node.message,
      location: edge.node.location,
    })),
  };
}

const ORDER_LOOKUP_QUERY = `
  query OrderLookup($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          id
          name
          displayFulfillmentStatus
          displayFinancialStatus
          createdAt
          estimatedDeliveryDate
          customer {
            email
          }
          timelineItems(first: 10) {
            edges {
              node {
                date
                message
                location
              }
            }
          }
        }
      }
    }
  }
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const startTime = Date.now();
    
    // Parse allowed origins from environment (comma-separated)
    const allowedOrigins = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : ['http://localhost:5173', 'http://localhost:3000'];

    logRequest('info', clientIp, 'Request received', {
      method: request.method,
      path: new URL(request.url).pathname,
      origin: origin ?? 'none',
    });

    // CORS preflight
    if (request.method === 'OPTIONS') {
      const corsHeaders = getCorsHeaders(origin, allowedOrigins);
      if (Object.keys(corsHeaders).length === 0) {
        logRequest('warn', clientIp, 'CORS origin rejected', { origin });
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Method check
    if (request.method !== 'POST') {
      logRequest('warn', clientIp, 'Invalid method', { method: request.method });
      return jsonResponse(
        { error: true, code: 'invalid_request', message: 'Method not allowed' },
        405,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }

    // Route check
    const url = new URL(request.url);
    if (url.pathname !== '/api/order-lookup') {
      logRequest('warn', clientIp, 'Unknown route', { path: url.pathname });
      return jsonResponse(
        { error: true, code: 'not_found', message: 'Route not found' },
        404,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }

    // Rate limiting
    const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
    const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS ?? '20', 10);
    const rateLimit = checkRateLimit(clientIp, windowMs, maxRequests);
    
    if (!rateLimit.allowed) {
      logRequest('warn', clientIp, 'Rate limit exceeded', {
        windowMs,
        maxRequests,
      });
      return jsonResponse(
        { error: true, code: 'rate_limited', message: 'Too many requests. Please try again later.' },
        429,
        {
          ...getCorsHeaders(origin, allowedOrigins),
          ...getSecurityHeaders(),
          'Retry-After': String(Math.ceil(windowMs / 1000)),
        },
      );
    }

    // Parse JSON body
    let body: OrderLookupRequest;
    try {
      body = (await request.json()) as OrderLookupRequest;
    } catch {
      logRequest('warn', clientIp, 'Invalid JSON body');
      return jsonResponse(
        { error: true, code: 'invalid_request', message: 'Invalid JSON body' },
        400,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }

    // Sanitize and validate required fields
    const sanitizedOrderNumber = sanitizeOrderNumber(body.orderNumber);
    if (
      typeof body.orderNumber !== 'number' ||
      !Number.isFinite(body.orderNumber) ||
      body.orderNumber <= 0 ||
      typeof body.emailHash !== 'string' ||
      !validateEmailHash(body.emailHash) ||
      typeof body.timestamp !== 'number' ||
      typeof body.hmac !== 'string'
    ) {
      logRequest('warn', clientIp, 'Invalid request fields', {
        hasOrderNumber: typeof body.orderNumber === 'number',
        hasEmailHash: typeof body.emailHash === 'string',
        hasTimestamp: typeof body.timestamp === 'number',
        hasHmac: typeof body.hmac === 'string',
      });
      return jsonResponse(
        {
          error: true,
          code: 'invalid_request',
          message: 'Missing or invalid required fields: orderNumber, emailHash, timestamp, hmac',
        },
        400,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }

    // Timestamp check — reject requests outside 5-minute window
    if (Math.abs(Date.now() - body.timestamp) > 300_000) {
      logRequest('warn', clientIp, 'Expired timestamp', {
        requestTimestamp: body.timestamp,
        now: Date.now(),
        diff: Math.abs(Date.now() - body.timestamp),
      });
      return jsonResponse(
        { error: true, code: 'invalid_hmac', message: 'Request expired' },
        401,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }

    // HMAC verification
    const hmacValid = await verifyHmac(
      { orderNumber: sanitizedOrderNumber, emailHash: body.emailHash, timestamp: body.timestamp },
      env.HMAC_SECRET,
      body.hmac,
    );
    if (!hmacValid) {
      logRequest('error', clientIp, 'Invalid HMAC signature', {
        orderNumber: sanitizedOrderNumber,
      });
      return jsonResponse(
        { error: true, code: 'invalid_hmac', message: 'Invalid signature' },
        401,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }

    // Query Shopify Admin GraphQL API
    try {
      logRequest('info', clientIp, 'Querying Shopify API', {
        orderNumber: sanitizedOrderNumber,
      });

      const shopifyResponse = await fetch(
        `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_TOKEN,
          },
          body: JSON.stringify({
            query: ORDER_LOOKUP_QUERY,
            variables: { query: `name:#${sanitizedOrderNumber}` },
          }),
        },
      );

      if (!shopifyResponse.ok) {
        logRequest('error', clientIp, 'Shopify API request failed', {
          status: shopifyResponse.status,
          orderNumber: sanitizedOrderNumber,
        });
        return jsonResponse(
          { error: true, code: 'proxy_error', message: 'Shopify API request failed' },
          500,
          { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
        );
      }

      const shopifyData = (await shopifyResponse.json()) as {
        errors?: Array<{ message: string }>;
        data?: {
          orders?: {
            edges?: Array<{ node: ShopifyOrderNode }>;
          };
        };
      };

      if (shopifyData.errors) {
        logRequest('error', clientIp, 'Shopify API errors', {
          errors: shopifyData.errors,
          orderNumber: sanitizedOrderNumber,
        });
        return jsonResponse(
          { error: true, code: 'proxy_error', message: 'Shopify API returned errors' },
          500,
          { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
        );
      }

      const edges = shopifyData.data?.orders?.edges;
      if (!edges || edges.length === 0) {
        logRequest('info', clientIp, 'Order not found', {
          orderNumber: sanitizedOrderNumber,
        });
        return jsonResponse(
          { error: true, code: 'not_found', message: 'Order not found' },
          404,
          { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
        );
      }

      const node = edges[0].node;

      // Email hash verification
      if (node.customer?.email) {
        const orderEmailHash = await sha256Hex(node.customer.email);
        if (orderEmailHash.toLowerCase() !== body.emailHash.toLowerCase()) {
          logRequest('warn', clientIp, 'Email mismatch', {
            orderNumber: sanitizedOrderNumber,
          });
          return jsonResponse(
            { error: true, code: 'email_mismatch', message: 'Email does not match order' },
            404,
            { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
          );
        }
      }

      // Validate response data before returning
      const validatedResponse = mapOrderResponse(node);
      
      const duration = Date.now() - startTime;
      logRequest('info', clientIp, 'Request completed successfully', {
        orderNumber: sanitizedOrderNumber,
        duration,
      });

      return jsonResponse(
        validatedResponse,
        200,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      logRequest('error', clientIp, 'Failed to query Shopify API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      return jsonResponse(
        { error: true, code: 'proxy_error', message: 'Failed to query Shopify API' },
        500,
        { ...getCorsHeaders(origin, allowedOrigins), ...getSecurityHeaders() },
      );
    }
  },
};
