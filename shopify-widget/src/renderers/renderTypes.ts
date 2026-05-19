import type { EscalationChatMessage as EscalationMsg, Product, StockInfo } from '../../../src/services/types';

export type { EscalationMsg as EscalationChatMessage };

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'error';
  text: string;
  timestamp: number;
  status: 'sending' | 'delivered' | 'error';
  isHumanAgent?: boolean;
  surface?: ResponseSurface;
  responseType?: ResponseType;
}

export type ResponseSurfaceType = 'product-card' | 'product-list' | 'order-card' | 'policy-summary' | 'stock-status';
export type ResponseType = 'product' | 'order' | 'policy' | 'escalation' | 'tracking' | 'return' | 'general';

export interface ProductCardSurface {
  type: 'product-card';
  product: Product;
  variant?: { title: string; price: number; stock: StockInfo };
}

export interface ProductListSurface {
  type: 'product-list';
  products: Product[];
  totalCount: number;
  query?: string;
}

export interface StockStatusSurface {
  type: 'stock-status';
  product: Product;
  variant: { title: string; stock: StockInfo; price: number };
}

export type ResponseSurface = ProductCardSurface | ProductListSurface | StockStatusSurface;

export type TimestampFormatter = (ts: number) => string;

export interface EscalationCallbacks {
  onConfirm: () => void;
  onCancel: () => void;
}

export interface MessageBubbleElements {
  bubble: HTMLElement;
  statusEl?: HTMLElement;
}
