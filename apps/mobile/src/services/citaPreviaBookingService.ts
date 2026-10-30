import {API_ENDPOINTS} from '@/config/api';
import apiClient from '@/services/api';

type ConfirmCitaPreviaBookingResponse = {
  confirmedAt: string;
  created: boolean;
};

export const citaPreviaBookingService = {
  async confirm(): Promise<ConfirmCitaPreviaBookingResponse> {
    const response = await apiClient.post<ConfirmCitaPreviaBookingResponse>(
      API_ENDPOINTS.citaPreviaBooking,
    );
    return response.data;
  },
};
