// src/services/catalogSync.ts
import type { Product, CatalogDataSource } from './types';

export type SyncCallback = (products: Product[]) => void;
export type ErrorCallback = (error: Error) => void;

export interface CatalogSyncOptions {
  dataSource: CatalogDataSource;
  syncIntervalMs?: number;
}

export class CatalogSyncManager {
  private dataSource: CatalogDataSource;
  private syncIntervalMs: number;
  private cache: Product[] | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastSyncTime: number | null = null;
  private syncing = false;
  private onSyncCallbacks: SyncCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  constructor(options: CatalogSyncOptions) {
    this.dataSource = options.dataSource;
    this.syncIntervalMs = options.syncIntervalMs ?? 300000;
  }

  onSync(cb: SyncCallback): void {
    this.onSyncCallbacks.push(cb);
  }

  onError(cb: ErrorCallback): void {
    this.onErrorCallbacks.push(cb);
  }

  async start(): Promise<void> {
    await this.sync();
    this.intervalId = setInterval(() => this.sync(), this.syncIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async sync(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;

    try {
      const products = await this.dataSource.loadProducts();
      this.cache = products;
      this.lastSyncTime = Date.now();
      this.onSyncCallbacks.forEach(cb => cb(products));
    } catch (error) {
      this.onErrorCallbacks.forEach(cb => cb(error as Error));
    } finally {
      this.syncing = false;
    }
  }

  async refresh(): Promise<void> {
    await this.sync();
  }

  getProducts(): Product[] {
    if (!this.cache) {
      throw new Error('Catalog not yet synced. Call start() first.');
    }
    return this.cache;
  }

  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  isSyncing(): boolean {
    return this.syncing;
  }
}
