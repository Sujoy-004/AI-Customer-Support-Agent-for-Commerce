import { describe, it, expect } from 'vitest';
import type { SuggestedAction, ConversationState } from '../services/types';
import { SuggestedActionsService } from '../services/suggestedActions';

describe('SuggestedAction interface', () => {
  it('should have label as string', () => {
    const action: SuggestedAction = { label: 'Test', query: 'test query' };
    expect(typeof action.label).toBe('string');
    expect(action.label).toBe('Test');
  });

  it('should have query as string', () => {
    const action: SuggestedAction = { label: 'Test', query: 'test query' };
    expect(typeof action.query).toBe('string');
    expect(action.query).toBe('test query');
  });

  it('should have optional icon as string', () => {
    const actionWithIcon: SuggestedAction = { label: 'Test', query: 'test query', icon: '[→]' };
    expect(actionWithIcon.icon).toBe('[→]');

    const actionWithoutIcon: SuggestedAction = { label: 'Test', query: 'test query' };
    expect(actionWithoutIcon.icon).toBeUndefined();
  });

  it('should be importable from types.ts', () => {
    const action: SuggestedAction = { label: 'Browse', query: 'show products' };
    expect(action).toBeDefined();
  });
});

describe('ConversationState type', () => {
  it('should accept initial state', () => {
    const state: ConversationState = 'initial';
    expect(state).toBe('initial');
  });

  it('should accept product_search state', () => {
    const state: ConversationState = 'product_search';
    expect(state).toBe('product_search');
  });

  it('should accept stock_check state', () => {
    const state: ConversationState = 'stock_check';
    expect(state).toBe('stock_check');
  });

  it('should accept order_tracking state', () => {
    const state: ConversationState = 'order_tracking';
    expect(state).toBe('order_tracking');
  });

  it('should accept policy_query state', () => {
    const state: ConversationState = 'policy_query';
    expect(state).toBe('policy_query');
  });

  it('should accept escalation_offer state', () => {
    const state: ConversationState = 'escalation_offer';
    expect(state).toBe('escalation_offer');
  });

  it('should accept return_flow state', () => {
    const state: ConversationState = 'return_flow';
    expect(state).toBe('return_flow');
  });

  it('should accept general state', () => {
    const state: ConversationState = 'general';
    expect(state).toBe('general');
  });
});

