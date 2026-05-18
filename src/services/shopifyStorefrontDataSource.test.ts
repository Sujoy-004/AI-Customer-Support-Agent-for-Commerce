import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShopifyStorefrontDataSource } from './shopifyStorefrontDataSource';
import type { Product } from './types';

function createDataSource(
  domain = 'test-store.myshopify.com',
  token?: string
): ShopifyStorefrontDataSource {
  return new ShopifyStorefrontDataSource({
    storeDomain: domain,
    storefrontToken: token,
  });
}

const mockProductNode = {
  id: 'gid://shopify/Product/1',
  title: 'Classic Hoodie',
  description: 'A comfortable cotton-blend hoodie',
  productType: 'Clothing',
  tags: ['featured', 'new'],
  options: [
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Color', values: ['Black', 'Gray', 'Navy'] },
  ],
  priceRange: {
    minVariantPrice: { amount: '49.99', currencyCode: 'USD' },
    maxVariantPrice: { amount: '59.99', currencyCode: 'USD' },
  },
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/101',
          title: 'M / Black',
          sku: 'HD-M-BLK',
          price: { amount: '49.99', currencyCode: 'USD' },
          compareAtPrice: { amount: '59.99', currencyCode: 'USD' },
          quantityAvailable: 25,
          availableForSale: true,
          selectedOptions: [
            { name: 'Size', value: 'M' },
            { name: 'Color', value: 'Black' },
          ],
        },
      },
      {
        node: {
          id: 'gid://shopify/ProductVariant/102',
          title: 'L / Gray',
          sku: 'HD-L-GY',
          price: { amount: '54.99', currencyCode: 'USD' },
          compareAtPrice: null,
          quantityAvailable: 0,
          availableForSale: false,
          selectedOptions: [
            { name: 'Size', value: 'L' },
            { name: 'Color', value: 'Gray' },
          ],
        },
      },
    ],
  },
  images: {
    edges: [
      { node: { url: 'https://cdn.example.com/hoodie.jpg', altText: 'Classic Hoodie Black' } },
    ],
  },
};

