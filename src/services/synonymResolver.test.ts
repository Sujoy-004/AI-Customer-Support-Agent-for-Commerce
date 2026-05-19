// src/services/synonymResolver.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeOptionValue, resolveSynonyms, tryResolveToken, getSynonymTableForOption, SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS } from './synonymResolver';

describe('synonymResolver', () => {
  describe('normalizeOptionValue', () => {
    it('should return canonical for exact match', () => {
      expect(normalizeOptionValue('Medium')).toBe('Medium');
    });

    it('should return canonical for alias match', () => {
      const sizeAliases = SIZE_SYNONYMS['Medium'] || [];
      if (sizeAliases.length > 0) {
        expect(normalizeOptionValue(sizeAliases[0])).toBe('Medium');
      }
    });

    it('should return null for unknown value', () => {
      expect(normalizeOptionValue('xyznonexistent')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(normalizeOptionValue('medium')).toBe('Medium');
      expect(normalizeOptionValue('MEDIUM')).toBe('Medium');
    });
  });

  describe('resolveSynonyms', () => {
    it('should resolve size token', () => {
      const result = resolveSynonyms(['Medium']);
      expect(result.Size).toBe('Medium');
    });

    it('should resolve color token', () => {
      const colorKey = Object.keys(COLOR_SYNONYMS)[0];
      const result = resolveSynonyms([colorKey]);
      expect(result.Color).toBe(colorKey);
    });

    it('should resolve multiple tokens', () => {
      const colorKey = Object.keys(COLOR_SYNONYMS)[0];
      const result = resolveSynonyms(['Medium', colorKey]);
      expect(result.Size).toBe('Medium');
      expect(result.Color).toBe(colorKey);
    });

    it('should ignore unresolvable tokens', () => {
      const result = resolveSynonyms(['xyznonexistent']);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('tryResolveToken', () => {
    it('should resolve canonical token', () => {
      expect(tryResolveToken('Medium', SIZE_SYNONYMS)).toBe('Medium');
    });

    it('should resolve alias token', () => {
      const aliases = SIZE_SYNONYMS['Medium'] || [];
      if (aliases.length > 0) {
        expect(tryResolveToken(aliases[0], SIZE_SYNONYMS)).toBe('Medium');
      }
    });

    it('should return null for unknown token', () => {
      expect(tryResolveToken('xyz', SIZE_SYNONYMS)).toBeNull();
    });
  });

  describe('getSynonymTableForOption', () => {
    it('should return SIZE_SYNONYMS for size option', () => {
      expect(getSynonymTableForOption('Size')).toBe(SIZE_SYNONYMS);
      expect(getSynonymTableForOption('Shoe Size')).toBe(SIZE_SYNONYMS);
    });

    it('should return COLOR_SYNONYMS for color option', () => {
      expect(getSynonymTableForOption('Color')).toBe(COLOR_SYNONYMS);
      expect(getSynonymTableForOption('Colour')).toBe(COLOR_SYNONYMS);
    });

    it('should return MATERIAL_SYNONYMS for material option', () => {
      expect(getSynonymTableForOption('Material')).toBe(MATERIAL_SYNONYMS);
      expect(getSynonymTableForOption('Fabric')).toBe(MATERIAL_SYNONYMS);
    });

    it('should return empty object for unknown option', () => {
      expect(getSynonymTableForOption('Brand')).toEqual({});
    });
  });
});
