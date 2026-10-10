import {Platform} from 'react-native';

export const SEDE_ORIGIN = 'https://sede.administracionespublicas.gob.es';

const ANDROID_CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const IOS_SAFARI_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/** Real mobile browser UA for the current platform. */
export const getWebViewUserAgent = () =>
  Platform.OS === 'android' ? ANDROID_CHROME_USER_AGENT : IOS_SAFARI_USER_AGENT;

/**
 * Cita Previa: use plain URI on first load — extra headers often trigger sede WAF 403 in WebView.
 * After the gateway #submit redirect, cookies carry the session to ICP.
 */
export const buildCitaPreviaWebViewSource = (url: string) => ({
  uri: url,
});

export const buildEmpadronamientoWebViewSource = (url: string) => ({
  uri: url,
  headers: {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  },
});

export const buildModelo790WebViewSource = (url: string) => ({
  uri: url,
});
