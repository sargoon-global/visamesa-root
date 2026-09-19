import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  BookingAssistantId,
  TieStepDetail,
} from '@/features/home/types/TieStepDetail';
import {useEffect, useMemo, useState} from 'react';
import {TFunction} from 'i18next';
import {useTranslation} from 'react-i18next';
import {CompositeNavigationProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useToast} from '@/components/Toast/ToastProvider';
import {useAppDialog} from '@/contexts/AppDialogContext';
import {useAuth} from '@/contexts/AuthContext';
import {useEntitlements} from '@/contexts/EntitlementsContext';
import {usePricingLink} from '@/hooks/usePricingLink';
import {RequirementWithProgress} from '@/features/dashboard/components/RequirementsChecklist';
import {formatAppointmentDetailsMessage} from '@/features/dashboard/data/dashboardContent';
import {syncEmpadronamientoStepFromProfile} from '@/features/dashboard/services/empadronamientoProgressService';
import {EX17_FORM_ID} from '@/features/pdfGeneration/forms/ex17/ex17Constants';
import {useEx17FormFlow} from '@/features/dashboard/hooks/useEx17FormFlow';
import {reconcileStepStatuses} from '@/features/dashboard/services/progressReconciliationService';
import {
  buildInitialProgressFromSteps,
  saveUserProgress,
  subscribeToProgressReset,
} from '@/features/dashboard/services/progressService';
import {useUserProgress} from '@/features/dashboard/hooks/useUserProgress';
import {
  ProgressContext,
  UserProgress,
} from '@/features/dashboard/types/UserProgress';
import {isUserProgressEqual} from '@/features/dashboard/utils/userProgressEquality';
import {formatCompletedInHint} from '@/features/dashboard/utils/completionHints';
import {getRequirementToggleState} from '@/features/dashboard/utils/requirementDependencies';
import {
  areAllRequirementsComplete,
  arePreviousStepsCompleted,
  getCompletedStepIds,
  getEffectiveRequirementProgress,
  getFirstIncompleteStepId,
  getStepStatus,
  isRequirementExternallyCompleted,
} from '@/features/dashboard/utils/progressUtils';
import {getProfile, loadBookingAssistantInjectionProfiles} from '@/features/profile/services/profileService';
import {useTieSteps} from '@/features/home/hooks/useTieSteps';
import {
  ProcessReadinessMissing,
  useProcessReadiness,
} from '@/hooks/useProcessReadiness';
import {usePrerequisitesDialog} from '@/hooks/usePrerequisitesDialog';
import {navigateToLoginFromTab} from '@/navigation/navigateToLogin';
import {
  DashboardStackParamList,
  RootStackParamList,
} from '@/navigation/types';

type DashboardScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type UseDashboardScreenResult = {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  steps: TieStepDetail[];
  isLoading: boolean;
  error: Error | null;
  currentStepId: number;
  activeStepId: number;
  currentStep: TieStepDetail | undefined;
  completedStepIds: number[];
  isCurrentStepCompleted: boolean;
  canCompleteStep: boolean;
  canInteractWithRequirements: boolean;
  stepActionDisabledHint?: string;
  stepActionLabel: string;
  currentStepRequirements: RequirementWithProgress[];
  canStartProcess: boolean;
  readinessMissing: ProcessReadinessMissing[];
  showPrerequisitesDialog: boolean;
  onSignInPress: () => void;
  onStepPress: (stepId: number) => void;
  onStepDetailPress: () => void;
  onCompleteStep: () => void;
  onRequirementCheckboxToggle: (requirementKey: string) => void;
  onBookingAssistantPress: (bookingAssistantId: BookingAssistantId, label: string) => void;
  onViewAppointmentPress: (label: string) => void;
  onClearBookingAssistantPress: (label: string) => void;
  onFormPress: (formId: string, requirementKey: string) => void;
  onApproveAndDownloadForm: (formId: string, requirementKey: string) => void;
  onFormView: (formId: string, requirementKey: string) => void;
  onClosePrerequisitesDialog: () => void;
  onGoToProfilePress: () => void;
  onSupportPress: () => void;
};

