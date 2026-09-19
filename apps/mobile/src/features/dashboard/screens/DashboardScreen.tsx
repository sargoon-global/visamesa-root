import React from 'react';
import {ActivityIndicator, ScrollView, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createStyleSheet, useStyles} from 'react-native-unistyles';
import {CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Stepper} from '@/components/Stepper';
import {DetailLinkRow} from '@/components/ui/DetailLinkRow';
import {Text} from '@/components/ui/Text';
import {DashboardHeader} from '@/features/dashboard/components/DashboardHeader';
import {PrerequisitesDialog} from '@/features/dashboard/components/PrerequisitesDialog';
import {RequirementsChecklist} from '@/features/dashboard/components/RequirementsChecklist';
import {StepActionFooter} from '@/features/dashboard/components/StepActionFooter';
import {useDashboardScreen} from '@/features/dashboard/hooks/useDashboardScreen';
import {useTabBarInset} from '@/navigation/useTabBarInset';
import {DashboardStackParamList, RootStackParamList} from '@/navigation/types';

type DashboardScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type DashboardScreenProps = {
  navigation: DashboardScreenNavigation;
};

const DashboardScreen = ({navigation}: DashboardScreenProps) => {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('dashboard');
  const tabBarInset = useTabBarInset();
  const {
    isAuthLoading,
    isLoading,
    error,
    steps,
    currentStepId,
    currentStep,
    completedStepIds,
    isCurrentStepCompleted,
    canCompleteStep,
    canInteractWithRequirements,
    stepActionDisabledHint,
    stepActionLabel,
    currentStepRequirements,
    canStartProcess,
    readinessMissing,
    showPrerequisitesDialog,
    onStepPress,
    onStepDetailPress,
    onCompleteStep,
    onRequirementCheckboxToggle,
    onBookingAssistantPress,
    onViewAppointmentPress,
    onClearBookingAssistantPress,
    onFormPress,
    onClosePrerequisitesDialog,
    onGoToProfilePress,
    onSupportPress,
  } = useDashboardScreen(navigation);

  if (isAuthLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text variant="bodyLarge" color="error">
            {error.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentStep) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.layout}>
        <View style={styles.stickyHeader}>
          <DashboardHeader />
          <View style={styles.stepSection}>
            <Stepper
              steps={steps}
              activeStepId={currentStepId}
              completedStepIds={completedStepIds}
              compact
              onStepPress={onStepPress}
            />
          </View>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <Text variant="titleLarge">{currentStep.title}</Text>
            <DetailLinkRow
              title={t('stepDetailLabel')}
              variant="compact"
              onPress={onStepDetailPress}
            />
          </View>
          <RequirementsChecklist
            requirements={currentStepRequirements}
            interactive={canInteractWithRequirements}
            onRequirementCheckboxToggle={onRequirementCheckboxToggle}
            onBookingAssistantPress={onBookingAssistantPress}
            onViewAppointmentPress={onViewAppointmentPress}
            onClearBookingAssistantPress={onClearBookingAssistantPress}
            onFormPress={onFormPress}
            onSupportPress={onSupportPress}
          />
        </ScrollView>
        <View
          style={[
            styles.footer,
            {paddingBottom: theme.spacing.md + tabBarInset},
          ]}>
          <StepActionFooter
            label={stepActionLabel}
            disabled={!canCompleteStep}
            completed={isCurrentStepCompleted}
            disabledHint={stepActionDisabledHint}
            canStartProcess={canStartProcess}
            onPress={onCompleteStep}
          />
        </View>
      </View>
      <PrerequisitesDialog
        visible={showPrerequisitesDialog}
        missing={readinessMissing}
        onClose={onClosePrerequisitesDialog}
        onGoToProfile={onGoToProfilePress}
      />
    </SafeAreaView>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  layout: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: theme.colors.background,
  },
  stepSection: {
    marginHorizontal: theme.spacing.md,
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  stepHeader: {
    gap: theme.spacing.xs,
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  footer: {
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
}));

export default DashboardScreen;
