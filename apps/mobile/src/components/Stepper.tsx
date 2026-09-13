import React from 'react';
import {ScrollView, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Button} from '@/components/ui/Button';
import {COMPLETION_COLORS} from '@/components/ui/StatusIndicator';
import {Icon} from '@/components/ui/Icon';
import {Text} from '@/components/ui/Text';
import {createElevationStyle} from '@/theme/elevation';
import {brandFontStyle} from '@/theme/fonts';
import {TieStepDetail} from '@/features/home/types/TieStepDetail';
import {getStepShortLabel} from '@/utils/stepLabel';

type StepperProps = {
  steps: TieStepDetail[];
  activeStepId: number;
  completedStepIds?: number[];
  isStepPressable?: (stepId: number) => boolean;
  compact?: boolean;
  onStepPress: (stepId: number) => void;
};

export function Stepper({
  steps,
  activeStepId,
  completedStepIds = [],
  isStepPressable,
  compact = false,
  onStepPress,
}: StepperProps) {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('tieSteps');
  const completedSet = new Set(completedStepIds);
  const elevationStyle = createElevationStyle(2, theme.colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        compact && styles.scrollContentCompact,
      ]}
      accessibilityRole="tablist">
      {steps.map(step => {
        const isActive = step.id === activeStepId;
        const isCompleted = completedSet.has(step.id);
        const pressable = isStepPressable?.(step.id) ?? true;

        const variant = isCompleted
          ? 'tonal'
          : isActive
            ? 'primary'
            : 'outline';

        return (
          <View key={step.id} style={styles.item}>
            <Button
              size="icon"
              variant={variant}
              disabled={!pressable}
              accessibilityRole="tab"
              accessibilityState={{
                selected: isActive,
                disabled: !pressable,
                checked: isCompleted,
              }}
              accessibilityLabel={`${t('stepperLabel', {
                stepId: step.id,
                title: step.title,
              })}${isCompleted ? t('stepperCompleted') : ''}`}
              onPress={() => onStepPress(step.id)}
              style={[
                styles.stepButton,
                !isActive && !isCompleted && styles.stepButtonInactive,
                isCompleted && styles.stepButtonCompleted,
                !pressable && styles.stepButtonDisabled,
                elevationStyle,
              ]}>
              {isCompleted ? (
                <Icon
                  name="check"
                  size="md"
                  color={
                    isActive ? 'primary' : COMPLETION_COLORS.done
                  }
                />
              ) : (
                <Text
                  variant="labelLarge"
                  color={isActive ? 'onPrimary' : 'onSurfaceVariant'}
                  style={styles.stepNumber}>
                  {step.id}
                </Text>
              )}
            </Button>
            <Text
              variant="labelSmall"
              color="primary"
              style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                !pressable && styles.stepLabelDisabled,
              ]}
              numberOfLines={1}>
              {getStepShortLabel(step.title)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const stylesheet = createStyleSheet(theme => ({
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  scrollContentCompact: {
    paddingTop: theme.spacing.xs,
  },
  item: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stepButton: {
    minWidth: theme.sizes.touchTargetMin,
    minHeight: theme.sizes.touchTargetMin,
    borderWidth: 0,
  },
  stepButtonInactive: {
    borderWidth: 0,
    backgroundColor: theme.colors.surface,
  },
  stepButtonCompleted: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  stepButtonDisabled: {
    opacity: 0.45,
  },
  stepNumber: {
    textAlign: 'center',
  },
  stepLabel: {
    textAlign: 'center',
    maxWidth: theme.sizes.stepper.itemWidth,
  },
  stepLabelActive: brandFontStyle(
    '600',
    theme.typography.labelSmall.fontSize,
    theme.typography.labelSmall.lineHeight,
  ),
  stepLabelDisabled: {
    opacity: 0.45,
  },
}));
