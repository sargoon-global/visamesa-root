import {act} from 'react';

import {useProfileScreen} from '@/features/profile/hooks/useProfileScreen';
import {createMockNavigation} from '@/test/navigation';
import {renderHook} from '@/test/renderHook';
import {ProfileStackParamList, RootStackParamList} from '@/navigation/types';
import type {ProcessReadinessMissing} from '@/types/processReadiness';
import {CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

const mockShowToast = jest.fn();
const mockLogout = jest.fn();
const mockRefreshReadiness = jest.fn();
const mockOpenPricing = jest.fn();
const mockOpenPricingStatus = jest.fn();

jest.mock('@/components/Toast/ToastProvider', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useProcessReadiness', () => ({
  useProcessReadiness: jest.fn(),
}));

jest.mock('@/hooks/usePricingLink', () => ({
  usePricingLink: () => ({
    openPricing: mockOpenPricing,
    openPricingStatus: mockOpenPricingStatus,
  }),
}));

jest.mock('@/features/profile/context/ProfileDataContext', () => ({
  useProfileData: jest.fn(),
}));

const mockUseFocusEffect = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => void) => mockUseFocusEffect(callback),
}));

const {useProfileData} = jest.requireMock(
  '@/features/profile/context/ProfileDataContext',
) as {
  useProfileData: jest.Mock;
};

type ProfileScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const {useAuth} = jest.requireMock('@/contexts/AuthContext') as {
  useAuth: jest.Mock;
};

const {useProcessReadiness} = jest.requireMock('@/hooks/useProcessReadiness') as {
  useProcessReadiness: jest.Mock;
};

function mockReadiness({
  isProfileComplete = false,
  missing = [
    'personalInformation',
    'legalPrivacy',
    'payment',
  ] as ProcessReadinessMissing[],
  isLoading = false,
}: {
  isProfileComplete?: boolean;
  missing?: ProcessReadinessMissing[];
  isLoading?: boolean;
} = {}) {
  useProcessReadiness.mockReturnValue({
    isProfileComplete,
    missing: [...missing],
    isLoading,
    refreshReadiness: mockRefreshReadiness,
  });
}

describe('useProfileScreen', () => {
  beforeEach(() => {
    mockShowToast.mockReset();
    mockLogout.mockReset();
    mockRefreshReadiness.mockReset();
    mockRefreshReadiness.mockResolvedValue(undefined);
    mockUseFocusEffect.mockReset();
    mockReadiness();
    mockOpenPricing.mockReset();
    mockOpenPricing.mockResolvedValue(undefined);
    mockOpenPricingStatus.mockReset();
    mockOpenPricingStatus.mockResolvedValue(undefined);
    useProfileData.mockReturnValue({
      isLoading: false,
      error: null,
    });
  });

  it('returns unauthenticated state when there is no user', () => {
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      logout: mockLogout,
    });

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    expect(getHookState().userEmail).toBeNull();
  });

  it('navigates to login when sign in is pressed', () => {
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      logout: mockLogout,
    });

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    act(() => {
      getHookState().onSignInPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('refreshes readiness when the screen gains focus', () => {
    useAuth.mockReturnValue({
      user: {id: '1', email: 'user@example.com'},
      isLoading: false,
      logout: mockLogout,
    });

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    renderHook(() => useProfileScreen(navigation));

    expect(mockUseFocusEffect).toHaveBeenCalled();
    const focusCallback = mockUseFocusEffect.mock.calls[0]?.[0] as () => void;

    act(() => {
      focusCallback();
    });

    expect(mockRefreshReadiness).toHaveBeenCalled();
  });

  it('loads profile data when authenticated', () => {
    useAuth.mockReturnValue({
      user: {id: '1', email: 'user@example.com'},
      isLoading: false,
      logout: mockLogout,
    });

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    expect(getHookState().userEmail).toBe('user@example.com');
  });

  it('returns payment status from entitlements', () => {
    useAuth.mockReturnValue({
      user: {id: '1', email: 'user@example.com'},
      isLoading: false,
      logout: mockLogout,
    });
    mockReadiness({missing: ['personalInformation', 'legalPrivacy']});

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    expect(getHookState().hasPaid).toBe(true);
    expect(getHookState().profileCompleteness.payment).toBe(true);
  });

  it('opens pricing website when payment is pressed and user is unpaid', () => {
    useAuth.mockReturnValue({
      user: {id: '1', email: 'user@example.com'},
      isLoading: false,
      logout: mockLogout,
    });

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    act(() => {
      getHookState().onPaymentPress();
    });

    expect(mockOpenPricing).toHaveBeenCalled();
  });

  it('shows already paid dialog instead of opening pricing when user already paid', () => {
    useAuth.mockReturnValue({
      user: {id: '1', email: 'user@example.com'},
      isLoading: false,
      logout: mockLogout,
    });
    mockReadiness({missing: []});

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    expect(getHookState().hasPaid).toBe(true);
    expect(getHookState().showAlreadyPaidDialog).toBe(false);

    act(() => {
      getHookState().onPaymentPress();
    });

    expect(mockOpenPricing).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
    expect(getHookState().showAlreadyPaidDialog).toBe(true);
  });

  it('opens pricing status page when see status is pressed', () => {
    useAuth.mockReturnValue({
      user: {id: '1', email: 'user@example.com'},
      isLoading: false,
      logout: mockLogout,
    });
    mockReadiness({missing: []});

    const navigation = createMockNavigation<
      ProfileStackParamList,
      'Profile'
    >() as ProfileScreenNavigation;
    const getHookState = renderHook(() => useProfileScreen(navigation));

    act(() => {
      getHookState().onPaymentPress();
    });

    act(() => {
      getHookState().onSeePaymentStatus();
    });

    expect(mockOpenPricingStatus).toHaveBeenCalled();
    expect(getHookState().showAlreadyPaidDialog).toBe(false);
  });
});
