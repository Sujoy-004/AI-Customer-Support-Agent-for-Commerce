// src/services/escalationStateMachine.ts
/**
 * Escalation State Machine
 * Manages escalation workflow with localStorage persistence
 */

import type { EscalationEvent, EscalationState, EscalationStatus, EscalationTrigger } from './types';

export const VALID_TRANSITIONS: Record<EscalationStatus, EscalationEvent[]> = {
  IDLE:          ['OFFER'],
  OFFERED:       ['CONFIRM', 'CANCEL'],
  CONFIRMING:    ['QUEUE', 'CANCEL'],
  TRANSFERRING:  ['QUEUE', 'FAIL'],
  QUEUED:        ['CONNECT', 'CANCEL', 'FAIL'],
  CONNECTED:     [],
  CANCELLED:     ['RESET'],
  FAILED:        ['RETRY', 'ABANDON'],
};

const STORAGE_KEY = 'escalation_state';

function createDefaultState(): EscalationState {
  return {
    status: 'IDLE',
    triggerType: 'none',
    queuedAt: null,
    position: 0,
    lastContext: { userMessages: [], agentResponse: null },
  };
}

export class EscalationStateMachine {
  private state: EscalationState;

  constructor() {
    this.state = this.load();
  }

  transition(event: EscalationEvent, triggerType?: EscalationTrigger): boolean {
    const allowed = VALID_TRANSITIONS[this.state.status];
    if (!allowed.includes(event)) return false;

    switch (event) {
      case 'OFFER':
        this.state.status = 'OFFERED';
        if (triggerType) this.state.triggerType = triggerType;
        break;
      case 'CONFIRM':
        this.state.status = 'CONFIRMING';
        break;
      case 'QUEUE':
        this.state.status = 'QUEUED';
        this.state.queuedAt = Date.now();
        break;
      case 'CONNECT':
        this.state.status = 'CONNECTED';
        break;
      case 'CANCEL':
        this.state.status = 'CANCELLED';
        this.state.queuedAt = null;
        this.state.position = 0;
        break;
      case 'RESET':
        this.state = createDefaultState();
        break;
      case 'FAIL':
        this.state.status = 'FAILED';
        break;
      case 'RETRY':
        this.state.status = 'TRANSFERRING';
        break;
      case 'ABANDON':
        this.state = createDefaultState();
        break;
    }

    this.save();
    return true;
  }

  isActive(): boolean {
    return ['OFFERED', 'CONFIRMING', 'TRANSFERRING', 'QUEUED'].includes(this.state.status);
  }

  getState(): EscalationState {
    return { ...this.state };
  }

  getCurrentSystemMessage(): string | null {
    switch (this.state.status) {
      case 'OFFERED':
        return this.state.triggerType === 'frustration'
          ? "It looks like you're having trouble finding what you need. Would you like me to connect you with a human agent?"
          : "I'll transfer you to a human agent who can help. Transfer now?";
      case 'TRANSFERRING':
        return 'Transferring you to a human agent...';
      case 'QUEUED':
        return `You're number ${this.state.position} in the queue. An agent will be with you shortly.`;
      case 'CONNECTED':
        return "You're now connected with a human agent.";
      case 'CANCELLED':
        return 'Escalation cancelled. How else can I help you?';
      case 'FAILED':
        return "I'm sorry, no human agents are available right now. I can keep helping you, or you can try again later.";
      default:
        return null;
    }
  }

  updateContext(userMessages: string[], agentResponse: string | null): void {
    this.state.lastContext = {
      userMessages: userMessages.slice(-3),
      agentResponse,
    };
    this.save();
  }

  getStorageKey(): string {
    return STORAGE_KEY;
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = createDefaultState();
  }

  private load(): EscalationState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as EscalationState;
    } catch {
    }
    return createDefaultState();
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
    }
  }
}