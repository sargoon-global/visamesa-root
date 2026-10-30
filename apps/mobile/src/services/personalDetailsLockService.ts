import {API_ENDPOINTS} from '@/config/api';
import apiClient from '@/services/api';

type LockPersonalDetailsResponse = {
  personalDetailsLockedAt: string;
};

export const personalDetailsLockService = {
  async lockPersonalDetails(): Promise<LockPersonalDetailsResponse> {
    const response = await apiClient.post<LockPersonalDetailsResponse>(
      API_ENDPOINTS.personalDetailsLock,
    );
    return response.data;
  },
};
