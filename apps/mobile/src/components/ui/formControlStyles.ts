import {Platform, type TextStyle, type ViewStyle} from 'react-native';

import type {AppTheme} from '@/theme';

type FormControlState = {
  focused?: boolean;
  error?: boolean;
  disabled?: boolean;
};

/** Shared box metrics for TextField, select triggers, and date triggers. */
export function getFormControlContainerStyle(
  theme: AppTheme,
  state: FormControlState = {},
): ViewStyle {
  const focused = Boolean(state.focused);
  const borderWidth = focused ? 2 : 1;
  const horizontalPadding = theme.spacing.md - (focused ? 1 : 0);

  return {
    height: theme.sizes.form.controlHeight,
    minHeight: theme.sizes.form.controlHeight,
    borderWidth,
    borderColor: state.error
      ? theme.colors.error
      : focused
        ? theme.colors.primary
        : theme.colors.outlineVariant,
    borderRadius: theme.radii.sm,
    paddingHorizontal: horizontalPadding,
    paddingVertical: 0,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    opacity: state.disabled ? 0.6 : 1,
  };
}

/** TextInput styles — omit lineHeight so the platform centers glyphs in the control. */
export function getFormControlTextInputStyle(theme: AppTheme): TextStyle {
  return {
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: theme.typography.bodyLarge.fontSize,
    color: theme.colors.onSurface,
    ...(Platform.OS === 'android'
      ? {
          textAlignVertical: 'center' as const,
          includeFontPadding: false,
        }
      : {}),
  };
}