describe('SuggestedActionsService', () => {
  let service: SuggestedActionsService;

  beforeEach(() => {
    service = new SuggestedActionsService();
  });

  describe('initial context', () => {
    it('should return 4 chips for initial state', () => {
      const suggestions = service.getSuggestions('initial', null);
      expect(suggestions.length).toBe(4);
    });

    it('should return correct labels for initial state', () => {
      const suggestions = service.getSuggestions('initial', null);
      const labels = suggestions.map(s => s.label);
      expect(labels).toContain('Browse Products');
      expect(labels).toContain('Track Order');
      expect(labels).toContain('View Policies');
      expect(labels).toContain('Check Returns');
    });

    it('should return correct queries for initial state', () => {
      const suggestions = service.getSuggestions('initial', null);
      const queries = suggestions.map(s => s.query);
      expect(queries).toContain('Show me your products');
      expect(queries).toContain('Track my order');
      expect(queries).toContain('What are your policies?');
      expect(queries).toContain('How do returns work?');
    });
  });

  describe('product_search context', () => {
    it('should return 4 chips for product_search state', () => {
      const suggestions = service.getSuggestions('product_search', null);
      expect(suggestions.length).toBe(4);
    });

    it('should return correct labels for product_search state', () => {
      const suggestions = service.getSuggestions('product_search', null);
      const labels = suggestions.map(s => s.label);
      expect(labels).toContain('Check Stock');
      expect(labels).toContain('View Variants');
      expect(labels).toContain('Compare Sizes');
      expect(labels).toContain('Back to Browse');
    });

    it('should return correct queries for product_search state', () => {
      const suggestions = service.getSuggestions('product_search', null);
      const queries = suggestions.map(s => s.query);
      expect(queries).toContain('Is this in stock?');
      expect(queries).toContain('Show me available options');
      expect(queries).toContain('What sizes are available?');
      expect(queries).toContain('Show me all products');
    });
  });

  describe('stock_check context', () => {
    it('should return 3 chips for stock_check state', () => {
      const suggestions = service.getSuggestions('stock_check', null);
      expect(suggestions.length).toBe(3);
    });

    it('should return correct labels for stock_check state', () => {
      const suggestions = service.getSuggestions('stock_check', null);
      const labels = suggestions.map(s => s.label);
      expect(labels).toContain('Add to Cart');
      expect(labels).toContain('View Similar');
      expect(labels).toContain('Check Another Product');
    });

    it('should return correct queries for stock_check state', () => {
      const suggestions = service.getSuggestions('stock_check', null);
      const queries = suggestions.map(s => s.query);
      expect(queries).toContain("I'd like to add this to cart");
      expect(queries).toContain('Show me similar products');
      expect(queries).toContain('Check another product');
    });
  });

  describe('order_tracking context', () => {
    it('should return 3 chips for order_tracking state', () => {
      const suggestions = service.getSuggestions('order_tracking', null);
      expect(suggestions.length).toBe(3);
    });

    it('should return correct labels for order_tracking state', () => {
      const suggestions = service.getSuggestions('order_tracking', null);
      const labels = suggestions.map(s => s.label);
      expect(labels).toContain('Start Return');
      expect(labels).toContain('Track Another Order');
      expect(labels).toContain('View Shipping Policy');
    });

    it('should return correct queries for order_tracking state', () => {
      const suggestions = service.getSuggestions('order_tracking', null);
      const queries = suggestions.map(s => s.query);
      expect(queries).toContain("I'd like to start a return");
      expect(queries).toContain('Track another order');
      expect(queries).toContain('What is your shipping policy?');
    });
  });

  describe('policy_query context', () => {
    it('should return 3 chips for policy_query state', () => {
      const suggestions = service.getSuggestions('policy_query', null);
      expect(suggestions.length).toBe(3);
    });

    it('should return correct labels for policy_query state', () => {
      const suggestions = service.getSuggestions('policy_query', null);
      const labels = suggestions.map(s => s.label);
      expect(labels).toContain('Check Products');
      expect(labels).toContain('Track Order');
      expect(labels).toContain('Talk to Human');
    });

    it('should return correct queries for policy_query state', () => {
      const suggestions = service.getSuggestions('policy_query', null);
      const queries = suggestions.map(s => s.query);
      expect(queries).toContain('Show me your products');
      expect(queries).toContain('Track my order');
      expect(queries).toContain("I'd like to speak to a human");
    });
  });

  describe('escalation_offer context', () => {
    it('should return 3 chips for escalation_offer state', () => {
      const suggestions = service.getSuggestions('escalation_offer', null);
      expect(suggestions.length).toBe(3);
    });

    it('should return correct labels for escalation_offer state', () => {
      const suggestions = service.getSuggestions('escalation_offer', null);
      const labels = suggestions.map(s => s.label);
      expect(labels).toContain('Yes, Connect Me');
      expect(labels).toContain("No, I'm Fine");
      expect(labels).toContain('View FAQ');
    });

    it('should return correct queries for escalation_offer state', () => {
      const suggestions = service.getSuggestions('escalation_offer', null);
      const queries = suggestions.map(s => s.query);
      expect(queries).toContain('Yes, connect me to a human');
      expect(queries).toContain("No, I'll keep trying");
      expect(queries).toContain('Show me frequently asked questions');
    });
  });

  describe('max chips enforcement', () => {
    it('should never return more than 4 chips regardless of context', () => {
      const states: ConversationState[] = ['initial', 'product_search', 'stock_check', 'order_tracking', 'policy_query', 'escalation_offer', 'return_flow', 'general'];
      for (const state of states) {
        const suggestions = service.getSuggestions(state, null);
        expect(suggestions.length).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('unknown context fallback', () => {
    it('should return default 4 chips for unknown context string', () => {
      const suggestions = service.getSuggestions('unknown_context' as ConversationState, null);
      expect(suggestions.length).toBe(4);
    });

    it('should return same chips as initial for unknown context', () => {
      const unknownSuggestions = service.getSuggestions('unknown_context' as ConversationState, null);
      const initialSuggestions = service.getSuggestions('initial', null);
      expect(unknownSuggestions.map(s => s.label)).toEqual(initialSuggestions.map(s => s.label));
    });
  });

  describe('immutability', () => {
    it('should return different array instances on repeated calls', () => {
      const first = service.getSuggestions('initial', null);
      const second = service.getSuggestions('initial', null);
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe('each chip has non-empty label and query', () => {
    it('initial chips have non-empty label and query', () => {
      const suggestions = service.getSuggestions('initial', null);
      for (const s of suggestions) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.query.length).toBeGreaterThan(0);
      }
    });

    it('product_search chips have non-empty label and query', () => {
      const suggestions = service.getSuggestions('product_search', null);
      for (const s of suggestions) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.query.length).toBeGreaterThan(0);
      }
    });

    it('stock_check chips have non-empty label and query', () => {
      const suggestions = service.getSuggestions('stock_check', null);
      for (const s of suggestions) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.query.length).toBeGreaterThan(0);
      }
    });

    it('order_tracking chips have non-empty label and query', () => {
      const suggestions = service.getSuggestions('order_tracking', null);
      for (const s of suggestions) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.query.length).toBeGreaterThan(0);
      }
    });

    it('policy_query chips have non-empty label and query', () => {
      const suggestions = service.getSuggestions('policy_query', null);
      for (const s of suggestions) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.query.length).toBeGreaterThan(0);
      }
    });

    it('escalation_offer chips have non-empty label and query', () => {
      const suggestions = service.getSuggestions('escalation_offer', null);
      for (const s of suggestions) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.query.length).toBeGreaterThan(0);
      }
    });
  });
});
