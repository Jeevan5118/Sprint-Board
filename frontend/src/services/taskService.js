import api from './api';

export const taskService = {
  getTasksBySprint: async (sprintId) => {
    const res = await api.get(`/tasks/sprint/${sprintId}`);
    return res.data.data.tasks;
  },

  getBacklogByProject: async (projectId, _sprintId) => {
    // Backlog = only project tasks not assigned to any sprint.
    // Do not pull tasks from other sprints into this board.
    const res = await api.get(`/tasks/project/${projectId}`);
    const all = res.data.data.tasks || [];
    return all.filter((t) => t.sprint_id === null || t.sprint_id === undefined);
  },

  updateStatus: async (taskId, status) => {
    const res = await api.patch(`/tasks/${taskId}/status`, { status });
    return res.data.data.task;
  },

  updateAssignee: async (taskId, userId) => {
    const normalizedAssignee =
      userId === '' || userId === null || userId === undefined
        ? null
        : Number(userId);
    const res = await api.put(`/tasks/${taskId}`, { assigned_to: normalizedAssignee });
    return res.data.data.task;
  },

  getTaskDetails: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data.data.task;
  },

  updateStoryPoints: async (taskId, storyPoints) => {
    const res = await api.put(`/tasks/${taskId}`, { story_points: storyPoints });
    return res.data.data.task;
  },

  getComments: async (taskId) => {
    const res = await api.get(`/comments/task/${taskId}`);
    return res.data.data.comments;
  },

  addComment: async (taskId, content) => {
    const res = await api.post(`/comments/task/${taskId}`, { content });
    return res.data.data.comment;
  },
  deleteComment: async (commentId) => {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  },

  uploadAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data.attachments;
  },

  deleteAttachment: async (attachmentId) => {
    const res = await api.delete(`/tasks/attachments/${attachmentId}`);
    return res.data.data.attachments;
  },

  addLink: async (taskId, { url, title, description }) => {
    const res = await api.post(`/tasks/${taskId}/links`, { url, title, description });
    return res.data.data.links;
  },

  getTimeLogs: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}/time-logs`);
    return res.data.data.timeLogs;
  },

  addTimeLog: async (taskId, payload) => {
    const res = await api.post(`/tasks/${taskId}/time-logs`, payload);
    return res.data.data.timeLog;
  },

  deleteTimeLog: async (timeLogId) => {
    const res = await api.delete(`/time-logs/${timeLogId}`);
    return res.data;
  },

  createTask: async (taskData) => {
    const res = await api.post('/tasks', taskData);
    return res.data.data.task;
  },

  updateTask: async (taskId, taskData) => {
    const res = await api.put(`/tasks/${taskId}`, taskData);
    return res.data.data.task;
  },
  deleteTask: async (taskId) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
  }
};

