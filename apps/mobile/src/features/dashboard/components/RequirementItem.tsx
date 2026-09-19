import React from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, Share, View} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Button} from '@/components/ui/Button';
import {Checkbox} from '@/components/ui/Checkbox';
import {Icon} from '@/components/ui/Icon';
import {Text} from '@/components/ui/Text';
import {RequirementProgress} from '@/features/dashboard/types/UserProgress';
import {getRequirementShareMessage} from '@/features/dashboard/utils/requirementGroups';
import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  Requirement,
} from '@/features/home/types/TieStepDetail';

type RequirementItemProps = {
  requirement: Requirement;
  progress: RequirementProgress;
  hint?: string;
  isReferenced?: boolean;
  interactive?: boolean;
  canCheck?: boolean;
  canUncheck?: boolean;
  showDocumentActions?: boolean;
  canUseActions?: boolean;
  onRequirementCheckboxToggle?: () => void;
  onBookingAssistantPress?: () => void;
  onViewAppointmentPress?: () => void;
  onClearBookingAssistantPress?: () => void;
  onFormPress?: () => void;
};

export function RequirementItem({
  requirement,
  progress,
  hint,
  isReferenced = false,
  interactive = true,
  canCheck = true,
  canUncheck = true,
  showDocumentActions = false,
  canUseActions,
  onRequirementCheckboxToggle,
  onBookingAssistantPress,
  onViewAppointmentPress,
  onClearBookingAssistantPress,
  onFormPress,
}: RequirementItemProps) {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('dashboard');
  const completed = progress.completed;
  const canToggleCheckbox =
    interactive &&
    !isReferenced &&
    (requirement.type === 'self_declared'
      ? completed
        ? canUncheck
        : canCheck
      : requirement.type === 'form'
        ? completed && canUncheck
        : false);
  const bookingAssistantSource =
    progress.source?.type === ASSISTED_BOOKING_REQUIREMENT_TYPE
      ? progress.source
      : undefined;
  const hasConfirmedAppointment = Boolean(bookingAssistantSource?.appointment);
  const canClearBookingAssistant =
    interactive &&
    requirement.type === ASSISTED_BOOKING_REQUIREMENT_TYPE &&
    completed &&
    !hasConfirmedAppointment &&
    canUncheck;
  const showBookAction =
    !completed && requirement.type === ASSISTED_BOOKING_REQUIREMENT_TYPE;
  const showFormAction = !completed && requirement.type === 'form';
  const canPerformActions =
    requirement.type === ASSISTED_BOOKING_REQUIREMENT_TYPE ||
    requirement.type === 'form'
      ? (canUseActions ?? false)
      : true;
  const actionsEnabled = interactive && canPerformActions;
  const dependencyHint =
    canPerformActions || !interactive
      ? undefined
      : t('requirementDependencyHint');
  const hasAppointmentAction =
    requirement.type === ASSISTED_BOOKING_REQUIREMENT_TYPE && completed;

  const handleShareDocument = async () => {
    const {message, url} = getRequirementShareMessage(requirement);
    await Share.share({message, url});
  };

  const checkbox = (
    <Checkbox
      checked={completed}
      onToggle={onRequirementCheckboxToggle || (() => {})}
      size="lg"
      disabled={!canToggleCheckbox || !onRequirementCheckboxToggle}
      accessibilityLabel={requirement.label}
    />
  );

  const documentActions = showDocumentActions ? (
    <View style={styles.documentActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('documentShareAccessibilityLabel', {
          label: requirement.label,
        })}
        onPress={handleShareDocument}
        android_ripple={{
          color: theme.colors.primaryContainer,
          borderless: true,
        }}
        style={styles.iconButton}>
        <Icon name="share" size="md" color="primary" />
      </Pressable>
    </View>
  ) : null;

  const titleRow = (
    <View style={styles.titleRow}>
      {checkbox}
      <View style={styles.titleContent}>
        <Text variant="bodyLarge" style={styles.titleText}>
          {requirement.label}
        </Text>
        {requirement.description ? (
          <Text variant="bodySmall" color="onSurfaceVariant">
            {requirement.description}
          </Text>
        ) : null}
        {hint ? (
          <Text variant="bodySmall" color="primary">
            {hint}
          </Text>
        ) : null}
      </View>
      {documentActions}
    </View>
  );

  if (requirement.type === 'self_declared') {
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{checked: completed, disabled: !canToggleCheckbox}}
        accessibilityLabel={requirement.label}
        disabled={!canToggleCheckbox}
        android_ripple={
          canToggleCheckbox ? {color: theme.colors.primaryContainer} : undefined
        }
        onPress={onRequirementCheckboxToggle}
        style={({pressed}) => [
          styles.item,
          canToggleCheckbox && pressed && styles.pressed,
        ]}>
        {titleRow}
      </Pressable>
    );
  }

  return (
    <View style={styles.item}>
      {titleRow}
      {showBookAction ? (
        <View style={styles.actionGroup}>
          <Button
            label={t('bookViaVisaMesa')}
            variant="primary"
            disabled={!actionsEnabled}
            onPress={onBookingAssistantPress}
            accessibilityLabel={t('bookAccessibilityLabel', {
              label: requirement.label,
            })}
            accessibilityHint={dependencyHint}
            style={styles.actionButtonNested}
          />
        </View>
      ) : null}
      {showFormAction ? (
        <View style={styles.actionGroup}>
          <Button
            label={t('reviewForm')}
            variant="primary"
            disabled={!actionsEnabled}
            onPress={onFormPress}
            accessibilityLabel={t('reviewAccessibilityLabel', {
              label: requirement.label,
            })}
            accessibilityHint={dependencyHint}
            style={styles.actionButtonNested}
          />
        </View>
      ) : null}
      {hasAppointmentAction ? (
        <View style={styles.completedActions}>
          <Button
            label={t('viewAppointment')}
            variant="tonal"
            onPress={onViewAppointmentPress}
            accessibilityLabel={t('viewAppointmentAccessibilityLabel', {
              label: requirement.label,
            })}
            style={styles.actionButton}
          />
          {canClearBookingAssistant ? (
            <Button
              label={t('markAsNotBooked')}
              variant="outline"
              onPress={onClearBookingAssistantPress}
              accessibilityLabel={t('markAsNotBookedAccessibilityLabel', {
                label: requirement.label,
              })}
              style={styles.actionButton}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  item: {
    width: '100%',
    paddingVertical: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    width: '100%',
  },
  titleContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleText: {
    flexShrink: 1,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconButton: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginLeft: theme.sizes.icon.lg + theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButtonNested: {
    alignSelf: 'flex-start',
  },
  actionGroup: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    width: '100%',
    gap: theme.spacing.sm,
    marginLeft: theme.sizes.icon.lg + theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  completedActions: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    width: '100%',
    gap: theme.spacing.sm,
    marginLeft: theme.sizes.icon.lg + theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceContainer,
    marginHorizontal: -theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
}));
