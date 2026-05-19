// shopify-widget/src/ChatWidget.ts
import responseGrounder from '../../src/services/responseGrounder';
import { OffTopicDetector } from '../../src/services/offTopicDetector';
import { PolicyService } from '../../src/services/policyService';
import { RefusalResponseService } from '../../src/services/refusalResponses';
import { CatalogIntentDetector, formatCatalogResponse } from '../../src/services/catalogIntentDetector';
import { CatalogService } from '../../src/services/catalogService';
import { MockCatalogDataSource } from '../../src/services/mockCatalogData';
import { OrderService } from '../../src/services/orderService';
import { MockOrderDataSource } from '../../src/services/mockOrderData';
import { OrderIntentDetector } from '../../src/services/orderIntentDetector';
import { formatOrderResponse } from '../../src/services/orderResponseFormatter';
import { EscalationDetector } from '../../src/services/escalationDetector';
import { EscalationStateMachine } from '../../src/services/escalationStateMachine';
import { HandoffChannel, HandoffChannelState } from '../../src/services/handoffChannel';
import { AgentPresenceTracker } from '../../src/services/agentPresence';
import { CatalogSyncManager } from '../../src/services/catalogSync';
import { PolicySyncManager } from '../../src/services/policySync';
import { ShopifyStorefrontDataSource } from '../../src/services/shopifyStorefrontDataSource';
import { ShopifyOrderProxyDataSource } from '../../src/services/shopifyOrderProxyDataSource';
import type { CatalogDataSource, OrderDataSource, EscalationChatMessage, Product } from '../../src/services/types';
import { SuggestedActionsService } from '../../src/services/suggestedActions';
import { AutocompleteService } from '../../src/services/autocomplete';
import type { SuggestedAction, ConversationState, AutocompleteResult } from '../../src/services/types';
import type { ReturnService } from '../../src/services/returnService';
import { SemanticRouter } from './core/semanticRouter';

// Initialize our services
const policyService = new PolicyService();

// Supabase Realtime — hardcoded for demo per D-06
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ── Type interfaces ──────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'error';
  text: string;
  timestamp: number;
  status: 'sending' | 'delivered' | 'error';
  isHumanAgent?: boolean;
}

export interface ChatWidgetOptions {
  container?: HTMLElement;
  endpoint?: string;
  timeoutMs?: number;
  catalogIntentDetector?: CatalogIntentDetector;
  catalogService?: CatalogService;
  orderService?: OrderService;
  orderIntentDetector?: OrderIntentDetector;
  escalationDetector?: EscalationDetector;
  escalationStateMachine?: EscalationStateMachine;
  enableReturnService?: boolean;
  // Live data source options (Phase 7)
  proxyUrl?: string;
  hmacSecret?: string;
  policyUrl?: string;
  storeDomain?: string;
  storefrontToken?: string;
  dataSource?: {
    catalog?: 'mock' | 'live';
    order?: 'mock' | 'live';
    policy?: 'mock' | 'live';
  };
}

export interface ChatWidgetState {
  isOpen: boolean;
  isOnline: boolean;
  isProcessing: boolean;
  messages: ChatMessage[];
}

// ── Widget class ─────────────────────────────────────────────────

