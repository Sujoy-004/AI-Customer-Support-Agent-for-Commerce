// src/services/escalationQueueSimulator.ts
/**
 * Queue position simulator for escalation
 * Manages dynamic queue position with refresh capability
 */

export class EscalationQueueSimulator {
  private position: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly onPositionChange: (newPosition: number) => void,
    private readonly refreshIntervalMs = 8000
  ) {
    this.position = this.randomPosition();
    this.onPositionChange(this.position);
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.position = this.randomPosition();
      this.onPositionChange(this.position);
    }, this.refreshIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  refresh(): number {
    this.position = this.randomPosition();
    this.onPositionChange(this.position);
    return this.position;
  }

  getPosition(): number {
    return this.position;
  }

  destroy(): void {
    this.stop();
  }

  private randomPosition(): number {
    return Math.floor(Math.random() * 5) + 1;
  }
}