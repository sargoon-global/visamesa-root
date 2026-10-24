import {ComponentProps, RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createStyleSheet, useStyles} from 'react-native-unistyles';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

import {useAuth} from '@/contexts/AuthContext';
import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  BookingAssistantId,
} from '@/features/home/types/TieStepDetail';
import type {BookingAssistantAppointmentSummary} from '@/features/dashboard/types/UserProgress';
import {
  fetchUserProgress,
  updateRequirementProgress,
} from '@/features/dashboard/services/progressService';
import {
  saveModelo790ReviewFile,
  setModelo790PendingReview,
} from '@/features/pdfGeneration/forms/modelo790/modelo790Storage';
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
  CONFIRM_EMPADRONAMIENTO_SUBMIT_SCRIPT,
  DOWNLOAD_EMPADRONAMIENTO_PDF_SCRIPT,
  EMPADRONAMIENTO_HOME_URL,
} from '@/scripts/empadronamiento';
import {
  isEmpadronamientoMessage,
  isEmpadronamientoPdf,
  type EmpadronamientoAppointmentDraft,
} from '@/scripts/empadronamiento/messages';
import {
  buildModelo790InjectionRules,
  buildModelo790ScriptStrings,
  MODELO_790_012_START_URL,
} from '@/scripts/modelo-790-012';
import {toModelo790} from '@/scripts/modelo-790-012/mapProfile';
import {
  parsePersonalInfo,
  parsePersonalInfoFieldNames,
} from '@/features/profile/utils/parsePersonalInfo';
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

const webViewScreenStylesheet = createStyleSheet(() => ({}));

function isTrustedOfficialMessageUrl(
  url: string | undefined,
  hostname: string,
): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && parsedUrl.hostname === hostname;
  } catch {
    return false;
  }
}

function isTrustedModelo790MessageUrl(url: string | undefined): boolean {
  return isTrustedOfficialMessageUrl(url, 'sede.policia.gob.es');
}

function isTrustedEmpadronamientoMessageUrl(
  url: string | undefined,
): boolean {
  return isTrustedOfficialMessageUrl(
    url,
    'seuelectronica.ajuntament.barcelona.cat',
  );
}

