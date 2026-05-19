import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export type HandoffChannelState = 'connected' | 'disconnected' | 'reconnecting';

export interface HandoffRequest {
  userId: string;
  transcript: Array<{ role: string; text: string; timestamp: number }>;
  timestamp: number;
}

export interface HandoffCallbacks {
  onHandoffAccepted?: (payload: { payload: { userId: string; agentId?: string; agentName?: string } }) => void;
  onAgentMessage?: (payload: { payload: { userId: string; text: string; timestamp?: number } }) => void;
  onTypingIndicator?: (payload: { payload: { userId: string; isTyping: boolean } }) => void;
  onHandoffCancelled?: (payload: { payload: { userId: string } }) => void;
  onStateChange?: (state: HandoffChannelState) => void;
  onMaxRetriesReached?: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_BACKOFF_MS = 30000;

export class HandoffChannel {
  private channel: RealtimeChannel | null = null;
  private client: ReturnType<typeof createClient> | null = null;
  private state: HandoffChannelState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: HandoffCallbacks = {};

  constructor(
    private readonly supabaseUrl: string,
    private readonly supabaseAnonKey: string,
    private readonly channelName = 'support-queue'
  ) {}

  setCallbacks(callbacks: HandoffCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getState(): HandoffChannelState {
    return this.state;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
      this.channel = this.client.channel(this.channelName, {
        config: { broadcast: { self: false } },
      });

      this.channel
        .on('broadcast', { event: 'handoff_accepted' }, (payload) => {
          this.callbacks.onHandoffAccepted?.({ payload: payload as any });
        })
        .on('broadcast', { event: 'agent_message' }, (payload) => {
          this.callbacks.onAgentMessage?.({ payload: payload as any });
        })
        .on('broadcast', { event: 'typing_indicator' }, (payload) => {
          this.callbacks.onTypingIndicator?.({ payload: payload as any });
        })
        .on('broadcast', { event: 'handoff_cancelled' }, (payload) => {
          this.callbacks.onHandoffCancelled?.({ payload: payload as any });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.state = 'connected';
            this.reconnectAttempts = 0;
            this.callbacks.onStateChange?.('connected');
            resolve();
          } else {
            this.handleDisconnect();
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
    });
  }

  sendHandoffRequest(handoff: HandoffRequest): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'handoff_request',
      payload: handoff,
    });
  }

  sendAgentMessage(userId: string, text: string): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'agent_message',
      payload: { userId, text, timestamp: Date.now() },
    });
  }

  sendTypingIndicator(userId: string, isTyping: boolean): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'typing_indicator',
      payload: { userId, isTyping, timestamp: Date.now() },
    });
  }

  sendHandoffCancelled(userId: string): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'handoff_cancelled',
      payload: { userId, timestamp: Date.now() },
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.channel?.unsubscribe();
    this.channel = null;
    this.client = null;
    this.state = 'disconnected';
    this.reconnectAttempts = 0;
    this.callbacks.onStateChange?.('disconnected');
  }

  private handleDisconnect(): void {
    this.state = 'reconnecting';
    this.callbacks.onStateChange?.('reconnecting');

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.state = 'disconnected';
      this.callbacks.onStateChange?.('disconnected');
      this.callbacks.onMaxRetriesReached?.();
      return;
    }

    const backoff = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      MAX_BACKOFF_MS
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // handleDisconnect will be called again by subscribe failure
      });
    }, backoff);
  }
}
