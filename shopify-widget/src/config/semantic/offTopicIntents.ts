// src/config/semantic/offTopicIntents.ts
export const ON_TOPIC_CLUSTERS: Record<string, string[]> = {
  products: [
    'what sizes do you have',
    'is this in stock',
    'do you sell shoes',
    'looking for something specific',
    'do you have this in blue',
    'how much does this cost',
    'i want to buy a hoodie',
    'show me your collection',
    'what products do you carry',
    // Expanded coverage
    'do you have this item',
    'what colors come in',
    'show me your best sellers',
  ],
  orders: [
    'where is my order',
    'track my package',
    'order status',
    'when will it arrive',
    'shipping update',
    'cancel my order',
    'tracking number',
    'has my order shipped',
    // Expanded coverage
    'where did my order go',
    'my package has not arrived',
    'still waiting on my delivery',
  ],
  policies: [
    'what is your return policy',
    'how does shipping work',
    'do you have a warranty',
    'refund policy',
    'exchange an item',
    'shipping options',
    'return window',
    'how long does shipping take',
    // Expanded coverage
    'can i get a refund',
    'do you offer exchanges',
    'what is your warranty coverage',
  ],
};

// Compliment/sentiment phrases that are NOT support queries
export const COMPLIMENT_PHRASES: string[] = [
  'i like your products',
  'love your store',
  'great website',
  'nice store',
  'beautiful products',
  'amazing shop',
  'cool stuff',
  'your products are great',
  'i love shopping here',
  'best store ever',
];