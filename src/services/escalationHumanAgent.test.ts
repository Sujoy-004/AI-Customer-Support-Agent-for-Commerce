// src/services/escalationHumanAgent.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { HumanAgentSimulator } from './escalationHumanAgent';

describe('HumanAgentSimulator', () => {
  let simulator: HumanAgentSimulator;

  beforeEach(() => {
    simulator = new HumanAgentSimulator();
  });

  it('should return first script message', () => {
    const msg = simulator.next();
    expect(msg).toBe("Thanks for reaching out. Let me look into that for you.");
  });

  it('should return second script message', () => {
    simulator.next();
    const msg = simulator.next();
    expect(msg).toBe("I can see your account and the details of what you've been discussing with our support team.");
  });

  it('should return third script message', () => {
    simulator.next();
    simulator.next();
    const msg = simulator.next();
    expect(msg).toBe("Is there anything else I can help you with?");
  });

  it('should return null after all messages consumed', () => {
    simulator.next();
    simulator.next();
    simulator.next();
    const msg = simulator.next();
    expect(msg).toBeNull();
  });

  it('should reset and restart from beginning', () => {
    simulator.next();
    simulator.next();
    simulator.reset();
    const msg = simulator.next();
    expect(msg).toBe("Thanks for reaching out. Let me look into that for you.");
  });

  it('should haveMore return true when messages remain', () => {
    expect(simulator.hasMore()).toBe(true);
    simulator.next();
    expect(simulator.hasMore()).toBe(true);
    simulator.next();
    expect(simulator.hasMore()).toBe(true);
  });

  it('should haveMore return false after all consumed', () => {
    simulator.next();
    simulator.next();
    simulator.next();
    expect(simulator.hasMore()).toBe(false);
  });
});