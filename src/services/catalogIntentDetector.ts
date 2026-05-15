// src/services/catalogIntentDetector.ts
import { CatalogService } from './catalogService';
import type { Product, Variant, StockInfo } from './types';
import { SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS } from './mockCatalogData';

export type CatalogIntent = 'stock_check' | 'sizing_inquiry' | 'product_search' | 'variant_lookup';

export type ResolvedQuery =
  | { type: 'exact'; intent: CatalogIntent; product: Product; variant: Variant; stock: StockInfo }
  | { type: 'partial'; intent: CatalogIntent; product: Product; options: Record<string, string>; candidates: Variant[] }
  | { type: 'product_only'; intent: CatalogIntent; product: Product; variants: Variant[] }
  | { type: 'search_results'; intent: 'product_search'; products: Product[]; totalCount: number }
  | { type: 'ambiguous'; intent: CatalogIntent; message: string; possibleOptions: Record<string, string[]> }
  | { type: 'not_found'; intent: CatalogIntent; message: string; suggestions: Product[] }
  | { type: 'context_expired'; message: string }
  | { type: 'not_catalog'; reason: string };

interface CatalogConversationContext {
  product: Product;
  intent: CatalogIntent;
  options: Record<string, string>;
  turnCount: number;
  timestamp: number;
}

const EXCLUSION_KEYWORDS = [
  'return', 'refund', 'exchange', 'warranty claim',
  'order status', 'tracking', 'cancel order'
];

export function formatCatalogResponse(query: string, result: ResolvedQuery): string {
  switch (result.type) {
    case 'exact': {
      const stockBadge = formatStockBadge(result.stock);
      const priceInfo = result.variant.compareAtPrice
        ? `$${result.variant.price} (was $${result.variant.compareAtPrice})`
        : `$${result.variant.price}`;
      return `${result.product.title} — ${result.variant.title.split(' - ')[1] || result.variant.title}\n${priceInfo} ${stockBadge}`;
    }

    case 'partial': {
      const resolvedParts = Object.entries(result.options).map(
        ([opt, val]) => `${opt}: ${val}`
      );
      const missing = result.product.options
        .filter(o => !result.options[o.name])
        .map(o => o.name);
      const optionsSummary = result.product.options.map(o => {
        if (result.options[o.name]) {
          return `${o.name}: ${result.options[o.name]}`;
        }
        return `${o.name}: ${o.values.join(', ')}`;
      }).join(' | ');

      let msg = `We have the ${result.product.title}. Here are the available options:\n${optionsSummary}\n`;
      if (missing.length > 0) {
        msg += `Which ${missing.join(' and ')} would you like?`;
      } else {
        msg += `We have ${result.candidates.length} combination${result.candidates.length !== 1 ? 's' : ''} available.`;
      }
      return msg;
    }

    case 'product_only': {
      const priceRange = result.product.priceRange.min === result.product.priceRange.max
        ? `$${result.product.priceRange.min}`
        : `$${result.product.priceRange.min} – $${result.product.priceRange.max}`;
      const optionsSummary = result.product.options.map(o =>
        `${o.name}: ${o.values.join(', ')}`
      ).join('\n');
      const stockSummary = summarizeStock(result.product.variants);
      return `${result.product.title}\n${result.product.description}\nPrice: ${priceRange}\n\nOptions:\n${optionsSummary}\n\n${stockSummary}`;
    }

    case 'search_results': {
      const lines = result.products.slice(0, 5).map((p, i) => {
        const price = p.priceRange.min === p.priceRange.max
          ? `$${p.priceRange.min}`
          : `$${p.priceRange.min} – $${p.priceRange.max}`;
        return `${i + 1}. ${p.title} — ${price}`;
      });
      const remainder = result.totalCount > 5 ? `\n...and ${result.totalCount - 5} more.` : '';
      return `I found ${result.totalCount} product${result.totalCount !== 1 ? 's' : ''}:\n${lines.join('\n')}${remainder}`;
    }

    case 'ambiguous': {
      return result.message;
    }

    case 'not_found': {
      let msg = result.message;
      if (result.suggestions.length > 0) {
        const suggestionNames = result.suggestions.slice(0, 5).map(p =>
          `- ${p.title} ($${p.priceRange.min} – $${p.priceRange.max})`
        ).join('\n');
        msg += `\n\nYou might be interested in:\n${suggestionNames}`;
      }
      return msg;
    }

    case 'context_expired': {
      return result.message;
    }

    case 'not_catalog': {
      return '';
    }
  }
}

