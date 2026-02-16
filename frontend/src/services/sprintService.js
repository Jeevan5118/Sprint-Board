import api from './api';

export const sprintService = {
    getSprintsByProject: async (projectId) => {
        const response = await api.get(`/sprints/project/${projectId}`);
        return response.data.data.sprints;
    },
    getSprintById: async (id) => {
        const response = await api.get(`/sprints/${id}`);
        return response.data.data.sprint;
    },
    createSprint: async (sprintData) => {
        const response = await api.post('/sprints', sprintData);
        return response.data.data.sprint;
    },
    startSprint: async (id) => {
        const response = await api.patch(`/sprints/${id}/start`);
        return response.data.data.sprint;
    },
    completeSprint: async (id) => {
        const response = await api.patch(`/sprints/${id}/complete`);
        return response.data.data.sprint;
    }
};
