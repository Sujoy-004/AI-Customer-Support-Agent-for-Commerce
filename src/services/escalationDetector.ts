// src/services/escalationDetector.ts
/**
 * Escalation Detection System
 * Identifies explicit handoff requests and frustration signals
 */

import type { EscalationTrigger } from './types';

export class EscalationDetector {
  private readonly EXPLICIT_KEYWORDS = [
    'talk to human', 'speak to agent', 'representative',
    'real person', 'human support', 'talk to staff',
    'customer service', 'talk to a person', 'speak to a human',
    'connect me', 'transfer me', 'human agent',
    'live agent', 'live person', 'talk to someone',
    'speak to a representative', 'agent please', 'human please',
  ];

  private readonly FRUSTRATION_KEYWORDS = [
    'useless', 'terrible', 'worst', 'horrible',
    'waste of time', 'i give up', 'awful', 'pathetic',
    'ridiculous', 'unacceptable', 'fed up',
  ];

  private nonResolvingCount = 0;
  private cancelledThisSession = false;

  detectIntent(query: string): EscalationTrigger {
    const lower = query.toLowerCase().trim();
    if (!lower) return 'none';

    for (const keyword of this.EXPLICIT_KEYWORDS) {
      if (lower.includes(keyword)) return 'explicit';
    }

    if (this.FRUSTRATION_KEYWORDS.some(k => lower.includes(k))) {
      return 'frustration';
    }

    if (this.nonResolvingCount >= 3) return 'frustration';

    return 'none';
  }

  incrementNonResolving(): void {
    this.nonResolvingCount++;
  }

  resetNonResolving(): void {
    this.nonResolvingCount = 0;
  }

  markCancelled(): void {
    this.cancelledThisSession = true;
  }

  isDuplicateRequest(): boolean {
    return this.cancelledThisSession;
  }

  resetCancelled(): void {
    this.cancelledThisSession = false;
  }
}