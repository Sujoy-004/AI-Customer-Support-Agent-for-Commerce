// src/services/escalationHumanAgent.ts
/**
 * Human agent simulator
 * Plays canned 3-message script sequence
 */

export class HumanAgentSimulator {
  private readonly SCRIPT = [
    "Thanks for reaching out. Let me look into that for you.",
    "I can see your account and the details of what you've been discussing with our support team.",
    "Is there anything else I can help you with?",
  ];
  private index = 0;

  next(): string | null {
    if (this.index >= this.SCRIPT.length) return null;
    return this.SCRIPT[this.index++];
  }

  hasMore(): boolean {
    return this.index < this.SCRIPT.length;
  }

  reset(): void {
    this.index = 0;
  }
}