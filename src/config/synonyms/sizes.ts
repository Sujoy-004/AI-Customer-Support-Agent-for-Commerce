// src/config/synonyms/sizes.ts

export interface SynonymEntry {
  canonical: string;
  aliases: string[];
}

export const SIZE_SYNONYM_TABLE: SynonymEntry[] = [
  {
    canonical: 'Extra Small',
    aliases: ['xs', 'x-small', 'x small', 'extra small'],
  },
  {
    canonical: 'Small',
    aliases: ['s', 'sm', 'small'],
  },
  {
    canonical: 'Medium',
    aliases: ['m', 'md', 'med', 'medium'],
  },
  {
    canonical: 'Large',
    aliases: ['l', 'lg', 'large'],
  },
  {
    canonical: 'Extra Large',
    aliases: ['xl', 'x-large', 'x large', 'extra large'],
  },
  {
    canonical: 'XX-Large',
    aliases: ['xxl', '2xl', '2x', 'xx-large', 'xx large', 'double extra large'],
  },
  {
    canonical: 'Small',
    aliases: ['s', 'sm'],
  },
  {
    canonical: 'Medium',
    aliases: ['m', 'md', 'med'],
  },
  {
    canonical: 'Large',
    aliases: ['l', 'lg'],
  },
  {
    canonical: 'Extra Large',
    aliases: ['xl', 'x-large', 'x large', 'extra large'],
  },
  {
    canonical: 'XX-Large',
    aliases: ['xxl', '2xl', '2x', 'xx-large', 'xx large'],
  },
];
