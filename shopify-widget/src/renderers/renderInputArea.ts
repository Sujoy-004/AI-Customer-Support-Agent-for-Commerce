export interface InputAreaElements {
  container: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
}

export interface InputCallbacks {
  onSend: () => void;
  onInput: () => void;
  onKeydown: (e: KeyboardEvent) => void;
}

const PLACEHOLDERS = [
  'Ask about products, orders, or policies',
  'Track an order — enter order number',
  'Check product availability',
  'View shipping or return policies',
  'Search products by name or type',
];

let placeholderIndex = 0;
let placeholderInterval: ReturnType<typeof setInterval> | null = null;

export function createInputArea(callbacks: InputCallbacks): InputAreaElements {
  const container = document.createElement('div');
  container.className = 'input-area';

  const textarea = document.createElement('textarea');
  textarea.className = 'input-textarea';
  textarea.placeholder = PLACEHOLDERS[0];
  textarea.rows = 1;

  const sendBtn = document.createElement('button');
  sendBtn.className = 'input-send';
  sendBtn.setAttribute('aria-label', 'Send message');
  sendBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 8L14.5 8M14.5 8L9 2.5M14.5 8L9 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  textarea.addEventListener('input', callbacks.onInput);
  textarea.addEventListener('keydown', callbacks.onKeydown);
  sendBtn.addEventListener('click', callbacks.onSend);

  container.appendChild(textarea);
  container.appendChild(sendBtn);

  return { container, textarea, sendBtn };
}

export function setPlaceholder(textarea: HTMLTextAreaElement, text: string): void {
  textarea.placeholder = text;
}

export function startPlaceholderRotation(textarea: HTMLTextAreaElement): void {
  stopPlaceholderRotation();
  placeholderInterval = setInterval(() => {
    if (document.activeElement !== textarea && textarea.value.length === 0) {
      placeholderIndex = (placeholderIndex + 1) % PLACEHOLDERS.length;
      textarea.placeholder = PLACEHOLDERS[placeholderIndex];
    }
  }, 4000);
}

export function stopPlaceholderRotation(): void {
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
    placeholderInterval = null;
  }
}
