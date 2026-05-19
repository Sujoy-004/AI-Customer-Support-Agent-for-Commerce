import type { SuggestedAction } from '../../../src/services/types';

export interface ActionChipCallbacks {
  onSelect: (query: string) => void;
}

export function createActionChips(
  suggestions: SuggestedAction[],
  callbacks: ActionChipCallbacks
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'action-chips';

  for (let i = 0; i < suggestions.length; i++) {
    const action = suggestions[i];
    const btn = document.createElement('button');
    btn.className = 'action-chip';
    btn.dataset.action = action.label.toLowerCase().replace(/\s+/g, '-');
    btn.style.animationDelay = `${i * 60}ms`;

    if (action.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'action-chip-icon';
      iconEl.textContent = action.icon;
      btn.appendChild(iconEl);
    }

    const labelEl = document.createElement('span');
    labelEl.className = 'action-chip-label';
    labelEl.textContent = action.label;
    btn.appendChild(labelEl);

    btn.addEventListener('click', () => callbacks.onSelect(action.query));
    container.appendChild(btn);
  }

  return container;
}
