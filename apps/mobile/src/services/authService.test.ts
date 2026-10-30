import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { API_ENDPOINTS } from '@/config/api';
import { authService } from '@/services/authService';
import apiClient from '@/services/api';
import { consentService } from '@/features/profile/services/consentService';
import { STORAGE_KEYS } from '@visamesa/types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockClearModelo790InProgressSession = jest.fn(
  async (_userId?: string | null) => {},
);

jest.mock('@/features/pdfGeneration/forms/modelo790/modelo790Storage', () => ({
  clearModelo790InProgressSession: (userId?: string) =>
    mockClearModelo790InProgressSession(userId),
}));

jest.mock('@/features/dashboard/services/progressService', () => ({
  clearStoredUserProgress: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
    NULL_PRESENTER: 'NULL_PRESENTER',
  },
}));

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('@/features/profile/services/consentService', () => ({
  consentService: {
    clearConsent: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs in with Google and stores session data', async () => {
    const authResponse = {
      token: 'jwt-token',
      user: { id: 'user-1', email: 'user@example.com' },
    };

    mockedGoogleSignin.hasPlayServices.mockResolvedValue(true);
    mockedGoogleSignin.signIn.mockResolvedValue({
      type: 'success',
      data: {
        idToken: 'google-id-token',
        scopes: [],
        serverAuthCode: null,
        user: {
          id: 'google-user',
          name: 'User',
          email: 'user@example.com',
          photo: null,
          familyName: null,
          givenName: null,
        },
      },
    });
    mockedApiClient.post.mockResolvedValue({ data: authResponse });

    await expect(authService.signInWithGoogle()).resolves.toEqual(authResponse);

    expect(mockedApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.googleAuth, {
      idToken: 'google-id-token',
    });
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.AUTH_TOKEN,
      'jwt-token',
    );
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(authResponse.user),
    );
  });

  it('returns null when there is no stored auth token', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(null);

    await expect(authService.getCurrentUser()).resolves.toBeNull();
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  it('fetches the current user from the API when a token exists', async () => {
    const user = { id: 'user-1', email: 'user@example.com' };

    mockedAsyncStorage.getItem.mockResolvedValue('jwt-token');
    mockedApiClient.get.mockResolvedValue({ data: user });

    await expect(authService.getCurrentUser()).resolves.toEqual(user);
    expect(mockedApiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.usersMe);
  });

  it('clears consent on logout', async () => {
    mockedGoogleSignin.signOut.mockResolvedValue(null);
    mockedAsyncStorage.getItem.mockImplementation(async key => {
      if (key === STORAGE_KEYS.USER_DATA) {
        return JSON.stringify({id: 'user-1', email: 'user@example.com'});
      }
      return null;
    });

    await authService.logout();

    expect(consentService.clearConsent).toHaveBeenCalled();
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(
      STORAGE_KEYS.AUTH_TOKEN,
    );
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(
      STORAGE_KEYS.USER_DATA,
    );
    expect(mockClearModelo790InProgressSession).toHaveBeenCalledWith('user-1');
  });
});
