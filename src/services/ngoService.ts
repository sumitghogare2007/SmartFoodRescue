import { apiClient } from '../lib/api';
import type { FoodDonation, DonationRequest, Pickup, Distribution } from '../types';

export const ngoService = {
  async getAvailableDonations() {
    const response = await apiClient.get('/api/donations?status=AVAILABLE');
    return response.data as FoodDonation[];
  },

  async createRequest(data: Partial<DonationRequest>) {
    const response = await apiClient.post('/api/donation-requests', data);
    return response.data as DonationRequest;
  },

  async getMyRequests(ngoId: string) {
    const response = await apiClient.get(`/api/donation-requests?ngoId=${ngoId}`);
    return response.data as DonationRequest[];
  },

  async getMyPickups() {
    const response = await apiClient.get('/api/pickups?ngoId=me');
    return response.data as Pickup[];
  },

  async getMyDistributions() {
    const response = await apiClient.get('/api/distributions');
    return response.data as Distribution[];
  },

  async createDistribution(data: Partial<Distribution>) {
    const response = await apiClient.post('/api/distributions', data);
    return response.data as Distribution;
  },

  async completeDistribution(id: string) {
    const response = await apiClient.put(`/api/distributions/${id}/complete`);
    return response.data as Distribution;
  }
};
