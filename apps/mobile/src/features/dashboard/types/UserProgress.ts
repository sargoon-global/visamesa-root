import {
  ASSISTED_BOOKING_REQUIREMENT_TYPE,
  type BookingAssistantId,
} from '@/features/home/types/TieStepDetail';

export type StepStatus = 'not_started' | 'in_progress' | 'completed';

export type BookingAssistantAppointmentSummary = {
  office: string;
  date: string;
  time: string;
  location?: string;
  confirmationCode?: string;
  isPlaceholder?: boolean;
};

export type RequirementCompletionSource =
  | {type: 'self_declared'}
  | {
      type: typeof ASSISTED_BOOKING_REQUIREMENT_TYPE;
      bookingAssistantId: BookingAssistantId;
      completedAt: string;
      appointment?: BookingAssistantAppointmentSummary;
    }
  | {type: 'form'; formId: string; confirmedAt: string}
  | {type: 'referenced_step'; stepId: number}
  | {type: 'referenced_requirement'; stepId: number; requirementKey: string}
  | {type: 'referenced_profile'};

export type RequirementProgress = {
  completed: boolean;
  source?: RequirementCompletionSource;
};

export type UserStepProgress = {
  stepId: number;
  status: StepStatus;
  requirements: Record<string, RequirementProgress>;
  startedAt?: string;
  completedAt?: string;
};

export type UserProgress = {
  currentStepId: number;
  steps: UserStepProgress[];
};

export type ProgressContext = {
  isProfileComplete?: boolean;
  isCitaPreviaBooked?: boolean;
  citaPreviaBookedAt?: string | null;
  isPersonalDetailsLocked?: boolean;
  allSteps?: import('@/features/home/types/TieStepDetail').TieStepDetail[];
};
