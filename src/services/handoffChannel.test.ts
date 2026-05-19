import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  const mockChannel = {
    on: vi.fn(function (this: any, _type: string, filter: { event: string }, handler: (p: any) => void) {
      const eventName = filter?.event;
      if (eventName) {
        if (!this._handlers) this._handlers = {};
        if (!this._handlers[eventName]) this._handlers[eventName] = [];
        this._handlers[eventName].push(handler);
      }
      return this;
    }),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      if (cb) cb('SUBSCRIBED');
      return mockChannel;
    }),
    send: vi.fn(),
    unsubscribe: vi.fn(),
    state: 'subscribed',
    _handlers: {} as Record<string, Array<(payload: any) => void>>,
    _emit(event: string, payload: any) {
      const handlers = this._handlers[event] || [];
      handlers.forEach(h => h(payload));
    },
  };
  return {
    createClient: vi.fn(() => ({
      channel: vi.fn(() => mockChannel),
    })),
    RealtimeChannel: {},
  };
});

import { HandoffChannel } from './handoffChannel';

describe('HandoffChannel', () => {
  let channel: HandoffChannel;

  beforeEach(() => {
    channel = new HandoffChannel('https://test.supabase.co', 'test-key');
  });

  it('should initialize in disconnected state', () => {
    expect(channel.getState()).toBe('disconnected');
  });

  it('should connect and transition to connected state', async () => {
    await channel.connect();
    expect(channel.getState()).toBe('connected');
  });

  it('should disconnect and clear state', async () => {
    await channel.connect();
    channel.disconnect();
    expect(channel.getState()).toBe('disconnected');
  });

  it('should send handoff request', async () => {
    await channel.connect();
    channel.sendHandoffRequest({
      userId: 'user-1',
      transcript: [{ role: 'user', text: 'help', timestamp: Date.now() }],
      timestamp: Date.now(),
    });
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    expect(ch.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'handoff_request',
      payload: expect.objectContaining({ userId: 'user-1' }),
    });
  });

  it('should send agent message', async () => {
    await channel.connect();
    channel.sendAgentMessage('user-1', 'Hello');
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    expect(ch.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'agent_message',
      payload: expect.objectContaining({ userId: 'user-1', text: 'Hello' }),
    });
  });

  it('should send typing indicator', async () => {
    await channel.connect();
    channel.sendTypingIndicator('user-1', true);
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    expect(ch.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'typing_indicator',
      payload: expect.objectContaining({ userId: 'user-1', isTyping: true }),
    });
  });

  it('should send handoff cancelled', async () => {
    await channel.connect();
    channel.sendHandoffCancelled('user-1');
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    expect(ch.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'handoff_cancelled',
      payload: expect.objectContaining({ userId: 'user-1' }),
    });
  });

  it('should call onHandoffAccepted callback when event received', async () => {
    const cb = vi.fn();
    channel.setCallbacks({ onHandoffAccepted: cb });
    await channel.connect();
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    ch._emit('handoff_accepted', { userId: 'user-1', agentId: 'agent-1' });
    expect(cb).toHaveBeenCalledWith({ payload: { userId: 'user-1', agentId: 'agent-1' } });
  });

  it('should call onAgentMessage callback when event received', async () => {
    const cb = vi.fn();
    channel.setCallbacks({ onAgentMessage: cb });
    await channel.connect();
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    ch._emit('agent_message', { userId: 'user-1', text: 'Hi' });
    expect(cb).toHaveBeenCalledWith({ payload: { userId: 'user-1', text: 'Hi' } });
  });

  it('should call onTypingIndicator callback when event received', async () => {
    const cb = vi.fn();
    channel.setCallbacks({ onTypingIndicator: cb });
    await channel.connect();
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    ch._emit('typing_indicator', { userId: 'user-1', isTyping: true });
    expect(cb).toHaveBeenCalledWith({ payload: { userId: 'user-1', isTyping: true } });
  });

  it('should call onHandoffCancelled callback when event received', async () => {
    const cb = vi.fn();
    channel.setCallbacks({ onHandoffCancelled: cb });
    await channel.connect();
    const { createClient } = await import('@supabase/supabase-js');
    const client = (createClient as any).mock.results[0].value;
    const ch = client.channel.mock.results[0].value;
    ch._emit('handoff_cancelled', { userId: 'user-1' });
    expect(cb).toHaveBeenCalledWith({ payload: { userId: 'user-1' } });
  });

  it('should reconnect with exponential backoff on disconnect', async () => {
    vi.useFakeTimers();
    const stateCb = vi.fn();
    channel.setCallbacks({ onStateChange: stateCb });

    // Simulate disconnect with reconnectAttempts = 0 (first reconnect)
    (channel as any).reconnectAttempts = 0;
    (channel as any).handleDisconnect();
    expect(stateCb).toHaveBeenCalledWith('reconnecting');

    // Advance 1 second (first backoff: 1000 * 2^0 = 1000ms)
    vi.advanceTimersByTime(1000);
    // Mock subscribe succeeds → connected
    expect(stateCb).toHaveBeenCalledWith('connected');

    vi.useRealTimers();
  });

  it('should emit max_retries_reached after 5 failed attempts', async () => {
    vi.useFakeTimers();
    const stateCb = vi.fn();
    const maxRetriesCb = vi.fn();
    channel.setCallbacks({ onStateChange: stateCb, onMaxRetriesReached: maxRetriesCb });

    // Manually set reconnectAttempts to 5 so handleDisconnect triggers max retries immediately
    (channel as any).reconnectAttempts = 5;
    (channel as any).handleDisconnect();

    expect(stateCb).toHaveBeenCalledWith('reconnecting');
    // Next attempt would be attempt 5 (>= MAX_RECONNECT_ATTEMPTS), so max retries reached
    expect(maxRetriesCb).toHaveBeenCalled();
    expect(stateCb).toHaveBeenCalledWith('disconnected');

    vi.useRealTimers();
  });

  it('should reset backoff counter on successful reconnect', async () => {
    vi.useFakeTimers();
    const stateCb = vi.fn();
    channel.setCallbacks({ onStateChange: stateCb });

    await channel.connect();
    expect(stateCb).toHaveBeenCalledWith('connected');

    // Disconnect and reconnect
    (channel as any).handleDisconnect();
    vi.advanceTimersByTime(1000);
    expect(stateCb).toHaveBeenCalledWith('connected');

    // Verify reconnectAttempts reset
    expect((channel as any).reconnectAttempts).toBe(0);

    vi.useRealTimers();
  });

  it('should return correct state from getState()', async () => {
    expect(channel.getState()).toBe('disconnected');
    await channel.connect();
    expect(channel.getState()).toBe('connected');
    channel.disconnect();
    expect(channel.getState()).toBe('disconnected');
  });
});
