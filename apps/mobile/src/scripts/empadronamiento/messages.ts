import type {BookingAssistantAppointmentSummary} from '@/features/dashboard/types/UserProgress';

export type EmpadronamientoAppointmentDraft = Partial<
  BookingAssistantAppointmentSummary
>;

export type EmpadronamientoErrorCode =
  | 'office_continue_unavailable'
  | 'office_selector_unavailable'
  | 'confirmation_unavailable';

type EmpadronamientoSelectionMessage = {
  type: 'empadronamiento-selection';
  payload: EmpadronamientoAppointmentDraft;
};

type EmpadronamientoReviewReadyMessage = {
  type: 'empadronamiento-review-ready';
  payload: EmpadronamientoAppointmentDraft;
};

type EmpadronamientoSubmitStartedMessage = {
  type: 'empadronamiento-submit-started';
};

type EmpadronamientoErrorMessage = {
  type: 'empadronamiento-error';
  payload: {
    code: EmpadronamientoErrorCode;
    detail?: string;
  };
};

type EmpadronamientoBookingCompleteMessage = {
  type: 'empadronamiento-booking-complete';
  payload: EmpadronamientoAppointmentDraft;
};

export type EmpadronamientoWebViewMessage =
  | EmpadronamientoSelectionMessage
  | EmpadronamientoReviewReadyMessage
  | EmpadronamientoSubmitStartedMessage
  | EmpadronamientoBookingCompleteMessage
  | EmpadronamientoErrorMessage;

const ERROR_CODES: readonly EmpadronamientoErrorCode[] = [
  'office_continue_unavailable',
  'office_selector_unavailable',
  'confirmation_unavailable',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isAppointmentDraft = (
  value: unknown,
): value is EmpadronamientoAppointmentDraft => {
  if (!isRecord(value)) {
    return false;
  }

  return ['office', 'date', 'time', 'location', 'confirmationCode'].every(
    key => value[key] === undefined || typeof value[key] === 'string',
  );
};

export function isEmpadronamientoMessage(
  value: unknown,
): value is EmpadronamientoWebViewMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'empadronamiento-selection':
    case 'empadronamiento-review-ready':
    case 'empadronamiento-booking-complete':
      return isAppointmentDraft(value.payload);
    case 'empadronamiento-submit-started':
      return value.payload === undefined;
    case 'empadronamiento-error':
      return (
        isRecord(value.payload) &&
        typeof value.payload.code === 'string' &&
        ERROR_CODES.includes(value.payload.code as EmpadronamientoErrorCode) &&
        (value.payload.detail === undefined ||
          typeof value.payload.detail === 'string')
      );
    default:
      return false;
  }
}
