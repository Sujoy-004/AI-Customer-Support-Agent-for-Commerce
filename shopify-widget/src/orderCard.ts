import type { Order, OrderStatus, TrackingEvent } from '../../src/services/types';

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

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'cancelled':
      return 'var(--color-status-cancelled)';
    case 'returned':
      return 'var(--color-status-returned)';
    case 'on_hold':
      return 'var(--color-status-on-hold)';
    case 'delivered':
      return 'var(--color-status-delivered)';
    default:
      return 'var(--color-status-processing)';
  }
}

function isActiveStatus(status: OrderStatus): boolean {
  return !['cancelled', 'returned'].includes(status);
}

function getStatusEmoji(status: OrderStatus): string {
  switch (status) {
    case 'confirmed':
      return '\u2705';
    case 'processing':
      return '\u2699\uFE0F';
    case 'shipped':
      return '\uD83D\uDCE6';
    case 'in_transit':
      return '\uD83D\uDE9A';
    case 'out_for_delivery':
      return '\uD83D\uDEE5\uFE0F';
    case 'delivered':
      return '\u2705';
    case 'cancelled':
      return '\u274C';
    case 'returned':
      return '\uD83D\uDD04';
    case 'on_hold':
      return '\u23F3';
  }
}

function getTimelineStatusClass(currentStatus: OrderStatus, stepStatus: OrderStatus): string {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepStatus);

  if (currentStatus === 'on_hold') return 'timeline-paused';
  if (!isActiveStatus(currentStatus)) return 'timeline-inactive';
  if (stepIndex < currentIndex) return 'timeline-done';
  if (stepIndex === currentIndex) return 'timeline-current';
  return 'timeline-upcoming';
}

function renderTimeline(status: OrderStatus): string {
  const activeSteps = ['confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];

  return activeSteps.map((step, index) => {
    const cls = getTimelineStatusClass(status, step as OrderStatus);
    const label = STATUS_LABELS[step as OrderStatus];
    const isFirst = index === 0;
    const isLast = index === activeSteps.length - 1;

    return `
        <div class="timeline-step ${cls}" style="display:flex;align-items:center;${isFirst ? '' : 'margin-top:var(--space-xs)'}">
            <div style="width:16px;height:16px;border-radius:50%;${cls === 'timeline-done' ? 'background:var(--color-status-delivered)' : cls === 'timeline-current' ? 'background:var(--color-status-processing);box-shadow:0 0 0 3px rgba(37,99,235,0.2)' : cls === 'timeline-paused' ? 'background:var(--color-status-on-hold);animation:pulse 2s infinite' : 'background:var(--color-ash)'};flex-shrink:0;margin-right:var(--space-xs);"></div>
          <span style="${cls === 'timeline-upcoming' || cls === 'timeline-paused' ? 'color:var(--color-ash)' : 'color:var(--color-ink')}">${label}</span>
        </div>`;
  }).join('');
}

function renderItemsSummary(order: Order): string {
  if (order.items.length === 0) return '<div class="empty-state">No items in this order</div>';
  return order.items.map(item =>
    `        <div style="display:flex;justify-content:space-between;font-size:var(--font-size-caption);padding:var(--space-xs) 0">
      <span>${item.title} ${item.variantTitle} x${item.quantity}</span>
    </div>`
  ).join('\n');
}

export class OrderCard {
  constructor(private order: Order) {}

  render(): string {
    const o = this.order;
    const color = getStatusColor(o.status);
    const emoji = getStatusEmoji(o.status);
    const isFailed = !isActiveStatus(o.status);

    return `<div class="order-card" style="border:1px solid var(--color-hairline-strong);border-radius:var(--radius-sm);padding:var(--space-lg);font-family:var(--font-mono);max-width:400px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md)">
    <strong style="font-size:var(--font-size-lg);font-weight:var(--font-weight-bold)">Order #${o.orderNumber}</strong>
    <span style="background:${color}15;color:${color};padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);font-size:var(--font-size-caption);font-weight:var(--font-weight-bold)">${emoji} ${STATUS_LABELS[o.status]}</span>
  </div>

  ${o.items.length > 0 ? `<div style="border-top:1px solid var(--color-hairline-strong);padding-top:var(--space-sm);margin-bottom:var(--space-sm)">
${renderItemsSummary(o)}
  </div>` : ''}

  ${o.trackingNumber && o.carrier ? `<div style="border-top:1px solid var(--color-hairline-strong);padding-top:var(--space-sm);margin-bottom:var(--space-sm);font-size:var(--font-size-caption)">
    <div><strong>${o.carrier}</strong> — ${o.trackingNumber}</div>
    ${o.estimatedDelivery ? `<div style="color:var(--color-mute);margin-top:var(--space-xs)">Estimated delivery: ${o.estimatedDelivery}</div>` : ''}
  </div>` : ''}

  ${o.status === 'on_hold' ? `<div style="border-top:1px solid var(--color-hairline-strong);padding-top:var(--space-sm);margin-bottom:var(--space-sm)">
    <div style="font-size:var(--font-size-xs);color:var(--color-status-on-hold);font-weight:var(--font-weight-bold);margin-bottom:var(--space-xs)">&#x23F3; On Hold — progress paused</div>
  </div>` : ''}
  ${!isFailed ? `<div style="border-top:1px solid var(--color-hairline-strong);padding-top:var(--space-sm)">
    <div style="font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);color:var(--color-mute);margin-bottom:var(--space-xs);text-transform:uppercase;letter-spacing:0.5px">Tracking Progress</div>
${renderTimeline(o.status)}
  </div>` : ''}

  ${o.notes ? `<div style="border-top:1px solid var(--color-hairline-strong);padding-top:var(--space-sm);margin-top:var(--space-sm);font-size:var(--font-size-caption);color:var(--color-mute)">
    <em>${o.notes}</em>
  </div>` : ''}
</div>`;
  }
}
