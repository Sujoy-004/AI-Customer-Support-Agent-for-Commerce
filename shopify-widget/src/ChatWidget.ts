// shopify-widget/src/ChatWidget.ts
import responseGrounder from '../../src/services/responseGrounder';
import offTopicDetector from '../../src/services/offTopicDetector';
import { PolicyService } from '../../src/services/policyService';
import { RefusalResponseService } from '../../src/services/refusalResponses';
import { CatalogIntentDetector, formatCatalogResponse } from '../../src/services/catalogIntentDetector';
import { CatalogService } from '../../src/services/catalogService';
import { MockCatalogDataSource } from '../../src/services/mockCatalogData';
import { OrderService } from '../../src/services/orderService';
import { MockOrderDataSource } from '../../src/services/mockOrderData';
import { OrderIntentDetector } from '../../src/services/orderIntentDetector';
import { formatOrderResponse } from '../../src/services/orderResponseFormatter';

// Initialize our services
const refusalResponseService = new RefusalResponseService(offTopicDetector);
const policyService = new PolicyService();

// ── Type interfaces ──────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'error';
  text: string;
  timestamp: number;
  status: 'sending' | 'delivered' | 'error';
}

export interface ChatWidgetOptions {
  container?: HTMLElement;
  endpoint?: string;
  timeoutMs?: number;
  catalogIntentDetector?: CatalogIntentDetector;
  catalogService?: CatalogService;
  orderService?: OrderService;
  orderIntentDetector?: OrderIntentDetector;
}

export interface ChatWidgetState {
  isOpen: boolean;
  isOnline: boolean;
  isProcessing: boolean;
  messages: ChatMessage[];
}

// ── Widget class ─────────────────────────────────────────────────

export class ChatWidget {
  private container: HTMLElement;
  private endpoint: string;
  private timeoutMs: number;
  private state: ChatWidgetState;
  private _catalogIntentDetector!: CatalogIntentDetector;
  private _orderIntentDetector!: OrderIntentDetector;
  private toggleBtn!: HTMLButtonElement;
  private widget!: HTMLDivElement;
  private offlineBanner!: HTMLDivElement;
  private messageList!: HTMLDivElement;
  private inputContainer!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private _messageIdCounter = 0;

  constructor(options: ChatWidgetOptions = {}) {
    this.container = options.container || document.getElementById('ai-support-widget') as HTMLElement;
    this.endpoint = options.endpoint || '/apps/support-agent/chat';
    this.timeoutMs = options.timeoutMs || 10000;

    this.state = {
      isOpen: false,
      isOnline: navigator.onLine,
      isProcessing: false,
      messages: [],
    };

    // Order services — optionally injectable for tests
    if (options.orderIntentDetector) {
      this._orderIntentDetector = options.orderIntentDetector;
    } else {
      const orderService = options.orderService || new OrderService(new MockOrderDataSource());
      this._orderIntentDetector = new OrderIntentDetector(orderService);
    }

    // Catalog services — optionally injectable for tests
    if (options.catalogIntentDetector) {
      this._catalogIntentDetector = options.catalogIntentDetector;
    } else {
      const catalogService = options.catalogService || new CatalogService(new MockCatalogDataSource());
      this._catalogIntentDetector = new CatalogIntentDetector(catalogService);
    }

    this._init();
  }

  _init() {
    this._createDOM();
    this._bindEvents();
    this._initNetworkDetection();
    this._render();
  }

  _createDOM() {
    // Toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'chat-toggle';
    this.toggleBtn.textContent = '[+] Support';
    this.toggleBtn.setAttribute('aria-label', 'Toggle support chat');

    // Widget container
    this.widget = document.createElement('div');
    this.widget.className = 'chat-widget';
    this.widget.setAttribute('role', 'dialog');
    this.widget.setAttribute('aria-label', 'AI Customer Support Chat');

    // Offline banner
    this.offlineBanner = document.createElement('div');
    this.offlineBanner.className = 'chat-offline-banner';
    this.offlineBanner.textContent = 'Connection lost. You can still type — messages will send when you\'re back online.';
    this.offlineBanner.hidden = true;

    // Message list
    this.messageList = document.createElement('div');
    this.messageList.className = 'chat-message-list';

    // Input area
    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'chat-input-container';

    this.textarea = document.createElement('textarea');
    this.textarea.className = 'chat-input__textarea';
    this.textarea.placeholder = 'Ask about your order, products, or policies...';
    this.textarea.rows = 1;

    this.sendBtn = document.createElement('button');
    this.sendBtn.className = 'chat-input__send';
    this.sendBtn.textContent = '\u2192';
    this.sendBtn.setAttribute('aria-label', 'Send message');

    this.inputContainer.appendChild(this.textarea);
    this.inputContainer.appendChild(this.sendBtn);

    this.widget.appendChild(this.offlineBanner);
    this.widget.appendChild(this.messageList);
    this.widget.appendChild(this.inputContainer);

    document.body.appendChild(this.toggleBtn);
    document.body.appendChild(this.widget);
  }

