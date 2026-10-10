import {
  INITIAL_PAGE_SCRIPT,
  ICP_PLUS_URL,
} from '../scripts/cita-previa/initialPage';

export {ICP_PLUS_URL} from '../scripts/cita-previa/initialPage';

export type WebViewInjectionMatch =
  | {
      type: 'exact';
      value: string;
    }
  | {
      type: 'prefix';
      value: string;
    }
  | {
      type: 'host';
      value: string;
    }
  | {
      type: 'regex';
      value: RegExp;
    };

export interface WebViewInjectionRule {
  id: string;
  match: WebViewInjectionMatch;
  script: string;
  ready?: {
    selector: string;
    allSelectors?: string[];
    timeoutMs?: number;
    injectOnTimeout?: boolean;
  };
  reinjectOnLoadEnd?: boolean;
}

export const webViewInjectionRules: WebViewInjectionRule[] = [
  {
    id: 'icp-plus-home',
    match: {
      type: 'exact',
      value: ICP_PLUS_URL,
    },
    script: INITIAL_PAGE_SCRIPT,
  },
];

const tryParseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

export const matchesWebViewInjectionRule = (
  currentUrl: string,
  rule: WebViewInjectionRule,
) => {
  switch (rule.match.type) {
    case 'exact':
      return currentUrl === rule.match.value;
    case 'prefix':
      return currentUrl.startsWith(rule.match.value);
    case 'host': {
      const parsedUrl = tryParseUrl(currentUrl);
      const parsedRuleUrl = tryParseUrl(rule.match.value);

      if (parsedRuleUrl) {
        return parsedUrl?.hostname === parsedRuleUrl.hostname;
      }

      return parsedUrl?.hostname === rule.match.value;
    }
    case 'regex':
      return rule.match.value.test(currentUrl);
    default:
      return false;
  }
};

const getMatchSpecificity = (rule: WebViewInjectionRule): number => {
  switch (rule.match.type) {
    case 'exact':
      return 1000 + rule.match.value.length;
    case 'prefix':
      return 500 + rule.match.value.length;
    case 'regex':
      return 400;
    case 'host':
      return 100;
    default:
      return 0;
  }
};

export const resolveWebViewInjectionRule = (
  currentUrl: string | null | undefined,
  rules: WebViewInjectionRule[] = webViewInjectionRules,
) => {
  if (!currentUrl) {
    return null;
  }

  return (
    rules
      .filter(rule => matchesWebViewInjectionRule(currentUrl, rule))
      .sort(
        (left, right) => getMatchSpecificity(right) - getMatchSpecificity(left),
      )[0] ?? null
  );
};

export const resolveInjectedJavaScript = (
  currentUrl: string | null | undefined,
  rules: WebViewInjectionRule[] = webViewInjectionRules,
) => resolveWebViewInjectionRule(currentUrl, rules)?.script ?? null;
