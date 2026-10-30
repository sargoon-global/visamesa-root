import React, {act} from 'react';
import {Linking} from 'react-native';

import {
  extractCheckoutSessionId,
  PaymentReturnListener,
} from '@/navigation/PaymentReturnListener';
import {
  navigateToDashboard,
  navigateToLogin,
  navigateToProfile,
} from '@/navigation/navigationRef';
import {paymentService} from '@/services/paymentService';
import {renderComponent} from '@/test/testRenderer';

const mockShowToast = jest.fn();
const mockWaitForPaidService = jest.fn();
const mockRefreshEntitlements = jest.fn();
const mockRefreshCompletion = jest.fn();
let linkingHandler: ((event: {url: string}) => void) | null = null;

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/EntitlementsContext', () => ({
  useEntitlements: jest.fn(),
}));

jest.mock('@/hooks/useProfileCompletion', () => ({
  useProfileCompletion: jest.fn(),
}));

jest.mock('@/components/Toast/ToastProvider', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock('@/navigation/navigationRef', () => ({
  navigateToDashboard: jest.fn(),
  navigateToLogin: jest.fn(),
  navigateToProfile: jest.fn(),
}));

jest.mock('@/services/paymentService', () => ({
  paymentService: {
    syncCheckoutSession: jest.fn(),
  },
}));

jest.mock('@/services/clientErrorService', () => ({
  reportClientErrorFromException: jest.fn(),
}));

const {useAuth} = jest.requireMock('@/contexts/AuthContext') as {
  useAuth: jest.Mock;
};

const {useEntitlements} = jest.requireMock('@/contexts/EntitlementsContext') as {
  useEntitlements: jest.Mock;
};

const {useProfileCompletion} = jest.requireMock('@/hooks/useProfileCompletion') as {
  useProfileCompletion: jest.Mock;
};

describe('extractCheckoutSessionId', () => {
  it('reads session_id from checkout success deep links', () => {
    expect(
      extractCheckoutSessionId(
        'visamesa://checkout/success?session_id=cs_test_123',
      ),
    ).toBe('cs_test_123');
  });

  it('returns null when session_id is missing', () => {
    expect(extractCheckoutSessionId('visamesa://checkout/success')).toBeNull();
  });
});

describe('PaymentReturnListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    linkingHandler = null;
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockImplementation((_event, handler) => {
      linkingHandler = handler as (event: {url: string}) => void;
      return {remove: jest.fn()} as never;
    });
    useAuth.mockReturnValue({isAuthenticated: true});
    useEntitlements.mockReturnValue({
      waitForPaidService: mockWaitForPaidService,
      refreshEntitlements: mockRefreshEntitlements.mockResolvedValue([]),
    });
    useProfileCompletion.mockReturnValue({
      refreshCompletion: mockRefreshCompletion,
    });
    (paymentService.syncCheckoutSession as jest.Mock).mockResolvedValue({
      entitlements: [],
      citaPreviaBookedAt: null,
      personalDetailsLockedAt: null,
    });
  });

  async function emitDeepLink(url: string) {
    renderComponent(<PaymentReturnListener />);
    await act(async () => {
      await linkingHandler?.({url});
    });
  }

  it('redirects signed-out users to login', async () => {
    useAuth.mockReturnValue({isAuthenticated: false});

    await emitDeepLink('visamesa://checkout/success?session_id=cs_test');

    expect(mockShowToast).toHaveBeenCalled();
    expect(navigateToLogin).toHaveBeenCalled();
    expect(navigateToDashboard).not.toHaveBeenCalled();
  });

  it('syncs checkout session before polling entitlements', async () => {
    mockWaitForPaidService.mockResolvedValue(true);
    mockRefreshCompletion.mockResolvedValue(true);

    await emitDeepLink('visamesa://checkout/success?session_id=cs_test_123');

    expect(paymentService.syncCheckoutSession).toHaveBeenCalledWith(
      'cs_test_123',
    );
    expect(mockRefreshEntitlements).toHaveBeenCalled();
  });

  it('routes to dashboard when entitlements sync slowly', async () => {
    mockWaitForPaidService.mockResolvedValue(false);

    await emitDeepLink('visamesa://checkout/success');

    expect(navigateToDashboard).toHaveBeenCalled();
    expect(navigateToProfile).not.toHaveBeenCalled();
  });

  it('routes to dashboard when service is ready and profile is complete', async () => {
    mockWaitForPaidService.mockResolvedValue(true);
    mockRefreshCompletion.mockResolvedValue(true);

    await emitDeepLink('visamesa:///checkout/success');

    expect(navigateToDashboard).toHaveBeenCalled();
    expect(navigateToProfile).not.toHaveBeenCalled();
  });

  it('routes to profile when service is ready but profile is incomplete', async () => {
    mockWaitForPaidService.mockResolvedValue(true);
    mockRefreshCompletion.mockResolvedValue(false);

    await emitDeepLink('visamesa://checkout/success');

    expect(navigateToProfile).toHaveBeenCalled();
    expect(navigateToDashboard).not.toHaveBeenCalled();
  });
});
