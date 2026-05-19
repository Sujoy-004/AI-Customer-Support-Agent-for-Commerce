export function createTypingIndicator(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'typing-indicator';

  const role = document.createElement('div');
  role.className = 'typing-role';
  role.textContent = 'Human Agent';

  const content = document.createElement('div');
  content.className = 'typing-dots';

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'typing-dot';
    content.appendChild(dot);
  }

  el.appendChild(role);
  el.appendChild(content);

  return el;
}

export function removeTypingIndicator(parentEl: HTMLElement): HTMLElement | null {
  const existing = parentEl.querySelector('.typing-indicator');
  if (existing) {
    existing.remove();
  }
  return null;
}
