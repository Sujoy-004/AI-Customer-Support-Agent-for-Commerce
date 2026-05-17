// src/services/escalationDetector.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { EscalationDetector } from './escalationDetector';

const createDetector = () => new EscalationDetector();

describe('EscalationDetector', () => {
  let detector: EscalationDetector;

  beforeEach(() => {
    detector = createDetector();
  });

  describe('detectIntent', () => {
    it('should detect explicit handoff - talk to human', () => {
      const result = detector.detectIntent('talk to human');
      expect(result).toBe('explicit');
    });

    it('should detect explicit handoff - speak to agent', () => {
      const result = detector.detectIntent('speak to agent');
      expect(result).toBe('explicit');
    });

    it('should detect explicit handoff - representative', () => {
      const result = detector.detectIntent('I want to speak to a representative');
      expect(result).toBe('explicit');
    });

    it('should detect frustration - useless', () => {
      const result = detector.detectIntent('this is useless');
      expect(result).toBe('frustration');
    });

    it('should detect frustration - terrible', () => {
      const result = detector.detectIntent('terrible service');
      expect(result).toBe('frustration');
    });

    it('should detect frustration - i give up', () => {
      const result = detector.detectIntent('i give up');
      expect(result).toBe('frustration');
    });

    it('should return none for non-escalation - order status', () => {
      const result = detector.detectIntent('what is my order status');
      expect(result).toBe('none');
    });

    it('should return none for non-escalation - product query', () => {
      const result = detector.detectIntent('do you have hoodies');
      expect(result).toBe('none');
    });

    it('should be case insensitive', () => {
      const result = detector.detectIntent('I want to TALK TO HUMAN please');
      expect(result).toBe('explicit');
    });

    it('should trigger frustration after 3 non-resolving messages', () => {
      detector.incrementNonResolving();
      detector.incrementNonResolving();
      detector.incrementNonResolving();
      const result = detector.detectIntent('hello');
      expect(result).toBe('frustration');
    });

    it('should return none for empty string', () => {
      const result = detector.detectIntent('');
      expect(result).toBe('none');
    });
  });

  describe('non-resolving counter', () => {
    it('should increment non-resolving count', () => {
      detector.incrementNonResolving();
      detector.incrementNonResolving();
      detector.incrementNonResolving();
      const result = detector.detectIntent('random query');
      expect(result).toBe('frustration');
    });

    it('should reset non-resolving count', () => {
      detector.incrementNonResolving();
      detector.incrementNonResolving();
      detector.incrementNonResolving();
      detector.resetNonResolving();
      const result = detector.detectIntent('hello');
      expect(result).toBe('none');
    });
  });

  describe('duplicate detection', () => {
    it('should return false when not cancelled', () => {
      const result = detector.isDuplicateRequest();
      expect(result).toBe(false);
    });

    it('should return true after cancellation', () => {
      detector.markCancelled();
      const result = detector.isDuplicateRequest();
      expect(result).toBe(true);
    });
  });
});