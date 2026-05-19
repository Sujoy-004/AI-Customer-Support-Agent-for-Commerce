import type { ChatMessage, TimestampFormatter, MessageBubbleElements } from './renderTypes';

const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'strong', 'em',
  'ul', 'ol', 'li', 'code', 'pre',
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
      while (el.attributes.length > 0) {
        el.removeAttribute(el.attributes[0].name);
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
  bubble.className = 'msg msg--agent';
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

  const statusEl = createStatusEl(msg.status, msg.id);

  bubble.appendChild(header);
  bubble.appendChild(content);
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
