import {ComponentProps, RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {RouteProp, useNavigation} from '@react-navigation/native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

import {useAuth} from '@/contexts/AuthContext';
import {BookingAssistantId} from '@/features/home/types/TieStepDetail';
import {fetchUserProgress, updateRequirementProgress} from '@/features/dashboard/services/progressService';
import {saveGeneratedPdfBase64, openGeneratedPdf} from '@/features/pdfGeneration/services/pdfFileService';
import {getProfile, loadBookingAssistantInjectionProfiles} from '@/features/profile/services/profileService';
import {RootStackParamList} from '@/navigation/types';
import {
  emptyCitaPreviaBookingAssistantProfile,
  emptyEmpadronamientoBookingAssistantProfile,
} from '@/scripts/bookingAssistantProfile';
import {
  reportClientError,
  sanitizeUrlForReport,
  toNumericContextValue,
} from '@/services/clientErrorService';
import {
  buildCitaPreviaInjectionRules,
  CITA_PREVIA_START_URL,
} from '@/scripts/cita-previa';
import {
  buildEmpadronamientoInjectionRules,
  EMPADRONAMIENTO_HOME_URL,
} from '@/scripts/empadronamiento';
import {
  buildModelo790InjectionRules,
  MODELO_790_012_START_URL,
} from '@/scripts/modelo-790-012';
import {mapProfileToModelo790} from '@/scripts/modelo-790-012/mapProfile';
import {isModelo790Error, isModelo790Pdf, type AutomationWebViewError} from '@/scripts/modelo-790-012/messages';
import type {Modelo790AutomationProfile} from '@/scripts/modelo-790-012/config';
import {useWebViewInjection, type WebViewReadinessTimeoutPayload} from '@/webViewInjection/useWebViewInjection';
import {
  buildCitaPreviaWebViewSource,
  buildEmpadronamientoWebViewSource,
  buildModelo790WebViewSource,
} from '@/webViewInjection/webViewDefaults';

type WebsiteWebViewRoute = RouteProp<RootStackParamList, 'WebsiteWebView'>;

type WebViewHandle = React.ElementRef<typeof WebView>;
type WebViewProps = ComponentProps<typeof WebView>;

function isTrustedModelo790MessageUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'sede.policia.gob.es';
  } catch {
    return false;
  }
}

export type UseWebsiteWebViewScreenResult = {
  webViewRef: RefObject<WebViewHandle | null>;
  bookingAssistant: BookingAssistantId;
  webViewError: AutomationWebViewError | null;
  modelo790ShowWebView: boolean;
  startUrl: string;
  webViewSource: ReturnType<typeof buildCitaPreviaWebViewSource>;
  onLoadEnd: () => void;
  onNavigationStateChange: ReturnType<
    typeof useWebViewInjection
  >['onNavigationStateChange'];
  onMessage: (event: WebViewMessageEvent) => void;
  onError: NonNullable<WebViewProps['onError']>;
  onHttpError: NonNullable<WebViewProps['onHttpError']>;
};

