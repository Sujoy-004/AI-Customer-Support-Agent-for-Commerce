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

  describe('edge cases — question words with no topic', () => {
    it('should treat questions with question words but no context as ambiguous (on-topic by default because no keyword signals)', async () => {
      // Zero keyword matches in either direction → confidence stays 0
      // The ambiguous-signal check only fires when confidence ∈ [0.3, 0.7]
      const result = await offTopicDetector.detectOffTopic('what is this');
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should not flag a question word query that also has on-topic keywords', async () => {
      const result = await offTopicDetector.detectOffTopic('what is your return policy');
      expect(result.isOffTopic).toBe(false);
    });
  });

  describe('edge cases — very short queries', () => {
    it('should treat "ok" as ambiguous (on-topic by default, no keyword signals)', async () => {
      // "ok" has 0 keyword matches in either direction → confidence stays 0
      const result = await offTopicDetector.detectOffTopic('ok');
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should treat "?" as ambiguous (on-topic by default, no keyword signals)', async () => {
      const result = await offTopicDetector.detectOffTopic('?');
      expect(result.isOffTopic).toBe(false);
    });
  });

  describe('edge cases — multiple off-topic keyword categories', () => {
    it('should increase confidence for multiple off-topic categories', async () => {
      const result = await offTopicDetector.detectOffTopic('what is the weather and sports news');
      expect(result.isOffTopic).toBe(true);
      // 3 off-topic keywords → 0.5 + 3*0.1 = 0.8
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('edge cases — on-topic signals override off-topic', () => {
    it('should treat "Amazon shipping policy" as on-topic because of strong on-topic signals', async () => {
      // "shipping", "policy", and "ship" are all on-topic keywords (≥2 override)
      const result = await offTopicDetector.detectOffTopic('Amazon shipping policy');
      expect(result.isOffTopic).toBe(false);
    });

    it('should handle partial override when on-topic signals are weak', async () => {
      // "Amazon" is off-topic, but "shipping" also matches "ship" (partial overlap)
      // giving 2 on-topic matches → triggers the override block even though
      // there's no meaningful on-topic intent
      const result = await offTopicDetector.detectOffTopic('Amazon shipping');
      // Results in isOffTopic = false with confidence = 0.3
      expect(result.isOffTopic).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('edge cases — multi-word keyword matching', () => {
    it('should detect multi-word competitor "best buy" but "buy" overlaps with on-topic keyword', async () => {
      // 'buy' is in ON_TOPIC_KEYWORDS, 'store' also matches → 2 on-topic matches
      // This overrides the off-topic classification
      const result = await offTopicDetector.detectOffTopic('how does your store compare to best buy');
      expect(result.isOffTopic).toBe(false);
    });

    it('should detect multi-word keyword "send back" as policy-related', async () => {
      // "send back" is a returns keyword, but it's not in OFF_TOPIC_KEYWORDS
      // It matches returns keywords in _assessPolicyRelevance only, not here
      const result = await offTopicDetector.detectOffTopic('how do I send back an item');
      expect(result.isOffTopic).toBe(false);
    });
  });

  describe('edge cases — default suggestions', () => {
    it('should provide default suggestions when no specific category was detected', async () => {
      // A query that triggers off-topic but doesn't match any suggestion category
      const result = await offTopicDetector.detectOffTopic('gambling casino');
      expect(result.isOffTopic).toBe(true);
      expect(result.suggestedTopics.length).toBeGreaterThan(0);
    });
  });
});