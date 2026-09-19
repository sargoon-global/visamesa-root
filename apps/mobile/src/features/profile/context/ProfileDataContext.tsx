import React, {createContext, useContext} from 'react';

import {useAuth} from '@/contexts/AuthContext';
import {
  useProfile,
  UseProfileResult,
} from '@/features/profile/hooks/useProfile';

const ProfileDataContext = createContext<UseProfileResult | null>(null);

export function ProfileDataProvider({children}: {children: React.ReactNode}) {
  const {user} = useAuth();
  const profile = useProfile(!!user, user?.email ?? null);

  return (
    <ProfileDataContext.Provider value={profile}>
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData(): UseProfileResult {
  const context = useContext(ProfileDataContext);

  if (!context) {
    throw new Error('useProfileData must be used within ProfileDataProvider');
  }

  return context;
}
