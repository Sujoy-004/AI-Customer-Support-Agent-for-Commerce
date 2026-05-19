// src/services/synonymConstants.ts
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
