import React, {act} from 'react';

import {EntitlementsProvider, useEntitlements} from '@/contexts/EntitlementsContext';
import {EntitlementType} from '@/types/entitlements';
import {renderHook, renderHookAsync, unmountRenderedHook} from '@/test/renderHook';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/paymentService', () => ({
  paymentService: {
    getEntitlements: jest.fn(),
  },
}));

jest.mock('@/services/clientErrorService', () => ({
  reportClientErrorFromException: jest.fn(),
}));

const {useAuth} = jest.requireMock('@/contexts/AuthContext') as {
  useAuth: jest.Mock;
};

const {getEntitlements} = jest.requireMock('@/services/paymentService')
  .paymentService as {
  getEntitlements: jest.Mock;
};

function EntitlementsWrapper({children}: {children: React.ReactNode}) {
  return <EntitlementsProvider>{children}</EntitlementsProvider>;
}

describe('EntitlementsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: {id: 'user-1', email: 'user@example.com'},
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    unmountRenderedHook();
    jest.useRealTimers();
  });

  it('loads entitlements when the user is authenticated', async () => {
    getEntitlements.mockResolvedValue({
      entitlements: [
        {
          type: EntitlementType.FULL_SERVICE,
          grantedAt: '2026-01-01T00:00:00.000Z',
          expiresAt: null,
        },
      ],
    });

    const getHookState = await renderHookAsync(
      () => useEntitlements(),
      state => !state.isLoading,
      EntitlementsWrapper,
    );

    expect(getEntitlements).toHaveBeenCalled();
    expect(getHookState().hasPaidService()).toBe(true);
  });

  it('polls until paid service is available', async () => {
    jest.useFakeTimers();
    getEntitlements
      .mockResolvedValueOnce({entitlements: []})
      .mockResolvedValueOnce({entitlements: []})
      .mockResolvedValueOnce({
        entitlements: [
          {
            type: EntitlementType.FULL_SERVICE,
            grantedAt: '2026-01-01T00:00:00.000Z',
            expiresAt: null,
          },
        ],
      });

    const getHookState = renderHook(
      () => useEntitlements(),
      EntitlementsWrapper,
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    let resolved = false;

    await act(async () => {
      const promise = getHookState().waitForPaidService().then(result => {
        resolved = result;
      });

      await jest.advanceTimersByTimeAsync(5000);
      await promise;
    });

    expect(resolved).toBe(true);
    expect(getEntitlements.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps existing entitlements when refresh fails', async () => {
    getEntitlements
      .mockResolvedValueOnce({
        entitlements: [
          {
            type: EntitlementType.FULL_SERVICE,
            grantedAt: '2026-01-01T00:00:00.000Z',
            expiresAt: null,
          },
        ],
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const getHookState = await renderHookAsync(
      () => useEntitlements(),
      state => !state.isLoading,
      EntitlementsWrapper,
    );

    expect(getHookState().hasPaidService()).toBe(true);

    await act(async () => {
      await getHookState().refreshEntitlements();
    });

    expect(getHookState().hasPaidService()).toBe(true);
    expect(getEntitlements).toHaveBeenCalledTimes(2);
  });

  it('returns false when paid service never arrives', async () => {
    jest.useFakeTimers();
    getEntitlements.mockResolvedValue({entitlements: []});

    const getHookState = renderHook(
      () => useEntitlements(),
      EntitlementsWrapper,
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    let resolved = true;

    await act(async () => {
      const promise = getHookState().waitForPaidService().then(result => {
        resolved = result;
      });

      await jest.advanceTimersByTimeAsync(10000);
      await promise;
    });

    expect(resolved).toBe(false);
  });
});
