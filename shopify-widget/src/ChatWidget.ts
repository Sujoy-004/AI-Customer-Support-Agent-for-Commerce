// shopify-widget/src/ChatWidget.ts
import responseGrounder from '../../src/services/responseGrounder';
import offTopicDetector from '../../src/services/offTopicDetector';
import { PolicyService } from '../../src/services/policyService';
import { RefusalResponseService } from '../../src/services/refusalResponses';
import { CatalogIntentDetector, formatCatalogResponse } from '../../src/services/catalogIntentDetector';
import { CatalogService } from '../../src/services/catalogService';
import { MockCatalogDataSource } from '../../src/services/mockCatalogData';

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
    this.offlineBanner.className = 'offline-banner';
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
    this.textarea.placeholder = 'Type a message...';
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
      this.offlineBanner.classList.add('offline-banner--visible');
      this._setInputEnabled(false);
    } else {
      this.offlineBanner.hidden = true;
      this.offlineBanner.classList.remove('offline-banner--visible');
      if (!this.state.isProcessing) {
        this._setInputEnabled(true);
      }
    }
  }

  _toggle() {
    this.state.isOpen = !this.state.isOpen;
    this.widget.classList.toggle('chat-widget--open', this.state.isOpen);
    this.toggleBtn.textContent = this.state.isOpen ? '[\u2212] Support' : '[+] Support';

    if (this.state.isOpen && !this.state.isProcessing) {
      this.textarea.focus();
    }
  }

  open() {
    if (!this.state.isOpen) this._toggle();
  }

  close() {
    if (this.state.isOpen) this._toggle();
  }

  _setInputEnabled(enabled) {
    this.textarea.disabled = !enabled;
    this.sendBtn.disabled = !enabled;
    if (enabled) {
      this.textarea.placeholder = 'Type a message...';
    }
  }

  setProcessing(processing) {
    this.state.isProcessing = processing;
    this._setInputEnabled(!processing);
    if (processing) {
      this.textarea.placeholder = 'Waiting for response...';
    }
  }

  _updateSendButton() {
    const hasContent = this.textarea.value.trim().length > 0;
    this.sendBtn.classList.toggle('chat-input__send--active', hasContent);
  }

  _autoGrow() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  _generateId() {
    this._messageIdCounter += 1;
    return `msg-${Date.now()}-${this._messageIdCounter}`;
  }

  _formatTimestamp(timestamp) {
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

  addMessage(msg) {
    this.state.messages.push(msg);
    this._renderMessage(msg);
    this._scrollToBottom();
    return msg;
  }

  _createMessage(text, role, status = 'delivered') {
    return {
      id: this._generateId(),
      role,
      text,
      timestamp: Date.now(),
      status,
    };
  }

  _renderMessage(msg) {
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

      const role = document.createElement('span');
      role.className = 'chat-bubble__role';
      role.textContent = msg.role === 'user' ? 'You' : 'Support';

      const time = document.createElement('time');
      time.className = 'chat-bubble__time';
      time.textContent = this._formatTimestamp(msg.timestamp);

      header.appendChild(role);
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

  _updateMessageStatus(messageId, newStatus) {
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

  _scrollToBottom() {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  async _sendMessage() {
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
      // Process the message through our policy grounding and guardrails
      const agentResponse = await this._generateAgentResponse(text);
      this._updateMessageStatus(msg.id, 'delivered');
      
      // Add the agent's response
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
   * Generate agent response with policy grounding and guardrails
   */
  async _generateAgentResponse(userQuery: string): Promise<string> {
    // Step 1: Check if query is off-topic
    const offTopicResult = await offTopicDetector.detectOffTopic(userQuery);
    
    if (offTopicResult.isOffTopic) {
      // Generate polite refusal
      const refusalResponse = await refusalResponseService.generateRefusal(userQuery);
      if (refusalResponse) {
        return refusalResponse.message;
      }
      return "I'm here to help with questions about our store, products, policies, and orders. Please ask about something related to our store.";
    }
    
    // Step 2: Check for catalog intent (product availability, sizing, search)
    const catalogResult = await this._catalogIntentDetector.resolveQuery(userQuery);
    if (catalogResult.type !== 'not_catalog') {
      // Update context for cross-turn queries
      const context = this.conversationContext;
      if (catalogResult.type === 'exact' && 'product' in catalogResult) {
        context.set(catalogResult.product, {}, []);
      } else if (catalogResult.type === 'partial' && 'product' in catalogResult) {
        context.set(catalogResult.product, catalogResult.options || {}, []);
      }
      return formatCatalogResponse(userQuery, catalogResult);
    }

    // Step 3: Generate a basic response (in a real implementation, this would come from an LLM)
    // For now, we'll generate a simple mock response based on the query
    let basicResponse = this._generateMockResponse(userQuery);
    
    // Step 4: Ground the response in policy data
    const groundingResult = await responseGrounder.groundResponse(userQuery, basicResponse);
    
    // Step 5: If response is not well grounded, improve it or provide a fallback
    if (!groundingResult.isGrounded && groundingResult.confidence < 0.3) {
      // Provide a helpful fallback that encourages policy-specific questions
      return "I want to make sure I give you accurate information based on our store policies. Could you please rephrase your question to be more specific about our shipping, warranty, or return policies? For example, you could ask about our shipping rates, warranty coverage, or return window.";
    }
    
    // Step 6: If we have grounding suggestions, incorporate them
    if (groundingResult.suggestions.length > 0 && groundingResult.confidence < 0.7) {
      // We could modify the response based on suggestions, but for now we'll return it as is
      // since our mock responses are already reasonably grounded
    }
    
    return basicResponse;
  }

  /**
   * Generate a mock response based on the user query
   * In a real implementation, this would be replaced with actual LLM integration
   */
  private _generateMockResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Shipping-related responses
    if (lowerQuery.includes('shipping') || lowerQuery.includes('delivery') || 
        lowerQuery.includes('ship')) {
      if (lowerQuery.includes('standard') || lowerQuery.includes('regular')) {
        return 'Standard shipping (5-7 business days): $5.99';
      }
      if (lowerQuery.includes('express') || lowerQuery.includes('fast')) {
        return 'Express shipping (2-3 business days): $12.99';
      }
      if (lowerQuery.includes('international') || lowerQuery.includes('overseas')) {
        return 'International shipping (7-14 business days): Calculated at checkout';
      }
      if (lowerQuery.includes('free')) {
        return 'We offer free shipping on orders over $75';
      }
      return 'Our shipping options are: Standard (5-7 business days, $5.99), Express (2-3 business days, $12.99), and International (7-14 business days, calculated at checkout). Free shipping is available on orders over $75.';
    }
    
    // Warranty-related responses
    if (lowerQuery.includes('warranty') || lowerQuery.includes('guarantee') || 
        lowerQuery.includes('defect') || lowerQuery.includes('broken')) {
      if (lowerQuery.includes('extended') || lowerQuery.includes('extension')) {
        return 'We offer extended warranty options: 2-year extension for $19.99 or 3-year extension for $29.99';
      }
      if (lowerQuery.includes('claim') || lowerQuery.includes('process') || lowerQuery.includes('rma')) {
        return 'To make a warranty claim, please contact support with your order number and issue description for an RMA';
      }
      return 'Our products come with a 1 year limited warranty that covers manufacturing defects and hardware failures under normal use. Extended options are available.';
    }
    
    // Returns-related responses
    if (lowerQuery.includes('return') || lowerQuery.includes('refund') || 
        lowerQuery.includes('exchange')) {
      if (lowerQuery.includes('window') || lowerQuery.includes('time') || lowerQuery.includes('days')) {
        return 'Our return window is 30 days from delivery date';
      }
      if (lowerQuery.includes('condition') || lowerQuery.includes('original')) {
        return 'Items must be in original condition with all accessories to be eligible for return';
      }
      if (lowerQuery.includes('refund') || lowerQuery.includes('money')) {
        return 'Refunds are issued to the original payment method within 5-7 business days after we receive the return';
      }
      if (lowerQuery.includes('exchange')) {
        return 'We offer free exchanges within 30 days, subject to availability';
      }
      if (lowerQuery.includes('restock') || lowerQuery.includes('fee')) {
        return 'There is no restocking fee for returns in original condition';
      }
      return 'Our return policy allows returns within 30 days of delivery. Items must be in original condition with all accessories. Refunds are issued to the original payment method within 5-7 business days. We also offer free exchanges within 30 days.';
    }
    
    // Greeting or general help
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || 
        lowerQuery.includes('help') || lowerQuery.includes('support')) {
      return 'Hello! I\'m here to help you with questions about our products, shipping, warranty, and return policies. How can I assist you today?';
    }
    
    // Default fallback response
    return 'I\'m here to help with questions about our store products, policies, and orders. You can ask me about shipping options, warranty coverage, return procedures, or product availability.';
  }

  // Public method for sending simulated agent responses (used in tests)
  simulateAgentResponse(text) {
    const msg = this._createMessage(text, 'agent');
    this.addMessage(msg);
    return msg;
  }

  destroy() {
    this.toggleBtn.remove();
    this.widget.remove();
  }

  _render() {
    // Initial render — widget is ready, no welcome message per D-14
  }
}