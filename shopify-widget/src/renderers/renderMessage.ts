import type { ChatMessage, TimestampFormatter, MessageBubbleElements } from './renderTypes';
import { renderResponseSurface } from './renderResponseSurface';

const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'strong', 'em',
  'ul', 'ol', 'li', 'code', 'pre',
]);

const ALLOWED_CLASSES = new Set([
  // Order Card
  'oc-card', 'oc-head', 'oc-head-left', 'oc-order-label', 'oc-order-number',
  'oc-badge', 'oc-status--cancelled', 'oc-status--returned', 'oc-status--hold',
  'oc-status--delivered', 'oc-status--active',
  'oc-items', 'oc-item', 'oc-item-name', 'oc-item-variant', 'oc-item-qty',
  'oc-tracking', 'oc-tracking-icon', 'oc-tracking-info', 'oc-tracking-row', 'oc-tracking-carrier',
  'oc-tracking-number', 'oc-tracking-est',
  'oc-hold-banner', 'oc-timeline',
  'oc-tl-step', 'oc-tl-dot', 'oc-tl-label', 'oc-tl-line',
  'oc-tl--paused', 'oc-tl--inactive', 'oc-tl--done', 'oc-tl--current', 'oc-tl--upcoming',
  'oc-notes',
  // Response Surface
  'rs-list', 'rs-list-header', 'rs-item', 'rs-item-title', 'rs-item-price',
  'rs-item-stock', 'rs-item-stock--in', 'rs-item-stock--low', 'rs-item-stock--out',
  // Product Card
  'pc-card', 'pc-header', 'pc-title', 'pc-price', 'pc-badge',
  'pc-options', 'pc-option', 'pc-variants', 'pc-variant',
  'pc-stock', 'pc-stock--in', 'pc-stock--low', 'pc-stock--out',
]);

function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const allElements: Element[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    allElements.push(node as Element);
  }

  for (const el of allElements) {
    if (!el.parentNode) continue;

    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      while (el.firstChild) {
        el.parentNode!.insertBefore(el.firstChild, el);
      }
      el.remove();
    } else {
      // Preserve whitelisted classes, remove others
      if (el.hasAttribute('class')) {
        const classes = el.getAttribute('class')!.split(/\s+/);
        const kept = classes.filter(c => ALLOWED_CLASSES.has(c));
        if (kept.length > 0) {
          el.setAttribute('class', kept.join(' '));
        } else {
          el.removeAttribute('class');
        }
      }
    }
  }

  return doc.body.innerHTML;
}

function createHeader(role: string, timestamp: number, formatTs: TimestampFormatter): HTMLElement {
  const header = document.createElement('div');
  header.className = 'msg-header';
  const label = document.createElement('span');
  label.className = 'msg-role';
  label.textContent = role;
  const time = document.createElement('time');
  time.className = 'msg-time';
  time.textContent = formatTs(timestamp);
  header.appendChild(label);
  header.appendChild(time);
  return header;
}

function createStatusEl(status: ChatMessage['status'], id: string): HTMLElement {
  const el = document.createElement('span');
  el.className = `msg-status msg-status--${status}`;
  el.dataset.statusFor = id;
  return el;
}

export function createUserMessage(msg: ChatMessage, formatTs: TimestampFormatter): MessageBubbleElements {
  const bubble = document.createElement('div');
  bubble.className = 'msg msg--user';
  bubble.dataset.messageId = msg.id;

  const content = document.createElement('div');
  content.className = 'msg-content';
  content.textContent = msg.text;

  bubble.appendChild(content);

  return { bubble };
}

export function createAgentMessage(msg: ChatMessage, formatTs: TimestampFormatter): MessageBubbleElements {
  const bubble = document.createElement('div');
  bubble.className = `msg msg--agent msg--type-${msg.responseType ?? 'general'}`;
  bubble.dataset.messageId = msg.id;

  const header = createHeader(
    msg.isHumanAgent ? 'Human Agent' : 'Support',
    msg.timestamp,
    formatTs
  );
  if (msg.isHumanAgent) {
    header.querySelector('.msg-role')?.classList.add('msg-role--human');
  }

  const content = document.createElement('div');
  content.className = 'msg-content';

  if (msg.text.includes('<')) {
    content.innerHTML = sanitizeHtml(msg.text);
  } else {
    content.textContent = msg.text;
  }

  bubble.appendChild(header);
  bubble.appendChild(content);

  if (msg.surface) {
    const surfaceEl = renderResponseSurface(msg.surface);
    bubble.appendChild(surfaceEl);
  }

  const statusEl = createStatusEl(msg.status, msg.id);
  bubble.appendChild(statusEl);

  return { bubble, statusEl };
}

export function createErrorMessage(msg: ChatMessage): { bubble: HTMLElement } {
  const bubble = document.createElement('div');
  bubble.className = 'msg msg--error';
  bubble.dataset.messageId = msg.id;

  const icon = document.createElement('span');
  icon.className = 'msg-error-icon';
  icon.textContent = '!';

  const content = document.createElement('div');
  content.className = 'msg-content';
  content.textContent = msg.text;

  bubble.appendChild(icon);
  bubble.appendChild(content);

  return { bubble };
}

export function updateMessageStatus(
  messageListEl: HTMLElement,
  messageId: string,
  newStatus: ChatMessage['status']
): void {
  const statusEl = messageListEl.querySelector(`[data-status-for="${messageId}"]`);
  if (statusEl) {
    statusEl.className = `msg-status msg-status--${newStatus}`;
  }
}
