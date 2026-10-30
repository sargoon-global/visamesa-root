import {API_ENDPOINTS} from '@/config/api';
import apiClient from '@/services/api';
import {citaPreviaBookingService} from '@/services/citaPreviaBookingService';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('citaPreviaBookingService', () => {
  it('posts to the cita previa booking confirm endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {confirmedAt: '2026-01-01T00:00:00.000Z', created: true},
    });

    await expect(citaPreviaBookingService.confirm()).resolves.toEqual({
      confirmedAt: '2026-01-01T00:00:00.000Z',
      created: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.citaPreviaBooking);
  });
});
