import React, {useEffect} from 'react';
import {ActivityIndicator, Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import {RootStackParamList} from '@/navigation/types';
import {getWebViewUserAgent} from '@/webViewInjection/webViewDefaults';
import {useWebsiteWebViewScreen} from '@/webViewInjection/useWebsiteWebViewScreen';

type WebsiteWebViewRouteProp = RouteProp<RootStackParamList, 'WebsiteWebView'>;

const WebsiteWebViewScreen = () => {
  const route = useRoute<WebsiteWebViewRouteProp>();
  const navigation = useNavigation();
  const {t} = useTranslation('common');
  const {
    webViewRef,
    webViewSource,
    webViewError,
    modelo790ShowWebView,
    onLoadEnd,
    onLoadStart,
    onNavigationStateChange,
    onMessage,
    onError,
    onHttpError,
  } = useWebsiteWebViewScreen(route);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (route.params?.automation === 'modelo-790-012' ||
          (event.data.action.type !== 'GO_BACK' && event.data.action.type !== 'POP')) {
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
            <ActivityIndicator size="large" color="#1A73E8" />
          </View>
        )}
        style={[styles.webView, shouldHideModelo790WebView ? styles.hiddenWebView : null]}
      />
      {isModelo790 && shouldHideModelo790WebView && !webViewError ? (
        <View style={styles.statusOverlay} pointerEvents="auto">
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#1A73E8" />
            <Text style={styles.statusTitle}>Preparing your Modelo 790</Text>
            <Text style={styles.statusMessage}>
              You’ll enter the official captcha next. When the PDF opens, save it locally.
            </Text>
          </View>
        </View>
      ) : null}
      {isModelo790 && webViewError ? (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{webViewError.title}</Text>
            <Text style={styles.errorMessage}>{webViewError.message}</Text>
            {webViewError.detail ? <Text style={styles.errorMessage}>{webViewError.detail}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backLabel}>Back to dashboard</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorOverlay: {position: 'absolute', inset: 0, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 24},
  errorCard: {gap: 16},
  errorTitle: {fontSize: 22, fontWeight: '700', color: '#1F2937'},
  errorMessage: {fontSize: 16, color: '#374151'},
  backButton: {backgroundColor: '#1A73E8', padding: 16, alignItems: 'center', borderRadius: 8},
  backLabel: {color: '#FFFFFF', fontWeight: '700'},
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
  },
  statusOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusCard: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 360,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default WebsiteWebViewScreen;
