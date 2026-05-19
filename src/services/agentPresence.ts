export type PresenceCallback = (count: number) => void;

export class AgentPresenceTracker {
  private onlineAgents = new Set<string>();
  private onOnlineCallbacks: PresenceCallback[] = [];
  private onOfflineCallbacks: PresenceCallback[] = [];
  private onChangeCallbacks: PresenceCallback[] = [];

  onAgentOnline(cb: PresenceCallback): void {
    this.onOnlineCallbacks.push(cb);
  }

  onAgentOffline(cb: PresenceCallback): void {
    this.onOfflineCallbacks.push(cb);
  }

  onPresenceChange(cb: PresenceCallback): void {
    this.onChangeCallbacks.push(cb);
  }

  handleAgentJoin(agentId: string): void {
    if (this.onlineAgents.has(agentId)) return;
    this.onlineAgents.add(agentId);
    const count = this.onlineAgents.size;
    this.onOnlineCallbacks.forEach(cb => cb(count));
    this.onChangeCallbacks.forEach(cb => cb(count));
  }

  handleAgentLeave(agentId: string): void {
    if (!this.onlineAgents.has(agentId)) return;
    this.onlineAgents.delete(agentId);
    const count = this.onlineAgents.size;
    this.onOfflineCallbacks.forEach(cb => cb(count));
    this.onChangeCallbacks.forEach(cb => cb(count));
  }

  processPresenceSnapshot(presences: Array<{ agentId: string }>): void {
    const newAgentIds = new Set(presences.map(p => p.agentId));

    for (const agentId of this.onlineAgents) {
      if (!newAgentIds.has(agentId)) {
        this.onlineAgents.delete(agentId);
      }
    }

    for (const agentId of newAgentIds) {
      this.onlineAgents.add(agentId);
    }

    const count = this.onlineAgents.size;
    this.onChangeCallbacks.forEach(cb => cb(count));
  }

  getOnlineCount(): number {
    return this.onlineAgents.size;
  }

  hasOnlineAgents(): boolean {
    return this.onlineAgents.size > 0;
  }

  reset(): void {
    const agents = [...this.onlineAgents];
    this.onlineAgents.clear();
    agents.forEach(() => {
      this.onOfflineCallbacks.forEach(cb => cb(0));
    });
    this.onChangeCallbacks.forEach(cb => cb(0));
  }
}
