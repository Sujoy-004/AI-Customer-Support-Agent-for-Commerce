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
};

const DEFAULT_SUGGESTIONS = SUGGESTION_MAP.initial;

export class SuggestedActionsService {
  getSuggestions(state: ConversationState, _lastResult: unknown): SuggestedAction[] {
    const suggestions = SUGGESTION_MAP[state] ?? DEFAULT_SUGGESTIONS;
    return suggestions.slice(0, MAX_CHIPS).map(s => ({ ...s }));
  }
}
