import { isAxiosError } from 'axios'

import {API_ENDPOINTS} from '@/config/api'
import {GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID} from '@/config/google'
import apiClient from '@/services/api'
import {getGoogleSignInErrorMessage} from '@/services/authGoogleErrors'
import {reportClientErrorFromException} from '@/services/clientErrorService'
import AsyncStorage from '@react-native-async-storage/async-storage';

import {clearStoredUserProgress} from '@/features/dashboard/services/progressService';
import {clearModelo790InProgressSession} from '@/features/pdfGeneration/forms/modelo790/modelo790Storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { consentService } from '@/features/profile/services/consentService'
import { i18n } from '@visamesa/content/i18n'
import { AuthResponse, STORAGE_KEYS, User } from '@visamesa/types'

let isGoogleConfigured = false;

function configureGoogleSignIn() {
  if (isGoogleConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });

  isGoogleConfigured = true;
}

export const authService = {
  async signInWithGoogle(): Promise<AuthResponse> {
    configureGoogleSignIn();

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type !== 'success') {
        throw new Error(i18n.t('googleSignInCancelledShort', { ns: 'auth' }));
      }

      const idToken = signInResult.data.idToken;

      if (!idToken) {
        throw new Error(i18n.t('googleNoIdToken', { ns: 'auth' }));
      }

      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.googleAuth,
        { idToken },
      );

      const { token, user } = response.data;

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return response.data;
    } catch (error) {
      const googleError = error as Error & { code?: string };
      const isUserCancelled =
        googleError.code === statusCodes.SIGN_IN_CANCELLED ||
        googleError.code === statusCodes.IN_PROGRESS;

      if (!isUserCancelled) {
        reportClientErrorFromException('AUTH_GOOGLE_SIGN_IN_FAILED', error);
      }

      throw new Error(getGoogleSignInErrorMessage(error));
    }
  },

  async logout(): Promise<void> {
    configureGoogleSignIn();

    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore sign-out errors when Google session is not active.
    }

    const storedUser = await this.getStoredUser();

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      consentService.clearConsent(),
      clearModelo790InProgressSession(storedUser?.id),
      clearStoredUserProgress(),
    ]);
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        return null;
      }

      const response = await apiClient.get<User>(API_ENDPOINTS.usersMe);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        await this.logout();
      } else {
        reportClientErrorFromException('AUTH_SESSION_REFRESH_FAILED', error);
      }

      console.error('Failed to get current user:', error);
      return null;
    }
  },

  async getStoredUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },
};
