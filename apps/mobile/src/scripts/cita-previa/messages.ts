import type {BookingAssistantAppointmentSummary} from '@/features/dashboard/types/UserProgress';

export type CitaPreviaAppointmentDraft = Partial<
  BookingAssistantAppointmentSummary
>;

export type CitaPreviaErrorCode =
  | 'slot_confirmation_unavailable'
  | 'appointment_confirmation_unavailable';

type CitaPreviaBookingCompleteMessage = {
  type: 'cita-previa-booking-complete';
  payload: CitaPreviaAppointmentDraft;
};

type CitaPreviaErrorMessage = {
  type: 'cita-previa-error';
  payload: {
    code: CitaPreviaErrorCode;
  };
};

export type CitaPreviaWebViewMessage =
  | CitaPreviaBookingCompleteMessage
  | CitaPreviaErrorMessage;

const ERROR_CODES: readonly CitaPreviaErrorCode[] = [
  'slot_confirmation_unavailable',
  'appointment_confirmation_unavailable',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isAppointmentDraft = (
  value: unknown,
): value is CitaPreviaAppointmentDraft => {
  if (!isRecord(value)) {
    return false;
  }

  return ['office', 'date', 'time', 'location', 'confirmationCode'].every(
    key => value[key] === undefined || typeof value[key] === 'string',
  );
};

export function isCitaPreviaMessage(
  value: unknown,
): value is CitaPreviaWebViewMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'cita-previa-booking-complete') {
    return isAppointmentDraft(value.payload);
  }

  return (
    value.type === 'cita-previa-error' &&
    isRecord(value.payload) &&
    typeof value.payload.code === 'string' &&
    ERROR_CODES.includes(value.payload.code as CitaPreviaErrorCode)
  );
}
