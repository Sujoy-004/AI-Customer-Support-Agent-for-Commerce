const MESSAGE_STATUS = {
  SENDING: 'sending',
  DELIVERED: 'delivered',
  ERROR: 'error',
};

export { MESSAGE_STATUS };

export class ChatWidget {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('ai-support-widget');
    this.endpoint = options.endpoint || '/apps/support-agent/chat';
    this.timeoutMs = options.timeoutMs || 10000;

    this.state = {
      isOpen: false,
      isOnline: navigator.onLine,
      isProcessing: false,
      messages: [],
    };

    this._messageIdCounter = 0;
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

  _handleNetworkChange(isOnline) {
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
      return;
    }

    this.setProcessing(true);
    this.textarea.value = '';

    const msg = this._createMessage(text, 'user', 'sending');
    this.addMessage(msg);

    try {
      await this._simulateApiCall(text);
      this._updateMessageStatus(msg.id, 'delivered');
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

  _simulateApiCall(text) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('timeout'));
      }, this.timeoutMs);

      // Stub: simulates a successful API call for Phase 1
      // In Phase 3+, this will be a real fetch to the Shopify proxy endpoint
      setTimeout(() => {
        clearTimeout(timeoutId);
        resolve();
      }, 500);
    });
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