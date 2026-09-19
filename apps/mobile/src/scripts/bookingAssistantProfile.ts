import type { BookingAssistantId } from '@visamesa/content/tieSteps/detail'

import {
  CITA_PREVIA_BOOKING_DEFAULTS,
  emptyCitaPreviaBookingAssistantProfile,
  type CitaPreviaBookingAssistantProfile,
} from './cita-previa/config'
import {
  EMPADRONAMIENTO_BOOKING_MOTIVE,
  emptyEmpadronamientoBookingAssistantProfile,
  type EmpadronamientoBookingAssistantProfile,
} from './empadronamiento/config'

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readLegacyDocumentFields(personal: Record<string, unknown>) {
  const legacyType = readString(personal.documentType)
  const legacyNumber = readString(personal.documentNumber)

  return {
    nieNumber:
      readString(personal.nieNumber) ||
      (legacyType === 'nie' ? legacyNumber : ''),
    passportNumber:
      readString(personal.passportNumber) ||
      (legacyType === 'passport' ? legacyNumber : ''),
  }
}

export function mapPersonalToEmpadronamientoBookingAssistantProfile(
  personal: Record<string, unknown>,
  fallbackEmail?: string | null,
): EmpadronamientoBookingAssistantProfile | null {
  const name = readString(personal.firstName)
  const surname = readString(personal.lastName)
  const {nieNumber, passportNumber} = readLegacyDocumentFields(personal)
  const identifier = nieNumber || passportNumber
  const identifierType = nieNumber ? 'NIE' : 'PASSAPORT'
  const phone = readString(personal.phoneNumber)
  const email = readString(personal.email) || readString(fallbackEmail)

  if (!name || !surname || !identifier || !phone || !email) {
    return null
  }

  return {
    personalInfo: {
      identifierType,
      identifier,
      name,
      surname,
      secondSurname: readString(personal.secondLastName),
      email,
      phone,
    },
    motive: EMPADRONAMIENTO_BOOKING_MOTIVE,
  }
}

export function mapPersonalToCitaPreviaBookingAssistantProfile(
  personal: Record<string, unknown>,
): CitaPreviaBookingAssistantProfile | null {
  const firstName = readString(personal.firstName)
  const lastName = readString(personal.lastName)
  const {nieNumber} = readLegacyDocumentFields(personal)

  if (!firstName || !nieNumber) {
    return null
  }

  return {
    details: {
      nie: nieNumber,
      Name: [firstName, lastName].filter(Boolean).join(' '),
      nationality: CITA_PREVIA_BOOKING_DEFAULTS.defaultNationality,
      documentType: 'nie',
    },
    provinceOptionIndex: CITA_PREVIA_BOOKING_DEFAULTS.provinceOptionIndex,
    tramitesOptionIndex: CITA_PREVIA_BOOKING_DEFAULTS.tramitesOptionIndex,
  }
}

export type BookingAssistantInjectionProfiles = {
  personal: Record<string, unknown>
  empadronamiento: EmpadronamientoBookingAssistantProfile | null
  citaPrevia: CitaPreviaBookingAssistantProfile | null
}

export function hasBookingAssistantProfile(
  personal: Record<string, unknown> | null,
  bookingAssistantId: BookingAssistantId,
  fallbackEmail?: string | null,
): boolean {
  if (!personal) {
    return false
  }

  if (bookingAssistantId === 'empadronamiento') {
    return (
      mapPersonalToEmpadronamientoBookingAssistantProfile(
        personal,
        fallbackEmail,
      ) !== null
    )
  }

  return mapPersonalToCitaPreviaBookingAssistantProfile(personal) !== null
}

export {
  emptyCitaPreviaBookingAssistantProfile,
  emptyEmpadronamientoBookingAssistantProfile,
}
