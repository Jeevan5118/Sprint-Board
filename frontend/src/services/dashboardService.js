import api from './api';

export const dashboardService = {
  getUserDashboard: async () => {
    const res = await api.get('/dashboard/user');
    return res.data.data;
  }
};

