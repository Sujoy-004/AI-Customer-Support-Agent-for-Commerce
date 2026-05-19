// src/services/synonymConstants.test.ts
import { describe, it, expect } from 'vitest';
import { SIZE_SYNONYMS, COLOR_SYNONYMS, MATERIAL_SYNONYMS, ALL_SYNONYMS } from './synonymConstants';

describe('synonymConstants', () => {
  it('should export SIZE_SYNONYMS as a record', () => {
    expect(typeof SIZE_SYNONYMS).toBe('object');
    expect(Object.keys(SIZE_SYNONYMS).length).toBeGreaterThan(0);
  });

  it('should export COLOR_SYNONYMS as a record', () => {
    expect(typeof COLOR_SYNONYMS).toBe('object');
    expect(Object.keys(COLOR_SYNONYMS).length).toBeGreaterThan(0);
  });

  it('should export MATERIAL_SYNONYMS as a record', () => {
    expect(typeof MATERIAL_SYNONYMS).toBe('object');
    expect(Object.keys(MATERIAL_SYNONYMS).length).toBeGreaterThan(0);
  });

  it('should export ALL_SYNONYMS combining all tables', () => {
    expect(typeof ALL_SYNONYMS).toBe('object');
    const allKeys = Object.keys(ALL_SYNONYMS);
    const sizeKeys = Object.keys(SIZE_SYNONYMS);
    const colorKeys = Object.keys(COLOR_SYNONYMS);
    const materialKeys = Object.keys(MATERIAL_SYNONYMS);

    expect(allKeys.length).toBe(sizeKeys.length + colorKeys.length + materialKeys.length);
  });

  it('should have canonical values with alias arrays', () => {
    for (const [canonical, aliases] of Object.entries(SIZE_SYNONYMS)) {
      expect(typeof canonical).toBe('string');
      expect(Array.isArray(aliases)).toBe(true);
    }
  });

  it('should be importable from mockCatalogData for backward compatibility', async () => {
    const mockModule = await import('./mockCatalogData');
    expect(mockModule.SIZE_SYNONYMS).toBe(SIZE_SYNONYMS);
    expect(mockModule.COLOR_SYNONYMS).toBe(COLOR_SYNONYMS);
    expect(mockModule.MATERIAL_SYNONYMS).toBe(MATERIAL_SYNONYMS);
  });
});
