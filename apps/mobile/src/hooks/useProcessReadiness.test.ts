import {act} from 'react';

import {renderHook, flushAsyncEffects} from '@/test/renderHook';
import {useProcessReadiness} from './useProcessReadiness';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/EntitlementsContext', () => ({
  useEntitlements: jest.fn(),
}));

jest.mock('@/hooks/useProfileCompletion', () => ({
  useProfileCompletion: jest.fn(),
}));

jest.mock('@/contexts/ConsentContext', () => ({
  useConsent: jest.fn(),
}));

import {useAuth} from '@/contexts/AuthContext';
import {useConsent} from '@/contexts/ConsentContext';
import {useEntitlements} from '@/contexts/EntitlementsContext';
import {useProfileCompletion} from '@/hooks/useProfileCompletion';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseEntitlements = useEntitlements as jest.MockedFunction<
  typeof useEntitlements
>;
const mockUseProfileCompletion = useProfileCompletion as jest.MockedFunction<
  typeof useProfileCompletion
>;
const mockUseConsent = useConsent as jest.MockedFunction<typeof useConsent>;
const mockRefreshConsent = jest.fn().mockResolvedValue(true);

function mockConsent(
  overrides: Partial<ReturnType<typeof useConsent>> = {},
): ReturnType<typeof useConsent> {
  return {
    hasConsent: true,
    hasPrivacyConsent: true,
    hasTermsConsent: true,
    consentStatus: {
      privacyPolicy: true,
      termsOfService: true,
      privacyAcceptedAt: null,
      termsAcceptedAt: null,
    },
    isLoading: false,
    refreshConsent: mockRefreshConsent,
    ...overrides,
  };
}

async function renderProcessReadiness() {
  const getHookState = renderHook(() => useProcessReadiness());
  await flushAsyncEffects();
  return getHookState;
}

describe('useProcessReadiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {id: 'test-user'},
    } as never);

    mockUseConsent.mockReturnValue(mockConsent());
  });

  it('returns canStartProcess false when payment is missing', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => false,
      isLoading: false,
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: true,
      refreshCompletion: jest.fn(),
    } as never);

    const getHookState = await renderProcessReadiness();

    expect(getHookState().canStartProcess).toBe(false);
    expect(getHookState().missing).toContain('payment');
    expect(getHookState().missing).not.toContain('personalInformation');
    expect(getHookState().missing).not.toContain('legalPrivacy');
  });

  it('returns canStartProcess false when personal information is incomplete', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => true,
      isLoading: false,
      refreshEntitlements: jest.fn(),
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: false,
      refreshCompletion: jest.fn(),
    } as never);

    const getHookState = await renderProcessReadiness();

    expect(getHookState().canStartProcess).toBe(false);
    expect(getHookState().missing).toContain('personalInformation');
    expect(getHookState().missing).not.toContain('payment');
  });

  it('returns canStartProcess false when legal consent is missing', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => true,
      isLoading: false,
      refreshEntitlements: jest.fn(),
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: true,
      refreshCompletion: jest.fn(),
    } as never);

    mockUseConsent.mockReturnValue(mockConsent({hasConsent: false}));

    const getHookState = await renderProcessReadiness();

    expect(getHookState().canStartProcess).toBe(false);
    expect(getHookState().missing).toContain('legalPrivacy');
  });

  it('returns canStartProcess false when all prerequisites are missing', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => false,
      isLoading: false,
      refreshEntitlements: jest.fn(),
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: false,
      refreshCompletion: jest.fn(),
    } as never);

    mockUseConsent.mockReturnValue(mockConsent({hasConsent: false}));

    const getHookState = await renderProcessReadiness();

    expect(getHookState().canStartProcess).toBe(false);
    expect(getHookState().missing).toEqual([
      'personalInformation',
      'legalPrivacy',
      'payment',
    ]);
  });

  it('returns canStartProcess true when all prerequisites are complete', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => true,
      isLoading: false,
      refreshEntitlements: jest.fn(),
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: true,
      isLoading: false,
      refreshCompletion: jest.fn(),
    } as never);

    const getHookState = await renderProcessReadiness();

    expect(getHookState().canStartProcess).toBe(true);
    expect(getHookState().isProfileComplete).toBe(true);
    expect(getHookState().missing).toHaveLength(0);
    expect(getHookState().refreshReadiness).toEqual(expect.any(Function));
  });

  it('refreshReadinessForProfileDisplay reloads consent and entitlements only', async () => {
    const refreshCompletion = jest.fn().mockResolvedValue(true);
    const refreshEntitlements = jest.fn().mockResolvedValue([]);
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => true,
      isLoading: false,
      refreshEntitlements,
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: true,
      isLoading: false,
      refreshCompletion,
    } as never);

    mockUseConsent.mockReturnValue(mockConsent());

    const getHookState = await renderProcessReadiness();

    await act(async () => {
      await getHookState().refreshReadinessForProfileDisplay();
    });

    expect(refreshCompletion).not.toHaveBeenCalled();
    expect(mockRefreshConsent).toHaveBeenCalledTimes(1);
    expect(refreshEntitlements).toHaveBeenCalledTimes(1);
  });

  it('refreshReadiness reloads profile, consent, and entitlements', async () => {
    const refreshCompletion = jest.fn().mockResolvedValue(true);
    const refreshEntitlements = jest.fn().mockResolvedValue([]);
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => true,
      isLoading: false,
      refreshEntitlements,
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: true,
      isLoading: false,
      refreshCompletion,
    } as never);

    mockUseConsent.mockReturnValue(mockConsent());

    const getHookState = await renderProcessReadiness();

    await act(async () => {
      await getHookState().refreshReadiness();
    });

    expect(refreshCompletion).toHaveBeenCalledTimes(1);
    expect(mockRefreshConsent).toHaveBeenCalledTimes(1);
    expect(refreshEntitlements).toHaveBeenCalledTimes(1);
  });

  it('returns isLoading true when entitlements are loading', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => false,
      isLoading: true,
      refreshEntitlements: jest.fn(),
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: false,
      refreshCompletion: jest.fn(),
    } as never);

    const getHookState = await renderProcessReadiness();

    expect(getHookState().isLoading).toBe(true);
  });

  it('returns isLoading true when profile completion is loading', async () => {
    mockUseEntitlements.mockReturnValue({
      hasPaidService: () => false,
      isLoading: false,
      refreshEntitlements: jest.fn(),
    } as never);

    mockUseProfileCompletion.mockReturnValue({
      isProfileComplete: false,
      isLoading: true,
      refreshCompletion: jest.fn(),
    } as never);

    const getHookState = await renderProcessReadiness();

    expect(getHookState().isLoading).toBe(true);
  });
});
