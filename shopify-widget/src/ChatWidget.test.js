import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatWidget, MESSAGE_STATUS } from './ChatWidget.js';

describe('ChatWidget', () => {
  let widget;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'ai-support-widget';
    document.body.appendChild(container);
    widget = new ChatWidget({ container, timeoutMs: 50 });
  });

  afterEach(() => {
    widget.destroy();
    document.body.removeChild(container);
  });

  describe('SAFE-03: UI Fidelity', () => {
    it('renders toggle button on init', () => {
      const toggle = document.querySelector('.chat-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveTextContent('[+] Support');
    });

    it('renders widget container on init', () => {
      const chatWidget = document.querySelector('.chat-widget');
      expect(chatWidget).toBeInTheDocument();
    });

    it('toggles open/close on button click', () => {
      widget.open();
      expect(document.querySelector('.chat-widget--open')).toBeInTheDocument();
      expect(document.querySelector('.chat-toggle')).toHaveTextContent('[\u2212] Support');
      widget.close();
      expect(document.querySelector('.chat-widget--open')).toBeNull();
      expect(document.querySelector('.chat-toggle')).toHaveTextContent('[+] Support');
    });

    it('creates user bubble with correct CSS class', () => {
      widget.addMessage({ id: '1', role: 'user', text: 'Hello', timestamp: Date.now(), status: 'delivered' });
      const bubble = document.querySelector('.chat-bubble--user');
      expect(bubble).toBeInTheDocument();
      expect(bubble).toHaveTextContent('Hello');
    });

    it('creates agent bubble with correct CSS class', () => {
      widget.addMessage({ id: '1', role: 'agent', text: 'Hi there!', timestamp: Date.now(), status: 'delivered' });
      const bubble = document.querySelector('.chat-bubble--agent');
      expect(bubble).toBeInTheDocument();
      expect(bubble).toHaveTextContent('Hi there!');
    });

    it('shows role label on bubbles', () => {
      widget.addMessage({ id: '1', role: 'user', text: 'Hello', timestamp: Date.now(), status: 'delivered' });
      const bubble = document.querySelector('.chat-bubble--user');
      expect(bubble.querySelector('.chat-bubble__role')).toHaveTextContent('You');
    });

    it('shows relative timestamp on bubbles', () => {
      widget.addMessage({ id: '1', role: 'user', text: 'Hello', timestamp: Date.now(), status: 'delivered' });
      const bubble = document.querySelector('.chat-bubble--user');
      expect(bubble.querySelector('.chat-bubble__time')).toHaveTextContent('just now');
    });

    it('shows status indicator on bubbles', () => {
      widget.addMessage({ id: '1', role: 'user', text: 'Hello', timestamp: Date.now(), status: 'delivered' });
      const statusEl = document.querySelector('.chat-bubble__status');
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveTextContent('Delivered');
    });
  });

  describe('SAFE-02: Error Handling', () => {
    it('disables input while processing (D-15)', () => {
      widget.setProcessing(true);
      expect(widget.textarea.disabled).toBe(true);
      expect(widget.sendBtn.disabled).toBe(true);
    });

    it('re-enables input after processing completes (D-15)', () => {
      widget.setProcessing(true);
      widget.setProcessing(false);
      expect(widget.textarea.disabled).toBe(false);
      expect(widget.sendBtn.disabled).toBe(false);
    });

    it('shows error bubble when send times out (D-10)', async () => {
      widget.open();
      widget.textarea.value = 'Hello';
      widget._sendMessage();
      await new Promise(r => setTimeout(r, 100));
      const errorBubble = document.querySelector('.chat-bubble--error');
      expect(errorBubble).toBeInTheDocument();
      expect(errorBubble).toHaveTextContent(/couldn't process/i);
    });

    it('shows offline banner when network goes down (D-12)', () => {
      window.dispatchEvent(new Event('offline'));
      expect(widget.offlineBanner.hidden).toBe(false);
      expect(widget.offlineBanner.textContent).toMatch(/connection lost/i);
    });

    it('hides offline banner when network restores (D-12)', () => {
      window.dispatchEvent(new Event('offline'));
      expect(widget.offlineBanner.hidden).toBe(false);
      window.dispatchEvent(new Event('online'));
      expect(widget.offlineBanner.hidden).toBe(true);
    });

    it('disables input when offline (D-12)', () => {
      window.dispatchEvent(new Event('offline'));
      expect(widget.textarea.disabled).toBe(true);
    });

    it('does not show typing indicator (D-08)', () => {
      widget.open();
      widget.setProcessing(true);
      const typingIndicator = document.querySelector('.typing-indicator');
      expect(typingIndicator).toBeNull();
    });

    it('error bubble has no retry button (D-11)', () => {
      widget.addMessage({ id: 'err-1', role: 'error', text: 'Sorry', timestamp: Date.now(), status: 'delivered' });
      const errorBubble = document.querySelector('.chat-bubble--error');
      expect(errorBubble).toBeInTheDocument();
      const retryBtn = errorBubble.querySelector('button');
      expect(retryBtn).toBeNull();
    });

    it('message status transitions through sending state', () => {
      const msg = { id: '1', role: 'user', text: 'Hello', timestamp: Date.now(), status: 'sending' };
      widget.addMessage(msg);
      const statusEl = document.querySelector('.chat-bubble__status--sending');
      expect(statusEl).toHaveTextContent('Sending...');
      widget._updateMessageStatus('1', 'delivered');
      const deliveredEl = document.querySelector('.chat-bubble__status--delivered');
      expect(deliveredEl).toHaveTextContent('Delivered');
    });
  });

  describe('Message Input', () => {
    it('textarea has correct placeholder', () => {
      expect(widget.textarea.placeholder).toBe('Type a message...');
    });

    it('changes placeholder during processing', () => {
      widget.setProcessing(true);
      expect(widget.textarea.placeholder).toBe('Waiting for response...');
    });

    it('textarea is initially enabled', () => {
      expect(widget.textarea.disabled).toBe(false);
    });
  });
});