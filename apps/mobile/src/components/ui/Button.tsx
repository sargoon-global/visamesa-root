import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Text} from '@/components/ui/Text';
import {AppTheme} from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'tonal' | 'destructive';
export type ButtonSize = 'default' | 'icon';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

type ColorToken = keyof AppTheme['colors'];

const LABEL_COLORS: Record<ButtonVariant, ColorToken> = {
  primary: 'onPrimary',
  secondary: 'onSecondary',
  outline: 'primary',
  tonal: 'onSecondaryContainer',
  destructive: 'onError',
};

export function Button({
  label,
  variant = 'primary',
  size = 'default',
  disabled = false,
  fullWidth = false,
  style,
  labelStyle,
  accessibilityLabel,
  children,
  ...props
}: ButtonProps) {
  const {styles, theme} = useStyles(stylesheet);
  const touchTargetMin = theme.sizes.touchTargetMin;

  const isIcon = size === 'icon';
  const labelColor = LABEL_COLORS[variant];
  const content = children ?? (
    <Text
      variant="labelLarge"
      color={labelColor}
      style={[styles.label, disabled && styles.labelDisabled, labelStyle]}>
      {label}
    </Text>
  );

  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{disabled}}
      accessibilityLabel={accessibilityLabel ?? label}
      android_ripple={
        disabled
          ? undefined
          : {
              color:
                variant === 'primary' || variant === 'secondary'
                  ? theme.colors.onPrimary
                  : variant === 'destructive'
                    ? theme.colors.onError
                    : theme.colors.primaryContainer,
            }
      }
      style={({pressed}) => [
        styles.base,
        {minHeight: touchTargetMin},
        isIcon ? styles.icon : styles.default,
        styles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {content}
    </Pressable>
  );
}

const stylesheet = createStyleSheet(theme => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.xl,
  },
  default: {
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
  },
  icon: {
    width: theme.sizes.touchTargetMin,
    height: theme.sizes.touchTargetMin,
    borderRadius: theme.radii.full,
    padding: 0,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  tonal: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderColor: theme.colors.outline,
  },
  destructive: {
    backgroundColor: theme.colors.error,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    textAlign: 'center',
  },
  labelDisabled: {
    opacity: 0.8,
  },
}));
