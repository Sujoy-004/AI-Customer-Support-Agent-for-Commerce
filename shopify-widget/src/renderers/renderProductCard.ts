import type { Product, StockInfo } from '../../../src/services/types';

function formatStockLabel(stock: StockInfo): { text: string; cls: string } {
  if (!stock.available || stock.quantity === 0) {
    return { text: 'Out of stock', cls: 'pc-stock--oos' };
  }
  if (stock.isLowStock) {
    return { text: `Only ${stock.quantity} left`, cls: 'pc-stock--low' };
  }
  return { text: 'In stock', cls: 'pc-stock--available' };
}

export function renderProductCard(product: Product): HTMLElement {
  const card = document.createElement('div');
  card.className = 'pc-card';

  const header = document.createElement('div');
  header.className = 'pc-header';

  const title = document.createElement('div');
  title.className = 'pc-title';
  title.textContent = product.title;

  const price = document.createElement('div');
  price.className = 'pc-price';
  if (product.priceRange.min === product.priceRange.max) {
    price.textContent = `$${product.priceRange.min}`;
  } else {
    price.textContent = `$${product.priceRange.min} – $${product.priceRange.max}`;
  }

  header.appendChild(title);
  header.appendChild(price);

  // Commerce metadata — subtle SKU + type
  const meta = document.createElement('div');
  meta.className = 'pc-meta';
  const firstVariant = product.variants[0];
  if (firstVariant?.sku) {
    const sku = document.createElement('span');
    sku.className = 'pc-sku';
    sku.textContent = `SKU: ${firstVariant.sku}`;
    meta.appendChild(sku);
  }
  if (product.type) {
    const type = document.createElement('span');
    type.className = 'pc-type';
    type.textContent = product.type;
    meta.appendChild(type);
  }

  const variants = document.createElement('div');
  variants.className = 'pc-variants';

  const inStock = product.variants.filter(v => v.inventory.available && v.inventory.quantity > 0);
  const sample = inStock.slice(0, 3);

  for (const variant of sample) {
    const row = document.createElement('div');
    row.className = 'pc-variant-row';

    const name = document.createElement('span');
    name.className = 'pc-variant-name';
    name.textContent = variant.title;

    const stock = formatStockLabel(variant.inventory);
    const stockEl = document.createElement('span');
    stockEl.className = `pc-stock ${stock.cls}`;
    stockEl.textContent = stock.text;

    row.appendChild(name);
    row.appendChild(stockEl);
    variants.appendChild(row);
  }

  const remaining = inStock.length - sample.length;
  if (remaining > 0) {
    const more = document.createElement('div');
    more.className = 'pc-more';
    more.textContent = `+${remaining} more variant${remaining !== 1 ? 's' : ''}`;
    variants.appendChild(more);
  }

  card.appendChild(header);
  if (meta.childNodes.length > 0) card.appendChild(meta);
  card.appendChild(variants);

  return card;
}

export function renderProductList(products: Product[], limit = 4): HTMLElement {
  const container = document.createElement('div');
  container.className = 'pc-list';

  const shown = products.slice(0, limit);
  for (const product of shown) {
    container.appendChild(renderProductCard(product));
  }

  if (products.length > limit) {
    const more = document.createElement('div');
    more.className = 'pc-list-more';
    more.textContent = `+${products.length - limit} more products`;
    container.appendChild(more);
  }

  return container;
}