function buildSuccessResponse(productNodes: any[] = [mockProductNode]): Response {
  return new Response(
    JSON.stringify({
      data: {
        products: {
          edges: productNodes.map((node) => ({ node })),
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

describe('ShopifyStorefrontDataSource', () => {
  let dataSource: ShopifyStorefrontDataSource;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dataSource = createDataSource();
    mockFetch = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Request shape ====================

  describe('loadProducts request', () => {
    it('makes POST request to correct Storefront API endpoint', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      await dataSource.loadProducts();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://test-store.myshopify.com/api/2026-04/graphql.json');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });

      const body = JSON.parse(options.body);
      expect(body.query).toContain('products');
      expect(body.query).toContain('priceRange');
    });
  });

  // ==================== Response mapping ====================

  describe('response mapping', () => {
    it('maps successful response to Product[] with correct shape', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products: Product[] = await dataSource.loadProducts();

      expect(products).toHaveLength(1);
      const product = products[0];
      expect(product.id).toBe('gid://shopify/Product/1');
      expect(product.title).toBe('Classic Hoodie');
      expect(product.description).toBe('A comfortable cotton-blend hoodie');
      expect(product.type).toBe('Clothing');
      expect(product.tags).toEqual(['featured', 'new']);
    });

    it('maps price range correctly', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const product = products[0];

      expect(product.priceRange.min).toBe(49.99);
      expect(product.priceRange.max).toBe(54.99);
    });

    it('maps product options correctly', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const product = products[0];

      expect(product.options).toHaveLength(2);
      expect(product.options[0]).toEqual({ name: 'Size', values: ['S', 'M', 'L', 'XL'] });
      expect(product.options[1]).toEqual({ name: 'Color', values: ['Black', 'Gray', 'Navy'] });
    });

    it('maps images correctly', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const product = products[0];

      expect(product.images).toHaveLength(1);
      expect(product.images[0]).toEqual({
        url: 'https://cdn.example.com/hoodie.jpg',
        alt: 'Classic Hoodie Black',
      });
    });
  });

  // ==================== Variant mapping ====================

  describe('variant mapping', () => {
    it('maps variants with correct fields', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const variants = products[0].variants;

      expect(variants).toHaveLength(2);

      const v1 = variants[0];
      expect(v1.id).toBe('gid://shopify/ProductVariant/101');
      expect(v1.title).toBe('M / Black');
      expect(v1.sku).toBe('HD-M-BLK');
      expect(v1.price).toBe(49.99);
      expect(v1.compareAtPrice).toBe(59.99);
    });

    it('maps variant selectedOptions to Record<string, string>', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const variant = products[0].variants[0];

      expect(variant.options).toEqual({ Size: 'M', Color: 'Black' });
    });

    it('maps variant inventory correctly', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const [v1, v2] = products[0].variants;

      // In-stock variant
      expect(v1.inventory.available).toBe(true);
      expect(v1.inventory.quantity).toBe(25);
      expect(v1.inventory.isLowStock).toBe(false);

      // Out-of-stock variant
      expect(v2.inventory.available).toBe(false);
      expect(v2.inventory.quantity).toBe(0);
      expect(v2.inventory.isLowStock).toBe(false);
    });

    it('handles missing compareAtPrice', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());

      const products = await dataSource.loadProducts();
      const variant = products[0].variants[1];

      expect(variant.compareAtPrice).toBeUndefined();
    });
  });

  // ==================== Error handling ====================

  describe('error handling', () => {
    it('throws Error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Unauthorized', {
          status: 401,
          statusText: 'Unauthorized',
        })
      );

      await expect(dataSource.loadProducts()).rejects.toThrow(
        'Storefront API error: 401 Unauthorized'
      );
    });

    it('throws Error on GraphQL error response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errors: [{ message: 'Field not found' }, { message: 'Access denied' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      await expect(dataSource.loadProducts()).rejects.toThrow(
        'Storefront API error: Field not found; Access denied'
      );
    });

    it('throws Error on 500 server error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        })
      );

      await expect(dataSource.loadProducts()).rejects.toThrow(
        'Storefront API error: 500 Internal Server Error'
      );
    });

    it('throws Error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(dataSource.loadProducts()).rejects.toThrow();
    });
  });

  // ==================== Edge cases ====================

  describe('empty catalog', () => {
    it('returns empty array when store has no products', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { products: { edges: [] } } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const products = await dataSource.loadProducts();
      expect(products).toEqual([]);
    });
  });

  // ==================== Domain normalization ====================

  describe('storeDomain normalization', () => {
    it('strips https:// prefix', async () => {
      const ds = createDataSource('https://test-store.myshopify.com');
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());
      await ds.loadProducts();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://test-store.myshopify.com/api/2026-04/graphql.json');
    });

    it('strips trailing slash', async () => {
      const ds = createDataSource('test-store.myshopify.com/');
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());
      await ds.loadProducts();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://test-store.myshopify.com/api/2026-04/graphql.json');
    });

    it('handles both https:// prefix and trailing slash', async () => {
      const ds = createDataSource('https://test-store.myshopify.com/');
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());
      await ds.loadProducts();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://test-store.myshopify.com/api/2026-04/graphql.json');
    });
  });

  // ==================== Storefront token ====================

  describe('storefrontToken', () => {
    it('includes X-Shopify-Storefront-Access-Token header when token provided', async () => {
      const ds = createDataSource('test-store.myshopify.com', 'test-token-value');
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());
      await ds.loadProducts();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).toHaveProperty('X-Shopify-Storefront-Access-Token', 'test-token-value');
    });

    it('does not include token header when token is empty', async () => {
      const ds = createDataSource('test-store.myshopify.com', '');
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());
      await ds.loadProducts();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).not.toHaveProperty('X-Shopify-Storefront-Access-Token');
    });

    it('does not include token header when token is undefined', async () => {
      mockFetch.mockResolvedValueOnce(buildSuccessResponse());
      await dataSource.loadProducts();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).not.toHaveProperty('X-Shopify-Storefront-Access-Token');
    });
  });
});
