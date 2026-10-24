import {completePersonalInfo} from '@/test/fixtures/personalInfo';

import {
  hasBookingAssistantProfile,
  mapPersonalToCitaPreviaBookingAssistantProfile,
  mapPersonalToEmpadronamientoBookingAssistantProfile,
} from '@/scripts/bookingAssistantProfile';

describe('bookingAssistantProfile mappers', () => {
  it('maps personal data for empadronamiento using NIE as the primary identifier', () => {
    expect(
      mapPersonalToEmpadronamientoBookingAssistantProfile(completePersonalInfo),
    ).toEqual({
      personalInfo: {
        identifierType: 'NIE',
        identifier: 'Y1234567X',
        name: 'Test',
        surname: 'User',
        secondSurname: '',
        email: 'test@example.com',
        phone: '600123456',
      },
      motive: 'Booking appointment to request empadronamiento.',
    });
  });

  it('removes the Spanish country code from the empadronamiento phone', () => {
    const mapped = mapPersonalToEmpadronamientoBookingAssistantProfile({
      ...completePersonalInfo,
      phoneNumber: {countryCode: '34', number: '34600123456'},
    });

    expect(mapped.personalInfo.phone).toBe('600123456');
  });

  it('does not map a foreign phone as a Spanish empadronamiento number', () => {
    const mapped = mapPersonalToEmpadronamientoBookingAssistantProfile({
      ...completePersonalInfo,
      phoneNumber: {countryCode: '44', number: '7700900123'},
    });

    expect(mapped.personalInfo.phone).toBe('');
    expect(
      hasBookingAssistantProfile(
        {
          ...completePersonalInfo,
          phoneNumber: {countryCode: '44', number: '7700900123'},
        } as unknown as Record<string, unknown>,
        'empadronamiento',
      ),
    ).toBe(false);
  });

  it('rejects malformed Spanish national numbers for empadronamiento', () => {
    expect(
      hasBookingAssistantProfile(
        {
          ...completePersonalInfo,
          phoneNumber: {countryCode: '34', number: '12345'},
        } as unknown as Record<string, unknown>,
        'empadronamiento',
      ),
    ).toBe(false);
  });

  it('uses fallback email for empadronamiento when profile email is missing', () => {
    expect(
      mapPersonalToEmpadronamientoBookingAssistantProfile(
        {...completePersonalInfo, email: ''},
        'fallback@example.com',
      ).personalInfo.email,
    ).toBe('fallback@example.com');
  });

  it('maps personal data for cita previa using NIE', () => {
    expect(mapPersonalToCitaPreviaBookingAssistantProfile(completePersonalInfo)).toMatchObject({
      details: {
        nie: 'Y1234567X',
        Name: 'Test User',
        documentType: 'nie',
      },
    });
  });

  it('validates booking assistant profile readiness', () => {
    expect(
      hasBookingAssistantProfile(
        completePersonalInfo as unknown as Record<string, unknown>,
        'empadronamiento',
      ),
    ).toBe(true);
    expect(
      hasBookingAssistantProfile(
        completePersonalInfo as unknown as Record<string, unknown>,
        'cita-previa',
      ),
    ).toBe(true);
    expect(hasBookingAssistantProfile(null, 'cita-previa')).toBe(false);
    expect(
      hasBookingAssistantProfile({firstName: 'Jane'}, 'empadronamiento'),
    ).toBe(false);
  });
});
