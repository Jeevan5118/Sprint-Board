import api from './api';

export const dashboardService = {
  getUserDashboard: async () => {
    const res = await api.get('/dashboard/user');
    return res.data.data;
  },
  getTeamProjectProgress: async () => {
    const res = await api.get('/dashboard/team-project-progress');
    return res.data.data;
  },
  getDeadlineAlerts: async () => {
    const res = await api.get('/dashboard/deadline-alerts');
    return res.data.data;
  }
};

