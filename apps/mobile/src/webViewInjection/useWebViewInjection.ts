import React from 'react';

import {
  resolveWebViewInjectionRule,
  WebViewInjectionRule,
} from './scriptRegistry';

export interface WebViewNavigationState {
  url?: string | null;
}

export interface WebViewInjectionHandle {
  injectJavaScript: (script: string) => void;
}

export interface WebViewReadinessTimeoutPayload {
  ruleId: string;
  url: string;
  selector: string;
  timeoutMs: number;
}

interface UseWebViewInjectionOptions {
  initialUrl?: string | null;
  rules?: WebViewInjectionRule[];
  onReadinessTimeout?: (payload: WebViewReadinessTimeoutPayload) => void;
}

interface WebViewInjectionInternalMessage {
  __webViewInjection: true;
  type: 'ready-state';
  payload: {
    ready: boolean;
    ruleId: string;
    url: string;
    selector: string;
  };
}

export interface UseWebViewInjectionResult {
  activeRule: WebViewInjectionRule | null;
  activeScript: string | null;
  currentUrl: string | null;
  handleMessage: (messageData: string) => boolean;
  onLoadEnd: () => void;
  onLoadStart: () => void;
  onNavigationStateChange: (state: WebViewNavigationState) => void;
}

const DEFAULT_READY_TIMEOUT_MS = 5000;

const buildRuleKey = (rule: WebViewInjectionRule, url: string) =>
  `${rule.id}::${url}`;

const buildReadyProbeScript = (rule: WebViewInjectionRule, url: string) => `
  (function() {
    var selector = ${JSON.stringify(rule.ready?.selector ?? '')};
    var allSelectors = ${JSON.stringify(rule.ready?.allSelectors ?? [])};
    var observer = null;

    function postReadyState() {
      try {
        var bridge = window.ReactNativeWebView;
        if (!bridge || typeof bridge.postMessage !== 'function') {
          return;
        }
        bridge.postMessage(JSON.stringify({
          __webViewInjection: true,
          type: 'ready-state',
          payload: {
            ready: true,
            ruleId: ${JSON.stringify(rule.id)},
            url: ${JSON.stringify(url)},
            selector: selector,
          },
        }));
      } catch (error) {}
    }

    function isReady() {
      if (!selector || !window.document.querySelector(selector)) {
        return false;
      }

      return allSelectors.every(function(requiredSelector) {
        return Boolean(window.document.querySelector(requiredSelector));
      });
    }

    function finishIfReady() {
      if (!isReady()) {
        return false;
      }

      if (observer) {
        observer.disconnect();
        observer = null;
      }
      postReadyState();
      return true;
    }

    if (finishIfReady()) {
      return;
    }

    var target = window.document.documentElement || window.document.body;
    if (!target || typeof MutationObserver === 'undefined') {
      return;
    }

    observer = new MutationObserver(finishIfReady);
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  })();
  true;
`;

const isWebViewInjectionInternalMessage = (
  value: unknown,
): value is WebViewInjectionInternalMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeMessage = value as Partial<WebViewInjectionInternalMessage>;
  return (
    maybeMessage.__webViewInjection === true &&
    maybeMessage.type === 'ready-state' &&
    typeof maybeMessage.payload?.ruleId === 'string' &&
    typeof maybeMessage.payload?.url === 'string' &&
    typeof maybeMessage.payload?.selector === 'string' &&
    typeof maybeMessage.payload?.ready === 'boolean'
  );
};

