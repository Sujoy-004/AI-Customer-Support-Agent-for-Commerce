// src/services/synonymResolver.ts
import { SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS } from './synonymConstants';

// Re-export tables for convenience
export { SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS };

/**
 * Normalize a single value by checking all synonym tables.
 * Returns the canonical form if found, null otherwise.
 */
export function normalizeOptionValue(value: string): string | null {
  const lower = value.toLowerCase();
  for (const [canonical, synonyms] of Object.entries(SIZE_SYNONYMS)) {
    if (canonical.toLowerCase() === lower || synonyms.some(s => s.toLowerCase() === lower)) {
      return canonical;
    }
  }
  for (const [canonical, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    if (canonical.toLowerCase() === lower || synonyms.some(s => s.toLowerCase() === lower)) {
      return canonical;
    }
  }
  for (const [canonical, synonyms] of Object.entries(MATERIAL_SYNONYMS)) {
    if (canonical.toLowerCase() === lower || synonyms.some(s => s.toLowerCase() === lower)) {
      return canonical;
    }
  }
  return null;
}

/**
 * Resolve multiple tokens against all synonym tables.
 * Returns a map of option name -> canonical value.
 */
export function resolveSynonyms(tokens: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (const token of tokens) {
    const size = tryResolveToken(token, SIZE_SYNONYMS);
    if (size) { options.Size = size; continue; }
    const color = tryResolveToken(token, COLOR_SYNONYMS);
    if (color) { options.Color = color; continue; }
    const material = tryResolveToken(token, MATERIAL_SYNONYMS);
    if (material) { options.Material = material; continue; }
  }
  return options;
}

/**
 * Try to resolve a single token against a specific synonym table.
 */
export function tryResolveToken(token: string, table: Record<string, string[]>): string | null {
  const lower = token.toLowerCase();
  for (const [canonical, aliases] of Object.entries(table)) {
    if (canonical.toLowerCase() === lower) return canonical;
    if (aliases.some(a => a.toLowerCase() === lower)) return canonical;
  }
  return null;
}

/**
 * Get the appropriate synonym table for a product option name.
 */
export function getSynonymTableForOption(optionName: string): Record<string, string[]> {
  const lower = optionName.toLowerCase();
  if (lower.includes('size') || lower.includes('shoe size')) return SIZE_SYNONYMS;
  if (lower.includes('color') || lower.includes('colour')) return COLOR_SYNONYMS;
  if (lower.includes('material') || lower.includes('fabric')) return MATERIAL_SYNONYMS;
  return {};
}
