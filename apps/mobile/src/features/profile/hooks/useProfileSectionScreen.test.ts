import {act} from 'react';
import {RouteProp} from '@react-navigation/native';

import {useProfileSectionScreen} from '@/features/profile/hooks/useProfileSectionScreen';
import {createMockNavigation} from '@/test/navigation';
import {renderHook} from '@/test/renderHook';
import {ProfileStackParamList} from '@/navigation/types';
import {consentService} from '@/features/profile/services/consentService';

const mockRefreshConsent = jest.fn();

jest.mock('@/contexts/ConsentContext', () => ({
  useConsent: () => ({
    refreshConsent: mockRefreshConsent,
  }),
}));

jest.mock('@/features/profile/context/ProfileDataContext', () => ({
  useProfileData: () => ({
    personalInitialValues: {fullName: 'Jane Doe'},
    isSubmittingPersonal: false,
    submitPersonal: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@/contexts/EntitlementsContext', () => ({
  useEntitlements: () => ({isPersonalDetailsLocked: false}),
}));

jest.mock('@/features/profile/hooks/useStepInvalidationPrompt', () => ({
  useStepInvalidationPrompt: () => ({
    affectedSteps: [],
    isDialogVisible: false,
    isConfirming: false,
    requestConfirmation: jest.fn(async () => 'save'),
    cancel: jest.fn(),
    confirm: jest.fn(),
  }),
}));

jest.mock('@/features/profile/services/consentService', () => ({
  consentService: {
    hasAcceptedConsent: jest.fn(),
    recordConsent: jest.fn(),
  },
}));

const createRoute = (): RouteProp<ProfileStackParamList, 'ProfileSection'> =>
  ({
    key: 'profile-section',
    name: 'ProfileSection',
    params: {sectionId: 'personal'},
  }) as RouteProp<ProfileStackParamList, 'ProfileSection'>;

describe('useProfileSectionScreen', () => {
  beforeEach(() => {
    mockRefreshConsent.mockReset();
    (consentService.hasAcceptedConsent as jest.Mock).mockResolvedValue(true);
    (consentService.recordConsent as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns the personal section form configuration', () => {
    const route = createRoute();
    const navigation = createMockNavigation<
      ProfileStackParamList,
      'ProfileSection'
    >();
    const getHookState = renderHook(() =>
      useProfileSectionScreen(route, navigation),
    );

    expect(getHookState().formId).toBe('profile-personal');
    expect(getHookState().title).toBe('Personal Information');
    expect(getHookState().initialValues).toEqual({fullName: 'Jane Doe'});
  });

  it('shows the consent dialog when consent has not been accepted', async () => {
    (consentService.hasAcceptedConsent as jest.Mock).mockResolvedValue(false);
    const route = createRoute();
    const navigation = createMockNavigation<
      ProfileStackParamList,
      'ProfileSection'
    >();
    const getHookState = renderHook(() =>
      useProfileSectionScreen(route, navigation),
    );

    await act(async () => {
      await getHookState().onSubmit({fullName: 'Jane Doe'});
    });

    expect(getHookState().showConsentDialog).toBe(true);
  });
});
