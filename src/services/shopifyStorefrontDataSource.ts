import type { CatalogDataSource, Product, Variant } from './types';

interface StorefrontEdge<T> {
  node: T;
}

interface PriceNode {
  amount: string;
  currencyCode: string;
}

interface SelectedOptionNode {
  name: string;
  value: string;
}

interface VariantNode {
  id: string;
  title: string;
  sku?: string;
  price: PriceNode;
  compareAtPrice?: PriceNode;
  quantityAvailable: number;
  availableForSale: boolean;
  selectedOptions: SelectedOptionNode[];
}

interface OptionNode {
  name: string;
  values: string[];
}

interface ProductNode {
  id: string;
  title: string;
  description?: string;
  productType?: string;
  tags?: string[];
  options: OptionNode[];
  priceRange: {
    minVariantPrice: PriceNode;
    maxVariantPrice: PriceNode;
  };
  variants: {
    edges: StorefrontEdge<VariantNode>[];
  };
  images?: {
    edges: StorefrontEdge<{ url: string; altText: string | null }>[];
  };
}

interface StorefrontProductsResponse {
  data?: {
    products?: {
      edges: StorefrontEdge<ProductNode>[];
    };
  };
  errors?: Array<{ message: string }>;
}

export interface ShopifyStorefrontDataSourceOptions {
  storeDomain: string;
  storefrontToken?: string;
}

export class ShopifyStorefrontDataSource implements CatalogDataSource {
  private storeDomain: string;
  private storefrontToken: string;
  private apiVersion = '2026-04';

  constructor(options: ShopifyStorefrontDataSourceOptions) {
    this.storeDomain = options.storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.storefrontToken = options.storefrontToken ?? '';
  }

  private get endpoint(): string {
    return `https://${this.storeDomain}/api/${this.apiVersion}/graphql.json`;
  }

  async loadProducts(): Promise<Product[]> {
    const query = `
      query Products {
        products(first: 50) {
          edges {
            node {
              id
              title
              description
              productType
              tags
              options { name values }
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                    price { amount currencyCode }
                    compareAtPrice { amount currencyCode }
                    quantityAvailable
                    availableForSale
                    selectedOptions { name value }
                  }
                }
              }
              images(first: 5) {
                edges {
                  node { url altText }
                }
              }
            }
          }
        }
      }`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.storefrontToken) {
      headers['X-Shopify-Storefront-Access-Token'] = this.storefrontToken;
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(
        `Storefront API error: ${response.status} ${response.statusText}`
      );
    }

    const json = (await response.json()) as StorefrontProductsResponse;

    if (json.errors) {
      throw new Error(
        `Storefront API error: ${json.errors.map((e) => e.message).join('; ')}`
      );
    }

    return (json.data?.products?.edges ?? []).map((edge) =>
      this.mapProduct(edge.node)
    );
  }

  private mapProduct(node: ProductNode): Product {
    const variants: Variant[] = (node.variants?.edges ?? []).map((ve) =>
      this.mapVariant(ve.node)
    );

    const prices = variants.map((v) => v.price);

    return {
      id: node.id,
      title: node.title,
      description: node.description ?? '',
      type: node.productType ?? '',
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
      options: (node.options ?? []).map((o) => ({
        name: o.name,
        values: o.values,
      })),
      variants,
      images: (node.images?.edges ?? []).map((ie) => ({
        url: ie.node.url,
        alt: ie.node.altText ?? '',
      })),
      tags: node.tags ?? [],
    };
  }

  private mapVariant(node: VariantNode): Variant {
    return {
      id: node.id,
      title: node.title,
      sku: node.sku ?? '',
      price: parseFloat(node.price?.amount ?? '0'),
      compareAtPrice: node.compareAtPrice
        ? parseFloat(node.compareAtPrice.amount)
        : undefined,
      options: (node.selectedOptions ?? []).reduce<Record<string, string>>(
        (acc, o) => {
          acc[o.name] = o.value;
          return acc;
        },
        {}
      ),
      inventory: {
        available: node.availableForSale ?? false,
        quantity: node.quantityAvailable ?? 0,
        lowStockThreshold: 5,
        isLowStock:
          (node.quantityAvailable ?? 0) > 0 &&
          (node.quantityAvailable ?? 0) <= 5,
      },
    };
  }
}
