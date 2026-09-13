import React from 'react';
import {Pressable, StyleProp, ViewStyle} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {COMPLETION_COLORS} from '@/components/ui/StatusIndicator';
import {Icon} from '@/components/ui/Icon';

export type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Interactive checkbox toggle.
 * - checked: teal check circle (`secondary`)
 * - unchecked: empty circle
 */
export function Checkbox({
  checked,
  onToggle,
  size = 'lg',
  disabled = false,
  style,
  accessibilityLabel,
}: CheckboxProps) {
  const {theme, styles} = useStyles(stylesheet);

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{checked, disabled}}
      accessibilityLabel={accessibilityLabel}
      android_ripple={{
        color: theme.colors.primaryContainer,
        borderless: true,
        radius: 20,
      }}
      style={[style, disabled && styles.disabled]}>
      <Icon
        name={checked ? 'check-circle' : 'radio-button-unchecked'}
        size={size}
        color={checked ? COMPLETION_COLORS.done : 'onSurfaceVariant'}
      />
    </Pressable>
  );
}

const stylesheet = createStyleSheet(() => ({
  disabled: {
    opacity: 0.45,
  },
}));
