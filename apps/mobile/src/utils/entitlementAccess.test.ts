import {
  canUseBookingAssistant,
  hasEntitlement,
  hasPaidService,
} from '@/utils/entitlementAccess';
import { EntitlementType } from '@/types/entitlements';

describe('entitlementAccess', () => {
  const fullService = [
    { type: EntitlementType.FULL_SERVICE, grantedAt: '', expiresAt: null },
  ];

  const empadronamientoOnly = [
    {
      type: EntitlementType.EMPADRONAMIENTO_BOOKING_ASSISTANT,
      grantedAt: '',
      expiresAt: null,
    },
  ];

  it('grants all booking assistants with full service', () => {
    expect(canUseBookingAssistant(fullService, 'empadronamiento')).toBe(true);
    expect(canUseBookingAssistant(fullService, 'cita-previa')).toBe(true);
  });

  it('grants only matching booking assistant tiers', () => {
    expect(canUseBookingAssistant(empadronamientoOnly, 'empadronamiento')).toBe(true);
    expect(canUseBookingAssistant(empadronamientoOnly, 'cita-previa')).toBe(false);
  });

  it('blocks cita previa when booking is already confirmed', () => {
    expect(
      canUseBookingAssistant(fullService, 'cita-previa', {citaPreviaBooked: true}),
    ).toBe(false);
  });

  it('treats full service as access to any entitlement type', () => {
    expect(hasEntitlement(fullService, EntitlementType.GUIDANCE)).toBe(true);
  });

  it('detects when user has any paid service', () => {
    expect(hasPaidService(fullService)).toBe(true);
    expect(hasPaidService([])).toBe(false);
  });
});
