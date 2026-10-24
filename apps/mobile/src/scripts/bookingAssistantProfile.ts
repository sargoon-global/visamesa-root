import type { BookingAssistantId } from '@visamesa/content/tieSteps/detail'

import {normalizePhone} from '@/features/forms/utils/phoneUtils'
import type { PersonalInfo } from '@/features/profile/utils/parsePersonalInfo'
import { parsePersonalInfo } from '@/features/profile/utils/parsePersonalInfo'

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

function formatSpanishPhoneForEmpadronamiento(
  phone: PersonalInfo['phoneNumber'],
): string {
  const normalized = normalizePhone(phone)
  const countryCode = normalized.countryCode ?? ''
  const number = normalized.number ?? ''

  return countryCode === '34' && /^[6-9]\d{8}$/.test(number) ? number : ''
}

export function mapPersonalToEmpadronamientoBookingAssistantProfile(
  info: PersonalInfo,
  fallbackEmail?: string | null,
): EmpadronamientoBookingAssistantProfile {
  const identifier = info.nieNumber || info.passportNumber
  const identifierType = info.nieNumber ? 'NIE' : 'PASSAPORT'
  const email = info.email || fallbackEmail?.trim() || ''

  return {
    personalInfo: {
      identifierType,
      identifier,
      name: info.firstName,
      surname: info.lastName,
      secondSurname: info.secondLastName ?? '',
      email,
      phone: formatSpanishPhoneForEmpadronamiento(info.phoneNumber),
    },
    motive: EMPADRONAMIENTO_BOOKING_MOTIVE,
  }
}

export function mapPersonalToCitaPreviaBookingAssistantProfile(
  info: PersonalInfo,
): CitaPreviaBookingAssistantProfile {
  return {
    details: {
      nie: info.nieNumber,
      Name: [info.firstName, info.lastName].filter(Boolean).join(' '),
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
  const parsed = parsePersonalInfo(personal)
  if (!parsed.ok) {
    return false
  }

  if (bookingAssistantId === 'empadronamiento') {
    const email = parsed.data.email || fallbackEmail?.trim() || ''
    const spanishPhone = formatSpanishPhoneForEmpadronamiento(
      parsed.data.phoneNumber,
    )
    return Boolean(email && spanishPhone)
  }

  return Boolean(parsed.data.firstName && parsed.data.nieNumber)
}

export {
  emptyCitaPreviaBookingAssistantProfile,
  emptyEmpadronamientoBookingAssistantProfile,
}
