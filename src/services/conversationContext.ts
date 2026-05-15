// src/services/conversationContext.ts
import type { Product } from './types';

export const CONTEXT_TTL_MS = 5 * 60 * 1000;
export const CONTEXT_MAX_TURNS = 3;

export interface CatalogConversationContext {
  lastProduct: Product | null;
  lastOptions: Record<string, string>;
  unmappedTokens: string[];
  turnNumber: number;
  expiresAt: number;
}

export class ConversationContextManager {
  private context: CatalogConversationContext | null = null;

  get(): CatalogConversationContext | null {
    if (
      this.context &&
      Date.now() < this.context.expiresAt &&
      this.context.turnNumber < CONTEXT_MAX_TURNS
    ) {
      return this.context;
    }
    return null;
  }

  update(updates: Partial<CatalogConversationContext>): void {
    if (!this.context) return;
    Object.assign(this.context, updates, {
      turnNumber: this.context.turnNumber + 1,
    });
  }

  set(product: Product, options: Record<string, string>, unmapped: string[]): void {
    this.context = {
      lastProduct: product,
      lastOptions: options,
      unmappedTokens: unmapped,
      turnNumber: 0,
      expiresAt: Date.now() + CONTEXT_TTL_MS,
    };
  }

  clear(): void {
    this.context = null;
  }
}
