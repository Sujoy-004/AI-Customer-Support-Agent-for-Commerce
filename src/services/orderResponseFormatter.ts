import type { Order } from './types';
import type { OrderQuery } from './orderIntentDetector';
import { OrderCard } from '../../shopify-widget/src/orderCard';

export function formatOrderResponse(result: OrderQuery): string {
  switch (result.type) {
    case 'order_found':
      return buildOrderResponse(result.order);
    case 'order_not_found':
      return result.message;
    case 'email_mismatch':
      return result.message;
    case 'needs_email':
      return result.message;
    case 'needs_order_number':
      return result.message;
    case 'context_expired':
      return result.message;
    case 'not_order':
      return '';
  }
  return '';
}

function buildOrderResponse(order: Order): string {
  const cardHtml = new OrderCard(order).render();
  return cardHtml;
}
