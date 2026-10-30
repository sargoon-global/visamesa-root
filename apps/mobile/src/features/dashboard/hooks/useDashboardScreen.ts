import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  BookingAssistantId,
  TieStepDetail,
} from '@/features/home/types/TieStepDetail';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
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
import {
  AppointmentDetailsMessage,
  formatAppointmentDetailsMessage,
} from '@/features/dashboard/data/dashboardContent';
import {syncEmpadronamientoStepFromProfile} from '@/features/dashboard/services/empadronamientoProgressService';
import {EX17_FORM_ID} from '@/features/pdfGeneration/forms/ex17/ex17Constants';
import {useEx17FormFlow} from '@/features/dashboard/hooks/useEx17FormFlow';
import {useModelo790FormFlow} from '@/features/dashboard/hooks/useModelo790FormFlow';
import {MODELO790_FORM_ID} from '@/features/pdfGeneration/forms/modelo790/modelo790Constants';
import {reconcileStepStatuses} from '@/features/dashboard/services/progressReconciliationService';
import {
  buildInitialProgressFromSteps,
  saveUserProgress,
  subscribeToProgressReset,
  syncStoredProgressToBackend,
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
import {
  FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY,
  PAY_FEE_STEP_SLUG,
} from '@visamesa/content/tieSteps/profileLock';
import {citaPreviaBookingService} from '@/services/citaPreviaBookingService';
import {getAxiosApiErrorMessage} from '@/services/apiErrors';
import {personalDetailsLockService} from '@/services/personalDetailsLockService';
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
  onConfirmBookingPress: (
    bookingAssistantId: BookingAssistantId,
    requirementKey: string,
  ) => void;
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
  const {
    canUseBookingAssistant: canUseBookingAssistantEntitlement,
    refreshEntitlements,
    applyPersonalDetailsLockedAt,
    isCitaPreviaBooked,
    citaPreviaBookedAt,
    isPersonalDetailsLocked,
  } = useEntitlements();
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
    completeBookingAssistantRequirement,
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

  useEffect(() => navigation.addListener('focus', () => {
    refreshProgress().catch(() => {});
  }), [navigation, refreshProgress]);

  const progressContext = useMemo<ProgressContext>(
    () => ({
      isProfileComplete,
      isCitaPreviaBooked,
      citaPreviaBookedAt,
      isPersonalDetailsLocked,
      allSteps: steps,
    }),
    [
      citaPreviaBookedAt,
      isCitaPreviaBooked,
      isPersonalDetailsLocked,
      isProfileComplete,
      steps,
    ],
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
    enrichRequirements: enrichEx17Requirements,
    onFormPress: onEx17FormPress,
    onFormView: onEx17FormView,
    onApproveAndDownloadForm: onEx17ApproveAndDownloadForm,
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

  const {
    enrichRequirements: enrichModelo790Requirements,
    onFormPress: onModelo790FormPress,
    onFormView: onModelo790FormView,
    onApproveAndDownloadForm: onModelo790ApproveAndDownloadForm,
  } = useModelo790FormFlow({
    navigation,
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

  const enrichFormRequirements = useCallback(
    (requirements: RequirementWithProgress[]) =>
      enrichModelo790Requirements(enrichEx17Requirements(requirements)),
    [enrichEx17Requirements, enrichModelo790Requirements],
  );

  const currentStepRequirements = useMemo(() => {
    if (!displayProgress || !currentStep) {
      return [];
    }

    return enrichFormRequirements(
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
    enrichFormRequirements,
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

    const markingReceiptComplete =
      requirementKey === FEE_PAYMENT_RECEIPT_REQUIREMENT_KEY &&
      currentStep.slug === PAY_FEE_STEP_SLUG &&
      !stored.completed;

    if (markingReceiptComplete) {
      showAlert(
        tDashboard('profileLockDialog.title'),
        tDashboard('profileLockDialog.message'),
        [
          {text: tCommon('cancel'), style: 'cancel'},
          {
            text: tDashboard('profileLockDialog.confirm'),
            onPress: async () => {
              try {
                await toggleSelfDeclaredRequirement(
                  currentStep.id,
                  requirementKey,
                  true,
                );
                await syncStoredProgressToBackend({strict: true});
                const lockResult =
                  await personalDetailsLockService.lockPersonalDetails();
                applyPersonalDetailsLockedAt(
                  lockResult.personalDetailsLockedAt,
                );
                await refreshEntitlements();
              } catch (lockError) {
                try {
                  await toggleSelfDeclaredRequirement(
                    currentStep.id,
                    requirementKey,
                    false,
                  );
                } catch {
                  // Best-effort rollback if lock failed after marking receipt
                }
                showAlert(
                  tCommon('errors.title'),
                  getAxiosApiErrorMessage(
                    lockError,
                    'dashboard:profileLockDialog.failed',
                  ),
                );
              }
            },
          },
        ],
      );
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
      bookingCompletion: {
        stepId: currentStep.id,
        requirementKey,
      },
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

    if (!appointment) {
      showAlert(
        tDashboard('appointmentDetailsTitle'),
        formatAppointmentDetailsMessage(
          (key, options) => tDashboard(key, options),
          appointment,
        ),
        [{text: tCommon('actions.gotIt')}],
      );
      return;
    }

    showAlert(
      tDashboard('appointmentDetailsTitle'),
      React.createElement(AppointmentDetailsMessage, {
        t: (key, options) => tDashboard(key, options),
        appointment,
        onCopy: (value: string) => {
          Clipboard.setString(value);
          showToast(tDashboard('appointmentCopied'));
        },
      }),
      [{text: tCommon('actions.gotIt')}],
    );
  };

  const onConfirmBookingPress = (
    bookingAssistantId: BookingAssistantId,
    requirementKey: string,
  ) => {
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

    if (!toggleState.canUseActions) {
      showToast(tDashboard('requirementDependencyHint'));
      return;
    }

    const completeBooking = async () => {
      try {
        if (bookingAssistantId === 'cita-previa') {
          await citaPreviaBookingService.confirm();
          await refreshEntitlements();
        }

        await completeBookingAssistantRequirement(
          currentStep.id,
          requirementKey,
          bookingAssistantId,
        );
        showToast(tDashboard('bookingAssistantSuccess'));
      } catch {
        showAlert(tCommon('errors.title'), tDashboard('confirmBookingFailed'));
      }
    };

    showAlert(
      tDashboard('confirmBookingTitle'),
      tDashboard('confirmBookingMessage'),
      [
        {text: tCommon('actions.cancel'), style: 'cancel'},
        {
          text: tCommon('actions.confirm'),
          onPress: () => {
            completeBooking().catch(() => {});
          },
        },
      ],
    );
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

    if (formId === MODELO790_FORM_ID) {
      await onModelo790FormPress(formId, requirementKey);
      return;
    }

    confirmFormRequirement(formId, requirementKey);
  };

  const onFormView = useCallback(
    async (formId: string, requirementKey: string) => {
      if (formId === EX17_FORM_ID) {
        await onEx17FormView(formId, requirementKey);
        return;
      }
      if (formId === MODELO790_FORM_ID) {
        await onModelo790FormView(formId, requirementKey);
      }
    },
    [onEx17FormView, onModelo790FormView],
  );

  const onApproveAndDownloadForm = useCallback(
    async (formId: string, requirementKey: string) => {
      if (formId === EX17_FORM_ID) {
        await onEx17ApproveAndDownloadForm(formId, requirementKey);
        return;
      }
      if (formId === MODELO790_FORM_ID) {
        await onModelo790ApproveAndDownloadForm(formId, requirementKey);
      }
    },
    [onEx17ApproveAndDownloadForm, onModelo790ApproveAndDownloadForm],
  );

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
    onConfirmBookingPress,
    onFormPress,
    onApproveAndDownloadForm,
    onFormView,
    onClosePrerequisitesDialog,
    onGoToProfilePress,
    onSupportPress,
  };
}
