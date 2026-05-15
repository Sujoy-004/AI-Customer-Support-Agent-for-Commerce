// src/services/types.ts
/**
 * Type definitions for policy service
 */

/**
 * Interface for policy data structure
 */
export interface PolicyData {
  shipping: {
    standard: string;
    express: string;
    international: string;
    freeShippingThreshold: number;
    processingTime: string;
  };
  warranty: {
    standardPeriod: string;
    extendedOptions: string[];
    coverageDetails: string;
    claimProcess: string;
  };
  returns: {
    returnWindow: string;
    conditionRequirements: string;
    refundMethod: string;
    exchangePolicy: string;
    restockingFee: string;
  };
}

/**
 * Enum for policy types
 */
export const PolicyType = {
  SHIPPING: 'shipping',
  WARRANTY: 'warranty',
  RETURNS: 'returns'
} as const;

export type PolicyType = typeof PolicyType[keyof typeof PolicyType];

// ==============================
// Catalog Types
// ==============================

/**
 * A single option on a product (e.g. Size, Color, Material)
 */
export interface ProductOption {
  name: string;
  values: string[];
}

/**
 * A product image
 */
export interface ProductImage {
  url: string;
  alt: string;
}

/**
 * Real-time stock information for a variant
 */
export interface StockInfo {
  available: boolean;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

/**
 * A product variant — SKU-level sellable unit
 */
export interface Variant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  options: Record<string, string>;
  inventory: StockInfo;
}

/**
 * A Shopify-style product with variants
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  type: string;
  priceRange: { min: number; max: number };
  options: ProductOption[];
  variants: Variant[];
  images: ProductImage[];
  tags: string[];
}

/**
 * Criteria for searching/filtering products
 */
export interface CatalogQuery {
  query?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

/**
 * Result of resolving a variant by option values
 */
export interface VariantResolution {
  product: Product;
  variant: Variant;
  matchedOptions: Record<string, string>;
}

/**
 * Swappable data source — mock or live Shopify API
 */
export interface CatalogDataSource {
  loadProducts(): Promise<Product[]>;
}