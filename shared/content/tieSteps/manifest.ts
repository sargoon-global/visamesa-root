import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  TIE_STEP_ORDER,
  type RequirementManifest,
  type TieStepManifestEntry,
  type TieStepSlug,
} from './types.js'

const empadronamientoRequirements: RequirementManifest[] = [
  { key: 'passport-nie', type: 'self_declared', location: 'in_app' },
  { key: 'proof-of-residence', type: 'self_declared', location: 'in_app' },
  {
    key: 'appointment-confirmation',
    type: ASSISTED_BOOKING_REQUIREMENT_TYPE,
    location: 'in_app',
    bookingAssistantId: 'empadronamiento',
    dependsOnKeys: ['passport-nie', 'proof-of-residence'],
  },
  {
    key: 'attend-ayuntamiento',
    type: 'self_declared',
    location: 'in_person',
    dependsOnKeys: ['passport-nie', 'proof-of-residence', 'appointment-confirmation'],
  },
]

const tomaDeHuellasRequirements: RequirementManifest[] = [
  {
    key: 'appointment-confirmation',
    type: ASSISTED_BOOKING_REQUIREMENT_TYPE,
    location: 'in_app',
    bookingAssistantId: 'cita-previa',
    link: {
      url: 'https://sede.administracionespublicas.gob.es/icpplus/index.html',
    },
  },
]

const requiredDocumentsRequirements: RequirementManifest[] = [
  {
    key: 'ex-17-form',
    type: 'form',
    location: 'in_app',
    formId: 'ex-17',
    shareableForm: true,
  },
]

const payFeeRequirements: RequirementManifest[] = [
  {
    key: 'modelo-790-form',
    type: 'form',
    location: 'in_app',
    formId: 'modelo-790-012',
    shareableForm: true,
  },
  {
    key: 'print-modelo-790',
    type: 'self_declared',
    location: 'in_person',
    dependsOnKeys: ['modelo-790-form'],
  },
  {
    key: 'fee-payment-receipt',
    type: 'self_declared',
    location: 'in_person',
    dependsOnKeys: ['print-modelo-790'],
  },
]

const step5DocumentKeys = [
  'ex-17-form',
  'modelo-790-receipt',
  'valid-passport',
  'passport-copies',
  'student-visa',
  'empadronamiento-certificate',
  'passport-photos',
  'appointment-confirmation-doc',
] as const

const fingerprintAppointmentRequirements: RequirementManifest[] = [
  {
    key: 'ex-17-form',
    type: 'self_declared',
    location: 'in_app',
    referencesRequirement: {
      stepSlug: 'required-documents',
      requirementKey: 'ex-17-form',
    },
  },
  {
    key: 'modelo-790-receipt',
    type: 'self_declared',
    location: 'in_app',
    referencesRequirement: {
      stepSlug: 'pay-fee',
      requirementKey: 'fee-payment-receipt',
    },
  },
  { key: 'valid-passport', type: 'self_declared', location: 'in_app' },
  { key: 'passport-copies', type: 'self_declared', location: 'in_app' },
  { key: 'student-visa', type: 'self_declared', location: 'in_app' },
  {
    key: 'empadronamiento-certificate',
    type: 'self_declared',
    location: 'in_app',
    referencesStepSlug: 'empadronamiento',
  },
  { key: 'passport-photos', type: 'self_declared', location: 'in_app' },
  {
    key: 'appointment-confirmation-doc',
    type: 'self_declared',
    location: 'in_app',
    referencesStepSlug: 'toma-de-huellas',
  },
  {
    key: 'print-documents',
    type: 'self_declared',
    location: 'in_person',
    dependsOnKeys: [...step5DocumentKeys],
  },
  {
    key: 'attend-appointment',
    type: 'self_declared',
    location: 'in_person',
    dependsOnKeys: ['print-documents'],
  },
]

const collectTieRequirements: RequirementManifest[] = [
  {
    key: 'resguardo',
    type: 'self_declared',
    location: 'in_app',
    referencesStepSlug: 'fingerprint-appointment',
  },
  { key: 'passport-collection', type: 'self_declared', location: 'in_app' },
  {
    key: 'attend-pickup',
    type: 'self_declared',
    location: 'in_person',
    dependsOnKeys: ['resguardo', 'passport-collection'],
  },
]

export const tieStepManifest: Record<TieStepSlug, TieStepManifestEntry> = {
  empadronamiento: {
    id: 1,
    slug: 'empadronamiento',
    officialLinkUrls: [
      'https://seuelectronica.ajuntament.barcelona.cat/oficinavirtual/es',
      'https://www.barcelona.cat/internationalwelcome/en',
    ],
    requirements: empadronamientoRequirements,
  },
  'toma-de-huellas': {
    id: 4,
    slug: 'toma-de-huellas',
    officialLinkUrls: [
      'https://sede.administracionespublicas.gob.es/icpplus/index.html',
    ],
    requirements: tomaDeHuellasRequirements,
  },
  'required-documents': {
    id: 2,
    slug: 'required-documents',
    officialLinkUrls: [
      'https://sede.administracionespublicas.gob.es/pagina/index/directorio/ex17',
    ],
    requirements: requiredDocumentsRequirements,
  },
  'pay-fee': {
    id: 3,
    slug: 'pay-fee',
    officialLinkUrls: ['https://sede.policia.gob.es/Tasa790_012/'],
    requirements: payFeeRequirements,
  },
  'fingerprint-appointment': {
    id: 5,
    slug: 'fingerprint-appointment',
    officialLinkUrls: [
      'https://www.barcelona.cat/internationalwelcome/en/identity-card-foreign-nationals-tie',
      'https://sede.administracionespublicas.gob.es/icpplus/index.html',
    ],
    requirements: fingerprintAppointmentRequirements,
  },
  'collect-tie': {
    id: 6,
    slug: 'collect-tie',
    officialLinkUrls: ['https://sede.policia.gob.es'],
    requirements: collectTieRequirements,
  },
}

export function getStepIdBySlug(slug: TieStepSlug): number {
  return tieStepManifest[slug].id
}

export function getStepSlugById(id: number): TieStepSlug | undefined {
  return TIE_STEP_ORDER.find((slug) => tieStepManifest[slug].id === id)
}
