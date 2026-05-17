// src/config/semantic/offTopicIntents.ts
export const ON_TOPIC_CLUSTERS: Record<string, string[]> = {
  products: [
    'what sizes do you have',
    'is this in stock',
    'do you sell shoes',
    'tell me about your products',
    'looking for something',
    'do you have this in blue',
    'how much does this cost',
    'i want to buy a hoodie',
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
  ],
};