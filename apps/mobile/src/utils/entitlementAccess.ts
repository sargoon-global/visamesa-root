import {
  EntitlementType,
  UserEntitlement,
  hasEntitlement,
} from '@visamesa/content/entitlements';

import { BookingAssistantId } from '@/features/home/types/TieStepDetail';

export { hasEntitlement, hasPaidService, isProductAlreadyCovered } from '@visamesa/content/entitlements';

const BOOKING_ASSISTANT_ENTITLEMENT: Record<BookingAssistantId, EntitlementType> = {
  empadronamiento: EntitlementType.EMPADRONAMIENTO_BOOKING_ASSISTANT,
  'cita-previa': EntitlementType.CITA_PREVIA_BOOKING_ASSISTANT,
};

export function canUseBookingAssistant(
  entitlements: UserEntitlement[],
  bookingAssistantId: BookingAssistantId,
  options?: {citaPreviaBooked?: boolean},
): boolean {
  if (bookingAssistantId === 'cita-previa' && options?.citaPreviaBooked) {
    return false;
  }

  const required = BOOKING_ASSISTANT_ENTITLEMENT[bookingAssistantId];
  return hasEntitlement(entitlements, required);
}
