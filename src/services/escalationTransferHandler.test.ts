// src/services/escalationTransferHandler.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EscalationTransferHandler } from './escalationTransferHandler';

describe('EscalationTransferHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should resolve with connected after timeout', async () => {
    const handler = new EscalationTransferHandler(100);
    const promise = handler.startTransfer();
    vi.advanceTimersByTime(100);
    const result = await promise;
    expect(result).toBe('connected');
  });

  it('should resolve with connected on first call (deterministic for testing)', async () => {
    const handler = new EscalationTransferHandler(100);
    const promise = handler.startTransfer();
    vi.advanceTimersByTime(100);
    const result = await promise;
    expect(result).toBe('connected');
  });

  it('should retry and fail with system_error', async () => {
    const handler = new EscalationTransferHandler(100);
    handler.startTransfer();
    vi.advanceTimersByTime(100);
    const promise = handler.retry();
    vi.advanceTimersByTime(100);
    const result = await promise;
    expect(result).toEqual({ type: 'failed', reason: 'system_error' });
  });

  it('should reset retryAttempted flag', async () => {
    const handler = new EscalationTransferHandler(100);
    handler.startTransfer();
    vi.advanceTimersByTime(100);
    handler.reset();
    const promise = handler.startTransfer();
    vi.advanceTimersByTime(100);
    const result = await promise;
    expect(result).toBe('connected');
  });

  it('should create independent timeouts for consecutive calls', async () => {
    const handler = new EscalationTransferHandler(100);
    const p1 = handler.startTransfer();
    const p2 = handler.startTransfer();
    vi.advanceTimersByTime(100);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('connected');
    expect(r2).toBe('connected');
  });
});