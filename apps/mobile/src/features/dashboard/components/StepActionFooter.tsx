import React from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Button} from '@/components/ui/Button';
import {Text} from '@/components/ui/Text';

type StepActionFooterProps = {
  label: string;
  disabled: boolean;
  completed: boolean;
  disabledHint?: string;
  canStartProcess: boolean;
  onPress: () => void;
};

export function StepActionFooter({
  label,
  disabled,
  completed,
  disabledHint,
  canStartProcess,
  onPress,
}: StepActionFooterProps) {
  const {styles} = useStyles(stylesheet);
  const {t} = useTranslation('dashboard');

  if (completed) {
    return (
      <View style={styles.container}>
        <Text variant="labelLarge" color="secondary" style={styles.completedLabel}>
          {t('stepCompleted')}
        </Text>
      </View>
    );
  }

  const shouldShowPrerequisitesButton = !canStartProcess;
  const isButtonDisabled = shouldShowPrerequisitesButton ? false : disabled;

  return (
    <View style={styles.container}>
      {!shouldShowPrerequisitesButton && disabled && disabledHint ? (
        <Text variant="bodySmall" color="onSurfaceVariant" style={styles.hint}>
          {disabledHint}
        </Text>
      ) : null}
      <Button
        label={label}
        onPress={onPress}
        disabled={isButtonDisabled}
        fullWidth
        accessibilityLabel={label}
      />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  completedLabel: {
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
  },
  hint: {
    textAlign: 'center',
  },
}));
