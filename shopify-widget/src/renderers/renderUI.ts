export interface WidgetShellElements {
  toggleBtn: HTMLButtonElement;
  widget: HTMLDivElement;
  offlineBanner: HTMLDivElement;
  messageList: HTMLDivElement;
  dataSourceIndicator: HTMLDivElement;
}

export function createWidgetShell(): WidgetShellElements {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'chat-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle support chat');
  toggleBtn.innerHTML = `
    <svg class="chat-toggle-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 10.65 1.98 12.18 2.82 13.44L1.5 16.5L4.56 15.18C5.82 16.02 7.35 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5Z" fill="currentColor"/>
      <path d="M6 7.5H12M6 10.5H9.75" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    <span>Chat</span>
  `;

  const widget = document.createElement('div');
  widget.className = 'chat-widget';
  widget.setAttribute('role', 'dialog');
  widget.setAttribute('aria-label', 'Customer Support Chat');

  const dataSourceIndicator = document.createElement('div');
  dataSourceIndicator.className = 'data-source-indicator';
  dataSourceIndicator.innerHTML = `
    <span class="dsi-dot"></span>
    <span class="dsi-label">Connected to store</span>
  `;

  const offlineBanner = document.createElement('div');
  offlineBanner.className = 'offline-banner';
  offlineBanner.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
      <path d="M7 4V7.5M7 9.5V9.51" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    <span>Connection lost. Messages will send when you're back online.</span>
  `;
  offlineBanner.hidden = true;

  const messageList = document.createElement('div');
  messageList.className = 'message-list';

  widget.appendChild(dataSourceIndicator);
  widget.appendChild(offlineBanner);
  widget.appendChild(messageList);

  return { toggleBtn, widget, offlineBanner, messageList, dataSourceIndicator };
}
