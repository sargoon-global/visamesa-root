import { EMPADRONAMIENTO_CERTIFICATE_VALIDITY_DAYS } from './constants.js'

export function isEmpadronamientoCertificateValid(
  issuedAt: string | Date,
  now: Date = new Date(),
): boolean {
  const issued = issuedAt instanceof Date ? issuedAt : new Date(issuedAt)

  if (Number.isNaN(issued.getTime())) {
    return false
  }

  const expiry = new Date(issued)
  expiry.setDate(expiry.getDate() + EMPADRONAMIENTO_CERTIFICATE_VALIDITY_DAYS)

  return now <= expiry
}
