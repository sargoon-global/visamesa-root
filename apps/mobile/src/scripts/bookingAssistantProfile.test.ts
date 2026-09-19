import {
  hasBookingAssistantProfile,
  mapPersonalToCitaPreviaBookingAssistantProfile,
  mapPersonalToEmpadronamientoBookingAssistantProfile,
} from '@/scripts/bookingAssistantProfile'

describe('bookingAssistantProfile mappers', () => {
  const personal = {
    firstName: 'Jane',
    lastName: 'Doe',
    secondLastName: 'Smith',
    nieNumber: 'X1234567L',
    passportNumber: 'A12345678',
    phoneNumber: '600123456',
    email: 'jane@example.com',
  }

  it('maps personal data for empadronamiento using NIE as the primary identifier', () => {
    expect(
      mapPersonalToEmpadronamientoBookingAssistantProfile(personal),
    ).toEqual({
      personalInfo: {
        identifierType: 'NIE',
        identifier: 'X1234567L',
        name: 'Jane',
        surname: 'Doe',
        secondSurname: 'Smith',
        email: 'jane@example.com',
        phone: '600123456',
      },
      motive: 'Booking appointment to request empadronamiento.',
    })
  })

  it('uses fallback email for empadronamiento when profile email is missing', () => {
    const withoutEmail = {
      firstName: personal.firstName,
      lastName: personal.lastName,
      secondLastName: personal.secondLastName,
      nieNumber: personal.nieNumber,
      passportNumber: personal.passportNumber,
      phoneNumber: personal.phoneNumber,
    }

    expect(
      mapPersonalToEmpadronamientoBookingAssistantProfile(
        withoutEmail,
        'fallback@example.com',
      )?.personalInfo.email,
    ).toBe('fallback@example.com')
  })

  it('maps personal data for cita previa using NIE', () => {
    expect(mapPersonalToCitaPreviaBookingAssistantProfile(personal)).toMatchObject({
      details: {
        nie: 'X1234567L',
        Name: 'Jane Doe',
        documentType: 'nie',
      },
    })
  })

  it('validates booking assistant profile readiness', () => {
    expect(
      hasBookingAssistantProfile(personal, 'empadronamiento'),
    ).toBe(true)
    expect(hasBookingAssistantProfile(personal, 'cita-previa')).toBe(true)
    expect(hasBookingAssistantProfile(null, 'cita-previa')).toBe(false)
    expect(
      hasBookingAssistantProfile({firstName: 'Jane'}, 'empadronamiento'),
    ).toBe(false)
  })
})
