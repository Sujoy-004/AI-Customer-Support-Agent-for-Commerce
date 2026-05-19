import type { AutocompleteResult } from '../../../src/services/types';

export interface AutocompleteCallbacks {
  onSelect: (index: number) => void;
}

const TYPE_META: Record<string, { label: string; cls: string }> = {
  product: { label: 'P', cls: 'autocomplete-type--product' },
  order: { label: '#', cls: 'autocomplete-type--order' },
  policy: { label: 'S', cls: 'autocomplete-type--policy' },
};

export function createAutocompleteDropdown(
  results: AutocompleteResult[],
  highlightedIndex: number,
  callbacks: AutocompleteCallbacks
): HTMLElement {
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';

  results.forEach((result, index) => {
    const item = document.createElement('div');
    item.className = `autocomplete-item${index === highlightedIndex ? ' autocomplete-item--highlighted' : ''}`;
    item.dataset.index = String(index);

    const meta = TYPE_META[result.type] ?? TYPE_META.product;
    const typeBadge = document.createElement('span');
    typeBadge.className = `autocomplete-type ${meta.cls}`;
    typeBadge.textContent = meta.label;

    const label = document.createElement('span');
    label.className = 'autocomplete-label';
    label.textContent = result.label;

    item.appendChild(typeBadge);
    item.appendChild(label);

    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      callbacks.onSelect(index);
    });

    dropdown.appendChild(item);
  });

  return dropdown;
}

export function highlightAutocompleteItem(dropdown: HTMLElement, index: number): void {
  const items = dropdown.querySelectorAll('.autocomplete-item');
  items.forEach((item, i) => {
    item.classList.toggle('autocomplete-item--highlighted', i === index);
  });
}
