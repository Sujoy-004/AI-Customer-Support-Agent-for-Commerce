// src/services/types.ts
/**
 * Type definitions for policy service
 */

/**
 * Interface for policy data structure
 */
export interface PolicyData {
  shipping: {
    standard: string;
    express: string;
    international: string;
    freeShippingThreshold: number;
    processingTime: string;
  };
  warranty: {
    standardPeriod: string;
    extendedOptions: string[];
    coverageDetails: string;
    claimProcess: string;
  };
  returns: {
    returnWindow: string;
    conditionRequirements: string;
    refundMethod: string;
    exchangePolicy: string;
    restockingFee: string;
  };
}

/**
 * Enum for policy types
 */
export const PolicyType = {
  SHIPPING: 'shipping',
  WARRANTY: 'warranty',
  RETURNS: 'returns'
} as const;

export type PolicyType = typeof PolicyType[keyof typeof PolicyType];

// ==============================
// Catalog Types
// ==============================

/**
 * A single option on a product (e.g. Size, Color, Material)
 */
export interface ProductOption {
  name: string;
  values: string[];
}

/**
 * A product image
 */
export interface ProductImage {
  url: string;
  alt: string;
}

/**
 * Real-time stock information for a variant
 */
export interface StockInfo {
  available: boolean;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

/**
 * A product variant — SKU-level sellable unit
 */
export interface Variant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  options: Record<string, string>;
  inventory: StockInfo;
}

/**
 * A Shopify-style product with variants
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  type: string;
  priceRange: { min: number; max: number };
  options: ProductOption[];
  variants: Variant[];
  images: ProductImage[];
  tags: string[];
}

/**
 * Criteria for searching/filtering products
 */
export interface CatalogQuery {
  query?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

/**
 * Result of resolving a variant by option values
 */
export interface VariantResolution {
  product: Product;
  variant: Variant;
  matchedOptions: Record<string, string>;
}

/**
 * Swappable data source — mock or live Shopify API
 */
export interface CatalogDataSource {
  loadProducts(): Promise<Product[]>;
}

// ==============================
// Order Types
// ==============================

export type OrderStatus =
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'on_hold';

export interface TrackingEvent {
  date: string;
  description: string;
  location: string;
}

export interface OrderLineItem {
  productId: string;
  title: string;
  variantTitle: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  orderNumber: number;
  email: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderLineItem[];
  fulfillmentStatus: string;
  financialStatus: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  timeline: TrackingEvent[];
  notes?: string;
}

export interface OrderDataSource {
  getOrder(orderId: string): Promise<Order | null>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getOrderByNumber(orderNumber: number): Promise<Order | null>;
}

// ==============================
// Return Types
// ==============================

export type ReturnRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequest {
  id: string;
  orderNumber: number;
  email: string;
  items: { title: string; variantTitle: string; quantity: number; reason: string }[];
  status: ReturnRequestStatus;
  reason: string;
  createdAt: string;
}

export type ReturnQuery =
  | { type: 'return_intent'; message: string }
  | { type: 'return_eligible'; orderNumber: number; items: { title: string; variantTitle: string }[] }
  | { type: 'return_submitted'; returnRequest: ReturnRequest; message: string }
  | { type: 'return_not_eligible'; message: string; reason: string }
  | { type: 'not_return'; reason: string };

export interface ReturnDataSource {
  submitReturn(request: Omit<ReturnRequest, 'id' | 'createdAt'>): Promise<ReturnRequest>;
  getReturnsByEmail(email: string): Promise<ReturnRequest[]>;
}

// ==============================
// UX Types
// ==============================

/**
 * A suggested action chip shown to the user based on conversation context.
 */
export interface SuggestedAction {
  label: string;
  query: string;
  icon?: string;
}

/**
 * The current state of the conversation, used to determine which action chips to show.
 */
export type ConversationState =
  | 'initial'
  | 'product_search'
  | 'stock_check'
  | 'order_tracking'
  | 'policy_query'
  | 'escalation_offer'
  | 'return_flow'
  | 'general';

// ==============================
// Escalation Types
// ==============================

export type EscalationStatus =
  | 'IDLE' | 'OFFERED' | 'CONFIRMING'
  | 'TRANSFERRING' | 'QUEUED' | 'CONNECTED'
  | 'CANCELLED' | 'FAILED';

export type EscalationTrigger = 'explicit' | 'frustration' | 'none';

export type EscalationEvent =
  | 'OFFER' | 'CONFIRM' | 'QUEUE' | 'CONNECT'
  | 'CANCEL' | 'RESET' | 'FAIL' | 'RETRY' | 'ABANDON';

export interface EscalationState {
  status: EscalationStatus;
  triggerType: EscalationTrigger;
  queuedAt: number | null;
  position: number;
  lastContext: { userMessages: string[]; agentResponse: string | null };
}

export interface EscalationChatMessage {
  id: string;
  role: 'system';
  text: string;
  timestamp: number;
  status: 'sending' | 'delivered' | 'error';
  subtype: 'escalation-offer' | 'frustration-offer' | 'transferring' | 'queue' | 'connected';
}