import type { ResponseSurface, ProductCardSurface, ProductListSurface, StockStatusSurface } from './renderTypes';
import type { StockInfo } from '../../../src/services/types';
import { renderProductCard, renderProductList } from './renderProductCard';

export function renderResponseSurface(surface: ResponseSurface): HTMLElement {
  switch (surface.type) {
    case 'product-card':
      return renderProductCardSurface(surface);
    case 'product-list':
      return renderProductListSurface(surface);
    case 'stock-status':
      return renderStockStatusSurface(surface);
  }
}

function renderProductCardSurface(surface: ProductCardSurface): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'response-surface';

  const card = renderProductCard(surface.product);
  wrapper.appendChild(card);

  if (surface.variant) {
    const variantBar = document.createElement('div');
    variantBar.className = 'rs-variant-bar';

    const variantName = document.createElement('span');
    variantName.className = 'rs-variant-name';
    variantName.textContent = surface.variant.title;

    const variantPrice = document.createElement('span');
    variantPrice.className = 'rs-variant-price';
    variantPrice.textContent = `$${surface.variant.price}`;

    const stockLabel = formatStockLabel(surface.variant.stock);
    const stockBadge = document.createElement('span');
    stockBadge.className = `rs-stock-badge ${stockLabel.cls}`;
    stockBadge.textContent = stockLabel.text;

    variantBar.appendChild(variantName);
    variantBar.appendChild(variantPrice);
    variantBar.appendChild(stockBadge);
    wrapper.appendChild(variantBar);
  }

  return wrapper;
}

function renderProductListSurface(surface: ProductListSurface): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'response-surface';

  if (surface.query) {
    const header = document.createElement('div');
    header.className = 'rs-list-header';
    header.textContent = `${surface.totalCount} result${surface.totalCount !== 1 ? 's' : ''}`;
    wrapper.appendChild(header);
  }

  const list = renderProductList(surface.products, 4);
  wrapper.appendChild(list);

  return wrapper;
}

function renderStockStatusSurface(surface: StockStatusSurface): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'response-surface rs-stock-surface';

  const productTitle = document.createElement('div');
  productTitle.className = 'rs-stock-product';
  productTitle.textContent = surface.product.title;

  const variantRow = document.createElement('div');
  variantRow.className = 'rs-stock-variant';

  const variantName = document.createElement('span');
  variantName.className = 'rs-variant-name';
  variantName.textContent = surface.variant.title;

  const stockLabel = formatStockLabel(surface.variant.stock);
  const stockBadge = document.createElement('span');
  stockBadge.className = `rs-stock-badge ${stockLabel.cls}`;
  stockBadge.textContent = stockLabel.text;

  variantRow.appendChild(variantName);
  variantRow.appendChild(stockBadge);

  wrapper.appendChild(productTitle);
  wrapper.appendChild(variantRow);

  return wrapper;
}

function formatStockLabel(stock: StockInfo): { text: string; cls: string } {
  if (!stock.available || stock.quantity === 0) {
    return { text: 'Out of stock', cls: 'rs-stock--oos' };
  }
  if (stock.isLowStock) {
    return { text: `Only ${stock.quantity} left`, cls: 'rs-stock--low' };
  }
  return { text: 'In stock', cls: 'rs-stock--available' };
}
