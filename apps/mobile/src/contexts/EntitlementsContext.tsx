import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
  isLoading: boolean;
  refreshEntitlements: () => Promise<UserEntitlement[]>;
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
  const [isLoading, setIsLoading] = useState(false);

  const refreshEntitlements = useCallback(async (): Promise<UserEntitlement[]> => {
    if (!isAuthenticated) {
      setEntitlements([]);
      return [];
    }

    setIsLoading(true);

    try {
      const response = await paymentService.getEntitlements();
      setEntitlements(response.entitlements);
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
    refreshEntitlements().catch(() => {});
  }, [user?.id, refreshEntitlements]);

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      entitlements,
      isLoading,
      refreshEntitlements,
      waitForPaidService,
      hasEntitlement: type => checkEntitlement(entitlements, type),
      hasPaidService: () => checkHasPaidService(entitlements),
      canUseBookingAssistant: bookingAssistantId =>
        checkBookingAssistantAccess(entitlements, bookingAssistantId),
    }),
    [entitlements, isLoading, refreshEntitlements, waitForPaidService],
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
