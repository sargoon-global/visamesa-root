import {act} from 'react';
import {fetchUserProgress, updateRequirementProgress} from '@/features/dashboard/services/progressService';
import {renderHook, flushAsyncEffects} from '@/test/renderHook';

import {useWebsiteWebViewScreen} from './useWebsiteWebViewScreen';

const mockNavigation = {goBack: jest.fn()};
const mockHandleMessage = jest.fn(() => false);
const updateProgress = updateRequirementProgress as jest.Mock;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

jest.mock('@/services/clientErrorService', () => ({
  reportClientError: jest.fn(),
  reportClientErrorFromException: jest.fn(),
}));

jest.mock('@/features/pdfGeneration/forms/modelo790/modelo790Storage', () => ({
  saveModelo790ReviewFile: jest.fn(),
  setModelo790PendingReview: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({user: {email: 'test@example.com'}}),
}));

jest.mock('@/features/profile/services/profileService', () => ({
  loadBookingAssistantInjectionProfiles: jest.fn(() =>
    Promise.resolve({empadronamiento: null, citaPrevia: null}),
  ),
  getProfile: jest.fn(),
}));

jest.mock('@/features/dashboard/services/progressService', () => ({
  fetchUserProgress: jest.fn(() => Promise.resolve({steps: []})),
  updateRequirementProgress: jest.fn(() => Promise.resolve({steps: []})),
}));

jest.mock('@/webViewInjection/useWebViewInjection', () => ({
  useWebViewInjection: () => ({
    activeRule: null,
    currentUrl: null,
    activeScript: null,
    handleMessage: mockHandleMessage,
    onLoadEnd: jest.fn(),
    onLoadStart: jest.fn(),
    onNavigationStateChange: jest.fn(),
  }),
}));

const citaRoute = {
  params: {
    bookingAssistant: 'cita-previa' as const,
    bookingCompletion: {stepId: 2, requirementKey: 'appointment-confirmation'},
  },
} as never;

const route = {
  params: {
    bookingAssistant: 'empadronamiento' as const,
    bookingCompletion: {stepId: 1, requirementKey: 'appointment-confirmation'},
  },
} as never;

function appointmentMessage(url: string, confirmationCode = '16723178') {
  return {
    nativeEvent: {
      url,
      data: JSON.stringify({
        type: 'empadronamiento-booking-complete',
        payload: {
          office: 'Office A',
          date: '2026-11-25',
          time: '11:40',
          confirmationCode,
        },
      }),
    },
  } as never;
}

function citaAppointmentMessage(url: string, confirmationCode = '3584AX7F') {
  return {
    nativeEvent: {
      url,
      data: JSON.stringify({
        type: 'cita-previa-booking-complete',
        payload: {
          office: 'CNP Comisaría Oficina de tramitación',
          date: '04/11/2026',
          time: '09:15',
          location: 'Olaguibel 15 Vitoria-Gasteiz 01071',
          confirmationCode,
        },
      }),
    },
  } as never;
}

describe('useWebsiteWebViewScreen Cita Previa completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchUserProgress as jest.Mock).mockResolvedValue({steps: []});
    updateProgress.mockResolvedValue({steps: []});
  });

  it('persists a valid final confirmation from the official host', async () => {
    const getState = renderHook(() => useWebsiteWebViewScreen(citaRoute));
    await flushAsyncEffects();

    await act(async () => {
      getState().onMessage(
        citaAppointmentMessage(
          'https://icp.administracionelectronica.gob.es/icpplustieb/acGrabarCita',
        ),
      );
      await Promise.resolve();
    });

    expect(updateRequirementProgress).toHaveBeenCalledWith(
      {steps: []},
      2,
      'appointment-confirmation',
      expect.objectContaining({
        completed: true,
        source: expect.objectContaining({
          bookingAssistantId: 'cita-previa',
          appointment: expect.objectContaining({
            date: '04/11/2026',
            confirmationCode: '3584AX7F',
          }),
        }),
      }),
    );
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('rejects Cita Previa completion messages from an untrusted host', async () => {
    const getState = renderHook(() => useWebsiteWebViewScreen(citaRoute));
    await flushAsyncEffects();

    await act(async () => {
      getState().onMessage(citaAppointmentMessage('https://evil.example/acGrabarCita'));
      await Promise.resolve();
    });

    expect(updateRequirementProgress).not.toHaveBeenCalled();
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });
});

describe('useWebsiteWebViewScreen empadronamiento completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchUserProgress as jest.Mock).mockResolvedValue({steps: []});
    updateProgress.mockResolvedValue({steps: []});
  });

  it('persists a valid completion only from the trusted official host', async () => {
    const getState = renderHook(() => useWebsiteWebViewScreen(route));
    await flushAsyncEffects();

    await act(async () => {
      getState().onMessage(
        appointmentMessage('https://seuelectronica.ajuntament.barcelona.cat/oficinavirtual/ca/cita/confirmation'),
      );
      await Promise.resolve();
    });

    expect(updateRequirementProgress).toHaveBeenCalledWith(
      {steps: []},
      1,
      'appointment-confirmation',
      expect.objectContaining({
        completed: true,
        source: expect.objectContaining({
          bookingAssistantId: 'empadronamiento',
          appointment: expect.objectContaining({
            office: 'Office A',
            confirmationCode: '16723178',
          }),
        }),
      }),
    );
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('rejects incomplete appointment details without persisting progress', async () => {
    const getState = renderHook(() => useWebsiteWebViewScreen(route));
    await flushAsyncEffects();

    await act(async () => {
      getState().onMessage(
        appointmentMessage(
          'https://seuelectronica.ajuntament.barcelona.cat/oficinavirtual/ca/cita/confirmation',
          '',
        ),
      );
      await Promise.resolve();
    });

    expect(updateRequirementProgress).not.toHaveBeenCalled();
    expect(getState().webViewError?.title).toBe(
      'Appointment details could not be read',
    );
  });

  it('ignores completion messages from an untrusted host', async () => {
    const getState = renderHook(() => useWebsiteWebViewScreen(route));
    await flushAsyncEffects();

    await act(async () => {
      getState().onMessage(
        appointmentMessage('https://evil.example/oficinavirtual/ca/cita/confirmation'),
      );
      await Promise.resolve();
    });

    expect(updateRequirementProgress).not.toHaveBeenCalled();
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });
});
