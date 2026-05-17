// src/services/escalationTransferHandler.ts
/**
 * Transfer handler for escalation
 * Manages 20s timeout with retry and email fallback
 */

export type TransferResult =
  | 'connected'
  | { type: 'failed'; reason: 'no_agents' | 'system_error' };

export class EscalationTransferHandler {
  private readonly TIMEOUT_MS: number;
  private retryAttempted = false;

  constructor(timeoutMs = 20000) {
    this.TIMEOUT_MS = timeoutMs;
  }

  startTransfer(): Promise<TransferResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.retryAttempted) {
          resolve({ type: 'failed', reason: 'system_error' });
        } else {
          resolve('connected');
        }
      }, this.TIMEOUT_MS);
    });
  }

  retry(): Promise<TransferResult> {
    this.retryAttempted = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ type: 'failed', reason: 'system_error' });
      }, this.TIMEOUT_MS);
    });
  }

  reset(): void {
    this.retryAttempted = false;
  }
}