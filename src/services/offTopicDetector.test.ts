// src/services/offTopicDetector.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { OffTopicDetector } from './offTopicDetector';
import { PolicyService } from './policyService';

describe('OffTopicDetector', () => {
  let offTopicDetector: OffTopicDetector;
  let policyService: PolicyService;

  beforeEach(() => {
    policyService = new PolicyService();
    offTopicDetector = new OffTopicDetector(policyService);
  });

  describe('detectOffTopic', () => {
    it('should detect off-topic questions about weather', async () => {
      const result = await offTopicDetector.detectOffTopic('What is the weather like today?');
      
      expect(result.isOffTopic).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasons).toContain('Contains off-topic keywords: weather');
    });

    it('should detect off-topic questions about competitors', async () => {
      const result = await offTopicDetector.detectOffTopic('How do your prices compare to Amazon?');
      
      expect(result.isOffTopic).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should treat ambiguous queries as on-topic', async () => {
      const result = await offTopicDetector.detectOffTopic('Tell me a fun fact');
      
      // No keyword matches either direction — treated as ambiguous, not off-topic
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should not detect on-topic questions about shipping as off-topic', async () => {
      const result = await offTopicDetector.detectOffTopic('What are your shipping rates?');
      
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should not detect on-topic questions about returns as off-topic', async () => {
      const result = await offTopicDetector.detectOffTopic('What is your return policy?');
      
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should not detect on-topic questions about warranty as off-topic', async () => {
      const result = await offTopicDetector.detectOffTopic('What does your warranty cover?');
      
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle empty queries', async () => {
      const result = await offTopicDetector.detectOffTopic('');
      
      expect(result.isOffTopic).toBe(true);
      expect(result.reasons).toContain('Empty query');
    });

    it('should handle very short queries', async () => {
      const result = await offTopicDetector.detectOffTopic('hi');
      
      // No keyword matches — treated as ambiguous, not off-topic
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should provide suggested topics for off-topic queries', async () => {
      const result = await offTopicDetector.detectOffTopic('What is the weather today?');
      
      expect(result.suggestedTopics.length).toBeGreaterThan(0);
      expect(result.suggestedTopics[0]).toContain('products');
    });
  });
});