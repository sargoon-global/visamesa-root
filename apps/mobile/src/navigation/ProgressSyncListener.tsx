import {useEffect} from 'react';
import {AppState} from 'react-native';

import {useAuth} from '@/contexts/AuthContext';
import {
  syncStoredProgressToBackend,
  tryHydrateProgressFromServer,
} from '@/features/dashboard/services/progressService';

async function syncProgressOnForeground(): Promise<void> {
  await tryHydrateProgressFromServer();
  await syncStoredProgressToBackend();
}

export function ProgressSyncListener() {
  const {user} = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    syncProgressOnForeground().catch(() => {});

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncProgressOnForeground().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [user]);

  return null;
}
