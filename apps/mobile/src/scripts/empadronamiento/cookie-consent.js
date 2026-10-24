const COOKIE_ACCEPT_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#didomi-notice-agree-button',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#tarteaucitronAllAllowed2',
  '[data-testid="uc-accept-all-button"]',
  '[data-cookiebanner="accept_button"]',
  'button[id*="accept"][id*="cookie" i]',
  'button[class*="accept"][class*="cookie" i]',
];

export const DISMISS_COOKIE_CONSENT_SCRIPT = `
  (function() {
    const cookieContextPattern = /cookie|cookies|galeta|galetes|privacitat/i;
    const acceptPattern = /accept all|acceptar tot|acceptar totes|accepta-les totes|d'acord|aceptar todo|aceptar todas/i;

    const dismissCookieConsent = () => {
      const directButton = document.querySelector(${JSON.stringify(
        COOKIE_ACCEPT_SELECTORS.join(', '),
      )});

      if (directButton) {
        directButton.click();
        return true;
      }

      const candidates = Array.from(
        document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'),
      );
      const contextualButton = candidates.find(element => {
        const label = String(
          element.textContent || element.value || element.getAttribute('aria-label') || '',
        ).trim();
        if (!acceptPattern.test(label)) {
          return false;
        }

        const context = element.closest(
          '[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [role="dialog"]',
        );
        return Boolean(context && cookieContextPattern.test(context.textContent || ''));
      });

      contextualButton?.click();
      return Boolean(contextualButton);
    };

    if (dismissCookieConsent()) {
      return;
    }

    const target = document.documentElement || document.body;
    if (!target || typeof MutationObserver === 'undefined') {
      return;
    }

    const observer = new MutationObserver(() => {
      if (dismissCookieConsent()) {
        observer.disconnect();
      }
    });
    observer.observe(target, {childList: true, subtree: true});
  })();
  true;
`;

export const withEmpadronamientoCookieConsent = script =>
  `${DISMISS_COOKIE_CONSENT_SCRIPT}\n${script}`;
