import { OrderService } from './orderService';
import type { Order } from './types';
import { SemanticRouter } from '../../shopify-widget/src/core/semanticRouter';
import orderEmbeddingsData from '../../shopify-widget/src/config/semantic/embeddings.json';

export type OrderQuery =
  | { type: 'order_found'; order: Order; email: string }
  | { type: 'order_not_found'; message: string }
  | { type: 'email_mismatch'; orderNumber: number; message: string }
  | { type: 'needs_email'; orderNumber: number; message: string }
  | { type: 'needs_order_number'; message: string }
  | { type: 'context_expired'; message: string }
  | { type: 'not_order'; reason: string };

interface OrderConversationContext {
  orderNumber: number;
  email: string;
  turnCount: number;
  timestamp: number;
}

export class OrderIntentDetector {
  private orderService: OrderService;
  private semanticRouter: SemanticRouter;
  private orderCategories: Record<string, any>;
  private context: OrderConversationContext | null = null;
  private readonly CONTEXT_TTL_MS = 300000;
  private readonly MAX_CONTEXT_TURNS = 3;

  private readonly INTENT_GROUPS: Record<string, { includes: string[]; excludes: string[] }> = {
    order_status: {
      includes: [
        'order status', 'track my order', 'where is my order',
        'tracking number', 'track package', 'track shipment',
        'order update', 'shipping status', 'order progress',
        'when will', 'my order', 'my package', 'track',
      ],
      excludes: [],
    },
  };

  private readonly ORDER_NUMBER_PATTERN = /#\d{3,}/;

  constructor(orderService: OrderService, semanticRouter: SemanticRouter) {
    this.orderService = orderService;
    this.semanticRouter = semanticRouter;
    this.orderCategories = orderEmbeddingsData.order;
  }

  async resolveQuery(query: string): Promise<OrderQuery> {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return { type: 'not_order', reason: 'Empty query' };
    }

    if (this.isContextExpired()) {
      this.clearContext();
      return { type: 'context_expired', message: 'Your order inquiry has expired. Please start again.' };
    }

    const detectedResult = await this.detectIntent(lowerQuery);
    const detectedIntent = detectedResult.intent;

    const hasOrderPattern = lowerQuery.includes('order') && (
      this.ORDER_NUMBER_PATTERN.test(lowerQuery) ||
      /\b\d{3,}\b/.test(lowerQuery)
    );

    if (!detectedIntent && !hasOrderPattern && !this.context) {
      return { type: 'not_order', reason: 'No order-related content detected' };
    }

    const orderNumber = this.extractOrderNumber(lowerQuery);
    const email = this.extractEmail(lowerQuery);

    const contextOrderNumber = this.context?.orderNumber ?? null;
    const contextEmail = this.context?.email ?? null;

    const resolvedOrderNumber = orderNumber ?? contextOrderNumber;
    const resolvedEmail = email ?? contextEmail;

    if (resolvedOrderNumber && resolvedEmail) {
      const order = await this.orderService.getOrderByNumber(resolvedOrderNumber);

      if (order) {
        if (order.email.toLowerCase() !== resolvedEmail.toLowerCase()) {
          this.clearContext();
          const msg = `Order #${resolvedOrderNumber} was found, but the email doesn't match. Please check your order number and email and try again.`;
          return { type: 'email_mismatch', orderNumber: resolvedOrderNumber, message: msg };
        }

        this.setContext(resolvedOrderNumber, resolvedEmail);
        return { type: 'order_found', order, email: resolvedEmail };
      }

      this.clearContext();
      const msg = `Order #${resolvedOrderNumber} wasn't found. Try a different order number?`;
      return { type: 'order_not_found', message: msg };
    }

    if (resolvedOrderNumber && !resolvedEmail) {
      this.setContext(resolvedOrderNumber, '');
      return { type: 'needs_email', orderNumber: resolvedOrderNumber, message: `Got it. And what email did you use for order #${resolvedOrderNumber}?` };
    }

    if (!resolvedOrderNumber && email) {
      this.setContext(0, email);
      return { type: 'needs_order_number', message: "Thanks! What's your order number?" };
    }

    if (!resolvedOrderNumber) {
      return { type: 'needs_order_number', message: "Sure, I can help with that! What's your order number?" };
    }

    return { type: 'not_order', reason: 'Unable to process query' };
  }

  clearContext(): void {
    this.context = null;
  }

  getContext(): OrderConversationContext | null {
    return this.context;
  }

  private setContext(orderNumber: number, email: string): void {
    if (this.context) {
      this.context = {
        orderNumber,
        email,
        turnCount: this.context.turnCount + 1,
        timestamp: Date.now(),
      };
    } else {
      this.context = {
        orderNumber,
        email,
        turnCount: 1,
        timestamp: Date.now(),
      };
    }
  }

  private isContextExpired(): boolean {
    if (!this.context) return false;
    const elapsed = Date.now() - this.context.timestamp;
    if (elapsed > this.CONTEXT_TTL_MS) return true;
    if (this.context.turnCount >= this.MAX_CONTEXT_TURNS) return true;
    return false;
  }

  private detectKeywordIntent(lowerQuery: string): { intent: string | null; confidence: number } {
    let bestIntent: string | null = null;
    let bestScore = 0;

    for (const [intent, group] of Object.entries(this.INTENT_GROUPS)) {
      const hasExclusion = group.excludes.some(k => lowerQuery.includes(k));
      if (hasExclusion) continue;

      let score = 0;
      for (const keyword of group.includes) {
        if (lowerQuery.includes(keyword)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    return { intent: bestIntent, confidence: bestIntent ? 0.5 + bestScore * 0.1 : 0 };
  }

  // Hybrid: semantic primary, keyword fallback (D-02)
  private async detectIntent(lowerQuery: string): Promise<{ intent: string | null; confidence: number; source: 'semantic' | 'keyword' | 'none' }> {
    // Step 1: Semantic routing
    const semanticResult = await this.semanticRouter.classify(
      lowerQuery, this.orderCategories,
    );

    if (semanticResult.intent && semanticResult.confidence >= 0.6) {
      return {
        intent: semanticResult.intent,
        confidence: semanticResult.confidence,
        source: 'semantic',
      };
    }

    // Step 2: Keyword fallback
    const keywordResult = this.detectKeywordIntent(lowerQuery);

    // Step 3: Highest confidence wins (D-23)
    if (keywordResult.confidence > semanticResult.confidence) {
      return { intent: keywordResult.intent, confidence: keywordResult.confidence, source: 'keyword' };
    }

    return { intent: null, confidence: 0, source: 'none' };
  }

  private extractOrderNumber(lowerQuery: string): number | null {
    const patterns = [
      /#(\d{3,})/,
      /order\s*#?\s*(\d{3,})/i,
      /number\s*#?\s*(\d{3,})/i,
    ];

    for (const pattern of patterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    const standaloneDigits = lowerQuery.match(/\b(\d{3,})\b/);
    if (standaloneDigits) {
      return parseInt(standaloneDigits[1], 10);
    }

    return null;
  }

  private extractEmail(lowerQuery: string): string | null {
    const emailPattern = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
    const match = lowerQuery.match(emailPattern);
    return match ? match[0].toLowerCase() : null;
  }
}
