// src/services/autocomplete.ts
import type { AutocompleteResult, Product } from './types';

/**
 * Pure autocomplete service providing prefix-matching suggestions
 * for product names, order numbers, and policy queries.
 *
 * No DOM access, no side effects — deterministic prefix matching only.
 */
export class AutocompleteService {
  /**
   * Get autocomplete suggestions for a query string.
   *
   * @param query - The user's input string (min 2 chars)
   * @param products - Array of products to search against
   * @param maxResults - Maximum number of results to return (default: 5)
   * @returns Array of AutocompleteResult sorted by relevance
   */
  getSuggestions(
    query: string,
    products: Product[],
    maxResults: number = 5
  ): AutocompleteResult[] {
    // Minimum query length
    if (query.length < 2) {
      return [];
    }

    // Detect order number patterns
    const orderMatch = this.detectOrderPattern(query);
    if (orderMatch) {
      return [orderMatch];
    }

    // Product matching
    const lowerQuery = query.toLowerCase();
    const matches: Array<{ result: AutocompleteResult; isPrefix: boolean }> = [];

    for (const product of products) {
      const lowerTitle = product.title.toLowerCase();
      const lowerTags = product.tags.map(t => t.toLowerCase());

      const titleMatches = lowerTitle.includes(lowerQuery);
      const tagMatches = lowerTags.some(tag => tag.includes(lowerQuery));

      if (titleMatches || tagMatches) {
        const isPrefix = lowerTitle.startsWith(lowerQuery);
        matches.push({
          result: {
            type: 'product',
            label: product.title,
            value: product.title
          },
          isPrefix
        });
      }
    }

    // Sort: exact prefix matches first, then substring matches
    matches.sort((a, b) => {
      if (a.isPrefix && !b.isPrefix) return -1;
      if (!a.isPrefix && b.isPrefix) return 1;
      return 0;
    });

    // Limit to maxResults
    return matches.slice(0, maxResults).map(m => m.result);
  }

  /**
   * Detect if the query matches an order number pattern.
   * Patterns: '#' followed by digits, or 'ORD-' prefix (case-insensitive).
   */
  private detectOrderPattern(query: string): AutocompleteResult | null {
    const trimmed = query.trim();

    // Pattern: # followed by one or more digits
    if (/^#\d+/.test(trimmed)) {
      return {
        type: 'order',
        label: trimmed,
        value: trimmed
      };
    }

    // Pattern: ORD- (case-insensitive)
    if (/^ord-/i.test(trimmed)) {
      return {
        type: 'order',
        label: trimmed,
        value: trimmed
      };
    }

    return null;
  }
}
