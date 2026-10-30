export const TIE_STEP_ORDER = [
  'empadronamiento',
  'required-documents',
  'pay-fee',
  'toma-de-huellas',
  'fingerprint-appointment',
  'collect-tie',
] as const

export type TieStepSlug = (typeof TIE_STEP_ORDER)[number]

export function isTieStepSlug(value: string): value is TieStepSlug {
  return (TIE_STEP_ORDER as readonly string[]).includes(value)
}

export type BookingAssistantId = 'empadronamiento' | 'cita-previa'

export type RequirementType = 'assisted_booking' | 'form' | 'self_declared'

export const ASSISTED_BOOKING_REQUIREMENT_TYPE =
  'assisted_booking' as const satisfies RequirementType

export type RequirementLocation = 'in_app' | 'in_person'

export type RequirementReference = {
  stepSlug: TieStepSlug
  requirementKey: string
}

export type PrintableSourceType = 'official_url' | 'form' | 'note'

export type PrintableManifest = {
  key: string
  sourceType: PrintableSourceType
  url?: string
  formId?: string
}

export type RequirementManifest = {
  key: string
  type: RequirementType
  location: RequirementLocation
  bookingAssistantId?: BookingAssistantId
  formId?: string
  referencesStepSlug?: TieStepSlug
  referencesProfile?: boolean
  referencesRequirement?: RequirementReference
  dependsOnKeys?: string[]
  shareableForm?: boolean
  link?: {
    url: string
  }
}

export type TieStepManifestEntry = {
  id: number
  slug: TieStepSlug
  officialLinkUrls: string[]
  requirements: RequirementManifest[]
  printables?: PrintableManifest[]
}

export type OfficialLink = {
  label: string
  url: string
}

export type Requirement = {
  key: string
  label: string
  description?: string
  detail?: string
  link?: OfficialLink
  type: RequirementType
  location: RequirementLocation
  bookingAssistantId?: BookingAssistantId
  formId?: string
  referencesStepId?: number
  referencesProfile?: boolean
  referencesRequirement?: RequirementReference & { stepId: number }
  dependsOnKeys?: string[]
  shareableForm?: boolean
}

export type PrintableItem = {
  key: string
  title: string
  description: string
  sourceType: PrintableSourceType
  url?: string
  formId?: string
}

export type EstimatedTimeItem = {
  label: string
  value: string
}

export type CommonQuestion = {
  question: string
  answer: string
}

export type StepCta = {
  start: string
  complete: string
}

export type TieStepDetail = {
  id: number
  slug: TieStepSlug
  title: string
  short: string
  description: string
  estimatedTime: EstimatedTimeItem[]
  officialLinks: OfficialLink[]
  whyItExists: string
  commonQuestions: CommonQuestion[]
  requirements: Requirement[]
  printables?: PrintableItem[]
  cta: StepCta
  completionPrompt: string
}

export type TieStepTranslation = {
  title: string
  short: string
  description: string
  whyItExists: string
  completionPrompt: string
  cta: StepCta
  estimatedTime: EstimatedTimeItem[]
  officialLinks: Array<{ label: string }>
  commonQuestions: CommonQuestion[]
  requirements: Record<
    string,
    {
      label: string
      description?: string
      detail?: string
      link?: { label: string }
    }
  >
  printables?: Record<
    string,
    {
      title: string
      description: string
    }
  >
}
