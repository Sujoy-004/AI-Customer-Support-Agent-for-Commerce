export function createOnboardingHint(onDismiss: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'onboarding-hint';

  const text = document.createElement('p');
  text.className = 'onboarding-text';
  text.textContent = 'Try asking about products, tracking orders, or checking policies. Type naturally — I understand typos.';

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'onboarding-dismiss';
  dismissBtn.textContent = '\u00d7';
  dismissBtn.setAttribute('aria-label', 'Dismiss hint');
  dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onDismiss();
  });

  el.appendChild(text);
  el.appendChild(dismissBtn);

  return el;
}

export function fadeOutOnboarding(el: HTMLElement): void {
  el.classList.add('onboarding-hint--fading');
}
