export interface Env {
  SHOPIFY_ADMIN_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
  HMAC_SECRET: string;
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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
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
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Method check
    if (request.method !== 'POST') {
      return jsonResponse(
        { error: true, code: 'invalid_request', message: 'Method not allowed' },
        405,
      );
    }

    // Route check
    const url = new URL(request.url);
    if (url.pathname !== '/api/order-lookup') {
      return jsonResponse(
        { error: true, code: 'not_found', message: 'Route not found' },
        404,
      );
    }

    // Parse JSON body
    let body: OrderLookupRequest;
    try {
      body = (await request.json()) as OrderLookupRequest;
    } catch {
      return jsonResponse(
        { error: true, code: 'invalid_request', message: 'Invalid JSON body' },
        400,
      );
    }

    // Validate required fields
    const emailHashHex = /^[0-9a-fA-F]{64}$/;
    if (
      typeof body.orderNumber !== 'number' ||
      typeof body.emailHash !== 'string' ||
      !emailHashHex.test(body.emailHash) ||
      typeof body.timestamp !== 'number' ||
      typeof body.hmac !== 'string'
    ) {
      return jsonResponse(
        {
          error: true,
          code: 'invalid_request',
          message: 'Missing or invalid required fields: orderNumber, emailHash, timestamp, hmac',
        },
        400,
      );
    }

    // Timestamp check — reject requests outside 5-minute window
    if (Math.abs(Date.now() - body.timestamp) > 300_000) {
      return jsonResponse(
        { error: true, code: 'invalid_hmac', message: 'Request expired' },
        401,
      );
    }

    // HMAC verification
    const hmacValid = await verifyHmac(
      { orderNumber: body.orderNumber, emailHash: body.emailHash, timestamp: body.timestamp },
      env.HMAC_SECRET,
      body.hmac,
    );
    if (!hmacValid) {
      return jsonResponse(
        { error: true, code: 'invalid_hmac', message: 'Invalid signature' },
        401,
      );
    }

    // Query Shopify Admin GraphQL API
    try {
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
            variables: { query: `name:${body.orderNumber}` },
          }),
        },
      );

      if (!shopifyResponse.ok) {
        return jsonResponse(
          { error: true, code: 'proxy_error', message: 'Shopify API request failed' },
          500,
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
        return jsonResponse(
          { error: true, code: 'proxy_error', message: 'Shopify API returned errors' },
          500,
        );
      }

      const edges = shopifyData.data?.orders?.edges;
      if (!edges || edges.length === 0) {
        return jsonResponse(
          { error: true, code: 'not_found', message: 'Order not found' },
          404,
        );
      }

      const node = edges[0].node;

      // Email hash verification
      if (node.customer?.email) {
        const orderEmailHash = await sha256Hex(node.customer.email);
        if (orderEmailHash.toLowerCase() !== body.emailHash.toLowerCase()) {
          return jsonResponse(
            { error: true, code: 'email_mismatch', message: 'Email does not match order' },
            404,
          );
        }
      }

      return jsonResponse(mapOrderResponse(node), 200);
    } catch {
      return jsonResponse(
        { error: true, code: 'proxy_error', message: 'Failed to query Shopify API' },
        500,
      );
    }
  },
};
