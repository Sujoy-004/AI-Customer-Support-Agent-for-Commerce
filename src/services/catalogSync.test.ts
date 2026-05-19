// src/services/catalogSync.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CatalogSyncManager } from './catalogSync';
import type { Product, CatalogDataSource } from './types';

function createMockDataSource(products: Product[] = []): CatalogDataSource {
  return {
    loadProducts: vi.fn().mockResolvedValue(products),
  };
}

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Test Product',
    description: 'A test product',
    vendor: 'Test Vendor',
    productType: 'Test Type',
    tags: ['test'],
    options: [],
    variants: [],
    images: [],
  },
];

describe('CatalogSyncManager', () => {
  let dataSource: CatalogDataSource;
  let syncManager: CatalogSyncManager;

  beforeEach(() => {
    vi.useFakeTimers();
    dataSource = createMockDataSource(mockProducts);
    syncManager = new CatalogSyncManager({ dataSource, syncIntervalMs: 60000 });
  });

  afterEach(() => {
    vi.useRealTimers();
    syncManager.stop();
  });

  it('should initialize with default interval', () => {
    const manager = new CatalogSyncManager({ dataSource });
    expect(manager).toBeTruthy();
  });

  it('should start periodic sync and load products immediately', async () => {
    await syncManager.start();
    expect(dataSource.loadProducts).toHaveBeenCalled();
    expect(syncManager.getProducts()).toEqual(mockProducts);
  });

  it('should stop interval timer', async () => {
    await syncManager.start();
    syncManager.stop();

    vi.advanceTimersByTime(120000);

    expect(dataSource.loadProducts).toHaveBeenCalledTimes(1);
  });

  it('should sync and update cache', async () => {
    await syncManager.start();
    expect(syncManager.getProducts()).toEqual(mockProducts);
  });

  it('should throw if cache empty and sync not started', () => {
    const manager = new CatalogSyncManager({ dataSource });
    expect(() => manager.getProducts()).toThrow('Catalog not yet synced');
  });

  it('should register and fire onSync callback', async () => {
    const callback = vi.fn();
    syncManager.onSync(callback);

    await syncManager.start();

    expect(callback).toHaveBeenCalledWith(mockProducts);
  });

  it('should register and fire onError callback', async () => {
    const errorDataSource = createMockDataSource();
    (errorDataSource.loadProducts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const manager = new CatalogSyncManager({ dataSource: errorDataSource, syncIntervalMs: 60000 });
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.start();

    expect(errorCallback).toHaveBeenCalled();
    manager.stop();
  });

  it('should track last sync time', async () => {
    await syncManager.start();
    expect(syncManager.getLastSyncTime()).toBeTruthy();
    expect(typeof syncManager.getLastSyncTime()).toBe('number');
  });

  it('should report syncing state', async () => {
    expect(syncManager.isSyncing()).toBe(false);

    let resolvePromise: (value: Product[]) => void;
    const slowPromise = new Promise<Product[]>(resolve => {
      resolvePromise = resolve;
    });
    const slowDataSource = createMockDataSource();
    (slowDataSource.loadProducts as ReturnType<typeof vi.fn>).mockReturnValue(slowPromise);

    const manager = new CatalogSyncManager({ dataSource: slowDataSource, syncIntervalMs: 60000 });
    const syncPromise = manager.sync();
    expect(manager.isSyncing()).toBe(true);

    resolvePromise!(mockProducts);
    await syncPromise;
    expect(manager.isSyncing()).toBe(false);
    manager.stop();
  });

  it('should preserve stale cache on sync failure', async () => {
    await syncManager.start();
    expect(syncManager.getProducts()).toEqual(mockProducts);

    (dataSource.loadProducts as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    await syncManager.sync();

    expect(syncManager.getProducts()).toEqual(mockProducts);
  });

  it('should trigger immediate sync on refresh', async () => {
    await syncManager.start();
    const initialCalls = (dataSource.loadProducts as ReturnType<typeof vi.fn>).mock.calls.length;

    await syncManager.refresh();

    expect((dataSource.loadProducts as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCalls + 1);
  });

  it('should prevent concurrent syncs', async () => {
    const syncPromise1 = syncManager.sync();
    const syncPromise2 = syncManager.sync();

    await Promise.all([syncPromise1, syncPromise2]);

    expect(dataSource.loadProducts).toHaveBeenCalledTimes(1);
  });
});
