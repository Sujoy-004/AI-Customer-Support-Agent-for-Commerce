export interface WidgetShellElements {
  toggleBtn: HTMLButtonElement;
  widget: HTMLDivElement;
  offlineBanner: HTMLDivElement;
  messageList: HTMLDivElement;
  dataSourceIndicator: HTMLDivElement;
  refreshBtn: HTMLButtonElement;
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

  const header = document.createElement('div');
  header.className = 'chat-header';

  const headerTitle = document.createElement('span');
  headerTitle.className = 'chat-header-title';
  headerTitle.textContent = 'Support';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'chat-refresh-btn';
  refreshBtn.setAttribute('aria-label', 'Refresh chat');
  refreshBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8C2 11.31 4.69 14 8 14C10.21 14 12.14 12.79 13.16 11M14 8C14 4.69 11.31 2 8 2C5.79 2 3.86 3.21 2.84 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M13.5 7.5V11H10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2.5 8.5V5H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  header.appendChild(headerTitle);
  header.appendChild(refreshBtn);

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

  widget.appendChild(header);
  widget.appendChild(dataSourceIndicator);
  widget.appendChild(offlineBanner);
  widget.appendChild(messageList);

  return { toggleBtn, widget, offlineBanner, messageList, dataSourceIndicator, refreshBtn };
}