function formatStockBadge(stock: StockInfo): string {
  if (!stock.available || stock.quantity === 0) {
    return '[Out of Stock]';
  }
  if (stock.isLowStock) {
    return `[Only ${stock.quantity} left!]`;
  }
  return `[In Stock (${stock.quantity} available)]`;
}

function summarizeStock(variants: Variant[]): string {
  const inStock = variants.filter(v => v.inventory.available && v.inventory.quantity > 0);
  const lowStock = variants.filter(v => v.inventory.isLowStock);
  const oos = variants.filter(v => !v.inventory.available || v.inventory.quantity === 0);

  const parts: string[] = [];
  if (inStock.length > 0) parts.push(`${inStock.length} variant${inStock.length !== 1 ? 's' : ''} in stock`);
  if (lowStock.length > 0) parts.push(`${lowStock.length} low on stock`);
  if (oos.length > 0) parts.push(`${oos.length} out of stock`);

  return parts.length > 0 ? `Stock: ${parts.join(', ')}.` : '';
}

function getSynonymTableForOption(optionName: string): Record<string, string[]> {
  const lower = optionName.toLowerCase();
  if (lower.includes('size') || lower.includes('shoe size')) return SIZE_SYNONYMS;
  if (lower.includes('color') || lower.includes('colour')) return COLOR_SYNONYMS;
  if (lower.includes('material') || lower.includes('fabric')) return MATERIAL_SYNONYMS;
  return {};
}

function normalizeOptionValue(value: string, synonymTable: Record<string, string[]>): string | null {
  const lower = value.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(synonymTable)) {
    if (canonical.toLowerCase() === lower) return canonical;
    if (synonyms.some(s => s.toLowerCase() === lower)) return canonical;
  }
  return null;
}

export class CatalogIntentDetector {
  private catalogService: CatalogService;
  private context: CatalogConversationContext | null = null;
  private readonly CONTEXT_TTL_MS = 300000;
  private readonly MAX_CONTEXT_TURNS = 3;
  private readonly SUGGESTION_LIMIT = 5;
  private readonly PRICE_RANGE_FRACTION = 0.2;

  private readonly INTENT_GROUPS: Record<string, { includes: string[]; excludes: string[] }> = {
    stock_check: {
      includes: [
        'stock', 'available', 'in stock', 'backorder', 'restock',
        'inventory', 'how many', 'still have'
      ],
      excludes: ['return', 'refund', 'exchange']
    },
    sizing_inquiry: {
      includes: [
        'size', 'sizing', 'fit', 'measurement', 'dimension',
        'small', 'medium', 'large', 'xs', 'xl', 'xxl',
        'extra small', 'extra large', 'plus size'
      ],
      excludes: ['shipping size', 'package size']
    },
    product_search: {
      includes: [
        'have', 'carry', 'sell', 'product', 'looking for',
        'got any', 'do you', 'can i get', 'is there', 'offer', 'show'
      ],
      excludes: ['return', 'refund', 'warranty']
    }
  };

  constructor(catalogService: CatalogService) {
    this.catalogService = catalogService;
  }

  async resolveQuery(query: string): Promise<ResolvedQuery> {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return { type: 'not_catalog', reason: 'Empty query' };
    }

    if (this.isContextExpired()) {
      this.clearContext();
      return { type: 'context_expired', message: 'Your previous product inquiry has expired. Please start your search again.' };
    }

    if (this.hasStrongExclusionKeywords(lowerQuery)) {
      return { type: 'not_catalog', reason: 'Query relates to orders, returns, or refunds' };
    }

    const detectedIntent = this.detectIntent(lowerQuery);

    const searchResults = await this.searchProducts(query);

    const contextProduct = this.context?.product ?? null;
    const hasOptionTerms = contextProduct
      ? this.hasProductOptionTerms(lowerQuery, contextProduct)
      : false;
    const canUseContext = this.context !== null && hasOptionTerms && searchResults.length === 0;

