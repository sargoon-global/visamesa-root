import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {AppState} from 'react-native';

import {useAuth} from '@/contexts/AuthContext';
import {
  consentService,
} from '@/features/profile/services/consentService';
import {
  EMPTY_CONSENT_STATUS,
  type ConsentAcceptanceStatus,
} from '@visamesa/content/checkout';

type ConsentContextValue = {
  hasConsent: boolean;
  hasPrivacyConsent: boolean;
  hasTermsConsent: boolean;
  consentStatus: ConsentAcceptanceStatus;
  isLoading: boolean;
  refreshConsent: () => Promise<boolean>;
};

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({children}: {children: ReactNode}) {
  const {user} = useAuth();
  const [consentStatus, setConsentStatus] =
    useState<ConsentAcceptanceStatus>(EMPTY_CONSENT_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedConsentRef = useRef(false);

  const refreshConsent = useCallback(async (): Promise<boolean> => {
    if (!user) {
      hasLoadedConsentRef.current = false;
      setConsentStatus(EMPTY_CONSENT_STATUS);
      setIsLoading(false);
      return false;
    }

    if (!hasLoadedConsentRef.current) {
      setIsLoading(true);
    }

    try {
      const status = await consentService.getConsentStatus();
      hasLoadedConsentRef.current = true;
      setConsentStatus(status);
      return status.privacyPolicy && status.termsOfService;
    } catch {
      let hasConsent = false;
      setConsentStatus(prev => {
        hasConsent = prev.privacyPolicy && prev.termsOfService;
        return prev;
      });
      return hasConsent;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      hasLoadedConsentRef.current = false;
      setConsentStatus(EMPTY_CONSENT_STATUS);
      setIsLoading(false);
      return;
    }

    hasLoadedConsentRef.current = false;
    refreshConsent().catch(() => {});
  }, [user, refreshConsent]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshConsent().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [user, refreshConsent]);

  const value = useMemo<ConsentContextValue>(
    () => ({
      hasConsent: consentStatus.privacyPolicy && consentStatus.termsOfService,
      hasPrivacyConsent: consentStatus.privacyPolicy,
      hasTermsConsent: consentStatus.termsOfService,
      consentStatus,
      isLoading,
      refreshConsent,
    }),
    [consentStatus, isLoading, refreshConsent],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider');
  }

  return context;
}
