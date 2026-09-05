import { apiClient } from '../lib/api';
import type { PlatformStats } from '../types';

export const statsService = {
  async getPlatformStats() {
    const response = await apiClient.get('/api/stats/platform');
    return response.data as PlatformStats;
  }
};
