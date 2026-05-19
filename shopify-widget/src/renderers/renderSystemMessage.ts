import type { TimestampFormatter, EscalationCallbacks } from './renderTypes';

export function renderEscalationOffer(
  text: string,
  subtype: string,
  _formatTs: TimestampFormatter,
  callbacks: EscalationCallbacks
): HTMLElement {
  const isFrustration = subtype === 'frustration-offer';
  const bubble = document.createElement('div');
  bubble.className = `sys-msg sys-msg--offer${isFrustration ? ' sys-msg--frustration' : ''}`;

  const header = document.createElement('div');
  header.className = 'msg-header';

  const role = document.createElement('span');
  role.className = 'msg-role';
  role.innerHTML = '<span class="msg-role-dot"></span> Support';

  const time = document.createElement('time');
  time.className = 'msg-time';

  header.appendChild(role);
  header.appendChild(time);

  const content = document.createElement('div');
  content.className = 'msg-content';
  content.textContent = text;

  const actions = document.createElement('div');
  actions.className = 'sys-actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'sys-btn sys-btn--confirm';
  confirmBtn.textContent = isFrustration ? 'Yes, connect me' : 'Connect to agent';
  confirmBtn.addEventListener('click', callbacks.onConfirm);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'sys-btn sys-btn--ghost';
  cancelBtn.textContent = isFrustration ? "I'll keep trying" : 'Not now';
  cancelBtn.addEventListener('click', callbacks.onCancel);

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);

  bubble.appendChild(header);
  bubble.appendChild(content);
  bubble.appendChild(actions);

  return bubble;
}

export function renderTransferring(): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = 'sys-msg sys-msg--transfer';

  const content = document.createElement('div');
  content.className = 'sys-msg-transfer-content';

  const label = document.createElement('span');
  label.className = 'sys-msg-transfer-label';
  label.textContent = 'Connecting you to a specialist';

  const dots = document.createElement('span');
  dots.className = 'sys-msg-transfer-dots';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'sys-dot-pulse';
    dots.appendChild(dot);
  }

  content.appendChild(label);
  content.appendChild(dots);
  bubble.appendChild(content);

  return bubble;
}

export function renderQueueStatus(position: number): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = 'sys-msg sys-msg--queue';

  const row = document.createElement('div');
  row.className = 'sys-queue-row';

  const pulse = document.createElement('span');
  pulse.className = 'sys-queue-pulse';

  const posEl = document.createElement('span');
  posEl.className = 'sys-queue-position';
  posEl.textContent = `#${position} in queue`;

  row.appendChild(pulse);
  row.appendChild(posEl);

  const label = document.createElement('div');
  label.className = 'sys-queue-label';
  label.textContent = 'An agent will be with you shortly';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'sys-btn sys-btn--text';
  cancelBtn.textContent = 'Cancel escalation';

  bubble.appendChild(row);
  bubble.appendChild(label);
  bubble.appendChild(cancelBtn);

  return bubble;
}

export function renderConnected(): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = 'sys-msg sys-msg--connected';

  const statusDot = document.createElement('span');
  statusDot.className = 'sys-connected-dot';

  const label = document.createElement('span');
  label.className = 'sys-connected-label';
  label.textContent = 'Connected with human agent';

  bubble.appendChild(statusDot);
  bubble.appendChild(label);

  return bubble;
}

export function renderReconnectBanner(): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'sys-banner sys-banner--reconnect';
  banner.textContent = 'Reconnecting to agent...';
  return banner;
}

export function renderNoAgentsBanner(): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'sys-banner sys-banner--no-agents';
  banner.textContent = 'No agents currently online';
  return banner;
}

export function renderLoadingModel(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'sys-msg sys-msg--loading';

  const spinner = document.createElement('span');
  spinner.className = 'sys-loading-spinner';

  const label = document.createElement('span');
  label.className = 'sys-loading-label';
  label.textContent = 'Loading AI model';

  el.appendChild(spinner);
  el.appendChild(label);

  return el;
}
