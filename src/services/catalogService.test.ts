import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatalogService } from './catalogService';
import type { Product, CatalogDataSource } from './types';

function createMockDataSource(products: Product[]): CatalogDataSource & { loadCount: number } {
  const data: CatalogDataSource & { loadCount: number } = {
    loadCount: 0,
    async loadProducts(): Promise<Product[]> {
      this.loadCount++;
      return products;
    }
  };
  return data;
}

let dataSource: CatalogDataSource & { loadCount: number };
let service: CatalogService;

beforeEach(() => {
  // Reset by creating fresh instances
  dataSource = createMockDataSource([]);
  service = new CatalogService(dataSource);
});

describe('loadProducts', () => {
  it('should load products from data source', async () => {
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        title: 'Test Product',
        description: 'A test product',
        type: 'clothing',
        priceRange: { min: 10, max: 20 },
        options: [],
        variants: [],
        images: [],
        tags: []
      }
    ];
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const products = await svc.loadProducts();
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('prod-1');
    expect(ds.loadCount).toBe(1);
  });
});

describe('getProduct', () => {
  it('should return a product by id', async () => {
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        title: 'Test Product',
        description: 'A test product',
        type: 'clothing',
        priceRange: { min: 10, max: 20 },
        options: [],
        variants: [],
        images: [],
        tags: ['test']
      }
    ];
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const product = await svc.getProduct('prod-1');
    expect(product).toBeDefined();
    expect(product!.id).toBe('prod-1');
  });

  it('should return undefined for non-existent product', async () => {
    const product = await service.getProduct('nonexistent');
    expect(product).toBeUndefined();
  });
});

describe('searchProducts', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      title: 'Classic Hoodie',
      description: 'A comfortable cotton hoodie for casual wear',
      type: 'clothing',
      priceRange: { min: 49.99, max: 59.99 },
      options: [],
      variants: [],
      images: [],
      tags: ['hoodie', 'featured']
    },
    {
      id: 'prod-2',
      title: 'Canvas Tote',
      description: 'Sturdy canvas tote bag for everyday use',
      type: 'accessories',
      priceRange: { min: 24.99, max: 24.99 },
      options: [],
      variants: [],
      images: [],
      tags: ['bag', 'everyday']
    },
    {
      id: 'prod-3',
      title: 'Running Shoes',
      description: 'Lightweight running shoes with cushioning',
      type: 'clothing',
      priceRange: { min: 89.99, max: 89.99 },
      options: [],
      variants: [],
      images: [],
      tags: ['shoes', 'running']
    }
  ];

  it('should find products by title', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ query: 'hoodie' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-1');
  });

  it('should find products by description', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ query: 'cushioning' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-3');
  });

  it('should find products by type', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ type: 'accessories' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-2');
  });

  it('should return empty array when no products match', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ query: 'nonexistent' });
    expect(results).toHaveLength(0);
  });

  it('should filter by price range', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ minPrice: 25, maxPrice: 100 });
    expect(results).toHaveLength(2);
    expect(results.map(p => p.id)).toEqual(['prod-1', 'prod-3']);
  });

  it('should filter by tags', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ tags: ['featured'] });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-1');
  });

  it('should combine search query and type filter', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ query: 'running', type: 'clothing' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-3');
  });

  it('should be case-insensitive', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ query: 'CLASSIC HOODIE' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-1');
  });
});

describe('checkStock', () => {
  it('should return stock info for an in-stock variant', async () => {
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        title: 'Test',
        description: 'test',
        type: 'clothing',
        priceRange: { min: 10, max: 10 },
        options: [{ name: 'Size', values: ['M'] }],
        variants: [
          {
            id: 'var-1',
            title: 'Test - M',
            sku: 'SKU-TEST-1',
            price: 10,
            options: { Size: 'M' },
            inventory: { available: true, quantity: 25, lowStockThreshold: 5, isLowStock: false }
          }
        ],
        images: [],
        tags: []
      }
    ];
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const stock = await svc.checkStock('var-1');
    expect(stock).toBeDefined();
    expect(stock!.available).toBe(true);
    expect(stock!.quantity).toBe(25);
    expect(stock!.isLowStock).toBe(false);
  });

  it('should return stock info for an out-of-stock variant', async () => {
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        title: 'Test',
        description: 'test',
        type: 'clothing',
        priceRange: { min: 10, max: 10 },
        options: [{ name: 'Size', values: ['M'] }],
        variants: [
          {
            id: 'var-1',
            title: 'Test - M',
            sku: 'SKU-TEST-1',
            price: 10,
            options: { Size: 'M' },
            inventory: { available: false, quantity: 0, lowStockThreshold: 5, isLowStock: false }
          }
        ],
        images: [],
        tags: []
      }
    ];
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const stock = await svc.checkStock('var-1');
    expect(stock).toBeDefined();
    expect(stock!.available).toBe(false);
    expect(stock!.quantity).toBe(0);
  });

  it('should return stock info for a low-stock variant', async () => {
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        title: 'Test',
        description: 'test',
        type: 'clothing',
        priceRange: { min: 10, max: 10 },
        options: [{ name: 'Size', values: ['M'] }],
        variants: [
          {
            id: 'var-1',
            title: 'Test - M',
            sku: 'SKU-TEST-1',
            price: 10,
            options: { Size: 'M' },
            inventory: { available: true, quantity: 3, lowStockThreshold: 5, isLowStock: true }
          }
        ],
        images: [],
        tags: []
      }
    ];
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const stock = await svc.checkStock('var-1');
    expect(stock).toBeDefined();
    expect(stock!.available).toBe(true);
    expect(stock!.quantity).toBe(3);
    expect(stock!.isLowStock).toBe(true);
  });

  it('should return null for a non-existent variant', async () => {
    const stock = await service.checkStock('nonexistent');
    expect(stock).toBeNull();
  });
});

