import { apiClient } from '../lib/api';
import type { Pickup, StatusHistoryEntry } from '../types';

export const volunteerService = {
  async getMyPickups() {
    const response = await apiClient.get('/api/pickups?volunteerId=me');
    return response.data as Pickup[];
  },

  async getPickupById(id: string) {
    const response = await apiClient.get(`/api/pickups/${id}`);
    return response.data as Pickup;
  },

  async updatePickupStatus(id: string, status: string, note?: string) {
    const response = await apiClient.put(`/api/pickups/${id}/status`, { status, note });
    return response.data as Pickup;
  },

  async getTrackingHistory(id: string) {
    const response = await apiClient.get(`/api/pickups/${id}/history`);
    return response.data as StatusHistoryEntry[];
  }
};