    if (!detectedIntent && searchResults.length === 0 && !canUseContext) {
      return { type: 'not_catalog', reason: 'No catalog-related content detected' };
    }

    if (detectedIntent === 'product_search' && searchResults.length === 0 && !canUseContext) {
      const allProducts = await this.catalogService.loadProducts();
      return {
        type: 'search_results',
        intent: 'product_search',
        products: allProducts,
        totalCount: allProducts.length
      };
    }

    if (searchResults.length === 0 && !canUseContext) {
      return {
        type: 'not_found',
        intent: detectedIntent ?? 'product_search',
        message: `Sorry, we don't carry that.`,
        suggestions: []
      };
    }

    let targetProduct: Product;
    let baseIntent: CatalogIntent;
    let accumulatedOptions: Record<string, string>;

    if (canUseContext && this.context) {
      targetProduct = this.context.product;
      baseIntent = this.context.intent;
      accumulatedOptions = { ...this.context.options };
    } else {
      targetProduct = searchResults[0];
      baseIntent = detectedIntent ?? 'product_search';
      accumulatedOptions = {};
    }

    const newOptions = this.extractOptions(targetProduct, lowerQuery);

    const mergedOptions: Record<string, string> = {};
    for (const key of Object.keys(accumulatedOptions)) {
      mergedOptions[key] = accumulatedOptions[key];
    }
    for (const [key, value] of Object.entries(newOptions)) {
      mergedOptions[key] = value;
    }

    const requiredOptionNames = targetProduct.options.map(o => o.name);
    const resolvedOptionNames = Object.keys(mergedOptions);
    const fullyResolvedCount = requiredOptionNames.filter(n => resolvedOptionNames.includes(n)).length;
    const totalRequired = requiredOptionNames.length;

    if (searchResults.length > 1 && !canUseContext && fullyResolvedCount === 0 && baseIntent === 'product_search') {
      return {
        type: 'search_results',
        intent: 'product_search',
        products: searchResults,
        totalCount: searchResults.length
      };
    }

    if (fullyResolvedCount === 0) {
      this.setContext(targetProduct, baseIntent, {});
      return {
        type: 'product_only',
        intent: baseIntent,
        product: targetProduct,
        variants: targetProduct.variants
      };
    }

    const variantResolution = await this.catalogService.checkVariantByOptions(
      targetProduct.id,
      mergedOptions
    );

    if (variantResolution && fullyResolvedCount >= totalRequired) {
      this.setContext(targetProduct, 'variant_lookup', mergedOptions);
      return {
        type: 'exact',
        intent: 'variant_lookup',
        product: targetProduct,
        variant: variantResolution.variant,
        stock: variantResolution.variant.inventory
      };
    }

    if (variantResolution && fullyResolvedCount > 0 && fullyResolvedCount < totalRequired) {
      const candidates = targetProduct.variants.filter(v => {
        for (const [key, value] of Object.entries(mergedOptions)) {
          const vOpt = v.options[key];
          if (!vOpt || vOpt.toLowerCase() !== value.toLowerCase()) return false;
        }
        return true;
      });

      this.setContext(targetProduct, baseIntent, mergedOptions);
      return {
        type: 'partial',
        intent: baseIntent,
        product: targetProduct,
        options: mergedOptions,
        candidates
      };
    }

    const unresolvedOptions: Record<string, string[]> = {};
    for (const opt of targetProduct.options) {
      if (!resolvedOptionNames.includes(opt.name)) {
        unresolvedOptions[opt.name] = opt.values;
      }
    }

    if (Object.keys(unresolvedOptions).length > 0 && fullyResolvedCount > 0) {
      const candidates = targetProduct.variants.filter(v => {
        for (const [key, value] of Object.entries(mergedOptions)) {
          const vOpt = v.options[key];
          if (!vOpt || vOpt.toLowerCase() !== value.toLowerCase()) {
            return false;
          }
        }
        return true;
      });

      this.setContext(targetProduct, baseIntent, mergedOptions);
      return {
        type: 'partial',
        intent: baseIntent,
        product: targetProduct,
        options: mergedOptions,
        candidates
      };
    }

