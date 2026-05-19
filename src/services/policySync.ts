// src/services/policySync.ts
import type { PolicyService } from './policyService';

export type PolicyChangeCallback = () => void;

export interface PolicySyncOptions {
  policyService: PolicyService;
  checkIntervalMs?: number;
}

export class PolicySyncManager {
  private policyService: PolicyService;
  private checkIntervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cacheHash: string | null = null;
  private onChangeCallbacks: PolicyChangeCallback[] = [];

  constructor(options: PolicySyncOptions) {
    this.policyService = options.policyService;
    this.checkIntervalMs = options.checkIntervalMs ?? 600000;
  }

  onPolicyChange(cb: PolicyChangeCallback): void {
    this.onChangeCallbacks.push(cb);
  }

  async start(): Promise<void> {
    await this.check();
    this.intervalId = setInterval(() => this.check(), this.checkIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async check(): Promise<void> {
    try {
      const content = await this.policyService.getRawContent();
      const hash = await this.computeHash(content);

      if (this.cacheHash !== null && hash !== this.cacheHash) {
        this.cacheHash = hash;
        this.onChangeCallbacks.forEach(cb => cb());
      } else if (this.cacheHash === null) {
        this.cacheHash = hash;
      }
    } catch {
      // Silently ignore check failures — next interval will retry
    }
  }

  async refresh(): Promise<void> {
    await this.check();
  }

  getCacheHash(): string | null {
    return this.cacheHash;
  }

  private async computeHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
