import React, {act} from 'react';
import {AppState} from 'react-native';

import {ConsentProvider, useConsent} from '@/contexts/ConsentContext';
import {consentService} from '@/features/profile/services/consentService';
import {EMPTY_CONSENT_STATUS} from '@visamesa/content/checkout';
import {
  flushAsyncEffects,
  renderHookAsync,
  rerenderRenderedHook,
  unmountRenderedHook,
} from '@/test/renderHook';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/profile/services/consentService', () => ({
  consentService: {
    getConsentStatus: jest.fn(),
  },
}));

const {useAuth} = jest.requireMock('@/contexts/AuthContext') as {
  useAuth: jest.Mock;
};

function ConsentWrapper({children}: {children: React.ReactNode}) {
  return <ConsentProvider>{children}</ConsentProvider>;
}

describe('ConsentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    unmountRenderedHook();
  });

  it('refreshes consent when a user signs in', async () => {
    useAuth.mockReturnValue({
      user: {id: 'user-1', email: 'user@example.com'},
    });
    (consentService.getConsentStatus as jest.Mock).mockResolvedValue({
      privacyPolicy: true,
      termsOfService: true,
      privacyAcceptedAt: '2026-01-01T00:00:00.000Z',
      termsAcceptedAt: '2026-01-01T00:00:00.000Z',
    });

    const getHookState = await renderHookAsync(
      () => useConsent(),
      state => !state.isLoading,
      ConsentWrapper,
    );

    expect(consentService.getConsentStatus).toHaveBeenCalled();
    expect(getHookState().hasConsent).toBe(true);
    expect(getHookState().hasPrivacyConsent).toBe(true);
    expect(getHookState().hasTermsConsent).toBe(true);
  });

  it('resets consent when the user signs out', async () => {
    useAuth.mockReturnValue({
      user: {id: 'user-1', email: 'user@example.com'},
    });
    (consentService.getConsentStatus as jest.Mock).mockResolvedValue({
      privacyPolicy: true,
      termsOfService: false,
      privacyAcceptedAt: '2026-01-01T00:00:00.000Z',
      termsAcceptedAt: null,
    });

    const getHookState = await renderHookAsync(
      () => useConsent(),
      state => !state.isLoading,
      ConsentWrapper,
    );

    expect(getHookState().consentStatus.privacyPolicy).toBe(true);

    useAuth.mockReturnValue({user: null});
    rerenderRenderedHook();
    await flushAsyncEffects();

    expect(getHookState().consentStatus).toEqual(EMPTY_CONSENT_STATUS);
    expect(getHookState().hasConsent).toBe(false);
  });

  it('keeps existing consent when refresh fails', async () => {
    useAuth.mockReturnValue({
      user: {id: 'user-1', email: 'user@example.com'},
    });
    (consentService.getConsentStatus as jest.Mock)
      .mockResolvedValueOnce({
        privacyPolicy: true,
        termsOfService: true,
        privacyAcceptedAt: '2026-01-01T00:00:00.000Z',
        termsAcceptedAt: '2026-01-01T00:00:00.000Z',
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const getHookState = await renderHookAsync(
      () => useConsent(),
      state => !state.isLoading,
      ConsentWrapper,
    );

    expect(getHookState().hasConsent).toBe(true);

    await act(async () => {
      await getHookState().refreshConsent();
    });

    expect(getHookState().hasConsent).toBe(true);
    expect(consentService.getConsentStatus).toHaveBeenCalledTimes(2);
  });

  it('refreshes consent when the app returns to the foreground', async () => {
    useAuth.mockReturnValue({
      user: {id: 'user-1', email: 'user@example.com'},
    });
    (consentService.getConsentStatus as jest.Mock).mockResolvedValue({
      privacyPolicy: false,
      termsOfService: false,
      privacyAcceptedAt: null,
      termsAcceptedAt: null,
    });

    const addEventListener = jest.spyOn(AppState, 'addEventListener');

    await renderHookAsync(
      () => useConsent(),
      state => !state.isLoading,
      ConsentWrapper,
    );

    const handler = addEventListener.mock.calls[0]?.[1];

    await act(async () => {
      await handler?.('active');
    });

    expect(consentService.getConsentStatus).toHaveBeenCalledTimes(2);
  });
});
