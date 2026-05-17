// src/services/escalationStateMachine.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EscalationStateMachine, VALID_TRANSITIONS } from './escalationStateMachine';

describe('EscalationStateMachine', () => {
  let machine: EscalationStateMachine;

  beforeEach(() => {
    localStorage.clear();
    machine = new EscalationStateMachine();
  });

  describe('initial state', () => {
    it('should start in IDLE status', () => {
      const state = machine.getState();
      expect(state.status).toBe('IDLE');
    });

    it('should have null triggerType initially', () => {
      const state = machine.getState();
      expect(state.triggerType).toBe('none');
    });

    it('should have position 0 initially', () => {
      const state = machine.getState();
      expect(state.position).toBe(0);
    });
  });

  describe('valid transitions', () => {
    it('should transition OFFER from IDLE', () => {
      const result = machine.transition('OFFER', 'explicit');
      expect(result).toBe(true);
      expect(machine.getState().status).toBe('OFFERED');
    });

    it('should transition CONFIRM from OFFERED', () => {
      machine.transition('OFFER', 'explicit');
      const result = machine.transition('CONFIRM');
      expect(result).toBe(true);
      expect(machine.getState().status).toBe('CONFIRMING');
    });

    it('should transition QUEUE from CONFIRMING', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      const result = machine.transition('QUEUE');
      expect(result).toBe(true);
      expect(machine.getState().status).toBe('QUEUED');
    });

    it('should transition CONNECT from QUEUED', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      machine.transition('QUEUE');
      const result = machine.transition('CONNECT');
      expect(result).toBe(true);
      expect(machine.getState().status).toBe('CONNECTED');
    });

    it('should transition CANCEL from OFFERED', () => {
      machine.transition('OFFER', 'explicit');
      const result = machine.transition('CANCEL');
      expect(result).toBe(true);
      expect(machine.getState().status).toBe('CANCELLED');
    });

    it('should transition CANCEL from QUEUED', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      machine.transition('QUEUE');
      const result = machine.transition('CANCEL');
      expect(result).toBe(true);
      expect(machine.getState().status).toBe('CANCELLED');
    });
  });

  describe('invalid transitions', () => {
    it('should reject IDLE to QUEUE', () => {
      const result = machine.transition('QUEUE');
      expect(result).toBe(false);
      expect(machine.getState().status).toBe('IDLE');
    });

    it('should reject IDLE to CONNECT', () => {
      const result = machine.transition('CONNECT');
      expect(result).toBe(false);
      expect(machine.getState().status).toBe('IDLE');
    });

    it('should reject CONNECTED to CANCEL (terminal state)', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      machine.transition('QUEUE');
      machine.transition('CONNECT');
      const result = machine.transition('CANCEL');
      expect(result).toBe(false);
      expect(machine.getState().status).toBe('CONNECTED');
    });
  });

  describe('isActive', () => {
    it('should return false when IDLE', () => {
      expect(machine.isActive()).toBe(false);
    });

    it('should return true when OFFERED', () => {
      machine.transition('OFFER', 'explicit');
      expect(machine.isActive()).toBe(true);
    });

    it('should return true when CONFIRMING', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      expect(machine.isActive()).toBe(true);
    });

    it('should return true when TRANSFERRING', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      machine.transition('QUEUE');
      machine.transition('CONNECT');
      machine.transition('FAIL');
      expect(machine.isActive()).toBe(false);
    });

    it('should return true when QUEUED', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CONFIRM');
      machine.transition('QUEUE');
      expect(machine.isActive()).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should save state to localStorage', () => {
      machine.transition('OFFER', 'explicit');
      const stored = localStorage.getItem('escalation_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.status).toBe('OFFERED');
    });

    it('should load state from localStorage on construction', () => {
      machine.transition('OFFER', 'explicit');
      const newMachine = new EscalationStateMachine();
      expect(newMachine.getState().status).toBe('OFFERED');
    });
  });

  describe('CANCELLED to RESET', () => {
    it('should reset to IDLE after CANCELLED', () => {
      machine.transition('OFFER', 'explicit');
      machine.transition('CANCEL');
      machine.transition('RESET');
      expect(machine.getState().status).toBe('IDLE');
    });
  });

  describe('clear', () => {
    it('should clear localStorage and reset to IDLE', () => {
      machine.transition('OFFER', 'explicit');
      machine.clear();
      expect(machine.getState().status).toBe('IDLE');
      expect(localStorage.getItem('escalation_state')).toBeNull();
    });
  });

  describe('getCurrentSystemMessage', () => {
    it('should return offer message for OFFERED status', () => {
      machine.transition('OFFER', 'explicit');
      const msg = machine.getCurrentSystemMessage();
      expect(msg).toContain('transfer');
    });

    it('should return frustration offer for frustration trigger', () => {
      machine.transition('OFFER', 'frustration');
      const msg = machine.getCurrentSystemMessage();
      expect(msg).toContain('having trouble');
    });

    it('should return null for IDLE status', () => {
      const msg = machine.getCurrentSystemMessage();
      expect(msg).toBeNull();
    });
  });

  describe('updateContext', () => {
    it('should update lastContext with user messages', () => {
      machine.updateContext(['msg1', 'msg2', 'msg3'], 'agent response');
      const state = machine.getState();
      expect(state.lastContext.userMessages).toEqual(['msg1', 'msg2', 'msg3']);
      expect(state.lastContext.agentResponse).toBe('agent response');
    });

    it('should keep only last 3 user messages', () => {
      machine.updateContext(['msg1', 'msg2', 'msg3', 'msg4', 'msg5'], null);
      const state = machine.getState();
      expect(state.lastContext.userMessages).toEqual(['msg3', 'msg4', 'msg5']);
    });
  });
});