export default class ChatWidget {
  private container: HTMLElement;
  private endpoint: string;
  private timeoutMs: number;
  private state: ChatWidgetState;
  private _catalogIntentDetector!: CatalogIntentDetector;
  private _orderIntentDetector!: OrderIntentDetector;
  private _escalationDetector!: EscalationDetector;
  private _escalationStateMachine!: EscalationStateMachine;
  private _handoffService: HandoffChannel | null = null;
  private _presenceTracker: AgentPresenceTracker | null = null;
  private _catalogSync: CatalogSyncManager | null = null;
  private _policySync: PolicySyncManager | null = null;
  private _useMockData = false;
  private _agentTyping = false;
  private _typingIndicatorEl: HTMLDivElement | null = null;
  private _reconnectBannerEl: HTMLDivElement | null = null;
  private _sessionId: string;
  private _returnService: ReturnService | undefined;
  private _offTopicDetector!: OffTopicDetector;
  private _refusalResponseService!: RefusalResponseService;
  private _semanticRouter!: SemanticRouter;
  private _policyService: PolicyService | undefined;
  private _pendingQuery: string | null = null;
  private _enableReturnService: boolean;
  private toggleBtn!: HTMLButtonElement;
  private widget!: HTMLDivElement;
  private offlineBanner!: HTMLDivElement;
  private messageList!: HTMLDivElement;
  private inputContainer!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private _messageIdCounter = 0;
  private _hasSentMessage = false;
  private _chipContainer: HTMLDivElement | null = null;
  private _onboardingHint: HTMLDivElement | null = null;
  // Suggested Actions (Phase 5-03)
  private _suggestedActions = new SuggestedActionsService();
  private _lastConversationState: ConversationState = 'initial';
  private _lastResolvedQuery: unknown = null;
  // Autocomplete (Phase 5-03)
  private _autocompleteService = new AutocompleteService();
  private _autocompleteDropdown: HTMLDivElement | null = null;
  private _autocompleteHighlightedIndex = -1;
  private _autocompleteResults: AutocompleteResult[] = [];
  private _catalogProducts: Product[] = [];
  private _autocompleteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Adaptive onboarding (Phase 5-03)
  private _onboardingFadeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: ChatWidgetOptions = {}) {
    this.container = options.container || document.getElementById('ai-support-widget') as HTMLElement;
    this.endpoint = options.endpoint || '/apps/support-agent/chat';
    this.timeoutMs = options.timeoutMs || 10000;
    this._enableReturnService = options.enableReturnService ?? false;

    this.state = {
      isOpen: false,
      isOnline: navigator.onLine,
      isProcessing: false,
      messages: [],
    };

    // Semantic Router — singleton shared across all detectors (D-22)
    this._semanticRouter = SemanticRouter.getInstance();

    // Off-topic detector — now injected with SemanticRouter (D-24)
    this._offTopicDetector = new OffTopicDetector(policyService, this._semanticRouter);
    this._refusalResponseService = new RefusalResponseService(this._offTopicDetector);

    // Data source selection — default to live, mock only when explicit (D-06, D-14)
    this._useMockData = options.dataSource === 'mock';
    const useMockOrder = this._useMockData || options.dataSource?.order === 'mock';
    const useMockCatalog = this._useMockData || options.dataSource?.catalog === 'mock';
    const useMockPolicy = this._useMockData || options.dataSource?.policy === 'mock';

    // Order services — optionally injectable for tests
    const orderDataSource: OrderDataSource = useMockOrder
      ? new MockOrderDataSource()
      : new ShopifyOrderProxyDataSource({
          proxyUrl: options.proxyUrl ?? '',
          hmacSecret: options.hmacSecret ?? '',
        });
    const _orderService = options.orderService || new OrderService(orderDataSource);
    if (options.orderIntentDetector) {
      this._orderIntentDetector = options.orderIntentDetector;
    } else {
      // Inject SemanticRouter (D-02)
      this._orderIntentDetector = new OrderIntentDetector(_orderService, this._semanticRouter);
    }

    // Catalog services — optionally injectable for tests
    if (options.catalogIntentDetector) {
      this._catalogIntentDetector = options.catalogIntentDetector;
    } else {
      const catalogDataSource: CatalogDataSource = useMockCatalog
        ? new MockCatalogDataSource()
        : new ShopifyStorefrontDataSource({
            storeDomain: options.storeDomain ?? '',
            storefrontToken: options.storefrontToken,
          });
      const catalogService = options.catalogService || new CatalogService(catalogDataSource);
      // Inject SemanticRouter (D-02)
      this._catalogIntentDetector = new CatalogIntentDetector(catalogService, this._semanticRouter);
    }

    // Load catalog products for autocomplete (fire-and-forget, gracefully degrades)
    const catSvc = options.catalogService ?? (this._catalogIntentDetector as any)._catalogService;
    if (catSvc) {
      catSvc.loadProducts()
        .then((products: Product[]) => { this._catalogProducts = products; })
        .catch(() => { /* autocomplete returns no results if load fails */ });
    }

    // Policy service with live fetch options (D-05, D-13)
    this._policyService = new PolicyService({
      policyUrl: options.policyUrl ?? './policies.md',
      useMockData: useMockPolicy,
    });

    // Return service — feature-flagged (D-30, D-31)
    // Field type changed to ReturnService | undefined; lazy init on first access
    this._returnService = undefined;

    // Escalation services — optionally injectable for tests
    if (options.escalationDetector) {
      this._escalationDetector = options.escalationDetector;
    } else {
      this._escalationDetector = new EscalationDetector();
    }
    if (options.escalationStateMachine) {
      this._escalationStateMachine = options.escalationStateMachine;
    } else {
      this._escalationStateMachine = new EscalationStateMachine();
    }

    this._sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    this._init();
  }

  _init() {
    this._createDOM();
    this._bindEvents();
    this._initNetworkDetection();
    this._render();
    this._startSyncManagers();
  }

  private _startSyncManagers(): void {
    if (this._useMockData) return;

    // Start catalog sync (5 min interval)
    if (this._catalogIntentDetector) {
      const catalogService = (this._catalogIntentDetector as any)._catalogService;
      if (catalogService) {
        const dataSource = (catalogService as any)._dataSource;
        if (dataSource) {
          this._catalogSync = new CatalogSyncManager({
            dataSource,
            syncIntervalMs: 300000,
          });
          this._catalogSync.start().catch(() => {
            // Sync failure is handled internally — stale cache preserved
          });
        }
      }
    }

    // Start policy sync (10 min interval)
    if (this._policyService) {
      this._policySync = new PolicySyncManager({
        policyService: this._policyService,
        checkIntervalMs: 600000,
      });
      this._policySync.onPolicyChange(() => {
        this._policyService?.invalidateCache();
      });
      this._policySync.start().catch(() => {
        // Sync failure is handled internally
      });
    }
  }

  // D-31: Lazy async init — constructor can't be async, so the dynamic
  // import() for ReturnService + MockReturnDataSource happens here on
  // first access in _generateAgentResponse. When enableReturnService is
  // false, this method is never called and the bundler tree-shakes both
  // modules away.
  private async _lazyInitReturnService(): Promise<void> {
    if (!this._enableReturnService || this._returnService !== undefined) return;
    try {
      const { ReturnService: RS, MockReturnDataSource: MDS } = await import('../../src/services/returnService');
      const orderSvc = new OrderService(new MockOrderDataSource());
      this._returnService = new RS(policyService, orderSvc, new MDS());
    } catch (err) {
      console.error('[ChatWidget] Failed to lazy-load ReturnService:', err);
    }
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
      // Autocomplete keyboard navigation (before Enter-to-send check)
      if (this._autocompleteDropdown && this._autocompleteResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this._autocompleteHighlightedIndex = (this._autocompleteHighlightedIndex + 1) % this._autocompleteResults.length;
          this._updateAutocompleteHighlight();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this._autocompleteHighlightedIndex = (this._autocompleteHighlightedIndex - 1 + this._autocompleteResults.length) % this._autocompleteResults.length;
          this._updateAutocompleteHighlight();
          return;
        }
        if (e.key === 'Enter' && this._autocompleteHighlightedIndex >= 0) {
          e.preventDefault();
          this._selectAutocompleteResult(this._autocompleteHighlightedIndex);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this._dismissAutocomplete();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          if (this._autocompleteHighlightedIndex >= 0) {
            this._selectAutocompleteResult(this._autocompleteHighlightedIndex);
          } else if (this._autocompleteResults.length > 0) {
            this._selectAutocompleteResult(0);
          }
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    });

    this.textarea.addEventListener('input', () => {
      this._autoGrow();
      this._updateSendButton();
      this._handleAutocompleteInput();
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
      this._renderActionChips();
      this._renderOnboardingHint();
    } else {
      this._removeActionChips();
      this._dismissAutocomplete();
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

  _createSystemMessage(text: string, subtype: EscalationChatMessage['subtype']): EscalationChatMessage {
    return {
      id: this._generateId(),
      role: 'system',
      subtype,
      text,
      timestamp: Date.now(),
      status: 'delivered',
    };
  }

  _renderMessage(msg: ChatMessage): void {
    if (msg.role === 'system') {
      const systemMsg = msg as EscalationChatMessage;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble--system';

      switch (systemMsg.subtype) {
        case 'escalation-offer':
        case 'frustration-offer': {
          bubble.className += ' chat-bubble--escalation-offer';
          if (systemMsg.subtype === 'frustration-offer') {
            bubble.classList.add('chat-bubble--frustration');
          }
          bubble.dataset.messageId = msg.id;

          const header = document.createElement('div');
          header.className = 'chat-bubble__header';
          const roleLabel = document.createElement('span');
          roleLabel.className = 'chat-bubble__role';
          roleLabel.textContent = 'Support';
          const time = document.createElement('time');
          time.className = 'chat-bubble__time';
          time.textContent = this._formatTimestamp(msg.timestamp);
          header.appendChild(roleLabel);
          header.appendChild(time);

          const content = document.createElement('div');
          content.className = 'chat-bubble__content';
          content.textContent = msg.text;

          const actions = document.createElement('div');
          actions.className = 'chat-bubble__actions';

          const confirmBtn = document.createElement('button');
          confirmBtn.className = 'chat-bubble__action-btn chat-bubble__action-btn--confirm';
          confirmBtn.textContent = systemMsg.subtype === 'frustration-offer' ? 'Yes, please' : 'Confirm';
          confirmBtn.addEventListener('click', () => this._handleEscalationConfirm());

          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'chat-bubble__action-btn chat-bubble__action-btn--cancel';
          cancelBtn.textContent = systemMsg.subtype === 'frustration-offer' ? "No, I'll keep trying" : 'Cancel';
          cancelBtn.addEventListener('click', () => this._handleEscalationCancel());

          actions.appendChild(confirmBtn);
          actions.appendChild(cancelBtn);

          bubble.appendChild(header);
          bubble.appendChild(content);
          bubble.appendChild(actions);
          break;
        }
        case 'transferring': {
          bubble.className += ' chat-bubble--transferring';
          bubble.dataset.messageId = msg.id;

          const header = document.createElement('div');
          header.className = 'chat-bubble__header';
          const roleLabel = document.createElement('span');
          roleLabel.className = 'chat-bubble__role';
          roleLabel.textContent = 'Support';
          header.appendChild(roleLabel);

          const content = document.createElement('div');
          content.className = 'chat-bubble__content';
          content.textContent = msg.text;

          const dot = document.createElement('span');
          dot.className = 'chat-bubble__dot';

          content.appendChild(dot);

          bubble.appendChild(header);
          bubble.appendChild(content);
          break;
        }
        case 'queue': {
          bubble.className += ' chat-bubble--queue';
          bubble.dataset.messageId = msg.id;

          const header = document.createElement('div');
          header.className = 'chat-bubble__header';
          const roleLabel = document.createElement('span');
          roleLabel.className = 'chat-bubble__role';
          roleLabel.textContent = 'Support';
          header.appendChild(roleLabel);

          const content = document.createElement('div');
          content.className = 'chat-bubble__content';

          const positionText = document.createElement('span');
          positionText.textContent = msg.text;
          content.appendChild(positionText);

          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'chat-bubble__action-btn chat-bubble__action-btn--danger';
          cancelBtn.textContent = 'Cancel escalation';
          cancelBtn.addEventListener('click', () => this._handleEscalationCancel());

          bubble.appendChild(header);
          bubble.appendChild(content);
          bubble.appendChild(cancelBtn);
          break;
        }
        case 'connected': {
          bubble.className += ' chat-bubble--connected';
          bubble.dataset.messageId = msg.id;

          const content = document.createElement('div');
          content.className = 'chat-bubble__content';
          content.textContent = msg.text;

          bubble.appendChild(content);
          break;
        }
      }

      this.messageList.appendChild(bubble);
      return;
    }

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
      if (msg.role === 'agent' && msg.text.includes('<')) {
        // Agent message contains HTML (e.g., OrderCard) — render as DOM
        // Simple sanitization: strip script tags and event handlers before inserting
        const sanitized = msg.text
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '');
        content.innerHTML = sanitized;
      } else {
        // User messages or plain text — use textContent to prevent XSS
        content.textContent = msg.text;
      }

      const statusEl = document.createElement('span');
      statusEl.className = `chat-bubble__status chat-bubble__status--${msg.status}`;
      statusEl.textContent = msg.status === 'sending' ? 'Sending...' : msg.status === 'delivered' ? 'Delivered' : 'Failed';
      statusEl.dataset.statusFor = msg.id;

      bubble.appendChild(header);
      bubble.appendChild(content);
      bubble.appendChild(statusEl);
    }

    if (msg.role === 'agent' && msg.isHumanAgent && bubble.querySelector('.chat-bubble__role')) {
      const roleSpan = bubble.querySelector('.chat-bubble__role') as HTMLElement;
      roleSpan.textContent = 'Human Agent';
      roleSpan.classList.add('chat-bubble__role--human');
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

    this._hasSentMessage = true;
    this._removeActionChips();
    this._removeOnboardingHint();
    this._dismissAutocomplete();

    if (!this.state.isOnline) {
      this.setProcessing(false);
      return;
    }

    // D-06, D-10, D-11: First-query model loading UX
    if (!this._semanticRouter.isLoaded() && !this._semanticRouter.getLoadError()) {
      this.setProcessing(true);
      this.textarea.value = '';

      // Show loading message
      const loadingMsg = this._createMessage('Loading AI model\u2026', 'system');
      this._pendingQuery = text;
      this.addMessage(loadingMsg);

      try {
        // D-28: Retry handled internally by SemanticRouter._ensureModel()
        await this._semanticRouter.embed('__warmup__'); // triggers lazy load
        // Remove loading message
        this._removeLastSystemMessage();
      } catch {
        // D-27: Silent fallback — model failed, remove loading message
        this._removeLastSystemMessage();
      }

      this.setProcessing(false);
      // Process the queued query normally (semantic fallback to keywords if model failed per D-29)
      return this._processQuery(text);
    }

    // Original flow continues
    this.setProcessing(true);
    this.textarea.value = '';

    const msg = this._createMessage(text, 'user', 'sending');
    this.addMessage(msg);

    try {
      const agentResponse = await this._generateAgentResponse(text);
      this._updateMessageStatus(msg.id, 'delivered');

      // Update conversation state based on response content
      this._lastConversationState = this._determineConversationState(agentResponse);

      const agentMsg = this._createMessage(agentResponse, 'agent');
      this.addMessage(agentMsg);

      // Re-render action chips with updated conversation context
      this._renderActionChips(true);
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

  // Process a query after model is loaded (used by first-query flow)
  private async _processQuery(text: string): Promise<void> {
    this.setProcessing(true);

    const msg = this._createMessage(text, 'user', 'sending');
    this.addMessage(msg);

    try {
      const agentResponse = await this._generateAgentResponse(text);
      this._updateMessageStatus(msg.id, 'delivered');

      // Update conversation state based on response content
      this._lastConversationState = this._determineConversationState(agentResponse);

      const agentMsg = this._createMessage(agentResponse, 'agent');
      this.addMessage(agentMsg);

      // Re-render action chips with updated conversation context
      this._renderActionChips(true);
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

  // Remove the last system message (used to clear loading indicator)
  private _removeLastSystemMessage(): void {
    const lastIdx = this.state.messages.length - 1;
    if (lastIdx >= 0 && this.state.messages[lastIdx].role === 'system') {
      this.state.messages.splice(lastIdx, 1);
      this._render();
    }
  }

  /**
   * Handle policy-specific queries by looking up live policy data.
   * Uses SemanticRouter for intent detection (W4) with keyword fallback.
   * Enforces ResponseGrounder validation (W2) — returns fallback on grounding failure.
   * Returns null if the query is not about store policies.
   */
  private async _handlePolicyQuery(query: string): Promise<string | null> {
    const ps = this._policyService || policyService;
    const policies = await ps.getAllPolicies();

    // Semantic routing for policy intent (W4 fix)
    const policyCategories = {
      shipping: ['shipping', 'delivery', 'how long to arrive', 'when will it ship', 'delivery time', 'shipping options'],
      warranty: ['warranty', 'guarantee', 'coverage', 'defect', 'repair', 'product guarantee'],
      returns: ['return', 'refund', 'exchange', 'send back', 'money back', 'return policy']
    };

    try {
      const result = await this._semanticRouter.classifyFromPhrases(query.toLowerCase(), policyCategories);

      if (result.confidence >= 0.6 && result.intent) {
        let policyResponse: string;
        switch (result.intent) {
          case 'shipping':
            policyResponse = `Our shipping options are: ${policies.shipping.standard}, ${policies.shipping.express}, and ${policies.shipping.international}. Free shipping on orders over $${policies.shipping.freeShippingThreshold}.`;
            break;
          case 'warranty':
            policyResponse = `Our products come with ${policies.warranty.standardPeriod} covering ${policies.warranty.coverageDetails}.`;
            break;
          case 'returns':
            policyResponse = `Our return policy allows returns within ${policies.returns.returnWindow}. ${policies.returns.refundMethod}.`;
            break;
          default:
            return null;
        }

        // Grounding enforcement (W2 fix)
        const grounding = await responseGrounder.groundResponse(query, policyResponse);
        if (!grounding.isGrounded) {
          return "I'm sorry, I couldn't verify the policy details. Please check our store policies page or contact support for accurate information.";
        }

        return policyResponse;
      }
    } catch (err) {
      // Semantic routing failed — fall through to keyword matching
      console.error('[ChatWidget] Semantic policy routing failed:', err);
    }

    // Keyword fallback if semantic confidence is low or routing failed
    const lower = query.toLowerCase();
    if (lower.includes('shipping') || lower.includes('delivery')) {
      const policyResponse = `Our shipping options are: ${policies.shipping.standard}, ${policies.shipping.express}, and ${policies.shipping.international}. Free shipping on orders over $${policies.shipping.freeShippingThreshold}.`;
      const grounding = await responseGrounder.groundResponse(query, policyResponse);
      if (!grounding.isGrounded) {
        return "I'm sorry, I couldn't verify the policy details. Please check our store policies page or contact support for accurate information.";
      }
      return policyResponse;
    }
    if (lower.includes('warranty') || lower.includes('guarantee')) {
      const policyResponse = `Our products come with ${policies.warranty.standardPeriod} covering ${policies.warranty.coverageDetails}.`;
      const grounding = await responseGrounder.groundResponse(query, policyResponse);
      if (!grounding.isGrounded) {
        return "I'm sorry, I couldn't verify the policy details. Please check our store policies page or contact support for accurate information.";
      }
      return policyResponse;
    }
    if (lower.includes('return') || lower.includes('refund')) {
      const policyResponse = `Our return policy allows returns within ${policies.returns.returnWindow}. ${policies.returns.refundMethod}.`;
      const grounding = await responseGrounder.groundResponse(query, policyResponse);
      if (!grounding.isGrounded) {
        return "I'm sorry, I couldn't verify the policy details. Please check our store policies page or contact support for accurate information.";
      }
      return policyResponse;
    }

    return null;
  }

    /**
     * Generate agent response with policy grounding and guardrails.
     * Pipeline: off-topic → escalation → order tracking → return → catalog → policy → greeting → fallback.
     */
  async _generateAgentResponse(userQuery: string): Promise<string> {
    const lowerQuery = userQuery.toLowerCase();

    // Step 0: Mixed intent detection (split at conjunction, handle secondary via context)
    const mixedIntent = this._detectMixedIntent(userQuery);
    if (mixedIntent) {
      const primaryResponse = await this._generateAgentResponse(mixedIntent.primary);
      const secondaryAck = mixedIntent.acknowledgment;
      if (primaryResponse) {
        return `${primaryResponse}\n\n${secondaryAck}`;
      }
      return secondaryAck;
    }

    // Step 1: Off-topic check
    const offTopicResult = await this._offTopicDetector.detectOffTopic(userQuery);
    if (offTopicResult.isOffTopic) {
      const refusalResponse = await this._refusalResponseService.generateRefusal(userQuery);
      if (refusalResponse) {
        return refusalResponse.message;
      }
      return "I'm here to help with questions about our store, products, policies, and orders. Please ask about something related to our store.";
    }

    // Step 2: Escalation detection (D-14 — after off-topic, before order tracking)
    if (this._escalationStateMachine.isActive()) {
      const systemMsg = this._escalationStateMachine.getCurrentSystemMessage();
      if (systemMsg) {
        const msg = this._createSystemMessage(systemMsg, this._getSubtypeForCurrentState());
        this.addMessage(msg);
        return '';
      }
    }

    const escalationType = this._escalationDetector.detectIntent(userQuery);
    if (escalationType !== 'none') {
      if (this._escalationDetector.isDuplicateRequest()) {
        return "You can ask me about products, policies, and orders instead.";
      }

      this._escalationStateMachine.transition('OFFER', escalationType);

      const offerSubtype = escalationType === 'frustration' ? 'frustration-offer' : 'escalation-offer';
      const offerText = this._escalationStateMachine.getCurrentSystemMessage() || '';

      const msg = this._createSystemMessage(offerText, offerSubtype);
      this.addMessage(msg);
      return '';
    }

    // Step 3: Order intent detection
    const orderResult = await this._orderIntentDetector.resolveQuery(userQuery);
    if (orderResult.type === 'order_found') {
      return formatOrderResponse(orderResult);
    }
    if (orderResult.type === 'needs_email' || orderResult.type === 'needs_order_number' || orderResult.type === 'email_mismatch' || orderResult.type === 'order_not_found') {
      return formatOrderResponse(orderResult);
    }

    // Step 4: Return initiation (feature-flagged per D-30, lazy-loaded per D-31)
    if (this._enableReturnService) {
      await this._lazyInitReturnService();
      if (this._returnService?.detectReturnIntent(userQuery)) {
        const orderResult = await this._orderIntentDetector.resolveQuery(userQuery);
        if (orderResult.type === 'order_found') {
          const eligibility = await this._returnService.checkEligibility(
            orderResult.order.orderNumber,
            orderResult.email,
          );
          if (eligibility.type === 'return_eligible') {
            const itemsList = eligibility.items.map(i => `  - ${i.title} (${i.variantTitle})`).join('\n');
            return `I can help you start a return for order #${eligibility.orderNumber}. Which item(s) would you like to return?\n\nItems in this order:\n${itemsList}\n\nPlease tell me which item and the reason for the return.`;
          }
          if (eligibility.type === 'return_not_eligible') {
            return eligibility.message;
          }
        }
        if (orderResult.type === 'needs_order_number') {
          return "Sure, I can help with a return. What's your order number?";
        }
        if (orderResult.type === 'needs_email') {
          return orderResult.message;
        }
        if (orderResult.type === 'email_mismatch' || orderResult.type === 'order_not_found') {
          return orderResult.message;
        }
        return "I can help you start a return. Please provide your order number and email.";
      }
    }

    // Step 5: Catalog intent detection (product availability, sizing, search)
    const catalogResult = await this._catalogIntentDetector.resolveQuery(userQuery);
    if (catalogResult.type !== 'not_catalog') {
      return formatCatalogResponse(userQuery, catalogResult);
    }

    // Step 6: Policy query handling
    const policyResponse = await this._handlePolicyQuery(userQuery);
    if (policyResponse) {
      // Defensive grounding check (already enforced in _handlePolicyQuery)
      const grounding = await responseGrounder.groundResponse(userQuery, policyResponse);
      if (!grounding.isGrounded) {
        return "I'm sorry, I couldn't verify the policy details. Please check our store policies page or contact support for accurate information.";
      }
      return policyResponse;
    }

    // Step 7: Greeting
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! I'm here to help with questions about our products, shipping, warranty, and return policies. How can I assist you today?";
    }

    // Step 8: Fallback
    return "I'm here to help with questions about our store products, policies, and orders. You can ask me about shipping options, warranty coverage, return procedures, or product availability.";
  }

  // Public method for sending simulated agent responses (used in tests)
  simulateAgentResponse(text: string): ChatMessage {
    const msg = this._createMessage(text, 'agent');
    this.addMessage(msg);
    return msg;
  }

  // ── Mixed Intent Detection ──────────────────────────

  private _detectMixedIntent(query: string): { primary: string; secondary: string; acknowledgment: string } | null {
    const lower = query.toLowerCase();
    // Conjunction patterns that signal mixed intent
    const conjunctions = [' and ', ' also ', ' plus ', ' but ', ' as well as '];
    
    for (const conj of conjunctions) {
      const idx = lower.indexOf(conj);
      if (idx === -1) continue;
      
      const primary = query.substring(0, idx).trim();
      const secondary = query.substring(idx + conj.length).trim();
      
      // Only split if both parts are non-trivial (at least 3 chars each)
      if (primary.length < 3 || secondary.length < 3) continue;
      
      // Generate acknowledgment for secondary intent
      const acknowledgment = this._getSecondaryAcknowledgment(secondary);
      
      return { primary, secondary, acknowledgment };
    }
    
    return null;
  }

  private _getSecondaryAcknowledgment(secondary: string): string {
    const lower = secondary.toLowerCase();
    
    // Return-related
    if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
      return "Also, regarding your return question — I can help with that too. Just provide your order number and I'll check eligibility.";
    }
    
    // Shipping-related
    if (lower.includes('ship') || lower.includes('deliver') || lower.includes('arrival')) {
      return "Also, about shipping — standard shipping takes 5-7 business days. Expedited options are available at checkout.";
    }
    
    // Sizing-related
    if (lower.includes('size') || lower.includes('fit') || lower.includes('measurement')) {
      return "Also, for sizing questions — each product page has a size chart. I can help with specific measurements if you tell me the product.";
    }
    
    // Default acknowledgment
    return "I also noticed you asked about another topic — feel free to ask me about it next and I'll help right away.";
  }

  // ── Escalation helpers ──────────────────────────────

  private _getSubtypeForCurrentState(): EscalationChatMessage['subtype'] {
    const state = this._escalationStateMachine.getState();
    switch (state.status) {
      case 'OFFERED': return state.triggerType === 'frustration' ? 'frustration-offer' : 'escalation-offer';
      case 'TRANSFERRING': return 'transferring';
      case 'QUEUED': return 'queue';
      case 'CONNECTED': return 'connected';
      default: return 'escalation-offer';
    }
  }

  // ── Typed event payloads for Supabase broadcast ──
  // Flat structure matching the broadcast send() call

  private async _handleEscalationConfirm(): Promise<void> {
    const state = this._escalationStateMachine.getState();

    if (state.status === 'FAILED') {
      await this._executeTransferRetry();
      return;
    }

    if (state.status !== 'OFFERED') return;

    this._escalationStateMachine.transition('CONFIRM');

    const transferringMsg = this._createSystemMessage('Transferring you to a human agent...', 'transferring');
    this._removeLastSystemMessage();
    this.addMessage(transferringMsg);

    try {
      this._presenceTracker = new AgentPresenceTracker();
      this._presenceTracker.onPresenceChange((count) => {
        if (count === 0 && this._escalationStateMachine.getState().status === 'CONFIRMING') {
          this._showNoAgentsMessage();
        }
      });

      this._handoffService = new HandoffChannel(SUPABASE_URL, SUPABASE_ANON_KEY);
      this._handoffService.setCallbacks({
        onHandoffAccepted: ({ payload }) => {
          if (payload.userId !== this._sessionId) return;
          this._escalationStateMachine.transition('CONNECT');
          this._removeLastSystemMessage();
          this._hideReconnectBanner();
          const connectedMsg = this._createSystemMessage(
            "You're now connected with a human agent.", 'connected');
          this.addMessage(connectedMsg);
        },
        onAgentMessage: ({ payload }) => {
          if (payload.userId !== this._sessionId) return;
          this._hideTypingIndicator();
          const humanMsg = this._createMessage(payload.text, 'agent');
          (humanMsg as ChatMessage).isHumanAgent = true;
          this.addMessage(humanMsg);
        },
        onTypingIndicator: ({ payload }) => {
          if (payload.userId !== this._sessionId) return;
          if (payload.isTyping) {
            this._showTypingIndicator();
          } else {
            this._hideTypingIndicator();
          }
        },
        onHandoffCancelled: ({ payload }) => {
          if (payload.userId !== this._sessionId) return;
          this._removeLastSystemMessage();
          const cancelledMsg = this._createMessage(
            'The agent has ended the session. How else can I help you?', 'agent');
          this.addMessage(cancelledMsg);
          this._escalationStateMachine.transition('CANCEL');
          this._escalationStateMachine.transition('RESET');
        },
        onStateChange: (newState: HandoffChannelState) => {
          if (newState === 'reconnecting') {
            this._showReconnectBanner();
          } else if (newState === 'connected') {
            this._hideReconnectBanner();
          }
        },
        onMaxRetriesReached: () => {
          this._removeLastSystemMessage();
          const failMsg = this._createMessage(
            'Connection to human support lost. Please try again later.', 'agent');
          this.addMessage(failMsg);
          this._escalationStateMachine.transition('CANCEL');
          this._escalationStateMachine.transition('RESET');
        },
      });

      await this._handoffService.connect();

      this._handoffService.sendHandoffRequest({
        userId: this._sessionId,
        transcript: this.state.messages.filter(m => m.role !== 'system').slice(-10),
        timestamp: Date.now(),
      });

      setTimeout(() => {
        if (this._escalationStateMachine.getState().status === 'CONFIRMING') {
          this._showNoAgentsMessage();
        }
      }, 60000);
    } catch (err) {
      this._removeLastSystemMessage();
      const failMsg = this._createMessage(
        'Human support is currently unavailable. Please try again later.', 'agent');
      this.addMessage(failMsg);
      this._escalationStateMachine.transition('CANCEL');
      this._escalationStateMachine.transition('RESET');
    }
  }

  private async _executeTransferRetry(): Promise<void> {
    this._removeLastSystemMessage();
    const transferringMsg = this._createSystemMessage('Retrying transfer...', 'transferring');
    this.addMessage(transferringMsg);

    try {
      if (!this._handoffService) {
        this._handoffService = new HandoffChannel(SUPABASE_URL, SUPABASE_ANON_KEY);
        this._handoffService.setCallbacks({
          onHandoffAccepted: ({ payload }) => {
            if (payload.userId !== this._sessionId) return;
            this._escalationStateMachine.transition('CONNECT');
            this._removeLastSystemMessage();
            this._hideReconnectBanner();
            this.addMessage(this._createSystemMessage("You're now connected with a human agent.", 'connected'));
          },
          onAgentMessage: ({ payload }) => {
            if (payload.userId !== this._sessionId) return;
            this._hideTypingIndicator();
            const humanMsg = this._createMessage(payload.text, 'agent');
            (humanMsg as ChatMessage).isHumanAgent = true;
            this.addMessage(humanMsg);
          },
          onStateChange: (s: HandoffChannelState) => {
            if (s === 'reconnecting') this._showReconnectBanner();
            else if (s === 'connected') this._hideReconnectBanner();
          },
        });
      }

      await this._handoffService.connect();
      this._handoffService.sendHandoffRequest({
        userId: this._sessionId,
        transcript: this.state.messages.filter(m => m.role !== 'system').slice(-10),
        timestamp: Date.now(),
      });
    } catch (err) {
      this._removeLastSystemMessage();
      const failMsg = this._createMessage(
        'Human support is currently unavailable. Please try again later.', 'agent');
      this.addMessage(failMsg);
    }
  }



  private _handleEscalationCancel(): void {
    this._escalationStateMachine.transition('CANCEL');
    this._escalationDetector.markCancelled();
    this._escalationStateMachine.transition('RESET');

    const cancelMsg = this._createMessage('Escalation cancelled. How else can I help you?', 'agent');
    this._removeLastSystemMessage();
    this.addMessage(cancelMsg);
  }

  private _showTypingIndicator(): void {
    if (this._typingIndicatorEl) return;
    this._agentTyping = true;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-bubble--system chat-bubble--typing';
    typingEl.innerHTML = `
      <div class="chat-bubble__header">
        <span class="chat-bubble__role">Human Agent</span>
      </div>
      <div class="chat-bubble__content">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    this.messageList.appendChild(typingEl);
    this._typingIndicatorEl = typingEl;
    this._scrollToBottom();
  }

  private _hideTypingIndicator(): void {
    if (this._typingIndicatorEl) {
      this._typingIndicatorEl.remove();
      this._typingIndicatorEl = null;
    }
    this._agentTyping = false;
  }

  private _showReconnectBanner(): void {
    if (this._reconnectBannerEl) return;

    const banner = document.createElement('div');
    banner.className = 'chat-bubble--system chat-bubble--reconnect';
    banner.textContent = 'Reconnecting to agent...';
    this.messageList.appendChild(banner);
    this._reconnectBannerEl = banner;
    this._scrollToBottom();
  }

  private _hideReconnectBanner(): void {
    if (this._reconnectBannerEl) {
      this._reconnectBannerEl.remove();
      this._reconnectBannerEl = null;
    }
  }

  private _showNoAgentsMessage(): void {
    this._removeLastSystemMessage();
    const noAgentsMsg = this._createMessage(
      'No human agents are currently online. Please try again during business hours.', 'agent');
    this.addMessage(noAgentsMsg);
    this._escalationStateMachine.transition('CANCEL');
    this._escalationStateMachine.transition('RESET');
  }

  private _removeLastSystemMessage(): void {
    const messages = this.messageList.querySelectorAll('.chat-bubble--system');
    const last = messages[messages.length - 1];
    if (last) last.remove();
  }

  destroy(): void {
    const state = this._escalationStateMachine?.getState();
    if (state && ['CONFIRMING', 'QUEUED', 'CONNECTED'].includes(state.status)) {
      if (this._handoffService) {
        this._handoffService.sendHandoffCancelled(this._sessionId);
        this._handoffService.disconnect();
      }
    }

    this._presenceTracker?.reset();
    this._catalogSync?.stop();
    this._policySync?.stop();

    this.toggleBtn.remove();
    this.widget.remove();
  }

  _render(): void {
    // Initial render — widget is ready, no welcome message per D-14
  }

  // ── Action Chips ────────────────────────────────

  private _renderActionChips(force = false): void {
    // Remove existing chips first
    if (this._chipContainer) {
      this._chipContainer.remove();
      this._chipContainer = null;
    }

    // Guard: don't show chips on re-open if message was already sent (unless forced)
    if (!force && this._hasSentMessage) {
      return;
    }

    const suggestions = this._suggestedActions.getSuggestions(this._lastConversationState, this._lastResolvedQuery);

    this._chipContainer = document.createElement('div');
    this._chipContainer.className = 'action-chips';

    for (const action of suggestions) {
      const btn = document.createElement('button');
      btn.className = 'action-chip';
      btn.dataset.action = action.label.toLowerCase().replace(/\s+/g, '-');
      btn.textContent = `[${action.label}]`;
      btn.addEventListener('click', () => {
        this.textarea.value = action.query;
        this.textarea.focus();
        this._autoGrow();
        this._updateSendButton();
      });
      this._chipContainer.appendChild(btn);
    }

    this.widget.insertBefore(this._chipContainer, this.inputContainer);
  }

  private _removeActionChips(): void {
    if (this._chipContainer) {
      this._chipContainer.remove();
      this._chipContainer = null;
    }
  }

  /**
   * Determine conversation state from agent response text (heuristic, zero LLM calls).
   */
  private _determineConversationState(response: string): ConversationState {
    const lower = response.toLowerCase();
    if (lower.includes('stock') || lower.includes('in stock')) return 'stock_check';
    if (lower.includes('order') && (lower.includes('tracking') || lower.includes('track'))) return 'order_tracking';
    if (lower.includes('policy') || lower.includes('shipping') || lower.includes('warranty') || lower.includes('return policy')) return 'policy_query';
    if (lower.includes('transfer') || lower.includes('human agent') || lower.includes('escalat')) return 'escalation_offer';
    if (lower.includes('return')) return 'return_flow';
    if (lower.includes('product')) return 'product_search';
    return 'initial';
  }

  // ── Onboarding Hint ────────────────────────────

  private _renderOnboardingHint(): void {
    if (this._hasSentMessage || this.state.messages.length > 0 || this._onboardingHint) return;

    // Check localStorage for 7-day expiry
    const seenFlag = localStorage.getItem('support-onboarding-seen');
    if (seenFlag) {
      const seenTime = parseInt(seenFlag, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - seenTime < sevenDays) {
        return; // Still within 7-day window — skip onboarding
      }
    }

    this._onboardingHint = document.createElement('div');
    this._onboardingHint.className = 'chat-onboarding-hint chat-onboarding-hint--adaptive';

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Try asking about products, tracking orders, or checking policies. Type naturally — I understand typos.';
    this._onboardingHint.appendChild(textSpan);

    // Dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'chat-onboarding-hint__dismiss';
    dismissBtn.textContent = '\u00d7';
    dismissBtn.addEventListener('click', () => {
      this._dismissOnboarding();
    });
    this._onboardingHint.appendChild(dismissBtn);

    // Start 3-second fade timer
    this._onboardingFadeTimer = setTimeout(() => {
      if (this._onboardingHint) {
        this._onboardingHint.classList.add('chat-onboarding-hint--fading');
        setTimeout(() => {
          this._dismissOnboarding();
        }, 500); // Match CSS transition duration
      }
    }, 3000);

    // Prepend to message list so it appears at the top
    this.messageList.prepend(this._onboardingHint);
  }

  private _dismissOnboarding(): void {
    if (this._onboardingFadeTimer) {
      clearTimeout(this._onboardingFadeTimer);
      this._onboardingFadeTimer = null;
    }
    localStorage.setItem('support-onboarding-seen', String(Date.now()));
    if (this._onboardingHint) {
      this._onboardingHint.remove();
      this._onboardingHint = null;
    }
  }

  private _removeOnboardingHint(): void {
    if (this._onboardingFadeTimer) {
      clearTimeout(this._onboardingFadeTimer);
      this._onboardingFadeTimer = null;
    }
    localStorage.setItem('support-onboarding-seen', String(Date.now()));
    if (this._onboardingHint) {
      this._onboardingHint.remove();
      this._onboardingHint = null;
    }
  }

  private _sendImmediate(text: string): void {
    this.textarea.value = text;
    this._sendMessage();
  }

  // ── Autocomplete (Phase 5-03) ──────────────────

  /**
   * Handle textarea input for autocomplete (debounced 150ms per T-05-05).
   */
  private _handleAutocompleteInput(): void {
    if (this._autocompleteDebounceTimer) {
      clearTimeout(this._autocompleteDebounceTimer);
    }
    this._autocompleteDebounceTimer = setTimeout(() => {
      const value = this.textarea.value.trim();
      if (value.length >= 2) {
        this._autocompleteResults = this._autocompleteService.getSuggestions(value, this._catalogProducts);
        if (this._autocompleteResults.length > 0) {
          this._renderAutocompleteDropdown(this._autocompleteResults);
        } else {
          this._dismissAutocomplete();
        }
      } else {
        this._dismissAutocomplete();
      }
    }, 150);
  }

  private _renderAutocompleteDropdown(results: AutocompleteResult[]): void {
    // Remove existing dropdown if present
    if (this._autocompleteDropdown) {
      this._autocompleteDropdown.remove();
    }

    this._autocompleteHighlightedIndex = -1;

    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';

    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.dataset.index = String(index);

      const typeSpan = document.createElement('span');
      typeSpan.className = 'autocomplete-item__type';
      typeSpan.textContent = result.type === 'order' ? '[#]' : result.type === 'product' ? '[P]' : '[S]';

      const labelSpan = document.createElement('span');
      labelSpan.textContent = result.label;

      item.appendChild(typeSpan);
      item.appendChild(labelSpan);

      item.addEventListener('click', () => {
        this._selectAutocompleteResult(index);
      });

      dropdown.appendChild(item);
    });

    // Insert before inputContainer
    this.widget.insertBefore(dropdown, this.inputContainer);
    this._autocompleteDropdown = dropdown;
  }

  private _updateAutocompleteHighlight(): void {
    if (!this._autocompleteDropdown) return;
    const items = this._autocompleteDropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      item.classList.toggle('autocomplete-item--highlighted', index === this._autocompleteHighlightedIndex);
    });
  }

  private _selectAutocompleteResult(index: number): void {
    if (index < 0 || index >= this._autocompleteResults.length) return;
    this.textarea.value = this._autocompleteResults[index].value;
    this._dismissAutocomplete();
    this._autoGrow();
    this._updateSendButton();
    this.textarea.focus();
  }

  private _dismissAutocomplete(): void {
    if (this._autocompleteDebounceTimer) {
      clearTimeout(this._autocompleteDebounceTimer);
      this._autocompleteDebounceTimer = null;
    }
    if (this._autocompleteDropdown) {
      this._autocompleteDropdown.remove();
      this._autocompleteDropdown = null;
    }
    this._autocompleteHighlightedIndex = -1;
    this._autocompleteResults = [];
  }
}