export type UseWebsiteWebViewScreenResult = {
  webViewRef: RefObject<WebViewHandle | null>;
  bookingAssistant: BookingAssistantId;
  webViewError: AutomationWebViewError | null;
  modelo790ShowWebView: boolean;
  modelo790PdfHandoff: boolean;
  empadronamientoRuleId: string | null;
  empadronamientoAppointment: EmpadronamientoAppointmentDraft;
  empadronamientoReviewReady: boolean;
  empadronamientoSubmitting: boolean;
  empadronamientoCompleted: boolean;
  empadronamientoPdfSaving: boolean;
  confirmEmpadronamientoAppointment: () => void;
  saveEmpadronamientoAppointmentPdf: () => void;
  bookingAssistantExitAllowedRef: RefObject<boolean>;
  goBackToDashboard: () => void;
  startUrl: string;
  webViewSource: ReturnType<typeof buildCitaPreviaWebViewSource>;
  onLoadEnd: () => void;
  onLoadStart: () => void;
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
  const isEmpadronamiento =
    !isModelo790 && bookingAssistant === 'empadronamiento';
  const {t} = useTranslation('common');
  const {theme} = useStyles(webViewScreenStylesheet);
  const modelo790ScriptStrings = useMemo(
    () =>
      buildModelo790ScriptStrings(t, {
        primary: theme.colors.primary,
        onPrimary: theme.colors.onPrimary,
        error: theme.colors.error,
        outline: theme.colors.outline,
        surface: theme.colors.surface,
      }),
    [
      t,
      theme.colors.error,
      theme.colors.onPrimary,
      theme.colors.outline,
      theme.colors.primary,
      theme.colors.surface,
    ],
  );
  const {user} = useAuth();
  const navigation = useNavigation();
  const [webViewError, setWebViewError] = useState<AutomationWebViewError | null>(null);
  const [modelo790ShowWebView, setModelo790ShowWebView] = useState(false);
  const [modelo790PdfHandoff, setModelo790PdfHandoff] = useState(false);
  const [modelo790Profile, setModelo790Profile] = useState<Modelo790AutomationProfile | null>(null);
  const [empadronamientoAppointment, setEmpadronamientoAppointment] =
    useState<EmpadronamientoAppointmentDraft>({});
  const [empadronamientoReviewReady, setEmpadronamientoReviewReady] =
    useState(false);
  const [empadronamientoSubmitting, setEmpadronamientoSubmitting] =
    useState(false);
  const [empadronamientoCompleted, setEmpadronamientoCompleted] =
    useState(false);
  const [empadronamientoPdfSaving, setEmpadronamientoPdfSaving] =
    useState(false);
  const pdfInFlight = useRef(false);
  const empadronamientoCompletionInFlight = useRef(false);
  const bookingAssistantExitAllowedRef = useRef(false);
  const modelo790CaptchaReadyRef = useRef(false);
  const webViewRef = useRef<WebViewHandle>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [empadronamientoProfile, setEmpadronamientoProfile] = useState(
    emptyEmpadronamientoBookingAssistantProfile,
  );
  const [citaPreviaProfile, setCitaPreviaProfile] = useState(
    emptyCitaPreviaBookingAssistantProfile,
  );

  useEffect(() => {
    if (!isEmpadronamiento) {
      return;
    }

    setEmpadronamientoAppointment({});
    setEmpadronamientoReviewReady(false);
    setEmpadronamientoSubmitting(false);
    setEmpadronamientoCompleted(false);
    setEmpadronamientoPdfSaving(false);
    empadronamientoCompletionInFlight.current = false;
  }, [isEmpadronamiento]);

  useEffect(() => {
    if (!isModelo790) {return;}
    setModelo790ShowWebView(false);
    setModelo790PdfHandoff(false);
    modelo790CaptchaReadyRef.current = false;
    pdfInFlight.current = false;
    let cancelled = false;
    getProfile().then(profile => {
      if (cancelled) {return;}
      const parsed = parsePersonalInfo(profile?.personal ?? null);
      if (!parsed.ok) {
        reportClientError('MODELO_790_PROFILE_INVALID', {
          fields: parsePersonalInfoFieldNames(profile?.personal ?? null) || 'personal',
        });
        setWebViewError({
          title: t('modelo790.errors.profileInvalidTitle'),
          message: t('modelo790.errors.profileInvalidMessage'),
        });
      } else {
        setModelo790Profile(toModelo790(parsed.data));
      }
    }).catch(() => {
      if (!cancelled) {
        setWebViewError({
          title: t('modelo790.errors.profileUnavailableTitle'),
          message: t('modelo790.errors.profileUnavailableMessage'),
        });
      }
    });
    return () => {cancelled = true;};
  }, [isModelo790, t]);

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
        return modelo790Profile
          ? buildModelo790InjectionRules(modelo790Profile, modelo790ScriptStrings)
          : [];
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
      modelo790ScriptStrings,
      profileLoaded,
    ],
  );

  const onReadinessTimeout = useCallback(
    (payload: WebViewReadinessTimeoutPayload) => {
      if (isModelo790) {
        setWebViewError({
          title: t('modelo790.errors.timedOutTitle'),
          message: t('modelo790.errors.timedOutMessage'),
        });
      } else if (isEmpadronamiento) {
        setWebViewError({
          title: t('empadronamiento.errors.timedOutTitle'),
          message: t('empadronamiento.errors.timedOutMessage'),
        });
      }
      reportClientError('WEBVIEW_INJECTION_TIMEOUT', {
        bookingAssistant,
        ruleId: payload.ruleId,
        url: sanitizeUrlForReport(payload.url),
        selector: payload.selector,
        timeoutMs: payload.timeoutMs,
      });
    },
    [bookingAssistant, isEmpadronamiento, isModelo790, t],
  );

  const {
    activeRule,
    handleMessage: handleInjectionMessage,
    onLoadEnd,
    onLoadStart: onInjectionLoadStart,
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

  const onLoadStart = useCallback(() => {
    if (
      isModelo790 &&
      !pdfInFlight.current &&
      !modelo790CaptchaReadyRef.current
    ) {
      setModelo790ShowWebView(false);
    }
    onInjectionLoadStart();
  }, [isModelo790, onInjectionLoadStart]);

  const goBackToDashboard = useCallback(() => {
    bookingAssistantExitAllowedRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const saveEmpadronamientoAppointmentPdf = useCallback(() => {
    if (
      !isEmpadronamiento ||
      !empadronamientoCompleted ||
      empadronamientoPdfSaving
    ) {
      return;
    }
    setEmpadronamientoPdfSaving(true);
    webViewRef.current?.injectJavaScript(DOWNLOAD_EMPADRONAMIENTO_PDF_SCRIPT);
  }, [
    empadronamientoCompleted,
    empadronamientoPdfSaving,
    isEmpadronamiento,
  ]);

  const confirmEmpadronamientoAppointment = useCallback(() => {
    if (!isEmpadronamiento || empadronamientoSubmitting) {
      return;
    }

    setEmpadronamientoReviewReady(false);
    setEmpadronamientoSubmitting(true);
    webViewRef.current?.injectJavaScript(
      CONFIRM_EMPADRONAMIENTO_SUBMIT_SCRIPT,
    );
  }, [empadronamientoSubmitting, isEmpadronamiento]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (handleInjectionMessage(event.nativeEvent.data)) {
        return;
      }

      try {
        const message = JSON.parse(event.nativeEvent.data);

        if (isEmpadronamiento && isEmpadronamientoPdf(message)) {
          if (!isTrustedEmpadronamientoMessageUrl(event.nativeEvent.url)) {
            return;
          }
          if (!empadronamientoPdfSaving) {
            return;
          }
          (async () => {
            try {
              const file = await saveGeneratedPdfBase64(
                message.payload.base64,
                message.payload.fileName,
              );
              const appointment: BookingAssistantAppointmentSummary = {
                office: empadronamientoAppointment.office || 'Barcelona appointment office',
                date: empadronamientoAppointment.date || '',
                time: empadronamientoAppointment.time || '',
                location: empadronamientoAppointment.location || undefined,
                confirmationCode:
                  empadronamientoAppointment.confirmationCode || undefined,
              };
              await openGeneratedPdf(file);
              const completion = route.params?.bookingCompletion;
              if (completion) {
                const progress = await fetchUserProgress();
                await updateRequirementProgress(
                  progress,
                  completion.stepId,
                  completion.requirementKey,
                  {
                    completed: true,
                    source: {
                      type: ASSISTED_BOOKING_REQUIREMENT_TYPE,
                      bookingAssistantId: 'empadronamiento',
                      completedAt: new Date().toISOString(),
                      appointment,
                    },
                  },
                );
              }
              bookingAssistantExitAllowedRef.current = true;
              navigation.goBack();
            } catch (error) {
              setEmpadronamientoPdfSaving(false);
              setWebViewError({
                title: t('empadronamiento.errors.pdfSaveFailedTitle'),
                message: t('empadronamiento.errors.pdfSaveFailedMessage'),
                detail: error instanceof Error ? error.message : undefined,
              });
            }
          })();
          return;
        }

        if (isEmpadronamiento && isEmpadronamientoMessage(message)) {
          if (!isTrustedEmpadronamientoMessageUrl(event.nativeEvent.url)) {
            return;
          }
          if (message.type === 'empadronamiento-error') {
            setEmpadronamientoReviewReady(false);
            setEmpadronamientoSubmitting(false);
            setWebViewError(message.payload);
            return;
          }

          if (
            message.type === 'empadronamiento-selection' ||
            message.type === 'empadronamiento-review-ready'
          ) {
            setEmpadronamientoAppointment(current => ({
              ...current,
              ...(message.payload ?? {}),
            }));
            if (message.type === 'empadronamiento-review-ready') {
              setEmpadronamientoReviewReady(true);
              setEmpadronamientoSubmitting(false);
            }
            return;
          }

          if (message.type === 'empadronamiento-submit-started') {
            setEmpadronamientoReviewReady(false);
            setEmpadronamientoSubmitting(true);
            return;
          }

          if (message.type === 'empadronamiento-booking-complete') {
            if (empadronamientoCompletionInFlight.current) {
              return;
            }
            empadronamientoCompletionInFlight.current = true;
            const appointmentDraft = {
              ...empadronamientoAppointment,
              ...(message.payload ?? {}),
            };
            setEmpadronamientoAppointment(appointmentDraft);
            setEmpadronamientoCompleted(true);
            setEmpadronamientoSubmitting(false);
            return;
          }
        }

        if (isModelo790 && isModelo790Error(message)) {
          setWebViewError(message.payload);
          return;
        }
        if (isModelo790 && message.type === 'modelo-790-captcha-ready') {
          if (!pdfInFlight.current) {
            modelo790CaptchaReadyRef.current = true;
            setModelo790ShowWebView(true);
          }
          return;
        }
        if (isModelo790 && isModelo790Pdf(message)) {
          if (!isTrustedModelo790MessageUrl(event.nativeEvent.url)) {
            return;
          }
          if (pdfInFlight.current) {return;}
          pdfInFlight.current = true;
          setModelo790PdfHandoff(true);
          setModelo790ShowWebView(false);
          const {base64, fileName} = message.payload;
          (async () => {
            try {
              const file = await saveGeneratedPdfBase64(base64, fileName);
              const review = route.params?.modelo790Review;
              if (review) {
                await saveModelo790ReviewFile(file);
                await setModelo790PendingReview({
                  ...review,
                  showNextStepsAlert: true,
                });
              }
              await openGeneratedPdf(file);
              navigation.goBack();
            } catch (error) {
              pdfInFlight.current = false;
              setModelo790PdfHandoff(false);
              setWebViewError({
                title: t('modelo790.errors.saveFailedTitle'),
                message: t('modelo790.errors.saveFailedMessage'),
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
    [
      empadronamientoAppointment,
      empadronamientoPdfSaving,
      handleInjectionMessage,
      isEmpadronamiento,
      isModelo790,
      navigation,
      route.params?.bookingCompletion,
      route.params?.modelo790Review,
      t,
    ],
  );

  const onError = useCallback<NonNullable<WebViewProps['onError']>>(
    syntheticEvent => {
      console.warn('[WebView] Load error', {
        bookingAssistant,
        requestedUrl: startUrl,
        ...syntheticEvent.nativeEvent,
      });

      if (isModelo790) {
        setWebViewError({
          title: t('modelo790.errors.siteLoadFailedTitle'),
          message: t('modelo790.errors.siteLoadFailedMessage'),
        });
      } else if (isEmpadronamiento) {
        setWebViewError({
          title: t('empadronamiento.errors.siteLoadFailedTitle'),
          message: t('empadronamiento.errors.siteLoadFailedMessage'),
        });
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
    [bookingAssistant, isEmpadronamiento, isModelo790, startUrl, t],
  );

  const onHttpError = useCallback<NonNullable<WebViewProps['onHttpError']>>(
    syntheticEvent => {
      console.warn('[WebView] HTTP error', {
        bookingAssistant,
        requestedUrl: startUrl,
        ...syntheticEvent.nativeEvent,
      });

      if (isModelo790) {
        setWebViewError({
          title: t('modelo790.errors.siteHttpErrorTitle'),
          message: t('modelo790.errors.siteHttpErrorMessage'),
          detail: `HTTP ${syntheticEvent.nativeEvent.statusCode}`,
        });
      } else if (isEmpadronamiento) {
        setWebViewError({
          title: t('empadronamiento.errors.siteHttpErrorTitle'),
          message: t('empadronamiento.errors.siteHttpErrorMessage'),
          detail: `HTTP ${syntheticEvent.nativeEvent.statusCode}`,
        });
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
    [bookingAssistant, isEmpadronamiento, isModelo790, startUrl, t],
  );

  return {
    webViewRef,
    bookingAssistant,
    webViewError,
    modelo790ShowWebView,
    modelo790PdfHandoff,
    empadronamientoRuleId: isEmpadronamiento ? activeRule?.id ?? null : null,
    empadronamientoAppointment,
    empadronamientoReviewReady,
    empadronamientoSubmitting,
    empadronamientoCompleted,
    empadronamientoPdfSaving,
    confirmEmpadronamientoAppointment,
    saveEmpadronamientoAppointmentPdf,
    bookingAssistantExitAllowedRef,
    goBackToDashboard,
    startUrl,
    webViewSource,
    onLoadEnd,
    onLoadStart,
    onNavigationStateChange,
    onMessage,
    onError,
    onHttpError,
  };
}