export function useWebsiteWebViewScreen(
  route: WebsiteWebViewRoute,
): UseWebsiteWebViewScreenResult {
  const bookingAssistant = route.params?.bookingAssistant ?? 'cita-previa';
  const isModelo790 = route.params?.automation === 'modelo-790-012';
  const {user} = useAuth();
  const navigation = useNavigation();
  const [webViewError, setWebViewError] = useState<AutomationWebViewError | null>(null);
  const [modelo790ShowWebView, setModelo790ShowWebView] = useState(false);
  const [modelo790Profile, setModelo790Profile] = useState<Modelo790AutomationProfile | null>(null);
  const pdfInFlight = useRef(false);
  const webViewRef = useRef<WebViewHandle>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [empadronamientoProfile, setEmpadronamientoProfile] = useState(
    emptyEmpadronamientoBookingAssistantProfile,
  );
  const [citaPreviaProfile, setCitaPreviaProfile] = useState(
    emptyCitaPreviaBookingAssistantProfile,
  );

  useEffect(() => {
    if (!isModelo790) {return;}
    setModelo790ShowWebView(false);
    let cancelled = false;
    getProfile().then(profile => {
      if (cancelled) {return;}
      const mapped = mapProfileToModelo790(profile?.personal ?? null);
      if (!mapped) {
        setWebViewError({
          title: 'Modelo 790 profile incomplete',
          message: 'Please check your NIE, name, Spanish phone number and address in your profile before generating this form.',
        });
      } else {
        setModelo790Profile(mapped);
      }
    }).catch(() => {
      if (!cancelled) {
        setWebViewError({title: 'Profile unavailable', message: 'Could not load your profile. Please go back to the dashboard and try again.'});
      }
    });
    return () => {cancelled = true;};
  }, [isModelo790]);

  useEffect(() => {
    let cancelled = false;

    loadBookingAssistantInjectionProfiles(user?.email)
      .then(loaded => {
        if (cancelled) {
          return;
        }

        if (loaded?.empadronamiento) {
          setEmpadronamientoProfile(loaded.empadronamiento);
        }

        if (loaded?.citaPrevia) {
          setCitaPreviaProfile(loaded.citaPrevia);
        }

        setProfileLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const startUrl =
    route.params?.url ??
    (isModelo790 ? MODELO_790_012_START_URL : bookingAssistant === 'empadronamiento'
      ? EMPADRONAMIENTO_HOME_URL
      : CITA_PREVIA_START_URL);

  const webViewSource = useMemo(
    () =>
      isModelo790 ? buildModelo790WebViewSource(startUrl) :
      bookingAssistant === 'empadronamiento'
        ? buildEmpadronamientoWebViewSource(startUrl)
        : buildCitaPreviaWebViewSource(startUrl),
    [bookingAssistant, isModelo790, startUrl],
  );

  const injectionRules = useMemo(
    () => {
      if (isModelo790) {
        return modelo790Profile ? buildModelo790InjectionRules(modelo790Profile) : [];
      }
      if (!profileLoaded) {
        return [];
      }

      return bookingAssistant === 'empadronamiento'
        ? buildEmpadronamientoInjectionRules(empadronamientoProfile)
        : buildCitaPreviaInjectionRules(citaPreviaProfile);
    },
    [
      bookingAssistant,
      citaPreviaProfile,
      empadronamientoProfile,
      isModelo790,
      modelo790Profile,
      profileLoaded,
    ],
  );

  const onReadinessTimeout = useCallback(
    (payload: WebViewReadinessTimeoutPayload) => {
      if (isModelo790) {
        setWebViewError({title: 'Modelo 790 timed out', message: 'The official form did not load. Please go back to the dashboard and try again.'});
      }
      reportClientError('WEBVIEW_INJECTION_TIMEOUT', {
        bookingAssistant,
        ruleId: payload.ruleId,
        url: sanitizeUrlForReport(payload.url),
        selector: payload.selector,
        timeoutMs: payload.timeoutMs,
      });
    },
    [bookingAssistant, isModelo790],
  );

  const {
    handleMessage: handleInjectionMessage,
    onLoadEnd,
    onNavigationStateChange,
  } = useWebViewInjection(webViewRef, {
    initialUrl: startUrl,
    rules: injectionRules,
    onReadinessTimeout,
  });

  // The profile can decrypt after the first WebView load. Re-run readiness when rules appear.
  useEffect(() => {
    if (isModelo790 && modelo790Profile && webViewRef.current) {
      onLoadEnd();
    }
  }, [isModelo790, modelo790Profile, onLoadEnd]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (handleInjectionMessage(event.nativeEvent.data)) {
        return;
      }

      try {
        const message = JSON.parse(event.nativeEvent.data);

        if (isModelo790 && isModelo790Error(message)) {
          setWebViewError(message.payload);
          return;
        }
        if (isModelo790 && message.type === 'modelo-790-captcha-ready') {
          setModelo790ShowWebView(true);
          return;
        }
        if (isModelo790 && isModelo790Pdf(message)) {
          if (!isTrustedModelo790MessageUrl(event.nativeEvent.url)) {
            return;
          }
          if (pdfInFlight.current) {return;}
          pdfInFlight.current = true;
          const {base64, fileName} = message.payload;
          (async () => {
            try {
              const file = await saveGeneratedPdfBase64(base64, fileName);
              await openGeneratedPdf(file);
              const completion = route.params?.formCompletion;
              if (completion) {
                const progress = await fetchUserProgress();
                await updateRequirementProgress(progress, completion.stepId, completion.requirementKey, {
                  completed: true,
                  source: {type: 'form', formId: completion.formId, confirmedAt: new Date().toISOString()},
                });
              }
              navigation.goBack();
            } catch (error) {
              pdfInFlight.current = false;
              setWebViewError({
                title: 'Modelo 790 could not be saved',
                message: 'The PDF could not be saved or opened. Please go back to the dashboard and try again.',
                detail: error instanceof Error ? error.message : undefined,
              });
            }
          })();
          return;
        }
        if (message.type === 'debug') {
          console.debug('[WebView debug]', message.data);
        }
      } catch {
        // Ignore non-JSON messages from the page.
      }
    },
    [handleInjectionMessage, isModelo790, navigation, route.params?.formCompletion],
  );

  const onError = useCallback<NonNullable<WebViewProps['onError']>>(
    syntheticEvent => {
      console.warn('[WebView] Load error', {
        bookingAssistant,
        requestedUrl: startUrl,
        ...syntheticEvent.nativeEvent,
      });

      if (isModelo790) {
        setWebViewError({title: 'Official website could not be loaded', message: 'Please go back to the dashboard and try again later.'});
      }
      reportClientError('WEBVIEW_LOAD_FAILED', {
        bookingAssistant,
        url: sanitizeUrlForReport(
          syntheticEvent.nativeEvent.url ?? startUrl,
        ),
        code: toNumericContextValue(syntheticEvent.nativeEvent.code),
        description: syntheticEvent.nativeEvent.description?.slice(0, 200) ?? null,
      });
    },
    [bookingAssistant, isModelo790, startUrl],
  );

  const onHttpError = useCallback<NonNullable<WebViewProps['onHttpError']>>(
    syntheticEvent => {
      console.warn('[WebView] HTTP error', {
        bookingAssistant,
        requestedUrl: startUrl,
        ...syntheticEvent.nativeEvent,
      });

      if (isModelo790) {
        setWebViewError({title: 'Official website error', message: 'Please go back to the dashboard and try again later.', detail: `HTTP ${syntheticEvent.nativeEvent.statusCode}`});
      }
      reportClientError('WEBVIEW_HTTP_ERROR', {
        bookingAssistant,
        url: sanitizeUrlForReport(
          syntheticEvent.nativeEvent.url ?? startUrl,
        ),
        statusCode: toNumericContextValue(
          syntheticEvent.nativeEvent.statusCode,
        ),
      });
    },
    [bookingAssistant, isModelo790, startUrl],
  );

  return {
    webViewRef,
    bookingAssistant,
    webViewError,
    modelo790ShowWebView,
    startUrl,
    webViewSource,
    onLoadEnd,
    onNavigationStateChange,
    onMessage,
    onError,
    onHttpError,
  };
}
