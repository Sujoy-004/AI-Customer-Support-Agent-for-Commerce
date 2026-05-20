// src/services/suggestedActions.ts
import type { SuggestedAction, ConversationState } from './types';

const MAX_CHIPS = 4;

const SUGGESTION_MAP: Record<string, SuggestedAction[]> = {
  initial: [
    { label: 'Browse Products', query: 'Show me your products' },
    { label: 'Track Order', query: 'Track my order' },
    { label: 'View Policies', query: 'What are your policies?' },
    { label: 'Check Returns', query: 'How do returns work?' },
  ],
  product_search: [
    { label: 'Check Stock', query: 'Is this in stock?' },
    { label: 'View Variants', query: 'Show me available options' },
    { label: 'Compare Sizes', query: 'What sizes are available?' },
    { label: 'Back to Browse', query: 'Show me all products' },
  ],
  stock_check: [
    { label: 'Add to Cart', query: "I'd like to add this to cart" },
    { label: 'View Similar', query: 'Show me similar products' },
    { label: 'Check Another Product', query: 'Check another product' },
  ],
  order_tracking: [
    { label: 'Start Return', query: "I'd like to start a return" },
    { label: 'Track Another Order', query: 'Track another order' },
    { label: 'View Shipping Policy', query: 'What is your shipping policy?' },
  ],
  policy_query: [
    { label: 'Check Products', query: 'Show me your products' },
    { label: 'Track Order', query: 'Track my order' },
    { label: 'Talk to Human', query: "I'd like to speak to a human" },
  ],
  escalation_offer: [
    { label: 'Yes, Connect Me', query: 'Yes, connect me to a human' },
    { label: "No, I'm Fine", query: "No, I'll keep trying" },
    { label: 'View FAQ', query: 'Show me frequently asked questions' },
  ],
  return_flow: [
    { label: 'Start Return', query: "I'd like to start a return" },
    { label: 'Check Return Status', query: 'What is the status of my return?' },
    { label: 'View Return Policy', query: 'What is your return policy?' },
  ],
};

const DEFAULT_SUGGESTIONS = SUGGESTION_MAP.initial;

export class SuggestedActionsService {
  getSuggestions(state: ConversationState, lastResult: unknown): SuggestedAction[] {
    const base = SUGGESTION_MAP[state] ?? DEFAULT_SUGGESTIONS;
    const suggestions = base.slice(0, MAX_CHIPS).map(s => ({ ...s }));

    // Context-aware enhancements based on last result
    if (state === 'product_search' && lastResult && typeof lastResult === 'object') {
      const result = lastResult as Record<string, unknown>;
      if (result.type === 'exact' && result.product) {
        const product = result.product as Record<string, unknown>;
        const title = (product.title as string) || 'this';
        suggestions[0] = { label: `Check ${title} Stock`, query: `Is ${title} in stock?` };
      }
    }

    if (state === 'order_tracking' && lastResult && typeof lastResult === 'object') {
      const result = lastResult as Record<string, unknown>;
      if (result.type === 'order_found' && result.order) {
        const order = result.order as Record<string, unknown>;
        const orderNum = order.orderNumber as number;
        suggestions[0] = { label: 'Start Return', query: `I'd like to return items from order #${orderNum}` };
      }
    }

    return suggestions;
  }
}