    if (Object.keys(unresolvedOptions).length > 0 && fullyResolvedCount === 0) {
      return {
        type: 'ambiguous',
        intent: baseIntent,
        message: buildAmbiguousMessage(targetProduct, unresolvedOptions),
        possibleOptions: unresolvedOptions
      };
    }

    const allOptions: Record<string, string[]> = {};
    for (const opt of targetProduct.options) {
      allOptions[opt.name] = opt.values;
    }

    return {
      type: 'ambiguous',
      intent: baseIntent,
      message: buildAmbiguousMessage(targetProduct, allOptions),
      possibleOptions: allOptions
    };
  }

  clearContext(): void {
    this.context = null;
  }

  getContext(): CatalogConversationContext | null {
    return this.context;
  }

  private setContext(product: Product, intent: CatalogIntent, options: Record<string, string>): void {
    if (this.context) {
      this.context = {
        product,
        intent,
        options,
        turnCount: this.context.turnCount + 1,
        timestamp: Date.now()
      };
    } else {
      this.context = {
        product,
        intent,
        options,
        turnCount: 1,
        timestamp: Date.now()
      };
    }
  }

  private isContextExpired(): boolean {
    if (!this.context) return false;
    const elapsed = Date.now() - this.context.timestamp;
    if (elapsed > this.CONTEXT_TTL_MS) return true;
    if (this.context.turnCount >= this.MAX_CONTEXT_TURNS) return true;
    return false;
  }

  private hasStrongExclusionKeywords(lowerQuery: string): boolean {
    const exclusionCount = EXCLUSION_KEYWORDS.filter(k => lowerQuery.includes(k)).length;
    if (exclusionCount === 0) return false;

    const catalogKeywords = [
      'stock', 'available', 'in stock', 'size', 'fit',
      'have', 'carry', 'sell', 'product', 'looking for'
    ];
    const catalogCount = catalogKeywords.filter(k => lowerQuery.includes(k)).length;

    return exclusionCount >= catalogCount;
  }

  private detectIntent(lowerQuery: string): CatalogIntent | null {
    let bestIntent: CatalogIntent | null = null;
    let bestScore = 0;

    for (const [intent, group] of Object.entries(this.INTENT_GROUPS)) {
      const hasExclusion = group.excludes.some(k => lowerQuery.includes(k));
      if (hasExclusion) {
        continue;
      }

      let score = 0;
      for (const keyword of group.includes) {
        if (lowerQuery.includes(keyword)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as CatalogIntent;
      }
    }

    return bestIntent;
  }

  private async searchProducts(query: string): Promise<Product[]> {
    const allProducts = await this.catalogService.loadProducts();
    const lowerQuery = query.toLowerCase().trim();

    let results = allProducts.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
    if (results.length > 0) return results;

    const searchTerms = this.extractSearchTerms(query);
    if (!searchTerms) return [];

    const words = searchTerms.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return [];

    const scored = allProducts
      .filter(p => {
        const titleLower = p.title.toLowerCase();
        const descLower = p.description.toLowerCase();
        const matchesInTitle = words.filter(w => titleLower.includes(w)).length;
        const matchesInDesc = words.filter(w => descLower.includes(w)).length;
        return matchesInTitle > 0 || matchesInDesc >= 2;
      })
      .map(p => {
        const titleLower = p.title.toLowerCase();
        const titleScore = words.filter(w => titleLower.includes(w)).length;
        const descScore = words.filter(w => p.description.toLowerCase().includes(w)).length;
        return { product: p, score: titleScore * 2 + descScore };
      })
      .sort((a, b) => b.score - a.score);

    return scored.map(s => s.product);
  }

  private extractSearchTerms(query: string): string {
    const lowerQuery = query.toLowerCase();

    const noiseWords = new Set([
      'i', 'me', 'my', 'we', 'our', 'you', 'your',
      'a', 'an', 'the', 'is', 'are', 'was', 'were',
      'do', 'does', 'did', 'have', 'has', 'had',
      'can', 'will', 'would', 'could', 'should',
      'please', 'tell', 'show', 'find', 'need', 'want',
      'about', 'for', 'with', 'that', 'this', 'these', 'those',
      'what', 'which', 'who', 'how', 'where', 'when',
      'in', 'on', 'at', 'to', 'of', 'by', 'from', 'as',
      'looking', 'got', 'any', 'there', 'offer', 'carry',
      'sell', 'stock', 'available', 'backorder', 'restock',
      'inventory', 'many', 'still', 'size', 'sizing', 'fit',
      'measurement', 'dimension', 'small', 'medium', 'large',
      'xs', 'xl', 'xxl', 'extra', 'color', 'colour',
      'material', 'fabric', 'product', 'price', 'cost',
      'tell', 'want', 'need', 'please'
    ]);

    const words = lowerQuery.split(/\s+/);
    const meaningful = words.filter(w => w.length > 1 && !noiseWords.has(w));

    if (meaningful.length <= 2) {
      return meaningful.join(' ');
    }

    return meaningful.slice(0, 2).join(' ');
  }

  private extractOptions(product: Product, lowerQuery: string): Record<string, string> {
    const options: Record<string, string> = {};
    const titleLower = product.title.toLowerCase();

    let remaining = lowerQuery;
    for (const word of titleLower.split(/\s+/)) {
      remaining = remaining.replace(word, '');
    }
    remaining = remaining.trim().replace(/\s+/g, ' ');

    for (const opt of product.options) {
      const foundValue = this.findOptionValueInText(opt, lowerQuery, remaining);
      if (foundValue) {
        options[opt.name] = foundValue;
      }
    }

    return options;
  }

  private textContainsWord(text: string, word: string): boolean {
    if (word.length <= 1) {
      const regex = new RegExp(`(?:^|\\s)${word}(?=\\s|$|[\\.!\\?,\\;:])`, 'i');
      return regex.test(text);
    }
    return text.includes(word);
  }

  private findOptionValueInText(
    opt: { name: string; values: string[] },
    fullLowerQuery: string,
    remainingText: string
  ): string | null {
    const synonymTable = getSynonymTableForOption(opt.name);

    for (const value of opt.values) {
      const valueLower = value.toLowerCase();
      if (this.textContainsWord(remainingText, valueLower) || this.textContainsWord(fullLowerQuery, valueLower)) {
        return value;
      }
    }

    if (Object.keys(synonymTable).length > 0) {
      for (const [canonical, synonyms] of Object.entries(synonymTable)) {
        const canonicalLower = canonical.toLowerCase();
        const canonicalInQuery = this.textContainsWord(remainingText, canonicalLower) ||
                                 this.textContainsWord(fullLowerQuery, canonicalLower);
        const synonymInQuery = synonyms.some(s =>
          this.textContainsWord(remainingText, s) || this.textContainsWord(fullLowerQuery, s)
        );

        if (canonicalInQuery || synonymInQuery) {
          const directMatch = opt.values.find(
            v => v.toLowerCase() === canonicalLower
          );
          if (directMatch) return directMatch;

          const reverseMatch = opt.values.find(v => {
            const vLower = v.toLowerCase();
            if (vLower === canonicalLower) return true;
            return synonyms.some(s => s.toLowerCase() === vLower);
          });
          if (reverseMatch) return reverseMatch;
        }
      }
    }

    return null;
  }

  private hasProductOptionTerms(lowerQuery: string, product: Product): boolean {
    for (const opt of product.options) {
      const synonymTable = getSynonymTableForOption(opt.name);

      for (const value of opt.values) {
        if (lowerQuery.includes(value.toLowerCase())) return true;
      }

      for (const [canonical, synonyms] of Object.entries(synonymTable)) {
        if (lowerQuery.includes(canonical.toLowerCase())) return true;
        for (const syn of synonyms) {
          if (lowerQuery.includes(syn)) return true;
        }
      }
    }

    return false;
  }

  private async findSuggestions(query: string): Promise<Product[]> {
    const allProducts = await this.catalogService.loadProducts();
    return allProducts.slice(0, this.SUGGESTION_LIMIT);
  }
}

function buildAmbiguousMessage(
  product: Product,
  possibleOptions: Record<string, string[]>
): string {
  const parts: string[] = [];
  for (const [optName, values] of Object.entries(possibleOptions)) {
    parts.push(`${optName}: ${values.join(', ')}`);
  }
  return `We have the ${product.title}. Please specify: ${parts.join(' | ')}`;
}
