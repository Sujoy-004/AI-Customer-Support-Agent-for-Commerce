export function createOnboardingHint(onDismiss: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'onboarding-hint';

  const title = document.createElement('p');
  title.className = 'onboarding-title';
  title.textContent = 'Store Support';

  const text = document.createElement('p');
  text.className = 'onboarding-text';
  text.textContent = 'Real-time product, order, and policy answers — powered by live store data.';

  const examples = document.createElement('div');
  examples.className = 'onboarding-examples';

  const exampleQueries = [
    '"Do you have blue pants in medium?"',
    '"Where\'s order #12345?"',
    '"What\'s your return policy?"',
  ];

  for (const query of exampleQueries) {
    const ex = document.createElement('span');
    ex.className = 'onboarding-example';
    ex.textContent = query;
    examples.appendChild(ex);
  }

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'onboarding-dismiss';
  dismissBtn.textContent = '\u00d7';
  dismissBtn.setAttribute('aria-label', 'Dismiss hint');
  dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onDismiss();
  });

  el.appendChild(title);
  el.appendChild(text);
  el.appendChild(examples);
  el.appendChild(dismissBtn);

  return el;
}

export function fadeOutOnboarding(el: HTMLElement): void {
  el.classList.add('onboarding-hint--fading');
}
