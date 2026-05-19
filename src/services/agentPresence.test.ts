import { describe, it, expect, beforeEach } from 'vitest';
import { AgentPresenceTracker } from './agentPresence';

describe('AgentPresenceTracker', () => {
  let tracker: AgentPresenceTracker;

  beforeEach(() => {
    tracker = new AgentPresenceTracker();
  });

  it('should initialize with zero agents online', () => {
    expect(tracker.getOnlineCount()).toBe(0);
    expect(tracker.hasOnlineAgents()).toBe(false);
  });

  it('should increment count and fire onAgentOnline when agent joins', () => {
    const cb = vi.fn();
    tracker.onAgentOnline(cb);

    tracker.handleAgentJoin('agent-1');

    expect(tracker.getOnlineCount()).toBe(1);
    expect(cb).toHaveBeenCalledWith(1);
  });

  it('should decrement count and fire onAgentOffline when agent leaves', () => {
    const onlineCb = vi.fn();
    const offlineCb = vi.fn();
    tracker.onAgentOnline(onlineCb);
    tracker.onAgentOffline(offlineCb);

    tracker.handleAgentJoin('agent-1');
    tracker.handleAgentLeave('agent-1');

    expect(tracker.getOnlineCount()).toBe(0);
    expect(offlineCb).toHaveBeenCalledWith(0);
  });

  it('should fire onPresenceChange on join and leave', () => {
    const cb = vi.fn();
    tracker.onPresenceChange(cb);

    tracker.handleAgentJoin('agent-1');
    expect(cb).toHaveBeenCalledWith(1);

    tracker.handleAgentLeave('agent-1');
    expect(cb).toHaveBeenCalledWith(0);
  });

  it('should deduplicate agent joins', () => {
    const cb = vi.fn();
    tracker.onAgentOnline(cb);

    tracker.handleAgentJoin('agent-1');
    tracker.handleAgentJoin('agent-1');

    expect(tracker.getOnlineCount()).toBe(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should ignore leave for unknown agent', () => {
    const cb = vi.fn();
    tracker.onAgentOffline(cb);

    tracker.handleAgentLeave('unknown-agent');

    expect(tracker.getOnlineCount()).toBe(0);
    expect(cb).not.toHaveBeenCalled();
  });

  it('should track multiple agents independently', () => {
    const cb = vi.fn();
    tracker.onPresenceChange(cb);

    tracker.handleAgentJoin('agent-1');
    tracker.handleAgentJoin('agent-2');
    tracker.handleAgentJoin('agent-3');

    expect(tracker.getOnlineCount()).toBe(3);
    expect(cb).toHaveBeenLastCalledWith(3);

    tracker.handleAgentLeave('agent-2');
    expect(tracker.getOnlineCount()).toBe(2);
    expect(cb).toHaveBeenLastCalledWith(2);
  });

  it('should process presence snapshot correctly', () => {
    const cb = vi.fn();
    tracker.onPresenceChange(cb);

    tracker.handleAgentJoin('agent-1');
    tracker.handleAgentJoin('agent-2');
    cb.mockClear();

    // Snapshot: agent-1 stays, agent-2 leaves, agent-3 joins
    tracker.processPresenceSnapshot([
      { agentId: 'agent-1' },
      { agentId: 'agent-3' },
    ]);

    expect(tracker.getOnlineCount()).toBe(2);
    expect(cb).toHaveBeenCalledWith(2);
    expect(tracker.hasOnlineAgents()).toBe(true);
  });

  it('should handle empty snapshot (all agents leave)', () => {
    tracker.handleAgentJoin('agent-1');
    tracker.handleAgentJoin('agent-2');

    tracker.processPresenceSnapshot([]);

    expect(tracker.getOnlineCount()).toBe(0);
    expect(tracker.hasOnlineAgents()).toBe(false);
  });

  it('should reset all agents and fire offline callbacks', () => {
    const offlineCb = vi.fn();
    const changeCb = vi.fn();
    tracker.onAgentOffline(offlineCb);
    tracker.onPresenceChange(changeCb);

    tracker.handleAgentJoin('agent-1');
    tracker.handleAgentJoin('agent-2');

    tracker.reset();

    expect(tracker.getOnlineCount()).toBe(0);
    expect(offlineCb).toHaveBeenCalledWith(0);
    expect(changeCb).toHaveBeenCalledWith(0);
  });

  it('should return true from hasOnlineAgents when count > 0', () => {
    tracker.handleAgentJoin('agent-1');
    expect(tracker.hasOnlineAgents()).toBe(true);
  });

  it('should return false from hasOnlineAgents when count is 0', () => {
    expect(tracker.hasOnlineAgents()).toBe(false);
  });
});
