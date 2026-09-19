import React, {useState} from 'react';
import {Pressable, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Dialog} from '@/components/ui/Dialog';
import {Icon} from '@/components/ui/Icon';
import {Surface} from '@/components/ui/Surface';
import {Text} from '@/components/ui/Text';
import {RequirementItem} from '@/features/dashboard/components/RequirementItem';
import {RequirementProgress} from '@/features/dashboard/types/UserProgress';
import {groupRequirementsByLocation} from '@/features/dashboard/utils/requirementGroups';
import {BookingAssistantId, Requirement} from '@/features/home/types/TieStepDetail';

export type RequirementWithProgress = Requirement & {
  progress: RequirementProgress;
  hint?: string;
  isReferenced?: boolean;
  canCheck?: boolean;
  canUncheck?: boolean;
  showDocumentActions?: boolean;
  canUseActions?: boolean;
};

type RequirementsChecklistProps = {
  requirements: RequirementWithProgress[];
  interactive?: boolean;
  onRequirementCheckboxToggle: (requirementKey: string) => void;
  onBookingAssistantPress: (bookingAssistantId: BookingAssistantId, requirementKey: string) => void;
  onViewAppointmentPress: (requirementKey: string) => void;
  onClearBookingAssistantPress: (requirementKey: string) => void;
  onFormPress: (formId: string, requirementKey: string) => void;
  onSupportPress: () => void;
};

export function RequirementsChecklist({
  requirements,
  interactive = true,
  onRequirementCheckboxToggle,
  onBookingAssistantPress,
  onViewAppointmentPress,
  onClearBookingAssistantPress,
  onFormPress,
  onSupportPress,
}: RequirementsChecklistProps) {
  const {styles, theme} = useStyles(stylesheet);
  const {t: tDashboard} = useTranslation('dashboard');
  const {t: tCommon} = useTranslation('common');
  const {t: tSupport} = useTranslation('support');
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  if (requirements.length === 0) {
    return null;
  }

  const groups = groupRequirementsByLocation(requirements);

  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text variant="titleMedium">{tDashboard('requirementsTitle')}</Text>
        <Pressable
          onPress={() => setShowInfoDialog(true)}
          accessibilityRole="button"
          accessibilityLabel={tDashboard('requirementsInfoAccessibilityLabel')}
          android_ripple={{
            color: theme.colors.primaryContainer,
            borderless: true,
            radius: theme.sizes.touchTargetMin / 2,
          }}
          style={styles.infoButton}>
          <Icon name="help-outline" size="md" color="primary" />
        </Pressable>
      </View>
      <View style={styles.list}>
        {groups.map(group => (
          <View
            key={group.location ?? 'default'}
            style={styles.group}>
            {group.location === 'in_person' ? (
              <View style={styles.groupHeader}>
                <Icon name="location-on" size="sm" color="onSurfaceVariant" />
                <Text variant="labelLarge" color="onSurfaceVariant">
                  {tDashboard('locationInPerson')}
                </Text>
              </View>
            ) : null}
            {group.requirements.map(requirement => (
              <RequirementItem
                key={requirement.key}
                requirement={requirement}
                progress={requirement.progress}
                hint={requirement.hint}
                isReferenced={requirement.isReferenced}
                interactive={interactive}
                canCheck={requirement.canCheck}
                canUncheck={requirement.canUncheck}
                showDocumentActions={requirement.showDocumentActions}
                canUseActions={requirement.canUseActions}
                onRequirementCheckboxToggle={() =>
                  onRequirementCheckboxToggle(requirement.key)
                }
                onBookingAssistantPress={() =>
                  requirement.bookingAssistantId
                    ? onBookingAssistantPress(requirement.bookingAssistantId, requirement.key)
                    : undefined
                }
                onViewAppointmentPress={() =>
                  onViewAppointmentPress(requirement.key)
                }
                onClearBookingAssistantPress={() =>
                  onClearBookingAssistantPress(requirement.key)
                }
                onFormPress={() =>
                  requirement.formId
                    ? onFormPress(requirement.formId, requirement.key)
                    : undefined
                }
              />
            ))}
          </View>
        ))}
      </View>
      <Dialog
        visible={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        title={tSupport('checklistInfoTitle')}
        actions={[
          {
            label: tSupport('stillNeedHelp'),
            onPress: () => {
              setShowInfoDialog(false);
              onSupportPress();
            },
            variant: 'outline',
          },
          {
            label: tCommon('actions.gotIt'),
            onPress: () => setShowInfoDialog(false),
            variant: 'primary',
          },
        ]}>
        {tSupport('checklistInfoMessage')}
      </Dialog>
    </View>
  );

  return (
    <Surface
      variant="elevated"
      elevation={2}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
        },
      ]}>
      {content}
    </Surface>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoButton: {
    width: theme.sizes.touchTargetMin,
    height: theme.sizes.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: theme.spacing.md,
  },
  group: {
    gap: theme.spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
}));
