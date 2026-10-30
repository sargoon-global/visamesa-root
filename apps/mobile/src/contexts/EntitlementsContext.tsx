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
import {paymentService} from '@/services/paymentService';
import {reportClientErrorFromException} from '@/services/clientErrorService';
import {
  EntitlementType,
  UserEntitlement,
} from '@/types/entitlements';
import {
  canUseBookingAssistant as checkBookingAssistantAccess,
  hasEntitlement as checkEntitlement,
  hasPaidService as checkHasPaidService,
} from '@/utils/entitlementAccess';
import { BookingAssistantId } from '@/features/home/types/TieStepDetail';

const ENTITLEMENT_POLL_ATTEMPTS = 5;
const ENTITLEMENT_POLL_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

type EntitlementsContextValue = {
  entitlements: UserEntitlement[];
  citaPreviaBookedAt: string | null;
  personalDetailsLockedAt: string | null;
  isCitaPreviaBooked: boolean;
  isPersonalDetailsLocked: boolean;
  isLoading: boolean;
  refreshEntitlements: () => Promise<UserEntitlement[]>;
  /** Optimistic update after POST personal-details-lock (refresh still runs afterward). */
  applyPersonalDetailsLockedAt: (lockedAt: string) => void;
  waitForPaidService: () => Promise<boolean>;
  hasEntitlement: (type: EntitlementType) => boolean;
  hasPaidService: () => boolean;
  canUseBookingAssistant: (bookingAssistantId: BookingAssistantId) => boolean;
};

const EntitlementsContext = createContext<EntitlementsContextValue | undefined>(
  undefined,
);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [citaPreviaBookedAt, setCitaPreviaBookedAt] = useState<string | null>(
    null,
  );
  const [personalDetailsLockedAt, setPersonalDetailsLockedAt] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedEntitlementsRef = useRef(false);

  const refreshEntitlements = useCallback(async (): Promise<UserEntitlement[]> => {
    if (!isAuthenticated) {
      hasLoadedEntitlementsRef.current = false;
      setEntitlements([]);
      setCitaPreviaBookedAt(null);
      setPersonalDetailsLockedAt(null);
      setIsLoading(false);
      return [];
    }

    if (!hasLoadedEntitlementsRef.current) {
      setIsLoading(true);
    }

    try {
      const response = await paymentService.getEntitlements();
      hasLoadedEntitlementsRef.current = true;
      setEntitlements(response.entitlements);
      setCitaPreviaBookedAt(response.citaPreviaBookedAt ?? null);
      setPersonalDetailsLockedAt(response.personalDetailsLockedAt ?? null);
      return response.entitlements;
    } catch (error) {
      console.error('Failed to load entitlements:', error);
      reportClientErrorFromException('PAYMENT_ENTITLEMENTS_FAILED', error);
      let cached: UserEntitlement[] = [];
      setEntitlements(prev => {
        cached = prev;
        return prev;
      });
      return cached;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const applyPersonalDetailsLockedAt = useCallback((lockedAt: string) => {
    hasLoadedEntitlementsRef.current = true;
    setPersonalDetailsLockedAt(lockedAt);
  }, []);

  const waitForPaidService = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < ENTITLEMENT_POLL_ATTEMPTS; attempt += 1) {
      const nextEntitlements = await refreshEntitlements();

      if (checkHasPaidService(nextEntitlements)) {
        return true;
      }

      if (attempt < ENTITLEMENT_POLL_ATTEMPTS - 1) {
        await sleep(ENTITLEMENT_POLL_DELAY_MS);
      }
    }

    return false;
  }, [refreshEntitlements]);

  useEffect(() => {
    hasLoadedEntitlementsRef.current = false;
    refreshEntitlements().catch(() => {});
  }, [user?.id, refreshEntitlements]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshEntitlements().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, refreshEntitlements]);

  const isCitaPreviaBooked = citaPreviaBookedAt !== null;
  const isPersonalDetailsLocked = personalDetailsLockedAt !== null;

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      entitlements,
      citaPreviaBookedAt,
      personalDetailsLockedAt,
      isCitaPreviaBooked,
      isPersonalDetailsLocked,
      isLoading,
      refreshEntitlements,
      applyPersonalDetailsLockedAt,
      waitForPaidService,
      hasEntitlement: type => checkEntitlement(entitlements, type),
      hasPaidService: () => checkHasPaidService(entitlements),
      canUseBookingAssistant: bookingAssistantId =>
        checkBookingAssistantAccess(entitlements, bookingAssistantId, {
          citaPreviaBooked: isCitaPreviaBooked,
        }),
    }),
    [
      citaPreviaBookedAt,
      entitlements,
      isCitaPreviaBooked,
      isPersonalDetailsLocked,
      personalDetailsLockedAt,
      isLoading,
      refreshEntitlements,
      applyPersonalDetailsLockedAt,
      waitForPaidService,
    ],
  );

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementsContext);

  if (!context) {
    throw new Error('useEntitlements must be used within EntitlementsProvider');
  }

  return context;
}
