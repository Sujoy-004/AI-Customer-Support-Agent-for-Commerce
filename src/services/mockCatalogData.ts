// src/services/mockCatalogData.ts
import type { Product, ProductOption, Variant, StockInfo, ProductImage, CatalogDataSource } from './types';
import {
  COLOR_SYNONYM_TABLE,
  SIZE_SYNONYM_TABLE,
  MATERIAL_SYNONYM_TABLE,
} from '../config/synonyms/index';

function buildSynonymRecord(
  table: Array<{ canonical: string; aliases: string[] }>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const entry of table) {
    result[entry.canonical] = entry.aliases;
  }
  return result;
}

export const SIZE_SYNONYMS: Record<string, string[]> = buildSynonymRecord(SIZE_SYNONYM_TABLE);
export const COLOR_SYNONYMS: Record<string, string[]> = buildSynonymRecord(COLOR_SYNONYM_TABLE);
export const MATERIAL_SYNONYMS: Record<string, string[]> = buildSynonymRecord(MATERIAL_SYNONYM_TABLE);

export const ALL_SYNONYMS: Record<string, string[]> = {
  ...SIZE_SYNONYMS,
  ...COLOR_SYNONYMS,
  ...MATERIAL_SYNONYMS
};

/**
 * Build all variant combinations from product options, applying stock overrides.
 */
function generateVariants(
  productId: string,
  productTitle: string,
  options: ProductOption[],
  basePrice: number,
  priceVariation: Record<string, number>,
  stockOverrides: Record<string, Partial<StockInfo>>
): Variant[] {
  function combine(
    index: number,
    acc: Record<string, string>
  ): Record<string, string>[] {
    if (index >= options.length) {
      return [{ ...acc }];
    }
    const option = options[index];
    return option.values.flatMap(value =>
      combine(index + 1, { ...acc, [option.name]: value })
    );
  }

  const combos = combine(0, {});
  return combos.map((combo, idx) => {
    const key = Object.values(combo).join('_');
    const override = stockOverrides[key] || {};
    let price = basePrice;
    for (const optValue of Object.values(combo)) {
      price += priceVariation[optValue] || 0;
    }
    const num = (idx + 1).toString().padStart(2, '0');
    const variantId = `${productId}-${num}`;
    return {
      id: variantId,
      title: `${productTitle} - ${Object.values(combo).join(', ')}`,
      sku: `SKU-${variantId.replace(/-/g, '').toUpperCase()}`,
      price: Math.round(price * 100) / 100,
      options: { ...combo },
      inventory: {
        available: true,
        quantity: 50,
        lowStockThreshold: 5,
        isLowStock: false,
        ...override
      }
    };
  });
}

interface ProductDefinition {
  id: string;
  title: string;
  description: string;
  type: string;
  options: ProductOption[];
  basePrice: number;
  priceVariation: Record<string, number>;
  stockOverrides: Record<string, Partial<StockInfo>>;
  images: ProductImage[];
  tags: string[];
}

function buildProduct(def: ProductDefinition): Product {
  const variants = generateVariants(
    def.id,
    def.title,
    def.options,
    def.basePrice,
    def.priceVariation,
    def.stockOverrides
  );

  const prices = variants.map(v => v.price);
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    type: def.type,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    options: def.options,
    variants,
    images: def.images,
    tags: def.tags
  };
}

// ==============================
// Product definitions
// ==============================

