import { tieStepManifest } from './manifest.js'
import {
  TIE_STEP_ORDER,
  type PrintableItem,
  type Requirement,
  type TieStepDetail,
  type TieStepSlug,
  type TieStepTranslation,
} from './types.js'

export type TieStepsTranslateFn = (
  key: string,
  options?: { returnObjects?: boolean },
) => string | unknown

function buildRequirements(
  slug: TieStepSlug,
  translation: TieStepTranslation,
  slugToId: Record<TieStepSlug, number>,
): Requirement[] {
  const manifest = tieStepManifest[slug]

  return manifest.requirements.map((entry: typeof manifest.requirements[number]) => {
    const copy = translation.requirements[entry.key]

    if (!copy) {
      throw new Error(`Missing requirement translation: tieSteps:steps.${slug}.requirements.${entry.key}`)
    }

    const requirement: Requirement = {
      key: entry.key,
      label: copy.label,
      description: copy.description,
      detail: copy.detail,
      type: entry.type,
      location: entry.location,
      bookingAssistantId: entry.bookingAssistantId,
      formId: entry.formId,
      referencesProfile: entry.referencesProfile,
      dependsOnKeys: entry.dependsOnKeys,
      shareableForm: entry.shareableForm,
    }

    if (entry.link) {
      requirement.link = {
        label: copy.link?.label ?? copy.label,
        url: entry.link.url,
      }
    }

    if (entry.referencesStepSlug) {
      requirement.referencesStepId = slugToId[entry.referencesStepSlug]
    }

    if (entry.referencesRequirement) {
      requirement.referencesRequirement = {
        ...entry.referencesRequirement,
        stepId: slugToId[entry.referencesRequirement.stepSlug],
      }
    }

    return requirement
  })
}

function buildPrintables(
  slug: TieStepSlug,
  translation: TieStepTranslation,
): PrintableItem[] | undefined {
  const manifest = tieStepManifest[slug].printables

  if (!manifest?.length) {
    return undefined
  }

  const copy = translation.printables ?? {}

  return manifest.map((entry: typeof manifest[number]) => {
    const itemCopy = copy[entry.key]

    if (!itemCopy) {
      throw new Error(`Missing printable translation: tieSteps:steps.${slug}.printables.${entry.key}`)
    }

    return {
      key: entry.key,
      title: itemCopy.title,
      description: itemCopy.description,
      sourceType: entry.sourceType,
      url: entry.url,
      formId: entry.formId,
    }
  })
}

export function buildTieSteps(t: TieStepsTranslateFn): TieStepDetail[] {
  const slugToId = Object.fromEntries(
    TIE_STEP_ORDER.map((slug: TieStepSlug) => [slug, tieStepManifest[slug].id]),
  ) as Record<TieStepSlug, number>

  return TIE_STEP_ORDER.map((slug: TieStepSlug) => {
    const manifest = tieStepManifest[slug]
    const translation = t(`tieSteps:steps.${slug}`, { returnObjects: true }) as TieStepTranslation

    if (!translation || typeof translation !== 'object') {
      throw new Error(`Missing step translation: tieSteps:steps.${slug}`)
    }

    return {
      id: manifest.id,
      slug,
      title: translation.title,
      short: translation.short,
      description: translation.description,
      whyItExists: translation.whyItExists,
      completionPrompt: translation.completionPrompt,
      cta: translation.cta,
      estimatedTime: translation.estimatedTime,
      officialLinks: manifest.officialLinkUrls.map((url: string, index: number) => ({
        url,
        label: translation.officialLinks[index]?.label ?? url,
      })),
      commonQuestions: translation.commonQuestions,
      requirements: buildRequirements(slug, translation, slugToId),
      printables: buildPrintables(slug, translation),
    }
  })
}
