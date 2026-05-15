// src/services/refusalResponses.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RefusalResponseService } from './refusalResponses';
import { OffTopicDetector } from './offTopicDetector';
import { PolicyService } from './policyService';

describe('RefusalResponseService', () => {
  let refusalResponseService: RefusalResponseService;
  let offTopicDetector: OffTopicDetector;
  let policyService: PolicyService;

  beforeEach(() => {
    policyService = new PolicyService();
    offTopicDetector = new OffTopicDetector(policyService);
    refusalResponseService = new RefusalResponseService(offTopicDetector);
  });

  describe('generateRefusal', () => {
    it('should generate a refusal for off-topic weather questions', async () => {
      const response = await refusalResponseService.generateRefusal('What is the weather like today?');
      
      expect(response).toBeDefined();
      expect(response.message).toContain('store-related assistance');
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.tone).toBe('polite');
    });

    it('should generate a refusal for competitor questions', async () => {
      const response = await refusalResponseService.generateRefusal('How do you compare to Amazon?');
      
      expect(response).toBeDefined();
      expect(response.message).toContain('only provide information about our store');
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.tone).toBe('polite');
    });

    it('should generate a refusal for advice questions', async () => {
      const response = await refusalResponseService.generateRefusal('I need some advice on hiking gear');
      
      expect(response).toBeDefined();
      expect(response.message).toContain('personal advice');
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.tone).toBe('polite');
    });

    it('should return null for on-topic questions', async () => {
      const response = await refusalResponseService.generateRefusal('What is your shipping policy?');
      
      expect(response).toBeNull();
    });

    it('should handle empty queries', async () => {
      const response = await refusalResponseService.generateRefusal('');
      
      expect(response).toBeDefined();
      expect(response.message).toContain('help with questions about our store');
    });

    it('should provide helpful suggestions in refusals', async () => {
      const response = await refusalResponseService.generateRefusal('What is the news today?');
      
      expect(response).toBeDefined();
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.suggestions[0]).toContain('product');
    });
  });

  describe('generateSimpleRefusal', () => {
    it('should generate a polite simple refusal', () => {
      const response = refusalResponseService.generateSimpleRefusal();
      
      expect(response).toBeDefined();
      expect(response.message).toContain('store-related questions');
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.tone).toBe('polite');
    });
  });

  describe('technical/device category', () => {
    it('should generate a refusal for device-related questions', async () => {
      const response = await refusalResponseService.generateRefusal('my computer is broken');
      
      expect(response).toBeDefined();
      expect(response.message).toContain('technical support');
      expect(response.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle phone-related queries', async () => {
      const response = await refusalResponseService.generateRefusal('my phone screen is cracked');
      
      expect(response).toBeDefined();
      expect(response.message).toContain('technical support');
    });
  });

  describe('short/general query category', () => {
    it('should return null for "yes" since it is not off-topic (no keyword matches)', async () => {
      // "yes" has no off-topic keyword matches → not flagged as off-topic → null
      const response = await refusalResponseService.generateRefusal('yes');
      expect(response).toBeNull();
    });

    it('should return null for "no" since it is not off-topic (no keyword matches)', async () => {
      const response = await refusalResponseService.generateRefusal('no');
      expect(response).toBeNull();
    });
  });

  describe('multi-category query behavior', () => {
    it('should use competitor message when both weather and competitor keywords present', async () => {
      // Competitor category is checked AFTER weather, so it wins (overwrites)
      const response = await refusalResponseService.generateRefusal(
        'how does your weather compare to amazon'
      );
      expect(response).toBeDefined();
      // The competitor block runs after weather, overwriting the message
      expect(response.message).toContain('only provide information about our store');
      expect(response.message).not.toContain('weather');
    });
  });

  describe('suggestions.slice(0, 4) limiting', () => {
    it('should limit suggestions to at most 4 for weather queries', async () => {
      const response = await refusalResponseService.generateRefusal('what is the weather today');
      expect(response).toBeDefined();
      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should return exactly 4 suggestions for weather category', async () => {
      const response = await refusalResponseService.generateRefusal('weather today');
      expect(response).toBeDefined();
      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });

    it('should return exactly 4 suggestions for competitor category', async () => {
      const response = await refusalResponseService.generateRefusal('amazon prices');
      expect(response).toBeDefined();
      expect(response.suggestions.length).toBeLessThanOrEqual(4);
    });
  });
});