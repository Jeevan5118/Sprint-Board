import api from './api';

export const notificationService = {
  getMyUnread: async () => {
    const res = await api.get('/notifications/my/unread');
    return res.data.data;
  },

  markAsRead: async (notificationId) => {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/notifications/my/read-all');
    return res.data;
  }
};
