import React from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Dialog} from '@/components/ui/Dialog';
import {Text} from '@/components/ui/Text';

type StepSummary = {
  id: number;
  title: string;
};

type StepInvalidationDialogProps = {
  steps: StepSummary[];
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function StepInvalidationDialog({
  steps,
  isConfirming,
  onConfirm,
  onCancel,
}: StepInvalidationDialogProps) {
  const {styles} = useStyles(stylesheet);
  const {t} = useTranslation('profile');
  const {t: tCommon} = useTranslation('common');
  const {t: tTieSteps} = useTranslation('tieSteps');
  const stepLabels = steps.map(step =>
    tTieSteps('stepperLabel', {stepId: step.id, title: step.title}),
  );

  return (
    <Dialog
      visible={true}
      onClose={onCancel}
      dismissable={!isConfirming}
      title={t('stepInvalidationDialog.title')}
      actions={[
        {
          label: tCommon('actions.cancel'),
          onPress: onCancel,
          variant: 'outline',
          disabled: isConfirming,
        },
        {
          label: isConfirming
            ? t('stepInvalidationDialog.confirming')
            : t('stepInvalidationDialog.confirm'),
          onPress: onConfirm,
          variant: 'primary',
          disabled: isConfirming,
        },
      ]}>
      <View
        style={styles.content}
        accessibilityRole="text"
        accessibilityLabel={`${t('stepInvalidationDialog.message')} ${stepLabels.join(', ')}`}>
        <Text variant="bodyMedium">{t('stepInvalidationDialog.message')}</Text>
        {steps.map(step => (
          <Text key={step.id} variant="bodyMedium" color="primary">
            {tTieSteps('stepperLabel', {stepId: step.id, title: step.title})}
          </Text>
        ))}
      </View>
    </Dialog>
  );
}

const stylesheet = createStyleSheet(theme => ({
  content: {
    gap: theme.spacing.sm,
  },
}));
