import type {BookingAssistantAppointmentSummary} from '@/features/dashboard/types/UserProgress';

export type EmpadronamientoAppointmentDraft = Partial<
  BookingAssistantAppointmentSummary
>;

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
    title: string;
    message: string;
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

export function isEmpadronamientoMessage(
  value: unknown,
): value is EmpadronamientoWebViewMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const type = (value as {type?: unknown}).type;
  return (
    type === 'empadronamiento-selection' ||
    type === 'empadronamiento-review-ready' ||
    type === 'empadronamiento-submit-started' ||
    type === 'empadronamiento-booking-complete' ||
    type === 'empadronamiento-error'
  );
}
