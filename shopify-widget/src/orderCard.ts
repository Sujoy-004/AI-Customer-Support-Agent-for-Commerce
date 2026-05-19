import type { Order, OrderStatus } from '../../src/services/types';

const STATUS_ORDER: OrderStatus[] = [
  'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  on_hold: 'On Hold',
};

function cssClassForStatus(status: OrderStatus): string {
  switch (status) {
    case 'cancelled': return 'oc-status--cancelled';
    case 'returned': return 'oc-status--returned';
    case 'on_hold': return 'oc-status--hold';
    case 'delivered': return 'oc-status--delivered';
    default: return 'oc-status--active';
  }
}

function timelineClass(current: OrderStatus, step: OrderStatus): string {
  const ci = STATUS_ORDER.indexOf(current);
  const si = STATUS_ORDER.indexOf(step);
  if (current === 'on_hold') return 'oc-tl--paused';
  if (['cancelled', 'returned'].includes(current)) return 'oc-tl--inactive';
  if (si < ci) return 'oc-tl--done';
  if (si === ci) return 'oc-tl--current';
  return 'oc-tl--upcoming';
}

function isTerminal(status: OrderStatus): boolean {
  return ['cancelled', 'returned'].includes(status);
}

function renderTimeline(status: OrderStatus): string {
  const steps = ['confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
  return steps.map((step, i) => {
    const cls = timelineClass(status, step as OrderStatus);
    return `<div class="oc-tl-step ${cls}">
      <div class="oc-tl-dot"></div>
      <span class="oc-tl-label">${STATUS_LABELS[step as OrderStatus]}</span>
      ${i < steps.length - 1 ? '<div class="oc-tl-line"></div>' : ''}
    </div>`;
  }).join('\n');
}

function renderItems(items: Order['items']): string {
  if (items.length === 0) return '';
  return items.map(item =>
    `<div class="oc-item">
      <span class="oc-item-name">${item.title}${item.variantTitle ? ' <span class="oc-item-variant">' + item.variantTitle + '</span>' : ''}</span>
      <span class="oc-item-qty">x${item.quantity}</span>
    </div>`
  ).join('\n');
}

export class OrderCard {
  constructor(private order: Order) {}

  render(): string {
    const o = this.order;
    const statusCls = cssClassForStatus(o.status);
    const isTerm = isTerminal(o.status);

    return `<div class="oc-card">
      <div class="oc-head">
        <div class="oc-head-left">
          <div class="oc-order-label">Order</div>
          <div class="oc-order-number">#${o.orderNumber}</div>
        </div>
        <div class="oc-badge ${statusCls}">${STATUS_LABELS[o.status]}</div>
      </div>

      ${o.items.length > 0 ? `<div class="oc-items">${renderItems(o.items)}</div>` : ''}

      ${o.trackingNumber && o.carrier ? `<div class="oc-tracking">
        <div class="oc-tracking-head">Tracking</div>
        <div class="oc-tracking-row">
          <span class="oc-tracking-carrier">${o.carrier}</span>
          <span class="oc-tracking-number">${o.trackingNumber}</span>
        </div>
        ${o.estimatedDelivery ? `<div class="oc-tracking-est">Est. delivery ${o.estimatedDelivery}</div>` : ''}
      </div>` : ''}

      ${o.status === 'on_hold' ? `<div class="oc-hold-banner">On Hold — progress paused</div>` : ''}

      ${!isTerm ? `<div class="oc-timeline"><div class="oc-tl-head">Progress</div><div class="oc-tl-steps">${renderTimeline(o.status)}</div></div>` : ''}

      ${o.notes ? `<div class="oc-notes">${o.notes}</div>` : ''}
    </div>`;
  }
}

export { OrderCard as default };
