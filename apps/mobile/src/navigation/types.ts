import {NavigatorScreenParams} from '@react-navigation/native';
import type {LegalDocumentId} from '@visamesa/content/legal';
import type {BookingAssistantId} from '@/features/home/types/TieStepDetail';

import {ProfileSectionId} from '@/features/profile/data/profileSections';
import {CitaPreviaDetails} from '@/types';

export type HomeStackParamList = {
  Home: undefined;
  ProcessOverview: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  StepDetail: {
    stepId: number;
  };
  Support: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  ProfileSection: {
    sectionId: ProfileSectionId;
  };
  Legal: undefined;
  LegalDocument: {
    documentId: LegalDocumentId;
  };
  Login: undefined;
  Settings: undefined;
  Support: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  WebsiteWebView: {
    bookingAssistant?: BookingAssistantId;
    automation?: 'modelo-790-012';
    formCompletion?: {stepId: number; requirementKey: string; formId: string};
    url?: string;
    title?: string;
    details?: CitaPreviaDetails;
  };
};
