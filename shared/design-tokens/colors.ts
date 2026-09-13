/**
 * VisaMesa brand colors mapped to Material Design 3 token structure.
 * Source of truth for mobile app and website.
 */

export const lightColors = {
  primary: '#00215E',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E8EAED',
  onPrimaryContainer: '#1B1B1F',

  /** Done icons, completed labels, secondary CTAs. */
  secondary: '#00C49F',
  onSecondary: '#FFFFFF',
  /** Pale teal surfaces: completed step pills. */
  secondaryContainer: '#B2F0E4',
  onSecondaryContainer: '#00251F',
  /** Lighter pale teal: tab bar active pill background. */
  secondaryContainerSubtle: '#E8FAF6',

  tertiary: '#735B0F',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFDF9D',
  onTertiaryContainer: '#251A00',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  /** Incomplete / missing-item indicator (checklists, profile rows). Not form validation error. */
  incomplete: '#D82020',
  onIncomplete: '#FFFFFF',

  surface: '#FFFFFF',
  onSurface: '#1B1B1F',
  surfaceVariant: '#E0E0E0',
  onSurfaceVariant: '#44464F',
  surfaceContainer: '#F0F0F0',
  surfaceContainerHigh: '#E8E8E8',

  outline: '#75777F',
  outlineVariant: '#C5C6D0',

  background: '#FCFCFC',
  onBackground: '#1B1B1F',

  inverseSurface: '#303033',
  inverseOnSurface: '#F2F0F4',

  shadow: '#000000',
  scrim: '#000000',
} as const

export const darkColors = {
  primary: '#A8C7FA',
  onPrimary: '#002F65',
  primaryContainer: '#3A3A3F',
  onPrimaryContainer: '#E4E2E6',

  secondary: '#5DE4C4',
  onSecondary: '#003830',
  secondaryContainer: '#005244',
  onSecondaryContainer: '#B2F0E4',
  secondaryContainerSubtle: '#1A4039',

  tertiary: '#E5C16E',
  onTertiary: '#3E2E00',
  tertiaryContainer: '#584400',
  onTertiaryContainer: '#FFDF9D',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  incomplete: '#FF897D',
  onIncomplete: '#601410',

  surface: '#1B1B1F',
  onSurface: '#E4E2E6',
  surfaceVariant: '#44464F',
  onSurfaceVariant: '#C5C6D0',
  surfaceContainer: '#252529',
  surfaceContainerHigh: '#303033',

  outline: '#8F9099',
  outlineVariant: '#44464F',

  background: '#1B1B1F',
  onBackground: '#E4E2E6',

  inverseSurface: '#E4E2E6',
  inverseOnSurface: '#303033',

  shadow: '#000000',
  scrim: '#000000',
} as const

export type ColorTokens = {
  [Key in keyof typeof lightColors]: string;
};