export const useWebViewInjection = (
  webViewRef: React.RefObject<WebViewInjectionHandle | null>,
  options: UseWebViewInjectionOptions = {},
): UseWebViewInjectionResult => {
  const {initialUrl = null, rules, onReadinessTimeout} = options;
  const [currentUrl, setCurrentUrl] = React.useState<string | null>(initialUrl);
  const currentUrlRef = React.useRef<string | null>(initialUrl);
  const lastInjectedRuleKeyRef = React.useRef<string | null>(null);
  const readinessTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingReadyRuleKeyRef = React.useRef<string | null>(null);
  const previousUrlForEffectRef = React.useRef<string | null>(initialUrl);

  const activeRule = resolveWebViewInjectionRule(currentUrl, rules);
  const activeScript = activeRule?.script ?? null;

  const clearReadinessTimer = React.useCallback(() => {
    if (readinessTimerRef.current) {
      clearTimeout(readinessTimerRef.current);
      readinessTimerRef.current = null;
    }
  }, []);

  const resetReadinessState = React.useCallback(() => {
    clearReadinessTimer();
    pendingReadyRuleKeyRef.current = null;
  }, [clearReadinessTimer]);

  const injectRuleScript = React.useCallback(
    (rule: WebViewInjectionRule, url: string) => {
      const ruleKey = buildRuleKey(rule, url);

      if (lastInjectedRuleKeyRef.current === ruleKey) {
        return true;
      }

      webViewRef.current?.injectJavaScript(rule.script);
      lastInjectedRuleKeyRef.current = ruleKey;
      resetReadinessState();
      console.debug('[WebViewInjection] Injected rule for URL', {
        url,
        ruleId: rule.id,
      });
      return true;
    },
    [resetReadinessState, webViewRef],
  );

  const beginReadinessObservation = React.useCallback(
    (rule: WebViewInjectionRule, url: string) => {
      const ready = rule.ready;

      if (!ready) {
        injectRuleScript(rule, url);
        return;
      }

      const ruleKey = buildRuleKey(rule, url);
      const timeoutMs = ready.timeoutMs ?? DEFAULT_READY_TIMEOUT_MS;
      const injectOnTimeout = ready.injectOnTimeout ?? true;

      pendingReadyRuleKeyRef.current = ruleKey;
      webViewRef.current?.injectJavaScript(buildReadyProbeScript(rule, url));
      clearReadinessTimer();
      readinessTimerRef.current = setTimeout(() => {
        if (pendingReadyRuleKeyRef.current !== ruleKey) {
          return;
        }

        if (!injectOnTimeout) {
          console.debug(
            '[WebViewInjection] Readiness timed out; skipping injection',
            {
              currentUrl: url,
              ruleId: rule.id,
              selector: ready.selector,
              timeoutMs,
            },
          );
          onReadinessTimeout?.({
            ruleId: rule.id,
            url,
            selector: ready.selector,
            timeoutMs,
          });
          pendingReadyRuleKeyRef.current = null;
          clearReadinessTimer();
          return;
        }

        console.debug(
          '[WebViewInjection] Readiness timed out; injecting anyway',
          {
            currentUrl: url,
            ruleId: rule.id,
            selector: ready.selector,
            timeoutMs,
          },
        );
        injectRuleScript(rule, url);
      }, timeoutMs);
    },
    [clearReadinessTimer, injectRuleScript, onReadinessTimeout, webViewRef],
  );

  const onNavigationStateChange = React.useCallback(
    ({url}: WebViewNavigationState) => {
      const nextUrl = url ?? null;
      const didUrlChange = nextUrl !== currentUrl;

      if (didUrlChange) {
        lastInjectedRuleKeyRef.current = null;
        resetReadinessState();
      }

      currentUrlRef.current = nextUrl;
      setCurrentUrl(nextUrl);
      console.debug('[WebViewInjection] Navigation state changed', {
        currentUrl: nextUrl,
        activeRuleId: resolveWebViewInjectionRule(nextUrl, rules)?.id ?? null,
      });
    },
    [currentUrl, resetReadinessState, rules],
  );

  const runInjectionForUrl = React.useCallback(
    (url: string | null) => {
      const activeRuleForUrl = resolveWebViewInjectionRule(url, rules);

      console.debug('[WebViewInjection] Run injection', {
        currentUrl: url,
        activeRuleId: activeRuleForUrl?.id ?? null,
      });

      if (!url || !activeRuleForUrl) {
        console.debug('[WebViewInjection] No matching rule for current URL', {
          currentUrl: url,
        });
        return;
      }

      const ruleKey = buildRuleKey(activeRuleForUrl, url);

      if (lastInjectedRuleKeyRef.current === ruleKey) {
        console.debug(
          '[WebViewInjection] Rule already injected for current URL',
          {
            currentUrl: url,
            ruleId: activeRuleForUrl.id,
          },
        );
        return;
      }

      if (pendingReadyRuleKeyRef.current === ruleKey) {
        console.debug('[WebViewInjection] Readiness observer already active', {
          currentUrl: url,
          ruleId: activeRuleForUrl.id,
        });
        return;
      }

      if (!activeRuleForUrl.ready) {
        injectRuleScript(activeRuleForUrl, url);
        return;
      }

      beginReadinessObservation(activeRuleForUrl, url);
    },
    [beginReadinessObservation, injectRuleScript, rules],
  );

  React.useEffect(() => {
    if (previousUrlForEffectRef.current === currentUrl) {
      return;
    }

    previousUrlForEffectRef.current = currentUrl;

    runInjectionForUrl(currentUrlRef.current);
  }, [currentUrl, runInjectionForUrl]);

  const onLoadEnd = React.useCallback(() => {
    const url = currentUrlRef.current;
    const activeRuleForUrl = resolveWebViewInjectionRule(url, rules);

    if (activeRuleForUrl?.reinjectOnLoadEnd) {
      lastInjectedRuleKeyRef.current = null;
      resetReadinessState();
    }

    console.debug('[WebViewInjection] Load end', {currentUrl: url});
    runInjectionForUrl(currentUrlRef.current);
  }, [resetReadinessState, runInjectionForUrl, rules]);

  const onLoadStart = React.useCallback(() => {
    const url = currentUrlRef.current;
    const activeRuleForUrl = resolveWebViewInjectionRule(url, rules);

    if (activeRuleForUrl?.reinjectOnLoadEnd) {
      lastInjectedRuleKeyRef.current = null;
      resetReadinessState();
    }
  }, [resetReadinessState, rules]);

  const handleMessage = React.useCallback(
    (messageData: string) => {
      let parsedMessage: unknown;

      try {
        parsedMessage = JSON.parse(messageData);
      } catch {
        return false;
      }

      if (!isWebViewInjectionInternalMessage(parsedMessage)) {
        return false;
      }

      const {payload} = parsedMessage;
      const pendingRuleKey = pendingReadyRuleKeyRef.current;
      const readyRule = rules?.find(rule => rule.id === payload.ruleId) ?? null;
      const injectionUrl = currentUrlRef.current ?? payload.url;
      const messageRuleKey = readyRule
        ? buildRuleKey(readyRule, injectionUrl)
        : null;

      if (
        !payload.ready ||
        !messageRuleKey ||
        pendingRuleKey !== messageRuleKey
      ) {
        return true;
      }

      if (!readyRule) {
        return true;
      }

      clearReadinessTimer();
      injectRuleScript(readyRule, injectionUrl);
      return true;
    },
    [clearReadinessTimer, injectRuleScript, rules],
  );

  React.useEffect(() => {
    currentUrlRef.current = initialUrl;
    setCurrentUrl(initialUrl);
  }, [initialUrl]);

  React.useEffect(() => {
    return () => {
      clearReadinessTimer();
    };
  }, [clearReadinessTimer]);

  return {
    activeRule,
    activeScript,
    currentUrl,
    handleMessage,
    onLoadEnd,
    onLoadStart,
    onNavigationStateChange,
  };
};
