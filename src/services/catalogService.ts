// src/services/catalogService.ts
import {
  Product,
  StockInfo,
  CatalogQuery,
  CatalogDataSource,
  VariantResolution
} from './types';

import { SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS } from './mockCatalogData';

function normalizeOptionValue(
  userValue: string,
  synonymTable: Record<string, string[]>
): string | null {
  const lower = userValue.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(synonymTable)) {
    if (canonical.toLowerCase() === lower) return canonical;
    if (synonyms.some(s => s.toLowerCase() === lower)) return canonical;
  }
  return null;
}

function resolveSynonyms(
  optionName: string,
  value: string
): string | null {
  const lower = value.toLowerCase().trim();
  const tables = [SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS];
  for (const table of tables) {
    const result = normalizeOptionValue(lower, table);
    if (result) return result;
  }
  return null;
}

export class CatalogService {
  private dataSource: CatalogDataSource;
  private cachedProducts: Product[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL_MS = 120000; // 2 minutes

  constructor(dataSource: CatalogDataSource) {
    this.dataSource = dataSource;
  }

  async loadProducts(): Promise<Product[]> {
    if (this.cachedProducts && this.cacheTimestamp) {
      const elapsed = Date.now() - this.cacheTimestamp;
      if (elapsed < this.CACHE_TTL_MS) {
        return this.cachedProducts;
      }
    }

    const products = await this.dataSource.loadProducts();
    this.cachedProducts = products;
    this.cacheTimestamp = Date.now();
    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const products = await this.loadProducts();
    return products.find(p => p.id === id);
  }

  async searchProducts(query: CatalogQuery): Promise<Product[]> {
    const products = await this.loadProducts();
    let results = [...products];

    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (query.type) {
      results = results.filter(p => p.type === query.type);
    }

    if (query.minPrice !== undefined) {
      results = results.filter(p => p.priceRange.min >= query.minPrice!);
    }

    if (query.maxPrice !== undefined) {
      results = results.filter(p => p.priceRange.max <= query.maxPrice!);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(p =>
        query.tags!.some(tag => p.tags.includes(tag))
      );
    }

    return results;
  }

  async checkStock(variantId: string): Promise<StockInfo | null> {
    // Never cache inventory — always fetch fresh from data source
    const products = await this.dataSource.loadProducts();
    for (const product of products) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        return { ...variant.inventory };
      }
    }
    return null;
  }

  async checkVariantByOptions(
    productId: string,
    options: Record<string, string>
  ): Promise<VariantResolution | null> {
    const products = await this.loadProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const resolvedOptions: Record<string, string> = {};
    for (const [optName, optValue] of Object.entries(options)) {
      const resolved = resolveSynonyms(optName, optValue);
      if (resolved) {
        resolvedOptions[optName] = resolved;
      } else {
        resolvedOptions[optName] = optValue;
      }
    }

    const variant = product.variants.find(v => {
      for (const [key, value] of Object.entries(resolvedOptions)) {
        const variantValue = v.options[key];
        if (!variantValue) return false;
        const variantLower = variantValue.toLowerCase();
        const valueLower = value.toLowerCase();
        if (variantLower !== valueLower) {
          const resolvedFromVariant = resolveSynonyms(key, variantValue);
          if (!resolvedFromVariant || resolvedFromVariant.toLowerCase() !== valueLower) {
            return false;
          }
        }
      }
      return true;
    });

    if (!variant) return null;

    return {
      product,
      variant,
      matchedOptions: resolvedOptions
    };
  }

  clearCache(): void {
    this.cachedProducts = null;
    this.cacheTimestamp = null;
  }
}
