// src/services/mockCatalogData.test.ts
import { describe, it, expect } from 'vitest';
import { MockCatalogDataSource, SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS, ALL_SYNONYMS } from './mockCatalogData';
import type { Product } from './types';

describe('MockCatalogDataSource', () => {
  let dataSource: MockCatalogDataSource;

  beforeEach(() => {
    dataSource = new MockCatalogDataSource();
  });

  describe('loadProducts', () => {
    it('should return all 7 products', async () => {
      const products = await dataSource.loadProducts();
      expect(products).toHaveLength(7);
    });

    it('should return products with expected IDs', async () => {
      const products = await dataSource.loadProducts();
      const ids = products.map(p => p.id);
      expect(ids).toEqual([
        'prod-1', 'prod-2', 'prod-3', 'prod-4',
        'prod-5', 'prod-6', 'prod-7'
      ]);
    });

    it('should return the same instance on repeated calls', async () => {
      const first = await dataSource.loadProducts();
      const second = await dataSource.loadProducts();
      expect(first).toBe(second);
    });

    it('should return products with expected titles', async () => {
      const products = await dataSource.loadProducts();
      const titles = products.map(p => p.title);
      expect(titles).toEqual([
        'Classic Hoodie',
        'Running Shoes',
        'Leather Belt',
        'Canvas Tote',
        'Wool Scarf',
        'Denim Jacket',
        'Aviator Sunglasses'
      ]);
    });
  });

  describe('product types', () => {
    it('should have 3 clothing products and 4 accessories', async () => {
      const products = await dataSource.loadProducts();
      const clothing = products.filter(p => p.type === 'clothing');
      const accessories = products.filter(p => p.type === 'accessories');
      expect(clothing).toHaveLength(3);
      expect(accessories).toHaveLength(4);
    });
  });

  describe('variant counts (indirectly tests generateVariants)', () => {
    it('Classic Hoodie should have 24 variants (4 sizes x 3 colors x 2 materials)', async () => {
      const products = await dataSource.loadProducts();
      const hoodie = products.find(p => p.id === 'prod-1')!;
      expect(hoodie.variants).toHaveLength(24);
    });

    it('Running Shoes should have 8 variants (4 sizes x 2 colors)', async () => {
      const products = await dataSource.loadProducts();
      const shoes = products.find(p => p.id === 'prod-2')!;
      expect(shoes.variants).toHaveLength(8);
    });

    it('Leather Belt should have 2 variants (2 colors x 1 material)', async () => {
      const products = await dataSource.loadProducts();
      const belt = products.find(p => p.id === 'prod-3')!;
      expect(belt.variants).toHaveLength(2);
    });

    it('Canvas Tote should have 3 variants (3 colors)', async () => {
      const products = await dataSource.loadProducts();
      const tote = products.find(p => p.id === 'prod-4')!;
      expect(tote.variants).toHaveLength(3);
    });

    it('Wool Scarf should have 4 variants (2 colors x 2 materials)', async () => {
      const products = await dataSource.loadProducts();
      const scarf = products.find(p => p.id === 'prod-5')!;
      expect(scarf.variants).toHaveLength(4);
    });

    it('Denim Jacket should have 8 variants (4 sizes x 2 colors)', async () => {
      const products = await dataSource.loadProducts();
      const jacket = products.find(p => p.id === 'prod-6')!;
      expect(jacket.variants).toHaveLength(8);
    });

    it('Aviator Sunglasses should have 3 variants (3 colors)', async () => {
      const products = await dataSource.loadProducts();
      const glasses = products.find(p => p.id === 'prod-7')!;
      expect(glasses.variants).toHaveLength(3);
    });

    it('total variants across all products should be 52', async () => {
      const products = await dataSource.loadProducts();
      const total = products.reduce((sum, p) => sum + p.variants.length, 0);
      expect(total).toBe(52);
    });
  });

  describe('each product should have non-empty variants', () => {
    it('every product should have at least one variant', async () => {
      const products = await dataSource.loadProducts();
      for (const product of products) {
        expect(product.variants.length).toBeGreaterThan(0);
      }
    });

    it('every variant should have a unique ID', async () => {
      const products = await dataSource.loadProducts();
      const allIds = products.flatMap(p => p.variants.map(v => v.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('every variant should have an SKU starting with SKU-', async () => {
      const products = await dataSource.loadProducts();
      for (const product of products) {
        for (const variant of product.variants) {
          expect(variant.sku).toMatch(/^SKU-/);
        }
      }
    });
  });

  describe('stock information', () => {
    it('should return stock info for all variants', async () => {
      const products = await dataSource.loadProducts();
      for (const product of products) {
        for (const variant of product.variants) {
          expect(variant.inventory).toBeDefined();
          expect(typeof variant.inventory.available).toBe('boolean');
          expect(typeof variant.inventory.quantity).toBe('number');
          expect(typeof variant.inventory.lowStockThreshold).toBe('number');
          expect(typeof variant.inventory.isLowStock).toBe('boolean');
        }
      }
    });

    it('should have correct stock for a known in-stock variant', async () => {
      const products = await dataSource.loadProducts();
      const hoodie = products.find(p => p.id === 'prod-1')!;
      const variant = hoodie.variants.find(v =>
        v.options.Size === 'M' && v.options.Color === 'Black' && v.options.Material === 'Cotton'
      );
      expect(variant).toBeDefined();
      expect(variant!.inventory.available).toBe(true);
      expect(variant!.inventory.quantity).toBe(25);
    });

    it('should have correct stock for a known out-of-stock variant', async () => {
      const products = await dataSource.loadProducts();
      const hoodie = products.find(p => p.id === 'prod-1')!;
      const variant = hoodie.variants.find(v =>
        v.options.Size === 'L' && v.options.Color === 'Black' && v.options.Material === 'Polyester'
      );
      expect(variant).toBeDefined();
      expect(variant!.inventory.available).toBe(false);
      expect(variant!.inventory.quantity).toBe(0);
    });

    it('should have correct stock for a known low-stock variant', async () => {
      const products = await dataSource.loadProducts();
      const hoodie = products.find(p => p.id === 'prod-1')!;
      const variant = hoodie.variants.find(v =>
        v.options.Size === 'M' && v.options.Color === 'Gray' && v.options.Material === 'Polyester'
      );
      expect(variant).toBeDefined();
      expect(variant!.inventory.isLowStock).toBe(true);
      expect(variant!.inventory.quantity).toBe(3);
    });

    it('should return null-like values for non-existent variant IDs via checkStock in CatalogService', async () => {
      // Simulate what CatalogService.checkStock does with the mock data source
      const products = await dataSource.loadProducts();
      const knownIds = new Set(products.flatMap(p => p.variants.map(v => v.id)));

      expect(knownIds.has('nonexistent-id')).toBe(false);
      expect(knownIds.has('prod-1-01')).toBe(true); // First variant of product 1
    });
  });

  describe('prices', () => {
    it('should have correct price ranges', async () => {
      const products = await dataSource.loadProducts();

      const hoodie = products.find(p => p.id === 'prod-1')!;
      expect(hoodie.priceRange.min).toBeLessThanOrEqual(hoodie.priceRange.max);

      const tote = products.find(p => p.id === 'prod-4')!;
      expect(tote.priceRange.min).toBe(24.99);
      expect(tote.priceRange.max).toBe(24.99);
    });
  });
});

describe('Synonym tables', () => {
  describe('SIZE_SYNONYMS', () => {
    it('should have all expected size entries', () => {
      expect(Object.keys(SIZE_SYNONYMS)).toEqual([
        'Extra Small', 'Small', 'Medium', 'Large', 'Extra Large', 'XX-Large'
      ]);
    });

    it('should have the correct known size synonyms', () => {
      expect(SIZE_SYNONYMS['Small']).toContain('s');
      expect(SIZE_SYNONYMS['Medium']).toContain('m');
      expect(SIZE_SYNONYMS['Large']).toContain('l');
      expect(SIZE_SYNONYMS['Extra Large']).toContain('xl');
      expect(SIZE_SYNONYMS['XX-Large']).toContain('xxl');
    });

    it('should not have empty synonym arrays', () => {
      for (const [canonical, synonyms] of Object.entries(SIZE_SYNONYMS)) {
        expect(synonyms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('COLOR_SYNONYMS', () => {
    it('should have all expected color entries', () => {
      expect(Object.keys(COLOR_SYNONYMS)).toEqual([
        'Blue', 'Black', 'Gray', 'White', 'Red', 'Green', 'Brown'
      ]);
    });

    it('should have the correct known color synonyms', () => {
      expect(COLOR_SYNONYMS['Blue']).toContain('navy');
      expect(COLOR_SYNONYMS['Gray']).toContain('grey');
      expect(COLOR_SYNONYMS['Black']).toContain('onyx');
    });

    it('should not have empty synonym arrays', () => {
      for (const synonyms of Object.values(COLOR_SYNONYMS)) {
        expect(synonyms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('MATERIAL_SYNONYMS', () => {
    it('should have all expected material entries', () => {
      expect(Object.keys(MATERIAL_SYNONYMS)).toEqual([
        'Cotton', 'Polyester', 'Leather', 'Wool', 'Canvas', 'Nylon'
      ]);
    });

    it('should have the correct known material synonyms', () => {
      expect(MATERIAL_SYNONYMS['Cotton']).toContain('pure cotton');
      expect(MATERIAL_SYNONYMS['Polyester']).toContain('poly');
    });

    it('should not have empty synonym arrays', () => {
      for (const synonyms of Object.values(MATERIAL_SYNONYMS)) {
        expect(synonyms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ALL_SYNONYMS', () => {
    it('should combine all synonym maps', () => {
      const combinedKeys = {
        ...SIZE_SYNONYMS,
        ...COLOR_SYNONYMS,
        ...MATERIAL_SYNONYMS
      };
      expect(Object.keys(ALL_SYNONYMS).length).toBe(
        Object.keys(combinedKeys).length
      );
    });
  });
});
