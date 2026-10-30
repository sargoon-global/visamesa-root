import { isAxiosError } from 'axios';
import { Platform } from 'react-native';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { i18n } from '@visamesa/content/i18n';

import { getAxiosApiErrorMessage } from '@/services/apiErrors';

type GoogleSignInError = Error & { code?: string };

function t(key: string): string {
  return i18n.t(key as never, {ns: 'auth'});
}

export function getGoogleSignInErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const backendMessage =
      typeof error.response?.data === 'object' &&
      error.response.data !== null &&
      'error' in error.response.data
        ? String((error.response.data as { error: string }).error)
        : null;

    if (backendMessage) {
      if (
        backendMessage.includes('requiredAudience') ||
        backendMessage.includes('Wrong recipient')
      ) {
        return t('googleBackendOAuthMisconfig');
      }
    }

    return getAxiosApiErrorMessage(error, 'auth:signInFailedFallback');
  }

  const googleError = error as GoogleSignInError;

  if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
    return t('googleSignInCancelledShort');
  }

  if (googleError.code === statusCodes.IN_PROGRESS) {
    return t('googleSignInInProgress');
  }

  if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return t('googlePlayServicesUnavailable');
  }

  const message = googleError.message ?? t('signInFailedFallback');

  if (
    message.includes('DEVELOPER_ERROR') ||
    message.toLowerCase().includes("couldn't sign in")
  ) {
    return t('googleAndroidMisconfig');
  }

  if (Platform.OS === 'ios') {
    const lower = message.toLowerCase();

    if (
      lower.includes('network connection was lost') ||
      lower.includes('network connection lost') ||
      lower.includes('internet connection appears to be offline')
    ) {
      return t('googleIosNetworkLost');
    }

    if (lower.includes('safari') || lower.includes('invalid')) {
      return t('googleIosMisconfig');
    }
  }

  return message;
}
