import type { Requirement, TieStepDetail } from '@/features/home/types/TieStepDetail'
import type { RequirementLocation } from '@visamesa/content/tieSteps/detail'

export type RequirementGroup<T extends Requirement = Requirement> = {
  location?: RequirementLocation
  requirements: T[]
}

export function groupRequirementsByLocation<T extends Requirement>(
  requirements: T[],
): RequirementGroup<T>[] {
  const inApp = requirements.filter(requirement => requirement.location === 'in_app')
  const inPerson = requirements.filter(requirement => requirement.location === 'in_person')

  const groups: RequirementGroup<T>[] = []

  if (inApp.length > 0) {
    groups.push({requirements: inApp})
  }

  if (inPerson.length > 0) {
    groups.push({location: 'in_person', requirements: inPerson})
  }

  return groups
}

export function findRequirementInSteps(
  steps: TieStepDetail[],
  stepId: number,
  requirementKey: string,
): Requirement | undefined {
  const step = steps.find(item => item.id === stepId)

  return step?.requirements.find(requirement => requirement.key === requirementKey)
}

export const FORM_SHARE_URLS: Record<string, string> = {
  'ex-17': 'https://sede.administracionespublicas.gob.es/pagina/index/directorio/ex17',
  'modelo-790-012': 'https://sede.policia.gob.es/Tasa790_012/',
}

export function isGeneratedFormView(requirement: Requirement): boolean {
  return requirement.formId === 'ex-17' && Boolean(requirement.shareableForm)
}

export function getRequirementShareMessage(
  requirement: Requirement,
): {message: string; url?: string} {
  const url = requirement.formId ? FORM_SHARE_URLS[requirement.formId] : requirement.link?.url;

  return {
    message: url
      ? `${requirement.label}\n${requirement.description ?? ''}\n${url}`.trim()
      : `${requirement.label}\n${requirement.description ?? ''}`.trim(),
    url,
  }
}