function buildRequirementsWithProgress(
  progress: UserProgress,
  step: TieStepDetail,
  context: ProgressContext,
  steps: TieStepDetail[],
  tDashboard: TFunction<'dashboard'>,
  canStartProcess: boolean,
): RequirementWithProgress[] {
  return step.requirements.map(requirement => {
    const effectiveProgress = getEffectiveRequirementProgress(
      progress,
      step,
      requirement.key,
      context,
    );

    const displayProgress = effectiveProgress;

    const isReferenced =
      canStartProcess && isRequirementExternallyCompleted(effectiveProgress);
    const hint = isReferenced
      ? formatCompletedInHint(tDashboard, effectiveProgress.source)
      : undefined;
    const toggleState = getRequirementToggleState(
      progress,
      step,
      requirement.key,
      context,
      steps,
    );

    return {
      ...requirement,
      progress: displayProgress,
      hint,
      isReferenced,
      canCheck: isReferenced ? false : toggleState.canCheck,
      canUncheck: isReferenced ? false : toggleState.canUncheck,
      showDocumentActions: toggleState.showDocumentActions,
      canUseActions: isReferenced ? false : toggleState.canUseActions,
    };
  });
}

export function useDashboardScreen(
  navigation: DashboardScreenNavigation,
): UseDashboardScreenResult {
  const {t: tDashboard} = useTranslation('dashboard');
  const {t: tHome} = useTranslation('home');
  const {t: tCommon} = useTranslation('common');
  const {user, isLoading: isAuthLoading} = useAuth();
  const {canUseBookingAssistant: canUseBookingAssistantEntitlement} = useEntitlements();
  const {showToast} = useToast();
  const {showAlert} = useAppDialog();
  const {openPricing} = usePricingLink();
  const {steps, isLoading: isStepsLoading, error: stepsError} = useTieSteps();
  const {
    progress,
    isLoading: isProgressLoading,
    error: progressError,
    refreshProgress,
    completeStep,
    toggleSelfDeclaredRequirement,
    clearBookingAssistantRequirement,
    completeFormRequirement,
  } = useUserProgress();
  const {
    canStartProcess,
    missing: readinessMissing,
    isProfileComplete,
    refreshReadiness,
  } = useProcessReadiness();
  const {
    visible: showPrerequisitesDialog,
    openDialog: openPrerequisitesDialog,
    closeDialog: onClosePrerequisitesDialog,
    onGoToProfilePress,
  } = usePrerequisitesDialog(refreshReadiness);

  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [hasSyncedEmpadronamiento, setHasSyncedEmpadronamiento] =
    useState(false);

  const isAuthenticated = Boolean(user);

  const displayProgress = useMemo(() => {
    if (!isAuthenticated) {
      if (!steps.length) {
        return null;
      }

      return buildInitialProgressFromSteps(steps);
    }

    return progress;
  }, [isAuthenticated, progress, steps]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedStepId(null);
    }
  }, [isAuthenticated]);

  const progressContext = useMemo<ProgressContext>(
    () => ({
      isProfileComplete,
      allSteps: steps,
    }),
    [isProfileComplete, steps],
  );

  useEffect(() => {
    return subscribeToProgressReset(() => {
      setHasSyncedEmpadronamiento(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !progress || !steps.length || hasSyncedEmpadronamiento) {
      return;
    }

    let cancelled = false;

    getProfile()
      .then(async profileData => {
        if (cancelled) {
          return;
        }

        let next = await syncEmpadronamientoStepFromProfile(
          progress,
          profileData,
        );
        next = reconcileStepStatuses(next, steps, progressContext);

        if (!isUserProgressEqual(next, progress)) {
          await saveUserProgress(next);
          await refreshProgress();
        }

        setHasSyncedEmpadronamiento(true);
      })
      .catch(async () => {
        if (cancelled) {
          return;
        }

        const next = reconcileStepStatuses(progress, steps, progressContext);

        if (!isUserProgressEqual(next, progress)) {
          await saveUserProgress(next);
          await refreshProgress();
        }

        setHasSyncedEmpadronamiento(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasSyncedEmpadronamiento,
    progress,
    progressContext,
    refreshProgress,
    steps,
    user,
  ]);

  const activeStepId = displayProgress
    ? getFirstIncompleteStepId(displayProgress, steps)
    : 1;

  useEffect(() => {
    if (displayProgress && selectedStepId === null) {
      setSelectedStepId(activeStepId);
    }
  }, [activeStepId, displayProgress, selectedStepId]);

  const currentStepId = selectedStepId ?? activeStepId;

  const currentStep = useMemo(
    () => steps.find(step => step.id === currentStepId),
    [currentStepId, steps],
  );

  const completedStepIds = useMemo(
    () => (displayProgress ? getCompletedStepIds(displayProgress) : []),
    [displayProgress],
  );

  const isCurrentStepCompleted = Boolean(
    displayProgress &&
      getStepStatus(displayProgress, currentStepId) === 'completed',
  );

  const canInteractWithRequirements = Boolean(
    isAuthenticated &&
      displayProgress &&
      currentStep &&
      !isCurrentStepCompleted &&
      (currentStepId === 1 ||
        arePreviousStepsCompleted(displayProgress, currentStepId, steps)) &&
      canStartProcess,
  );

  const {
    enrichRequirements,
    onFormPress: onEx17FormPress,
    onFormView,
    onApproveAndDownloadForm,
  } = useEx17FormFlow({
    currentStep,
    currentStepId,
    progress,
    canInteractWithRequirements,
    progressContext,
    steps,
    isAuthenticated,
    tDashboard,
    tCommon,
    completeFormRequirement,
  });

  const currentStepRequirements = useMemo(() => {
    if (!displayProgress || !currentStep) {
      return [];
    }

    return enrichRequirements(
      buildRequirementsWithProgress(
        displayProgress,
        currentStep,
        progressContext,
        steps,
        tDashboard,
        canStartProcess,
      ),
    );
  }, [
    canStartProcess,
    currentStep,
    displayProgress,
    enrichRequirements,
    progressContext,
    steps,
    tDashboard,
  ]);

  const canCompleteStep = Boolean(
    isAuthenticated &&
      displayProgress &&
      currentStep &&
      !isCurrentStepCompleted &&
      arePreviousStepsCompleted(displayProgress, currentStepId, steps) &&
      areAllRequirementsComplete(displayProgress, currentStep, progressContext) &&
      canStartProcess,
  );

  const stepActionLabel = useMemo(() => {
    if (!canStartProcess) {
      return tHome('prerequisitesButton');
    }
    return currentStep?.cta.complete ?? tDashboard('completeStepFallback');
  }, [canStartProcess, currentStep, tDashboard, tHome]);

  const stepActionDisabledHint = useMemo(() => {
    if (!displayProgress || !currentStep || isCurrentStepCompleted) {
      return undefined;
    }

    if (!arePreviousStepsCompleted(displayProgress, currentStepId, steps)) {
      return tDashboard('completePreviousStepHint');
    }

    if (
      !areAllRequirementsComplete(displayProgress, currentStep, progressContext)
    ) {
      return tDashboard('completeAllItemsHint');
    }

    return undefined;
  }, [
    displayProgress,
    currentStep,
    isCurrentStepCompleted,
    currentStepId,
    steps,
    progressContext,
    tDashboard,
  ]);

  const onSignInPress = () => {
    navigateToLoginFromTab(navigation);
  };

  const onSupportPress = () => {
    navigation.navigate('Support');
  };

  const onStepPress = (stepId: number) => {
    setSelectedStepId(stepId);
  };

  const onStepDetailPress = () => {
    if (!currentStep) {
      return;
    }

    navigation.navigate('StepDetail', {stepId: currentStep.id});
  };

  const onCompleteStep = () => {
    // If prerequisites not met, show dialog instead
    if (!canStartProcess) {
      openPrerequisitesDialog();
      return;
    }

    if (!progress || !currentStep || !canCompleteStep) {
      return;
    }

    showAlert(
      tDashboard('confirmCompletionTitle'),
      currentStep.completionPrompt,
      [
        {text: tDashboard('notYet'), style: 'cancel'},
        {
          text: tDashboard('yesDone'),
          onPress: async () => {
            const nextStepId = getFirstIncompleteStepId(
              {
                ...progress,
                steps: progress.steps.map(step =>
                  step.stepId === currentStep.id
                    ? {...step, status: 'completed' as const}
                    : step,
                ),
              },
              steps,
            );
            await completeStep(currentStep.id, nextStepId);
            setSelectedStepId(nextStepId);
            showToast(tDashboard('stepCompleted'));
          },
        },
      ],
    );
  };

  const onRequirementCheckboxToggle = async (requirementKey: string) => {
    if (!progress || !currentStep || !canInteractWithRequirements) {
      return;
    }

    const toggleState = getRequirementToggleState(
      progress,
      currentStep,
      requirementKey,
      progressContext,
      steps,
    );
    const stored = progress.steps.find(step => step.stepId === currentStep.id)
      ?.requirements[requirementKey] ?? {completed: false};

    if (stored.completed) {
      if (!toggleState.canUncheck) {
        showToast(tDashboard('requirementLockedHint'));
        return;
      }
    } else if (!toggleState.canCheck) {
      showToast(tDashboard('requirementDependencyHint'));
      return;
    }

    if (
      isRequirementExternallyCompleted(
        getEffectiveRequirementProgress(
          progress,
          currentStep,
          requirementKey,
          progressContext,
        ),
      )
    ) {
      return;
    }

    await toggleSelfDeclaredRequirement(
      currentStep.id,
      requirementKey,
      !stored.completed,
    );
  };

  const onBookingAssistantPress = async (
    bookingAssistantId: BookingAssistantId,
    requirementKey: string,
  ) => {
    if (!progress || !currentStep || !canInteractWithRequirements) {
      return;
    }

    const toggleState = getRequirementToggleState(
      progress,
      currentStep,
      requirementKey,
      progressContext,
      steps,
    );

    if (!toggleState.canUseActions) {
      showToast(tDashboard('requirementDependencyHint'));
      return;
    }

    if (!canUseBookingAssistantEntitlement(bookingAssistantId)) {
      showAlert(
        tDashboard('serviceRequiredTitle'),
        tDashboard('serviceRequiredMessage'),
        [
          {text: tCommon('actions.notNow'), style: 'cancel'},
          {
            text: tDashboard('getService'),
            onPress: () => {
              openPricing().catch(() => {});
            },
          },
        ],
      );
      return;
    }

    const loaded = await loadBookingAssistantInjectionProfiles(user?.email);
    const hasProfile =
      loaded &&
      (bookingAssistantId === 'empadronamiento'
        ? loaded.empadronamiento !== null
        : loaded.citaPrevia !== null);

    if (!hasProfile) {
      showAlert(
        tCommon('bookingAssistant.missingProfile'),
        tDashboard('readinessDescription'),
        [
          {text: tCommon('actions.notNow'), style: 'cancel'},
          {
            text: tDashboard('prerequisitesDialog.action'),
            onPress: onGoToProfilePress,
          },
        ],
      );
      return;
    }

    navigation.navigate('WebsiteWebView', {
      bookingAssistant: bookingAssistantId,
    });
  };

  const onViewAppointmentPress = (label: string) => {
    if (!progress || !currentStep) {
      return;
    }

    const requirementProgress = progress.steps.find(
      step => step.stepId === currentStep.id,
    )?.requirements[label];

    const appointment =
      requirementProgress?.source?.type === ASSISTED_BOOKING_REQUIREMENT_TYPE
        ? requirementProgress.source.appointment
        : undefined;

    showAlert(
      tDashboard('appointmentDetailsTitle'),
      formatAppointmentDetailsMessage(
        (key, options) => tDashboard(key, options),
        appointment,
      ),
      [{text: tCommon('actions.gotIt')}],
    );
  };

  const onClearBookingAssistantPress = async (requirementKey: string) => {
    if (!currentStep || !progress || !canInteractWithRequirements) {
      return;
    }

    const toggleState = getRequirementToggleState(
      progress,
      currentStep,
      requirementKey,
      progressContext,
      steps,
    );

    if (!toggleState.canUncheck) {
      showToast(tDashboard('requirementLockedHint'));
      return;
    }

    await clearBookingAssistantRequirement(currentStep.id, requirementKey);
    showToast(tDashboard('bookingStatusReset'));
  };

  const confirmFormRequirement = (formId: string, requirementKey: string) => {
    if (!currentStep || !progress) {
      return;
    }

    const toggleState = getRequirementToggleState(
      progress,
      currentStep,
      requirementKey,
      progressContext,
      steps,
    );

    if (!toggleState.canUseActions) {
      showToast(tDashboard('requirementDependencyHint'));
      return;
    }

    showAlert(
      tDashboard('confirmFormTitle'),
      tDashboard('confirmFormMessage'),
      [
        {text: tCommon('actions.cancel'), style: 'cancel'},
        {
          text: tCommon('actions.confirm'),
          onPress: async () => {
            try {
              await completeFormRequirement(
                currentStep.id,
                requirementKey,
                formId,
              );
              showToast(tDashboard('formConfirmed'));
            } catch (formError) {
              showAlert(
                tCommon('errors.title'),
                formError instanceof Error
                  ? formError.message
                  : tCommon('errors.generic'),
              );
            }
          },
        },
      ],
    );
  };

  const onFormPress = async (formId: string, requirementKey: string) => {
    if (!currentStep || !progress || !canInteractWithRequirements) {
      return;
    }

    if (formId === EX17_FORM_ID) {
      await onEx17FormPress(formId, requirementKey);
      return;
    }

    confirmFormRequirement(formId, requirementKey);
  };

  const isLoading = isStepsLoading || (isAuthenticated && isProgressLoading);
  const error = stepsError ?? progressError;

  return {
    isAuthLoading,
    isAuthenticated,
    steps,
    isLoading,
    error,
    currentStepId,
    activeStepId,
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
    onSignInPress,
    onStepPress,
    onStepDetailPress,
    onCompleteStep,
    onRequirementCheckboxToggle,
    onBookingAssistantPress,
    onViewAppointmentPress,
    onClearBookingAssistantPress,
    onFormPress,
    onApproveAndDownloadForm,
    onFormView,
    onClosePrerequisitesDialog,
    onGoToProfilePress,
    onSupportPress,
  };
}
