import {API_ENDPOINTS} from '@/config/api';
import apiClient from '@/services/api';
import {personalDetailsLockService} from '@/services/personalDetailsLockService';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('personalDetailsLockService', () => {
  it('posts to the personal details lock endpoint', async () => {
    const lockedAt = '2026-01-01T00:00:00.000Z';
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {personalDetailsLockedAt: lockedAt},
    });

    await expect(personalDetailsLockService.lockPersonalDetails()).resolves.toEqual({
      personalDetailsLockedAt: lockedAt,
    });

    expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.personalDetailsLock);
  });
});
