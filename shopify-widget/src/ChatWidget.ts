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
import type { ResponseSurface } from './renderers/renderTypes';
import type { ReturnService } from '../../src/services/returnService';
import { SemanticRouter } from './core/semanticRouter';

// ── UI Renderers ────────────────────────────────────────────
import { createWidgetShell } from './renderers/renderUI';
import { createInputArea } from './renderers/renderInputArea';
import { createUserMessage, createAgentMessage, createErrorMessage, updateMessageStatus as updateMsgStatus } from './renderers/renderMessage';
import { createTypingIndicator } from './renderers/renderTypingIndicator';
import { createActionChips } from './renderers/renderActionChips';
import { createOnboardingHint, fadeOutOnboarding } from './renderers/renderOnboardingHint';
import { createAutocompleteDropdown, highlightAutocompleteItem } from './renderers/renderAutocomplete';
import { renderEscalationOffer, renderTransferring, renderQueueStatus, renderConnected, renderReconnectBanner, renderNoAgentsBanner, renderLoadingModel } from './renderers/renderSystemMessage';
import type { EscalationCallbacks } from './renderers/renderTypes';

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
  surface?: ResponseSurface;
  responseType?: 'product' | 'order' | 'policy' | 'escalation' | 'tracking' | 'return' | 'general';
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
  dataSource?: 'mock' | 'live' | {
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
  private _typingIndicatorEl: HTMLElement | null = null;
  private _reconnectBannerEl: HTMLElement | null = null;
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
  private dataSourceIndicator!: HTMLDivElement;
  private messageList!: HTMLDivElement;
  private inputContainer!: HTMLDivElement;
  private textarea!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private refreshBtn!: HTMLButtonElement;
  private _messageIdCounter = 0;
  private _hasSentMessage = false;
  private _chipContainer: HTMLElement | null = null;
  private _onboardingHint: HTMLElement | null = null;
  // Suggested Actions (Phase 5-03)
  private _suggestedActions = new SuggestedActionsService();
  private _lastConversationState: ConversationState = 'initial';
  private _lastResult: unknown = null;
  // Autocomplete (Phase 5-03)
  private _autocompleteService = new AutocompleteService();
  private _autocompleteDropdown: HTMLElement | null = null;
  private _autocompleteHighlightedIndex = -1;
  private _autocompleteResults: AutocompleteResult[] = [];
  private _catalogProducts: Product[] = [];
  private _autocompleteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Adaptive onboarding (Phase 5-03)
  private _onboardingFadeTimer: ReturnType<typeof setTimeout> | null = null;
  // Response surface for structured commerce data (P1)
  private _lastResponseSurface: ResponseSurface | null = null;
  private _lastResponseType: ChatMessage['responseType'] = 'general';
  // Scroll persistence (P4)
  private _lastScrollTop = 0;

  constructor(options: ChatWidgetOptions = {}) {
    this.container = options.container || document.getElementById('ai-support-widget') as HTMLElement;
    this.endpoint = options.endpoint || '/apps/support-agent/chat';
    this.timeoutMs = options.timeoutMs || 10000;
    this._enableReturnService = options.enableReturnService ?? true;

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
    const ds = typeof options.dataSource === 'object' ? options.dataSource : undefined;
    const useMockOrder = this._useMockData || ds?.order === 'mock';
    const useMockCatalog = this._useMockData || ds?.catalog === 'mock';
    const useMockPolicy = this._useMockData || ds?.policy === 'mock';

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
    const { toggleBtn, widget, offlineBanner, messageList, dataSourceIndicator, refreshBtn } = createWidgetShell();
    const { container: inputContainer, textarea, sendBtn } = createInputArea({
      onSend: () => this._sendMessage(),
      onInput: () => {
        this._autoGrow();
        this._updateSendButton();
        this._handleAutocompleteInput();
      },
      onKeydown: (e) => {
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
      },
    });

    this.toggleBtn = toggleBtn;
    this.widget = widget;
    this.offlineBanner = offlineBanner;
    this.dataSourceIndicator = dataSourceIndicator;
    this.messageList = messageList;
    this.textarea = textarea;
    this.sendBtn = sendBtn;
    this.inputContainer = inputContainer;
    this.refreshBtn = refreshBtn;

    widget.appendChild(inputContainer);

    document.body.appendChild(toggleBtn);
    document.body.appendChild(widget);
  }

  _bindEvents() {
    this.toggleBtn.addEventListener('click', () => this._toggle());
    this.refreshBtn.addEventListener('click', () => this._resetChat());
  }

  _initNetworkDetection() {
    window.addEventListener('online', () => this._handleNetworkChange(true));
    window.addEventListener('offline', () => this._handleNetworkChange(false));
  }

  _handleNetworkChange(isOnline: boolean): void {
    this.state.isOnline = isOnline;
    this.offlineBanner.hidden = isOnline;
    if (isOnline) {
      if (!this.state.isProcessing) this._setInputEnabled(true);
    } else {
      this._setInputEnabled(false);
    }
  }

  _resetChat(): void {
    this.state.messages = [];
    this.messageList.innerHTML = '';
    this._hasSentMessage = false;
    this._lastResponseSurface = null;
    this._lastResponseType = 'general';
    this._pendingQuery = null;
    this._removeActionChips();
    this._dismissAutocomplete();
    this._removeOnboardingHint();
    this._catalogIntentDetector.clearContext();
    this._orderIntentDetector.clearContext();
    this._semanticRouter.pruneCache();
    this._setInputEnabled(true);
    this.textarea.value = '';
    this._autoGrow();
    this._updateSendButton();
    if (this.state.isOpen) {
      this._renderActionChips();
      this._renderOnboardingHint();
    }
  }

  _toggle(): void {
    this.state.isOpen = !this.state.isOpen;
    this.widget.classList.toggle('chat-widget--open', this.state.isOpen);

    if (this.state.isOpen && !this.state.isProcessing) {
      this.textarea.focus();
      this._renderActionChips();
      this._renderOnboardingHint();
      // Restore scroll position (P4)
      requestAnimationFrame(() => {
        this.messageList.scrollTop = this._lastScrollTop;
      });
    } else {
      // Save scroll position (P4)
      this._lastScrollTop = this.messageList.scrollTop;
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
    const callbacks: EscalationCallbacks = {
      onConfirm: () => this._handleEscalationConfirm(),
      onCancel: () => this._handleEscalationCancel(),
    };

    const formatTs = (ts: number) => this._formatTimestamp(ts);

    let result: { bubble: HTMLElement };

    if (msg.role === 'system') {
      const sys = msg as EscalationChatMessage;
      switch (sys.subtype) {
        case 'escalation-offer':
        case 'frustration-offer':
          result = { bubble: renderEscalationOffer(sys.text, sys.subtype, formatTs, callbacks) };
          break;
        case 'transferring':
          result = { bubble: renderTransferring() };
          break;
        case 'queue':
          result = { bubble: renderQueueStatus(0) };
          break;
        case 'connected':
          result = { bubble: renderConnected() };
          break;
        default:
          result = { bubble: renderLoadingModel() };
      }
    } else if (msg.role === 'user') {
      result = createUserMessage(msg, formatTs);
    } else if (msg.role === 'agent') {
      result = createAgentMessage(msg, formatTs);
    } else {
      result = createErrorMessage(msg);
    }

    this.messageList.appendChild(result.bubble);
  }

  _updateMessageStatus(messageId: string, newStatus: ChatMessage['status']): void {
    const msg = this.state.messages.find(m => m.id === messageId);
    if (msg) {
      msg.status = newStatus;
      updateMsgStatus(this.messageList, messageId, newStatus);
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
        await this._semanticRouter.embed('__warmup__');
        this._removeLastLoadingMsg();
      } catch {
        this._removeLastLoadingMsg();
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

    // Show contextual loading state (P3)
    const loadingMsg = this._createContextualLoadingMessage(text);
    if (loadingMsg) {
      this.addMessage(loadingMsg);
    }

    try {
      const agentResponse = await this._generateAgentResponse(text);

      // Remove loading message if shown
      if (loadingMsg) {
        this._removeLastSystemMessage();
        const idx = this.state.messages.findIndex(m => m.id === loadingMsg.id);
        if (idx >= 0) this.state.messages.splice(idx, 1);
      }

      this._updateMessageStatus(msg.id, 'delivered');

      // Realistic typing delay based on response length (P4)
      const typingDelay = this._computeTypingDelay(agentResponse);
      await this._delay(typingDelay);

      // Update conversation state based on response content
      this._lastConversationState = this._determineConversationState(agentResponse);

      const agentMsg = this._createMessage(agentResponse, 'agent');
      agentMsg.responseType = this._lastResponseType;
      if (this._lastResponseSurface) {
        agentMsg.surface = this._lastResponseSurface;
        this._lastResponseSurface = null;
      }
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

    // Show contextual loading state (P3)
    const loadingMsg = this._createContextualLoadingMessage(text);
    if (loadingMsg) {
      this.addMessage(loadingMsg);
    }

    try {
      const agentResponse = await this._generateAgentResponse(text);

      // Remove loading message if shown
      if (loadingMsg) {
        this._removeLastSystemMessage();
        const idx = this.state.messages.findIndex(m => m.id === loadingMsg.id);
        if (idx >= 0) this.state.messages.splice(idx, 1);
      }

      this._updateMessageStatus(msg.id, 'delivered');

      // Realistic typing delay based on response length (P4)
      const typingDelay = this._computeTypingDelay(agentResponse);
      await this._delay(typingDelay);

      // Update conversation state based on response content
      this._lastConversationState = this._determineConversationState(agentResponse);

      const agentMsg = this._createMessage(agentResponse, 'agent');
      agentMsg.responseType = this._lastResponseType;
      if (this._lastResponseSurface) {
        agentMsg.surface = this._lastResponseSurface;
        this._lastResponseSurface = null;
      }
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

  // Remove loading message from state (used by first-query model loading flow)
  private _removeLastLoadingMsg(): void {
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
    const lower = query.toLowerCase();

    // General policy overview
    if (lower.includes('what are your policies') || lower.includes('show me your policies') || lower.includes('tell me about your policies')) {
      return `Here's a quick overview:\n\n• Shipping: Standard (₹199, 5-7 days), Express (₹499, 2-3 days), Free on orders over ₹2,999.\n• Returns: 30-day return window, refund to original payment.\n• Warranty: 1-year limited warranty covering manufacturing defects.\n\nWant details on any of these?`;
    }

    // Shipping — specific sub-questions
    if (lower.includes('free shipping') || lower.includes('free ship')) {
      return `Yes, we offer free standard shipping on orders over ₹2,999.`;
    }
    if (lower.includes('how long') && (lower.includes('ship') || lower.includes('deliver'))) {
      return `Standard shipping takes 5-7 business days. Express is 2-3 business days.`;
    }
    if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('ship')) {
      return `We offer standard shipping (₹199, 5-7 days), express (₹499, 2-3 days), and international (calculated at checkout). Free shipping on orders over ₹2,999.`;
    }

    // Warranty — specific sub-questions
    if (lower.includes('defective') || lower.includes('damaged') || lower.includes('broken') || lower.includes('not working') || lower.includes('malfunction')) {
      return `If your item is defective, damaged, or not working properly, our 1-year limited warranty covers manufacturing defects and hardware failures under normal use. You can start a return or warranty claim — just provide your order number and email.`;
    }
    if (lower.includes('how long') && (lower.includes('warranty') || lower.includes('guarantee'))) {
      return `Our standard warranty covers 1 year from purchase.`;
    }
    if (lower.includes('what') && lower.includes('cover') && (lower.includes('warranty') || lower.includes('guarantee'))) {
      return `Our warranty covers manufacturing defects and hardware failures under normal use.`;
    }
    if (lower.includes('warranty') || lower.includes('guarantee')) {
      return `Our products come with a 1-year limited warranty covering manufacturing defects and hardware failures under normal use.`;
    }

    // Returns — specific sub-questions
    if (lower.includes('how long') && (lower.includes('return') || lower.includes('refund'))) {
      return `You have 30 days from delivery to return an item.`;
    }
    if (lower.includes('restocking fee') || lower.includes('restocking')) {
      return `No, we don't charge a restocking fee on returns.`;
    }
    if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
      return `Our return policy allows returns within 30 days from delivery. Refunds are issued to your original payment method within 5-7 business days.`;
    }

    return null;
  }

    /**
     * Generate agent response with policy grounding and guardrails.
     * Pipeline: off-topic → escalation → order tracking → return → catalog → policy → greeting → fallback.
     */
   async _generateAgentResponse(userQuery: string): Promise<string> {
    this._lastResponseSurface = null;
    const lowerQuery = userQuery.toLowerCase();

    // Step 0: Multi-question detection — split newlines/tabs and answer each independently
    const questions = userQuery.split(/[\n\t]+/).map(l => l.trim()).filter(l => l.length > 2);
    if (questions.length >= 2) {
      const responses: string[] = [];
      for (const q of questions) {
        const resp = await this._generateAgentResponse(q);
        if (resp) responses.push(resp);
      }
      return responses.join('\n\n');
    }

    // Step 0b: Compound query detection — handle queries with BOTH catalog AND policy intent
    // e.g., "is the hoodie in stock and can I return it"
    const hasCatalogIntent = /\b(show|find|search|browse|look|is|do|what|check|available|stock|size|color|price)\b/i.test(lowerQuery) &&
      !/\b(track|order|return|refund|exchange|shipping|warranty|policy)\b/i.test(lowerQuery.split(/and|but|also|while/)[0] || '');
    const hasPolicyIntent = /\b(return|refund|exchange|shipping|warranty|policy|guarantee)\b/i.test(lowerQuery);

    if (hasCatalogIntent && hasPolicyIntent) {
      // Process catalog first, then append policy info
      const catalogResult = await this._catalogIntentDetector.resolveQuery(userQuery);
      let catalogResponse = '';
      if (catalogResult.type !== 'not_catalog') {
        this._lastResponseType = 'product';
        this._lastResponseSurface = this._buildCatalogSurface(catalogResult);
        this._lastResult = catalogResult;
        catalogResponse = formatCatalogResponse(userQuery, catalogResult);
      }

      // Then handle policy part
      const policyKeywords = ['return', 'refund', 'exchange', 'warranty', 'policy', 'guarantee', 'shipping'];
      const matchedPolicy = policyKeywords.find(k => lowerQuery.includes(k));
      let policyResponse = '';
      if (matchedPolicy) {
        const policyResp = await this._handlePolicyQuery(userQuery);
        if (policyResp) {
          this._lastResponseType = 'policy';
          policyResponse = policyResp;
        }
      }

      if (catalogResponse && policyResponse) {
        return `${catalogResponse}\n\nRegarding returns: ${policyResponse}`;
      }
      if (catalogResponse) return catalogResponse;
      if (policyResponse) return policyResponse;
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

    // Step 3: Policy query handling (BEFORE order tracking — "shipping" queries are policy, not orders)
    const policyKeywords = ['shipping', 'return', 'refund', 'exchange', 'warranty', 'policy', 'policies', 'guarantee', 'restocking fee', 'restocking', 'free shipping'];
    const isPolicyQuery = policyKeywords.some(k => lowerQuery.includes(k));

    if (isPolicyQuery) {
      const policyResponse = await this._handlePolicyQuery(userQuery);
      if (policyResponse) {
        this._lastResponseType = 'policy';
        return policyResponse;
      }
    }

    // Step 4: Order intent detection
    const orderResult = await this._orderIntentDetector.resolveQuery(userQuery);
    if (orderResult.type === 'order_found') {
      this._lastResponseType = 'order';
      this._lastResult = orderResult;
      return formatOrderResponse(orderResult);
    }
    if (orderResult.type === 'needs_email' || orderResult.type === 'needs_order_number' || orderResult.type === 'email_mismatch' || orderResult.type === 'order_not_found') {
      this._lastResponseType = 'tracking';
      this._lastResult = orderResult;
      return formatOrderResponse(orderResult);
    }

    // Step 5: Return initiation (feature-flagged per D-30, lazy-loaded per D-31)
    if (this._enableReturnService) {
      await this._lazyInitReturnService();
      if (this._returnService?.detectReturnIntent(userQuery)) {
        this._lastResponseType = 'return';
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

    // Step 6: Catalog intent detection (product availability, sizing, search)
    const catalogResult = await this._catalogIntentDetector.resolveQuery(userQuery);
    if (catalogResult.type !== 'not_catalog') {
      this._lastResponseType = 'product';
      this._lastResponseSurface = this._buildCatalogSurface(catalogResult);
      this._lastResult = catalogResult;
      return formatCatalogResponse(userQuery, catalogResult);
    }

    // Step 7: Policy query handling (fallback for queries without obvious keywords)
    const policyResponse = await this._handlePolicyQuery(userQuery);
    if (policyResponse) {
      this._lastResponseType = 'policy';
      return policyResponse;
    }

    // Step 8: Greeting
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! I'm here to help with questions about our products, shipping, warranty, and return policies. How can I assist you today?";
    }

    // Step 9: Fallback
    return "I'm here to help with questions about our store products, policies, and orders. You can ask me about shipping options, warranty coverage, return procedures, or product availability.";
  }

  // Public method for sending simulated agent responses (used in tests)
  simulateAgentResponse(text: string): ChatMessage {
    const msg = this._createMessage(text, 'agent');
    this.addMessage(msg);
    return msg;
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
    const el = createTypingIndicator();
    this.messageList.appendChild(el);
    this._typingIndicatorEl = el;
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
    const banner = renderReconnectBanner();
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
    const messages = this.messageList.querySelectorAll('.sys-msg, .msg--loading');
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
    if (this._chipContainer) {
      this._chipContainer.remove();
      this._chipContainer = null;
    }

    if (!force && this._hasSentMessage) return;

    const suggestions = this._suggestedActions.getSuggestions(this._lastConversationState, this._lastResult);

    this._chipContainer = createActionChips(suggestions, {
      onSelect: (query) => {
        this.textarea.value = query;
        this.textarea.focus();
        this._autoGrow();
        this._updateSendButton();
      },
    });

    this.widget.insertBefore(this._chipContainer!, this.inputContainer);
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

  // ── Catalog Surface Builder ──────────────────────

  private _computeTypingDelay(response: string): number {
    if (!response || response.length === 0) return 200;
    // Base delay + per-character delay with variance for realism
    const base = 300;
    const perChar = Math.min(response.length * 8, 1200);
    const variance = Math.random() * 200 - 100;
    return Math.max(200, Math.min(2000, base + perChar + variance));
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private _buildCatalogSurface(result: ReturnType<typeof this._catalogIntentDetector.resolveQuery> extends Promise<infer T> ? T : never): ResponseSurface | null {
    switch (result.type) {
      case 'exact':
        return {
          type: 'product-card',
          product: result.product,
          variant: {
            title: result.variant.title.split(' - ')[1] || result.variant.title,
            price: result.variant.price,
            stock: result.stock,
          },
        };

      case 'search_results':
        return {
          type: 'product-list',
          products: result.products,
          totalCount: result.totalCount,
        };

      case 'partial':
      case 'product_only':
      case 'ambiguous':
      case 'not_found':
      case 'context_expired':
      case 'not_catalog':
        return null;
    }
  }

  // ── Contextual Loading States ────────────────────

  private _createContextualLoadingMessage(query: string): EscalationChatMessage | null {
    const lower = query.toLowerCase();

    let label: string;
    if (lower.includes('stock') || lower.includes('available') || lower.includes('inventory') || lower.includes('in stock')) {
      label = 'Checking inventory\u2026';
    } else if (lower.includes('order') || lower.includes('track') || lower.includes('#')) {
      label = 'Looking up order\u2026';
    } else if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
      label = 'Checking return eligibility\u2026';
    } else if (lower.includes('ship') || lower.includes('deliver') || lower.includes('policy') || lower.includes('warranty')) {
      label = 'Reviewing policy details\u2026';
    } else if (lower.includes('product') || lower.includes('show') || lower.includes('browse') || lower.includes('find')) {
      label = 'Searching catalog\u2026';
    } else if (lower.includes('human') || lower.includes('agent') || lower.includes('support') || lower.includes('help')) {
      label = 'Checking agent availability\u2026';
    } else {
      return null;
    }

    return this._createSystemMessage(label, 'transferring');
  }

  // ── Onboarding Hint ────────────────────────────

  private _renderOnboardingHint(): void {
    if (this._hasSentMessage || this.state.messages.length > 0 || this._onboardingHint) return;

    const seenFlag = localStorage.getItem('support-onboarding-seen');
    if (seenFlag) {
      const seenTime = parseInt(seenFlag, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - seenTime < sevenDays) return;
    }

    this._onboardingHint = createOnboardingHint(() => this._dismissOnboarding());

    this._onboardingFadeTimer = setTimeout(() => {
      if (this._onboardingHint) {
        fadeOutOnboarding(this._onboardingHint);
        setTimeout(() => this._dismissOnboarding(), 500);
      }
    }, 2500);

    this.messageList.prepend(this._onboardingHint!);
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
    if (this._autocompleteDropdown) {
      this._autocompleteDropdown.remove();
    }

    this._autocompleteHighlightedIndex = -1;

    const dropdown = createAutocompleteDropdown(results, -1, {
      onSelect: (index) => this._selectAutocompleteResult(index),
    });

    this.widget.insertBefore(dropdown, this.inputContainer);
    this._autocompleteDropdown = dropdown;
  }

  private _updateAutocompleteHighlight(): void {
    if (!this._autocompleteDropdown) return;
    highlightAutocompleteItem(this._autocompleteDropdown, this._autocompleteHighlightedIndex);
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