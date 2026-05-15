// src/config/synonyms/materials.ts

export interface SynonymEntry {
  canonical: string;
  aliases: string[];
}

export const MATERIAL_SYNONYM_TABLE: SynonymEntry[] = [
  {
    canonical: 'Cotton',
    aliases: ['pure cotton', 'organic cotton'],
  },
  {
    canonical: 'Polyester',
    aliases: ['poly', 'polyester blend', 'poly blend'],
  },
  {
    canonical: 'Leather',
    aliases: ['genuine leather', 'real leather', 'bonded leather'],
  },
  {
    canonical: 'Wool',
    aliases: ['merino wool', 'lambswool', 'virgin wool'],
  },
  {
    canonical: 'Canvas',
    aliases: ['cotton canvas', 'heavy canvas'],
  },
  {
    canonical: 'Nylon',
    aliases: ['polyamide', 'ripstop nylon'],
  },
];