describe('checkVariantByOptions', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      title: 'Classic Hoodie',
      description: 'A comfortable hoodie',
      type: 'clothing',
      priceRange: { min: 49.99, max: 54.99 },
      options: [
        { name: 'Size', values: ['S', 'M', 'L'] },
        { name: 'Color', values: ['Black', 'Gray'] }
      ],
      variants: [
        {
          id: 'var-1',
          title: 'Classic Hoodie - M, Black',
          sku: 'SKU-HOODIE-M-BLK',
          price: 49.99,
          options: { Size: 'M', Color: 'Black' },
          inventory: { available: true, quantity: 25, lowStockThreshold: 5, isLowStock: false }
        },
        {
          id: 'var-2',
          title: 'Classic Hoodie - M, Gray',
          sku: 'SKU-HOODIE-M-GRY',
          price: 49.99,
          options: { Size: 'M', Color: 'Gray' },
          inventory: { available: true, quantity: 15, lowStockThreshold: 5, isLowStock: false }
        },
        {
          id: 'var-3',
          title: 'Classic Hoodie - L, Gray',
          sku: 'SKU-HOODIE-L-GRY',
          price: 49.99,
          options: { Size: 'L', Color: 'Gray' },
          inventory: { available: true, quantity: 15, lowStockThreshold: 5, isLowStock: false }
        },
        {
          id: 'var-4',
          title: 'Classic Hoodie - S, Gray',
          sku: 'SKU-HOODIE-S-GRY',
          price: 49.99,
          options: { Size: 'S', Color: 'Gray' },
          inventory: { available: true, quantity: 2, lowStockThreshold: 5, isLowStock: true }
        }
      ],
      images: [],
      tags: []
    }
  ];

  it('should resolve variant by exact option match', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const result = await svc.checkVariantByOptions('prod-1', { Size: 'M', Color: 'Black' });
    expect(result).toBeDefined();
    expect(result!.variant.id).toBe('var-1');
    expect(result!.product.id).toBe('prod-1');
  });

  it('should resolve variant using size synonyms', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const result = await svc.checkVariantByOptions('prod-1', { Size: 'm', Color: 'Black' });
    expect(result).toBeDefined();
    expect(result!.variant.id).toBe('var-1');
    expect(result!.matchedOptions.Size).toBe('Medium');
  });

  it('should resolve variant using color synonyms', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const result = await svc.checkVariantByOptions('prod-1', { Size: 'M', Color: 'charcoal' });
    expect(result).toBeDefined();
    expect(result!.variant.id).toBe('var-2');
    expect(result!.matchedOptions.Color).toBe('Gray');
    expect(result!.matchedOptions.Size).toBe('Medium');
  });

  it('should return null when no variant matches', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const result = await svc.checkVariantByOptions('prod-1', { Size: 'XXL', Color: 'Pink' });
    expect(result).toBeNull();
  });

  it('should return null for non-existent product', async () => {
    const result = await service.checkVariantByOptions('nonexistent', { Size: 'M' });
    expect(result).toBeNull();
  });
});

