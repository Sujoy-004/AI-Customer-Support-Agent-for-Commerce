import { describe, it, expect, beforeEach } from 'vitest';
import ChatWidget from '../src/ChatWidget';
import { CatalogIntentDetector } from '../../src/services/catalogIntentDetector';
import { CatalogService } from '../../src/services/catalogService';
import { MockCatalogDataSource } from '../../src/services/mockCatalogData';

function createWidget(): ChatWidget {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);

  const catalogService = new CatalogService(new MockCatalogDataSource());
  const catalogIntentDetector = new CatalogIntentDetector(catalogService);

  const widget = new ChatWidget({
    container,
    catalogIntentDetector,
    catalogService
  });

  return widget;
}

describe('ChatWidget catalog integration', () => {
  let widget: ChatWidget;

  beforeEach(() => {
    widget = createWidget();
  });

  it('should return catalog response for product search query', async () => {
    const response = await widget._generateAgentResponse('do you have the classic hoodie');
    expect(response).toContain('Classic Hoodie');
    expect(response).not.toContain('I\'m here to help');
  });

  it('should return catalog response for availability query', async () => {
    const response = await widget._generateAgentResponse('how many classic hoodies are available');
    expect(response).toContain('Classic Hoodie');
    expect(response).toContain('Stock');
  });

  it('should return out of stock message for unavailable variant', async () => {
    const response = await widget._generateAgentResponse('running shoes size 10 black');
    expect(response).toContain('Out of Stock');
  });

  it('should handle sizing inquiry for a product', async () => {
    const response = await widget._generateAgentResponse('what sizes does the denim jacket come in');
    expect(response).toContain('Denim Jacket');
    expect(response).toContain('Size');
  });

  it('should return partial match with clarifying options', async () => {
    const response = await widget._generateAgentResponse('classic hoodie in black');
    expect(response).toContain('Classic Hoodie');
    expect(response).toContain('Size');
  });

  it('should handle single product search via generic query', async () => {
    const response = await widget._generateAgentResponse('do you have leather belts');
    expect(response).toContain('Leather Belt');
  });

  it('should return search results for broad query', async () => {
    const response = await widget._generateAgentResponse('what products do you have');
    expect(response).toContain('I found');
  });

  it('should handle follow-up queries with context', async () => {
    const first = await widget._generateAgentResponse('classic hoodie in black');
    expect(first).toContain('Classic Hoodie');
    expect(first).toContain('Black');

    const second = await widget._generateAgentResponse('what about large');
    expect(second).toContain('Classic Hoodie');
    expect(second).toContain('Size');
  });

  describe('order tracking pipeline', () => {
    it('should return order card HTML for order query with number and email', async () => {
      const response = await widget._generateAgentResponse('track order #1001 for john@example.com');
      expect(response).toContain('order-card');
      expect(response).toContain('Order #1001');
    });

    it('should prompt for email when only order number given', async () => {
      const response = await widget._generateAgentResponse('track my order');
      expect(response).toContain('order number');
    });

    it('should return not_found message for non-existent order', async () => {
      const response = await widget._generateAgentResponse('track order #9999 for nobody@example.com');
      expect(response).toContain("wasn't found");
    });
  });
});
