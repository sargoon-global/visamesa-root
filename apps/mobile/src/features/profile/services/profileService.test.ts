import { API_ENDPOINTS } from '@/config/api';
import {
  getPersonalForBookingAssistant,
  getProfile,
  updateProfile,
} from '@/features/profile/services/profileService';
import { cryptoService } from '@/services/cryptoService';
import { ProfileDecryptionError } from '@/services/profileCryptoErrors';
import apiClient from '@/services/api';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('@/services/cryptoService', () => ({
  cryptoService: {
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  },
}));

jest.mock('@/services/clientErrorService', () => ({
  reportClientError: jest.fn(),
  reportClientErrorFromException: jest.fn(),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedCryptoService = cryptoService as jest.Mocked<typeof cryptoService>;

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and decrypts the current user profile', async () => {
    const profile = {
      personal: { firstName: 'Ada' },
    };
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };

    mockedApiClient.get.mockResolvedValue({ data: encryptedPayload });
    mockedCryptoService.decrypt.mockResolvedValue(profile);

    await expect(getProfile()).resolves.toEqual({
      personal: {...profile.personal, province: 'Barcelona'},
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.encryptedDetails,
    );
    expect(mockedCryptoService.decrypt).toHaveBeenCalledWith(encryptedPayload);
  });

  it('returns an empty profile when no encrypted payload exists', async () => {
    mockedApiClient.get.mockResolvedValue({ data: null });

    await expect(getProfile()).resolves.toEqual({
      personal: null,
    });
    expect(mockedCryptoService.decrypt).not.toHaveBeenCalled();
  });

  it('updates a profile section with encrypted payload', async () => {
    const updatedProfile = {
      personal: {firstName: 'Ada', province: 'Barcelona'},
    };
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };

    mockedApiClient.get.mockResolvedValue({ data: null });
    mockedCryptoService.encrypt.mockResolvedValue(encryptedPayload);
    mockedApiClient.put.mockResolvedValue({ data: encryptedPayload });

    await expect(
      updateProfile('personal', { firstName: 'Ada' }),
    ).resolves.toEqual(updatedProfile);

    expect(mockedCryptoService.encrypt).toHaveBeenCalledWith(updatedProfile);
    expect(mockedApiClient.put).toHaveBeenCalledWith(
      API_ENDPOINTS.encryptedDetails,
      encryptedPayload,
    );
  });

  it('returns personal data for booking assistant when profile decrypts', async () => {
    const profile = {
      personal: { firstName: 'Ada', documentNumber: 'X1234567A' },
    };
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };

    mockedApiClient.get.mockResolvedValue({ data: encryptedPayload });
    mockedCryptoService.decrypt.mockResolvedValue(profile);

    await expect(getPersonalForBookingAssistant()).resolves.toEqual({
      ...profile.personal,
      province: 'Barcelona',
    });
  });

  it('returns null personal for booking assistant when decrypt fails on another device', async () => {
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };

    mockedApiClient.get.mockResolvedValue({ data: encryptedPayload });
    mockedCryptoService.decrypt.mockRejectedValue(new ProfileDecryptionError());

    await expect(getPersonalForBookingAssistant()).resolves.toBeNull();
  });

  it('rethrows profile decryption errors for profile screen loads', async () => {
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };

    mockedApiClient.get.mockResolvedValue({ data: encryptedPayload });
    mockedCryptoService.decrypt.mockRejectedValue(new ProfileDecryptionError());

    await expect(getProfile()).rejects.toThrow(ProfileDecryptionError);
  });

  it('overwrites unreadable remote profile when saving on a new device', async () => {
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };
    const updatedProfile = {
      personal: {firstName: 'Ada', province: 'Barcelona'},
    };

    mockedApiClient.get.mockResolvedValue({ data: encryptedPayload });
    mockedCryptoService.decrypt.mockRejectedValue(new ProfileDecryptionError());
    mockedCryptoService.encrypt.mockResolvedValue(encryptedPayload);
    mockedApiClient.put.mockResolvedValue({ data: encryptedPayload });

    await expect(
      updateProfile('personal', { firstName: 'Ada' }),
    ).resolves.toEqual(updatedProfile);

    expect(mockedCryptoService.encrypt).toHaveBeenCalledWith(updatedProfile);
  });

  it('migrates legacy profile data from old three-section format', async () => {
    const legacyProfile = {
      personal: { firstName: 'Ada' },
      billing: { iban: 'ES123' },
      residenceRegistration: { address: '123 Main St', city: 'Barcelona' },
    };
    const encryptedPayload = {
      ciphertext: 'encrypted',
      nonce: 'nonce',
      authTag: 'tag',
      algorithm: 'AES-256-GCM' as const,
      keyId: 'device-key-v1',
      version: 1,
    };

    mockedApiClient.get.mockResolvedValue({ data: encryptedPayload });
    mockedCryptoService.decrypt.mockResolvedValue(legacyProfile);

    const result = await getProfile();

    expect(result.personal).toMatchObject({
      firstName: 'Ada',
      address: '123 Main St',
      city: 'Barcelona',
    });
    expect(result).not.toHaveProperty('billing');
    expect(result).not.toHaveProperty('residenceRegistration');
  });
});
