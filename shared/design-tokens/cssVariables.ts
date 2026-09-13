import { lightColors } from './colors.js'
import { radii } from './radii.js'
import { spacing } from './spacing.js'
import { sizes } from './sizes.js'
import { typography, type TypographyVariant } from './typography.js'

function toKebabCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function colorVariables(prefix: string, colors: Record<string, string>) {
  return Object.entries(colors)
    .map(([key, value]) => `--${prefix}-color-${toKebabCase(key)}: ${value};`)
    .join('\n  ')
}

function spacingVariables() {
  return Object.entries(spacing)
    .map(([key, value]) => `--space-${key}: ${value}px;`)
    .join('\n  ')
}

function radiusVariables() {
  return Object.entries(radii)
    .map(([key, value]) => `--radius-${key}: ${value}px;`)
    .join('\n  ')
}

function typographyVariables() {
  return (Object.entries(typography) as [TypographyVariant, (typeof typography)[TypographyVariant]][])
    .flatMap(([variant, style]) => {
      const name = toKebabCase(variant)
      return [
        `--type-${name}-size: ${style.fontSize}px;`,
        `--type-${name}-line-height: ${style.lineHeight}px;`,
        `--type-${name}-weight: ${style.fontWeight};`,
      ]
    })
    .join('\n  ')
}

/** Web Text variant aliases mapped to M3 typography tokens. */
function webTypographyAliasVariables() {
  const aliases: Record<string, TypographyVariant> = {
    display: 'displaySmall',
    headline: 'headlineMedium',
    title: 'titleLarge',
    body: 'bodyLarge',
    label: 'labelLarge',
    caption: 'bodySmall',
  }

  return Object.entries(aliases)
    .flatMap(([webVariant, m3Variant]) => {
      const style = typography[m3Variant]
      return [
        `--type-web-${webVariant}-size: ${style.fontSize}px;`,
        `--type-web-${webVariant}-line-height: ${style.lineHeight}px;`,
        `--type-web-${webVariant}-weight: ${style.fontWeight};`,
      ]
    })
    .join('\n  ')
}

/** M3 elevation levels 1–3 as CSS box-shadow (navy-tinted, matches app iOS shadows). */
function elevationVariables() {
  const shadowColor = 'rgba(0, 33, 94, 0.12)'
  const levels: Record<number, string> = {
    1: `0 1px 3px ${shadowColor}`,
    2: `0 2px 6px rgba(0, 33, 94, 0.16)`,
    3: `0 4px 10px rgba(0, 33, 94, 0.18)`,
  }

  return Object.entries(levels)
    .map(([level, value]) => `--elevation-${level}: ${value};`)
    .join('\n  ')
}

function breakpointVariables() {
  return Object.entries(sizes.breakpoints)
    .map(([key, value]) => `--breakpoint-${key}: ${value}px;`)
    .join('\n  ')
}

function layoutVariables() {
  return [
    `--content-max-width: ${sizes.marketingMaxWidth}px;`,
    `--content-app-max-width: ${sizes.contentMaxWidth}px;`,
    `--content-reading-max-width: ${sizes.readingMaxWidth}px;`,
    `--content-hero-max-width: ${sizes.heroCopyMaxWidth}px;`,
    `--content-section-lead-max-width: ${sizes.sectionLeadMaxWidth}px;`,
    `--viewport-min-width: ${sizes.viewportMin}px;`,
    `--icon-size-sm: ${sizes.icon.sm}px;`,
    `--icon-size-md: ${sizes.icon.md}px;`,
    `--icon-size-lg: ${sizes.icon.lg}px;`,
    `--brand-mark-height: ${sizes.brand.markHeightDesktop}px;`,
    `--brand-mark-height-mobile: ${sizes.brand.markHeightMobile}px;`,
    `--vm-size-touch-target-min: ${sizes.touchTargetMin}px;`,
  ].join('\n  ')
}

/** Form field tokens aligned with mobile TextField (label → control → error). */
function formVariables() {
  return [
    `--form-field-gap: ${spacing.xs}px;`,
    `--form-error-min-height: ${typography.bodySmall.lineHeight}px;`,
    `--form-control-min-height: 48px;`,
  ].join('\n  ')
}

export function createThemeCssVariables() {
  return `:root {
  ${colorVariables('vm', lightColors)}
  ${spacingVariables()}
  ${radiusVariables()}
  ${typographyVariables()}
  ${webTypographyAliasVariables()}
  ${elevationVariables()}
  ${breakpointVariables()}
  ${layoutVariables()}
  ${formVariables()}
  --gutter: ${spacing.xl}px;
  --font-family: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, -apple-system, sans-serif;
}`
}