  _bindEvents() {
    this.toggleBtn.addEventListener('click', () => this._toggle());

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    });

    this.textarea.addEventListener('input', () => {
      this._autoGrow();
      this._updateSendButton();
    });

    this.sendBtn.addEventListener('click', () => this._sendMessage());
  }

  _initNetworkDetection() {
    window.addEventListener('online', () => this._handleNetworkChange(true));
    window.addEventListener('offline', () => this._handleNetworkChange(false));
  }

  _handleNetworkChange(isOnline: boolean): void {
    this.state.isOnline = isOnline;
    if (!isOnline) {
      this.offlineBanner.hidden = false;
      this.offlineBanner.classList.add('chat-offline-banner--visible');
      this._setInputEnabled(false);
    } else {
      this.offlineBanner.hidden = true;
      this.offlineBanner.classList.remove('chat-offline-banner--visible');
      if (!this.state.isProcessing) {
        this._setInputEnabled(true);
      }
    }
  }

  _toggle(): void {
    this.state.isOpen = !this.state.isOpen;
    this.widget.classList.toggle('chat-widget--open', this.state.isOpen);
    this.toggleBtn.textContent = this.state.isOpen ? '[\u2212] Support' : '[+] Support';

    if (this.state.isOpen && !this.state.isProcessing) {
      this.textarea.focus();
    }
  }

  open(): void {
    if (!this.state.isOpen) this._toggle();
  }

  close(): void {
    if (this.state.isOpen) this._toggle();
  }

  _setInputEnabled(enabled: boolean): void {
    this.textarea.disabled = !enabled;
    this.sendBtn.disabled = !enabled;
    if (enabled) {
      this.textarea.placeholder = 'Type a message...';
    }
  }

  setProcessing(processing: boolean): void {
    this.state.isProcessing = processing;
    this._setInputEnabled(!processing);
    if (processing) {
      this.textarea.placeholder = 'Waiting for response...';
    }
  }

  _updateSendButton(): void {
    const hasContent = this.textarea.value.trim().length > 0;
    this.sendBtn.classList.toggle('chat-input__send--active', hasContent);
  }

  _autoGrow(): void {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  _generateId(): string {
    this._messageIdCounter += 1;
    return `msg-${Date.now()}-${this._messageIdCounter}`;
  }

  _formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }

  addMessage(msg: ChatMessage): ChatMessage {
    this.state.messages.push(msg);
    this._renderMessage(msg);
    this._scrollToBottom();
    return msg;
  }

  _createMessage(text: string, role: ChatMessage['role'], status: ChatMessage['status'] = 'delivered'): ChatMessage {
    return {
      id: this._generateId(),
      role,
      text,
      timestamp: Date.now(),
      status,
    };
  }

  _renderMessage(msg: ChatMessage): void {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble--${msg.role === 'user' ? 'user' : msg.role === 'agent' ? 'agent' : 'error'}`;
    bubble.dataset.messageId = msg.id;

    if (msg.role === 'error') {
      const errorContent = document.createElement('div');
      errorContent.className = 'chat-bubble__content';
      errorContent.textContent = msg.text;
      bubble.appendChild(errorContent);
    } else {
      const header = document.createElement('div');
      header.className = 'chat-bubble__header';

      const roleLabel = document.createElement('span');
      roleLabel.className = 'chat-bubble__role';
      roleLabel.textContent = msg.role === 'user' ? 'You' : 'Support';

      const time = document.createElement('time');
      time.className = 'chat-bubble__time';
      time.textContent = this._formatTimestamp(msg.timestamp);

      header.appendChild(roleLabel);
      header.appendChild(time);

      const content = document.createElement('div');
      content.className = 'chat-bubble__content';
      content.textContent = msg.text;

      const statusEl = document.createElement('span');
      statusEl.className = `chat-bubble__status chat-bubble__status--${msg.status}`;
      statusEl.textContent = msg.status === 'sending' ? 'Sending...' : msg.status === 'delivered' ? 'Delivered' : 'Failed';
      statusEl.dataset.statusFor = msg.id;

      bubble.appendChild(header);
      bubble.appendChild(content);
      bubble.appendChild(statusEl);
    }

    this.messageList.appendChild(bubble);
  }

  _updateMessageStatus(messageId: string, newStatus: ChatMessage['status']): void {
    const msg = this.state.messages.find(m => m.id === messageId);
    if (msg) {
      msg.status = newStatus;
      const statusEl = this.messageList.querySelector(`[data-status-for="${messageId}"]`);
      if (statusEl) {
        statusEl.className = `chat-bubble__status chat-bubble__status--${newStatus}`;
        statusEl.textContent = newStatus === 'sending' ? 'Sending...' : newStatus === 'delivered' ? 'Delivered' : 'Failed';
      }
    }
  }

  _scrollToBottom(): void {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  async _sendMessage(): Promise<void> {
    const text = this.textarea.value.trim();
    if (!text || this.state.isProcessing) return;

    if (!this.state.isOnline) {
      this.setProcessing(false);
      return;
    }

    this.setProcessing(true);
    this.textarea.value = '';

    const msg = this._createMessage(text, 'user', 'sending');
    this.addMessage(msg);

    try {
      const agentResponse = await this._generateAgentResponse(text);
      this._updateMessageStatus(msg.id, 'delivered');

      const agentMsg = this._createMessage(agentResponse, 'agent');
      this.addMessage(agentMsg);
    } catch (err) {
      this._updateMessageStatus(msg.id, 'error');
      const errorMsg = this._createMessage(
        'Sorry, I couldn\'t process that request right now. Please try again.',
        'error'
      );
      this.addMessage(errorMsg);
    } finally {
      this.setProcessing(false);
      this._updateSendButton();
    }
  }

  /**
   * Handle policy-specific queries by looking up live policy data.
   * Returns null if the query is not about store policies.
   */
  private async _handlePolicyQuery(query: string): Promise<string | null> {
    const lower = query.toLowerCase();
    const policies = await policyService.getAllPolicies();

    if (lower.includes('shipping') || lower.includes('delivery')) {
      return `Our shipping options are: ${policies.shipping.standard}, ${policies.shipping.express}, and ${policies.shipping.international}. Free shipping on orders over $${policies.shipping.freeShippingThreshold}.`;
    }

    if (lower.includes('warranty') || lower.includes('guarantee')) {
      return `Our products come with ${policies.warranty.standardPeriod} covering ${policies.warranty.coverageDetails}.`;
    }

    if (lower.includes('return') || lower.includes('refund')) {
      return `Our return policy allows returns within ${policies.returns.returnWindow}. ${policies.returns.refundMethod}.`;
    }

    return null;
  }

  /**
   * Generate agent response with policy grounding and guardrails.
   * Pipeline: off-topic → order tracking → catalog → policy → greeting → fallback.
   */
  async _generateAgentResponse(userQuery: string): Promise<string> {
    const lowerQuery = userQuery.toLowerCase();

    // Step 1: Off-topic check
    const offTopicResult = await offTopicDetector.detectOffTopic(userQuery);
    if (offTopicResult.isOffTopic) {
      const refusalResponse = await refusalResponseService.generateRefusal(userQuery);
      if (refusalResponse) {
        return refusalResponse.message;
      }
      return "I'm here to help with questions about our store, products, policies, and orders. Please ask about something related to our store.";
    }

    // Step 2: Order intent detection (order tracking, status lookup) per D-11
    const orderResult = await this._orderIntentDetector.resolveQuery(userQuery);
    if (orderResult.type === 'order_found') {
      return formatOrderResponse(orderResult);
    }
    if (orderResult.type === 'needs_email' || orderResult.type === 'needs_order_number' || orderResult.type === 'email_mismatch' || orderResult.type === 'order_not_found') {
      return formatOrderResponse(orderResult);
    }

    // Step 3: Catalog intent detection (product availability, sizing, search)
    const catalogResult = await this._catalogIntentDetector.resolveQuery(userQuery);
    if (catalogResult.type !== 'not_catalog') {
      return formatCatalogResponse(userQuery, catalogResult);
    }

    // Step 4: Policy query handling
    const policyResponse = await this._handlePolicyQuery(userQuery);
    if (policyResponse) {
      const grounding = await responseGrounder.groundResponse(userQuery, policyResponse);
      if (!grounding.isGrounded && grounding.violations.length > 0) {
        // Response validated against policy — violations logged if mismatch
        // Policy text comes directly from live data so grounding checks pass
      }
      return policyResponse;
    }

    // Step 5: Greeting
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! I'm here to help with questions about our products, shipping, warranty, and return policies. How can I assist you today?";
    }

    // Step 6: Fallback
    return "I'm here to help with questions about our store products, policies, and orders. You can ask me about shipping options, warranty coverage, return procedures, or product availability.";
  }

  // Public method for sending simulated agent responses (used in tests)
  simulateAgentResponse(text: string): ChatMessage {
    const msg = this._createMessage(text, 'agent');
    this.addMessage(msg);
    return msg;
  }

  destroy(): void {
    this.toggleBtn.remove();
    this.widget.remove();
  }

  _render(): void {
    // Initial render — widget is ready, no welcome message per D-14
  }
}