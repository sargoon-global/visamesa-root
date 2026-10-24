import React, {useEffect} from 'react';
import {ActivityIndicator, Alert, Pressable, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {RootStackParamList} from '@/navigation/types';
import {getWebViewUserAgent} from '@/webViewInjection/webViewDefaults';
import {Text} from '@/components/ui/Text';
import {useWebsiteWebViewScreen} from '@/webViewInjection/useWebsiteWebViewScreen';

type WebsiteWebViewRouteProp = RouteProp<RootStackParamList, 'WebsiteWebView'>;

function withAlpha(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(character => character + character).join('')
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  webView: {
    flex: 1,
  },
  hiddenWebView: {
    opacity: 0,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  statusOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: withAlpha(theme.colors.scrim, 0.78),
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  statusCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    maxWidth: 360,
  },
  statusTitle: {
    textAlign: 'center',
  },
  statusMessage: {
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  errorCard: {
    gap: theme.spacing.md,
  },
  errorTitle: {},
  errorMessage: {},
  backButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radii.md,
  },
  backLabel: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  appointmentCard: {
    width: '100%',
    maxWidth: 420,
    gap: theme.spacing.md,
  },
  appointmentDetails: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceContainer,
  },
  appointmentLabel: {},
  appointmentValue: {},
  confirmButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radii.md,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
}));

const WebsiteWebViewScreen = () => {
  const route = useRoute<WebsiteWebViewRouteProp>();
  const navigation = useNavigation();
  const {t} = useTranslation('common');
  const {styles, theme} = useStyles(stylesheet);
  const {
    webViewRef,
    webViewSource,
    webViewError,
    modelo790ShowWebView,
    modelo790PdfHandoff,
    empadronamientoRuleId,
    empadronamientoAppointment,
    empadronamientoReviewReady,
    empadronamientoSubmitting,
    confirmEmpadronamientoAppointment,
    bookingAssistantExitAllowedRef,
    goBackToDashboard,
    onLoadEnd,
    onLoadStart,
    onNavigationStateChange,
    onMessage,
    onError,
    onHttpError,
  } = useWebsiteWebViewScreen(route);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (
        route.params?.automation === 'modelo-790-012' ||
        bookingAssistantExitAllowedRef.current ||
        (event.data.action.type !== 'GO_BACK' &&
          event.data.action.type !== 'POP')
      ) {
        return;
      }

      event.preventDefault();

      Alert.alert(
        t('bookingAssistant.stopTitle'),
        t('bookingAssistant.stopMessage'),
        [
          {text: t('actions.cancel'), style: 'cancel'},
          {
            text: t('actions.stop'),
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ],
      );
    });

    return unsubscribe;
  }, [bookingAssistantExitAllowedRef, navigation, route.params?.automation, t]);

  const isModelo790 = route.params?.automation === 'modelo-790-012';
  const isEmpadronamiento =
    !isModelo790 && route.params?.bookingAssistant === 'empadronamiento';
  const shouldHideModelo790WebView = isModelo790 && !modelo790ShowWebView;
  const shouldHideWebView =
    shouldHideModelo790WebView || isEmpadronamiento;
  const showModelo790StatusOverlay =
    isModelo790 &&
    shouldHideModelo790WebView &&
    !webViewError &&
    !modelo790PdfHandoff;
  const showModelo790PdfHandoff = isModelo790 && modelo790PdfHandoff && !webViewError;
  const empadronamientoStatusKey = (() => {
    if (empadronamientoSubmitting) {
      return 'submitting';
    }
    if (empadronamientoRuleId?.includes('personal-info')) {
      return 'personalInfo';
    }
    if (empadronamientoRuleId?.includes('select-oficina')) {
      return 'office';
    }
    if (empadronamientoRuleId?.includes('select-date')) {
      return 'date';
    }
    if (empadronamientoRuleId?.includes('select-time')) {
      return 'time';
    }
    if (empadronamientoRuleId?.includes('motive')) {
      return 'motive';
    }
    return 'preparing';
  })();
  const canConfirmEmpadronamiento = Boolean(
    empadronamientoAppointment.office &&
      empadronamientoAppointment.date &&
      empadronamientoAppointment.time,
  );

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        userAgent={getWebViewUserAgent()}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        startInLoadingState
        setSupportMultipleWindows={false}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onMessage={onMessage}
        onError={onError}
        onHttpError={onHttpError}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        style={[
          styles.webView,
          shouldHideWebView ? styles.hiddenWebView : null,
        ]}
      />
      {isEmpadronamiento && !empadronamientoReviewReady && !webViewError ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="headlineSmall" color="onSurface" style={styles.statusTitle}>
              {t('empadronamiento.status.title')}
            </Text>
            <Text variant="bodyLarge" color="onSurfaceVariant" style={styles.statusMessage}>
              {t(`empadronamiento.status.${empadronamientoStatusKey}`)}
            </Text>
          </View>
        </View>
      ) : null}
      {isEmpadronamiento && empadronamientoReviewReady && !webViewError ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.appointmentCard}>
            <Text variant="headlineSmall" color="onSurface" style={styles.statusTitle}>
              {t('empadronamiento.review.title')}
            </Text>
            <Text variant="bodyLarge" color="onSurfaceVariant" style={styles.statusMessage}>
              {t('empadronamiento.review.message')}
            </Text>
            <View style={styles.appointmentDetails}>
              {(['office', 'date', 'time', 'location'] as const).map(field =>
                empadronamientoAppointment[field] ? (
                  <View key={field}>
                    <Text variant="labelMedium" color="onSurfaceVariant" style={styles.appointmentLabel}>
                      {t(`empadronamiento.review.${field}`)}
                    </Text>
                    <Text variant="bodyLarge" color="onSurface" style={styles.appointmentValue}>
                      {empadronamientoAppointment[field]}
                    </Text>
                  </View>
                ) : null,
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled: !canConfirmEmpadronamiento}}
              disabled={!canConfirmEmpadronamiento}
              onPress={confirmEmpadronamientoAppointment}
              style={[
                styles.confirmButton,
                !canConfirmEmpadronamiento
                  ? styles.confirmButtonDisabled
                  : null,
              ]}>
              <Text style={styles.backLabel}>
                {t('empadronamiento.review.confirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {showModelo790StatusOverlay ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="headlineSmall" color="onSurface" style={styles.statusTitle}>
              {t('modelo790.status.title')}
            </Text>
            <Text variant="bodyLarge" color="onSurfaceVariant" style={styles.statusMessage}>
              {t('modelo790.status.message')}
            </Text>
          </View>
        </View>
      ) : null}
      {showModelo790PdfHandoff ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="headlineSmall" color="onSurface" style={styles.statusTitle}>
              {t('modelo790.captcha.openingPdf')}
            </Text>
          </View>
        </View>
      ) : null}
      {(isModelo790 || isEmpadronamiento) && webViewError ? (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text variant="headlineSmall" color="onSurface" style={styles.errorTitle}>
              {webViewError.title}
            </Text>
            <Text variant="bodyLarge" color="onSurfaceVariant" style={styles.errorMessage}>
              {webViewError.message}
            </Text>
            {webViewError.detail ? (
              <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.errorMessage}>
                {webViewError.detail}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={goBackToDashboard}
              style={styles.backButton}>
              <Text style={styles.backLabel}>
                {isModelo790
                  ? t('modelo790.backToDashboard')
                  : t('empadronamiento.backToDashboard')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default WebsiteWebViewScreen;
