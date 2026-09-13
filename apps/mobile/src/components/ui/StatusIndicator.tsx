import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';

import {Icon} from '@/components/ui/Icon';
import {AppTheme} from '@/theme';

export type StatusIndicatorProps = {
  status: 'done' | 'notDone';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

type ColorToken = keyof AppTheme['colors'];

/** Design-system colors for completion indicators (shared with Checkbox, Stepper). */
export const COMPLETION_COLORS = {
  done: 'secondary',
  doneMutedSurface: 'secondaryContainer',
  notDone: 'incomplete',
} as const satisfies Record<string, ColorToken>;

/**
 * Read-only status indicator showing completion state.
 * - done: teal check circle (`secondary`)
 * - notDone: red error-outline icon (`incomplete`)
 */
export function StatusIndicator({
  status,
  size = 'md',
  style,
}: StatusIndicatorProps) {
  if (status === 'done') {
    return (
      <Icon
        name="check-circle"
        size={size}
        color={COMPLETION_COLORS.done}
        style={style}
      />
    );
  }

  return (
    <Icon
      name="error-outline"
      size={size}
      color={COMPLETION_COLORS.notDone}
      style={style}
    />
  );
}
