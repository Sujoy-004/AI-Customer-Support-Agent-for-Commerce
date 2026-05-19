// src/services/policySync.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PolicySyncManager } from './policySync';
import type { PolicyService } from './policyService';

function createMockPolicyService(content: string = 'initial content'): PolicyService {
  return {
    getRawContent: vi.fn().mockResolvedValue(content),
    invalidateCache: vi.fn(),
    clearCache: vi.fn(),
    loadPolicies: vi.fn(),
    getPolicy: vi.fn(),
    getAllPolicies: vi.fn(),
  } as unknown as PolicyService;
}

describe('PolicySyncManager', () => {
  let policyService: PolicyService;
  let syncManager: PolicySyncManager;

  beforeEach(() => {
    vi.useFakeTimers();
    policyService = createMockPolicyService('initial content');
    syncManager = new PolicySyncManager({ policyService, checkIntervalMs: 60000 });
  });

  afterEach(() => {
    vi.useRealTimers();
    syncManager.stop();
  });

  it('should initialize with default interval', () => {
    const manager = new PolicySyncManager({ policyService });
    expect(manager).toBeTruthy();
  });

  it('should start periodic check', async () => {
    await syncManager.start();
    expect(policyService.getRawContent).toHaveBeenCalled();
  });

  it('should stop interval timer', async () => {
    await syncManager.start();
    syncManager.stop();

    vi.advanceTimersByTime(120000);

    expect(policyService.getRawContent).toHaveBeenCalledTimes(1);
  });

  it('should detect policy change via hash comparison', async () => {
    const callback = vi.fn();
    syncManager.onPolicyChange(callback);

    await syncManager.start();
    expect(callback).not.toHaveBeenCalled();

    (policyService.getRawContent as ReturnType<typeof vi.fn>).mockResolvedValue('updated content');
    await syncManager.check();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not fire callback when no change detected', async () => {
    const callback = vi.fn();
    syncManager.onPolicyChange(callback);

    await syncManager.start();
    await syncManager.check();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should track cache hash', async () => {
    await syncManager.start();
    expect(syncManager.getCacheHash()).toBeTruthy();
    expect(typeof syncManager.getCacheHash()).toBe('string');
  });

  it('should trigger immediate check on refresh', async () => {
    await syncManager.start();
    const initialCalls = (policyService.getRawContent as ReturnType<typeof vi.fn>).mock.calls.length;

    await syncManager.refresh();

    expect((policyService.getRawContent as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCalls + 1);
  });

  it('should silently ignore check failures', async () => {
    (policyService.getRawContent as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    await syncManager.check();

    expect(syncManager.getCacheHash()).toBeNull();
  });
});
