import { apiClient } from '../lib/api';
import type { FoodDonation, DonationRequest } from '../types';

export const donationService = {
  async getAvailableDonations(filters?: any) {
    const params = new URLSearchParams({ status: 'AVAILABLE', ...filters });
    const response = await apiClient.get(`/api/donations?${params.toString()}`);
    return response.data as FoodDonation[];
  },

  async getMyDonations() {
    const response = await apiClient.get('/api/donations/my/donations');
    return response.data as FoodDonation[];
  },

  async getDonationById(id: string) {
    const response = await apiClient.get(`/api/donations/${id}`);
    return response.data as FoodDonation;
  },

  async createDonation(data: Partial<FoodDonation>) {
    const response = await apiClient.post('/api/donations', data);
    return response.data as FoodDonation;
  },

  async updateDonation(id: string, data: Partial<FoodDonation>) {
    const response = await apiClient.put(`/api/donations/${id}`, data);
    return response.data as FoodDonation;
  },

  async cancelDonation(id: string) {
    const response = await apiClient.put(`/api/donations/${id}`, { status: 'CANCELLED' });
    return response.data as FoodDonation;
  },

  async getDonationRequests(donationId: string) {
    const response = await apiClient.get(`/api/donation-requests?donationId=${donationId}`);
    return response.data as DonationRequest[];
  },

  async acceptRequest(requestId: string, volunteerId?: string) {
    const response = await apiClient.put(`/api/donation-requests/${requestId}/accept`, { volunteerId });
    return response.data as DonationRequest;
  },

  async rejectRequest(requestId: string) {
    const response = await apiClient.put(`/api/donation-requests/${requestId}/reject`);
    return response.data as DonationRequest;
  }
};
