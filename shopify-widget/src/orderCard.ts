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
      return '#dc2626';
    case 'returned':
      return '#7c3aed';
    case 'on_hold':
      return '#d97706';
    case 'delivered':
      return '#16a34a';
    default:
      return '#2563eb';
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
        <div class="timeline-step ${cls}" style="display:flex;align-items:center;${isFirst ? '' : 'margin-top:4px'}">
            <div style="width:16px;height:16px;border-radius:50%;${cls === 'timeline-done' ? 'background:#16a34a' : cls === 'timeline-current' ? 'background:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.2)' : cls === 'timeline-paused' ? 'background:#d97706;animation:pulse 2s infinite' : 'background:#d1d5db'};flex-shrink:0;margin-right:8px;"></div>
          <span style="${cls === 'timeline-upcoming' || cls === 'timeline-paused' ? 'color:#9ca3af' : 'color:#111'}">${label}</span>
        </div>`;
  }).join('');
}

function renderItemsSummary(order: Order): string {
  if (order.items.length === 0) return '';
  return order.items.map(item =>
    `        <div style="display:flex;justify-content:space-between;font-size:13px;padding:2px 0">
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

    return `<div class="order-card" style="border:1px solid #e5e5e5;border-radius:8px;padding:16px;font-family:system-ui,-apple-system,sans-serif;max-width:400px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <strong style="font-size:16px">Order #${o.orderNumber}</strong>
    <span style="background:${color}15;color:${color};padding:4px 10px;border-radius:12px;font-size:13px;font-weight:600">${emoji} ${STATUS_LABELS[o.status]}</span>
  </div>

  ${o.items.length > 0 ? `<div style="border-top:1px solid #eee;padding-top:8px;margin-bottom:8px">
${renderItemsSummary(o)}
  </div>` : ''}

  ${o.trackingNumber && o.carrier ? `<div style="border-top:1px solid #eee;padding-top:8px;margin-bottom:8px;font-size:13px">
    <div><strong>${o.carrier}</strong> — ${o.trackingNumber}</div>
    ${o.estimatedDelivery ? `<div style="color:#666;margin-top:2px">Estimated delivery: ${o.estimatedDelivery}</div>` : ''}
  </div>` : ''}

  ${o.status === 'on_hold' ? `<div style="border-top:1px solid #eee;padding-top:8px;margin-bottom:8px">
    <div style="font-size:12px;color:#d97706;font-weight:600;margin-bottom:4px">&#x23F3; On Hold — progress paused</div>
  </div>` : ''}
  ${!isFailed ? `<div style="border-top:1px solid #eee;padding-top:8px">
    <div style="font-size:12px;font-weight:600;color:#666;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Tracking Progress</div>
${renderTimeline(o.status)}
  </div>` : ''}

  ${o.notes ? `<div style="border-top:1px solid #eee;padding-top:8px;margin-top:8px;font-size:13px;color:#666">
    <em>${o.notes}</em>
  </div>` : ''}
</div>`;
  }
}
