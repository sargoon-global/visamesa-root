export const EntitlementType = {
  FULL_SERVICE: 'full_service',
  EMPADRONAMIENTO_BOOKING_ASSISTANT: 'empadronamiento_auto',
  CITA_PREVIA_BOOKING_ASSISTANT: 'cita_previa_auto',
  GUIDANCE: 'guidance',
} as const

export type EntitlementType =
  (typeof EntitlementType)[keyof typeof EntitlementType]

export type ProductType = EntitlementType

export type UserEntitlement = {
  type: EntitlementType
  grantedAt: string
  expiresAt: string | null
}

export type EntitlementsResponse = {
  entitlements: UserEntitlement[]
  citaPreviaBookedAt: string | null
  personalDetailsLockedAt: string | null
}

function activeTypes(entitlements: UserEntitlement[]): Set<string> {
  const now = Date.now()
  return new Set(
    entitlements
      .filter((entry) => !entry.expiresAt || Date.parse(entry.expiresAt) > now)
      .map((entry) => entry.type),
  )
}

export function hasEntitlement(
  entitlements: UserEntitlement[],
  type: EntitlementType,
): boolean {
  const types = activeTypes(entitlements)

  if (types.has(EntitlementType.FULL_SERVICE)) {
    return true
  }

  return types.has(type)
}

export function hasPaidService(entitlements: UserEntitlement[]): boolean {
  return activeTypes(entitlements).size > 0
}

export function isProductAlreadyCovered(
  productType: ProductType,
  entitlements: UserEntitlement[],
): boolean {
  return hasEntitlement(entitlements, productType)
}