function buildMockProducts(): Product[] {
  return [
    // 1. Classic Hoodie — Size/Color/Material, mix of stock states
    buildProduct({
      id: 'prod-1',
      title: 'Classic Hoodie',
      description: 'A comfortable cotton-blend hoodie with adjustable drawstrings and a front pouch pocket. Perfect for layering in cooler weather.',
      type: 'clothing',
      options: [
        { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
        { name: 'Color', values: ['Black', 'Gray', 'Navy'] },
        { name: 'Material', values: ['Cotton', 'Polyester'] }
      ],
      basePrice: 49.99,
      priceVariation: {
        'XL': 5.00,
        'Navy': 2.00
      },
      stockOverrides: {
        'M_Black_Cotton': { available: true, quantity: 25 },
        'M_Gray_Polyester': { available: true, quantity: 3, isLowStock: true },
        'L_Navy_Cotton': { available: true, quantity: 15 },
        'L_Black_Polyester': { available: false, quantity: 0, isLowStock: false },
        'XL_Gray_Cotton': { available: true, quantity: 8 },
        'XL_Navy_Polyester': { available: true, quantity: 0, isLowStock: false },
        'S_Gray_Cotton': { available: true, quantity: 2, isLowStock: true },
        'S_Black_Polyester': { available: true, quantity: 12 }
      },
      images: [
        { url: '/images/hoodie-1.jpg', alt: 'Classic Hoodie front view' },
        { url: '/images/hoodie-2.jpg', alt: 'Classic Hoodie back view' }
      ],
      tags: ['hoodie', 'cotton', 'casual', 'featured']
    }),

    // 2. Running Shoes — Size/Color only, some OOS
    buildProduct({
      id: 'prod-2',
      title: 'Running Shoes',
      description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Designed for everyday runs and training.',
      type: 'clothing',
      options: [
        { name: 'Shoe Size', values: ['8', '9', '10', '11'] },
        { name: 'Color', values: ['Black', 'White'] }
      ],
      basePrice: 89.99,
      priceVariation: {},
      stockOverrides: {
        '8_Black': { available: true, quantity: 15 },
        '8_White': { available: true, quantity: 4, isLowStock: true },
        '9_Black': { available: true, quantity: 20 },
        '9_White': { available: true, quantity: 10 },
        '10_Black': { available: false, quantity: 0, isLowStock: false },
        '10_White': { available: true, quantity: 5, isLowStock: true },
        '11_Black': { available: true, quantity: 2, isLowStock: true },
        '11_White': { available: false, quantity: 0, isLowStock: false }
      },
      images: [
        { url: '/images/shoes-1.jpg', alt: 'Running Shoes side view' }
      ],
      tags: ['shoes', 'running', 'athletic']
    }),

    // 3. Leather Belt — Color/Material, backordered
    buildProduct({
      id: 'prod-3',
      title: 'Leather Belt',
      description: 'Genuine leather belt with a polished brass buckle. Available in multiple widths and finishes for a timeless accessory.',
      type: 'accessories',
      options: [
        { name: 'Color', values: ['Black', 'Brown'] },
        { name: 'Material', values: ['Genuine Leather'] }
      ],
      basePrice: 34.99,
      priceVariation: {},
      stockOverrides: {
        'Black_Genuine Leather': { available: true, quantity: 30 },
        'Brown_Genuine Leather': { available: true, quantity: 0, isLowStock: false }
      },
      images: [
        { url: '/images/belt-1.jpg', alt: 'Leather Belt' }
      ],
      tags: ['belt', 'leather', 'accessories']
    }),

    // 4. Canvas Tote — Color only, in stock
    buildProduct({
      id: 'prod-4',
      title: 'Canvas Tote',
      description: 'Sturdy canvas tote bag with reinforced handles and an interior pocket. Ideal for groceries, books, or daily essentials.',
      type: 'accessories',
      options: [
        { name: 'Color', values: ['Natural', 'Black', 'Olive'] }
      ],
      basePrice: 24.99,
      priceVariation: {},
      stockOverrides: {
        'Natural': { available: true, quantity: 40 },
        'Black': { available: true, quantity: 35 },
        'Olive': { available: true, quantity: 28 }
      },
      images: [
        { url: '/images/tote-1.jpg', alt: 'Canvas Tote front view' }
      ],
      tags: ['tote', 'canvas', 'bag', 'everyday']
    }),

    // 5. Wool Scarf — Color/Material, low stock
    buildProduct({
      id: 'prod-5',
      title: 'Wool Scarf',
      description: 'Soft merino wool scarf with a classic knit pattern. Keeps you warm without the bulk.',
      type: 'accessories',
      options: [
        { name: 'Color', values: ['Gray', 'Burgundy'] },
        { name: 'Material', values: ['Wool', 'Acrylic Blend'] }
      ],
      basePrice: 29.99,
      priceVariation: {
        'Wool': 10.00,
        'Burgundy': 2.00
      },
      stockOverrides: {
        'Gray_Wool': { available: true, quantity: 4, isLowStock: true },
        'Gray_Acrylic Blend': { available: true, quantity: 12 },
        'Burgundy_Wool': { available: true, quantity: 2, isLowStock: true },
        'Burgundy_Acrylic Blend': { available: true, quantity: 3, isLowStock: true }
      },
      images: [
        { url: '/images/scarf-1.jpg', alt: 'Wool Scarf' }
      ],
      tags: ['scarf', 'wool', 'winter', 'accessories']
    }),

    // 6. Denim Jacket — Size/Color, some OOS
    buildProduct({
      id: 'prod-6',
      title: 'Denim Jacket',
      description: 'Classic denim jacket with button-front closure and chest pockets. A timeless layering piece for any wardrobe.',
      type: 'clothing',
      options: [
        { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
        { name: 'Color', values: ['Blue', 'Black'] }
      ],
      basePrice: 69.99,
      priceVariation: {
        'XL': 5.00
      },
      stockOverrides: {
        'S_Blue': { available: true, quantity: 10 },
        'S_Black': { available: false, quantity: 0, isLowStock: false },
        'M_Blue': { available: true, quantity: 3, isLowStock: true },
        'M_Black': { available: true, quantity: 18 },
        'L_Blue': { available: true, quantity: 14 },
        'L_Black': { available: true, quantity: 7 },
        'XL_Blue': { available: false, quantity: 0, isLowStock: false },
        'XL_Black': { available: true, quantity: 1, isLowStock: true }
      },
      images: [
        { url: '/images/jacket-1.jpg', alt: 'Denim Jacket front view' },
        { url: '/images/jacket-2.jpg', alt: 'Denim Jacket detail view' }
      ],
      tags: ['jacket', 'denim', 'casual', 'featured']
    }),

    // 7. Aviator Sunglasses — Color only, in stock
    buildProduct({
      id: 'prod-7',
      title: 'Aviator Sunglasses',
      description: 'Classic aviator sunglasses with UV400 protection and lightweight metal frames. A timeless style for sunny days.',
      type: 'accessories',
      options: [
        { name: 'Color', values: ['Gold', 'Silver', 'Black'] }
      ],
      basePrice: 19.99,
      priceVariation: {
        'Gold': 10.00
      },
      stockOverrides: {
        'Gold': { available: true, quantity: 45 },
        'Silver': { available: true, quantity: 30 },
        'Black': { available: true, quantity: 22 }
      },
      images: [
        { url: '/images/sunglasses-1.jpg', alt: 'Aviator Sunglasses' }
      ],
      tags: ['sunglasses', 'aviator', 'accessories', 'summer']
    })
  ];
}

export const MOCK_PRODUCTS: Product[] = buildMockProducts();

// ==============================
// Mock data source implementation
// ==============================

export class MockCatalogDataSource implements CatalogDataSource {
  private products: Product[] | null = null;

  async loadProducts(): Promise<Product[]> {
    if (!this.products) {
      this.products = buildMockProducts();
    }
    return this.products;
  }
}

export default new MockCatalogDataSource();
