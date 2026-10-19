import React, {useEffect} from 'react';
import {ActivityIndicator, Alert, Pressable, Text, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {RootStackParamList} from '@/navigation/types';
import {getWebViewUserAgent} from '@/webViewInjection/webViewDefaults';
import {useWebsiteWebViewScreen} from '@/webViewInjection/useWebsiteWebViewScreen';

type WebsiteWebViewRouteProp = RouteProp<RootStackParamList, 'WebsiteWebView'>;

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
    backgroundColor: theme.colors.surface,
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
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
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
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
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
  }, [navigation, route.params?.automation, t]);

  const isModelo790 = route.params?.automation === 'modelo-790-012';
  const shouldHideModelo790WebView = isModelo790 && !modelo790ShowWebView;
  const showModelo790StatusOverlay =
    isModelo790 &&
    shouldHideModelo790WebView &&
    !webViewError &&
    !modelo790PdfHandoff;
  const showModelo790PdfHandoff = isModelo790 && modelo790PdfHandoff && !webViewError;

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
          shouldHideModelo790WebView ? styles.hiddenWebView : null,
        ]}
      />
      {showModelo790StatusOverlay ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.statusTitle}>{t('modelo790.status.title')}</Text>
            <Text style={styles.statusMessage}>
              {t('modelo790.status.message')}
            </Text>
          </View>
        </View>
      ) : null}
      {showModelo790PdfHandoff ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.statusTitle}>
              {t('modelo790.captcha.openingPdf')}
            </Text>
          </View>
        </View>
      ) : null}
      {isModelo790 && webViewError ? (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{webViewError.title}</Text>
            <Text style={styles.errorMessage}>{webViewError.message}</Text>
            {webViewError.detail ? (
              <Text style={styles.errorMessage}>{webViewError.detail}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Text style={styles.backLabel}>{t('modelo790.backToDashboard')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default WebsiteWebViewScreen;
