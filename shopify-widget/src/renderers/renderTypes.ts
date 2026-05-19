import type { EscalationChatMessage as EscalationMsg } from '../../../src/services/types';

export type { EscalationMsg as EscalationChatMessage };

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'error';
  text: string;
  timestamp: number;
  status: 'sending' | 'delivered' | 'error';
  isHumanAgent?: boolean;
}

export type TimestampFormatter = (ts: number) => string;

export interface EscalationCallbacks {
  onConfirm: () => void;
  onCancel: () => void;
}

export interface MessageBubbleElements {
  bubble: HTMLElement;
  statusEl?: HTMLElement;
}
