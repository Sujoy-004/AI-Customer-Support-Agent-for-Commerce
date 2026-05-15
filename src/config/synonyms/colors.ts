// src/config/synonyms/colors.ts

export interface SynonymEntry {
  canonical: string;
  aliases: string[];
}

export const COLOR_SYNONYM_TABLE: SynonymEntry[] = [
  {
    canonical: 'Blue',
    aliases: ['navy', 'navy blue', 'royal', 'royal blue', 'sky blue', 'teal', 'aqua'],
  },
  {
    canonical: 'Black',
    aliases: ['jet black', 'onyx', 'obsidian', 'charcoal black'],
  },
  {
    canonical: 'Gray',
    aliases: ['grey', 'charcoal', 'heather gray', 'silver', 'slate', 'smoke'],
  },
  {
    canonical: 'White',
    aliases: ['cream', 'ivory', 'off white', 'natural', 'ecru'],
  },
  {
    canonical: 'Red',
    aliases: ['burgundy', 'maroon', 'crimson', 'scarlet', 'cherry'],
  },
  {
    canonical: 'Green',
    aliases: ['olive', 'forest', 'sage', 'emerald', 'moss', 'army'],
  },
  {
    canonical: 'Brown',
    aliases: ['tan', 'khaki', 'beige', 'camel', 'taupe', 'mocha'],
  },
];