describe('caching behavior', () => {
  it('should return cached products on second loadProducts call', async () => {
    const product: Product = {
      id: 'prod-1',
      title: 'Test',
      description: 'test',
      type: 'clothing',
      priceRange: { min: 10, max: 10 },
      options: [],
      variants: [],
      images: [],
      tags: []
    };
    const ds = createMockDataSource([product]);
    const svc = new CatalogService(ds);

    const first = await svc.loadProducts();
    const second = await svc.loadProducts();

    expect(first).toBe(second);
    expect(ds.loadCount).toBe(1);
  });

  it('should reload products after TTL expires', async () => {
    const product: Product = {
      id: 'prod-1',
      title: 'Test',
      description: 'test',
      type: 'clothing',
      priceRange: { min: 10, max: 10 },
      options: [],
      variants: [],
      images: [],
      tags: []
    };
    const ds = createMockDataSource([product]);
    const svc = new CatalogService(ds);

    await svc.loadProducts();
    (svc as any).cacheTimestamp = Date.now() - 130000; // 2min 10s ago

    await svc.loadProducts();
    expect(ds.loadCount).toBe(2);
  });

  it('should never cache inventory — checkStock always calls data source', async () => {
    const product: Product = {
      id: 'prod-1',
      title: 'Test',
      description: 'test',
      type: 'clothing',
      priceRange: { min: 10, max: 10 },
      options: [{ name: 'Size', values: ['M'] }],
      variants: [
        {
          id: 'var-1',
          title: 'Test - M',
          sku: 'SKU-TEST-1',
          price: 10,
          options: { Size: 'M' },
          inventory: { available: true, quantity: 25, lowStockThreshold: 5, isLowStock: false }
        }
      ],
      images: [],
      tags: []
    };
    const ds = createMockDataSource([product]);
    const svc = new CatalogService(ds);

    // First loadProducts caches result
    await svc.loadProducts();
    expect(ds.loadCount).toBe(1);

    // checkStock should bypass cache and call data source again
    await svc.checkStock('var-1');
    expect(ds.loadCount).toBe(2);

    // Another checkStock call — should still bypass cache
    await svc.checkStock('var-1');
    expect(ds.loadCount).toBe(3);
  });
});

describe('clearCache', () => {
  it('should clear the cache and force reload on next call', async () => {
    const product: Product = {
      id: 'prod-1',
      title: 'Test',
      description: 'test',
      type: 'clothing',
      priceRange: { min: 10, max: 10 },
      options: [],
      variants: [],
      images: [],
      tags: []
    };
    const ds = createMockDataSource([product]);
    const svc = new CatalogService(ds);

    await svc.loadProducts();
    expect(ds.loadCount).toBe(1);

    svc.clearCache();
    expect((svc as any).cachedProducts).toBeNull();
    expect((svc as any).cacheTimestamp).toBeNull();

    await svc.loadProducts();
    expect(ds.loadCount).toBe(2);
  });
});

describe('error handling', () => {
  it('should propagate data source errors', async () => {
    const errorDs: CatalogDataSource = {
      async loadProducts(): Promise<Product[]> {
        throw new Error('Shopify API unavailable');
      }
    };
    const svc = new CatalogService(errorDs);

    await expect(svc.loadProducts()).rejects.toThrow('Shopify API unavailable');
  });

  it('should re-throw errors from checkStock when data source fails', async () => {
    const errorDs: CatalogDataSource = {
      async loadProducts(): Promise<Product[]> {
        throw new Error('Network error');
      }
    };
    const svc = new CatalogService(errorDs);

    await expect(svc.checkStock('var-1')).rejects.toThrow('Network error');
  });

  it('should throw when loadProducts fails in checkVariantByOptions', async () => {
    const errorDs: CatalogDataSource = {
      async loadProducts(): Promise<Product[]> {
        throw new Error('Database connection failed');
      }
    };
    const svc = new CatalogService(errorDs);

    await expect(
      svc.checkVariantByOptions('prod-1', { Size: 'M' })
    ).rejects.toThrow('Database connection failed');
  });
});

describe('searchProducts edge cases', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      title: 'Classic Hoodie',
      description: 'A comfortable cotton hoodie',
      type: 'clothing',
      priceRange: { min: 49.99, max: 59.99 },
      options: [],
      variants: [],
      images: [],
      tags: ['hoodie', 'featured']
    },
    {
      id: 'prod-2',
      title: 'Canvas Tote',
      description: 'Sturdy canvas tote bag',
      type: 'accessories',
      priceRange: { min: 24.99, max: 24.99 },
      options: [],
      variants: [],
      images: [],
      tags: ['bag', 'everyday']
    }
  ];

  it('should return all products when tags array is empty', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    const results = await svc.searchProducts({ tags: [] });
    expect(results).toHaveLength(2); // All products returned
  });

  it('should include products at exact minPrice boundary', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    // Classic Hoodie min price is 49.99 — should be included at exact boundary
    const results = await svc.searchProducts({ minPrice: 49.99 });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-1');
  });

  it('should include products at exact maxPrice boundary', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    // Canvas Tote max price is 24.99 — should be included at exact boundary
    const results = await svc.searchProducts({ maxPrice: 24.99 });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-2');
  });

  it('should exclude products below minPrice', async () => {
    const ds = createMockDataSource(mockProducts);
    const svc = new CatalogService(ds);

    // Classic Hoodie min priceRange.min is 49.99, so 49.99 >= 50 is false → excluded
    const results = await svc.searchProducts({ minPrice: 50 });
    expect(results).toHaveLength(0);
  });
});
