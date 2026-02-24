import api from './api';

export const teamService = {
    getAllTeams: async () => {
        const response = await api.get('/teams');
        return response.data.data.teams;
    },
    createTeam: async (teamData) => {
        const response = await api.post('/teams', teamData);
        return response.data.data.team;
    },
    getAvailableMembers: async () => {
        const response = await api.get('/teams/available-members/list');
        return response.data.data.members;
    },
    addMember: async (teamId, userId) => {
        const response = await api.post(`/teams/${teamId}/members`, { user_id: userId });
        return response.data;
    },
    removeMember: async (teamId, userId) => {
        const response = await api.delete(`/teams/${teamId}/members/${userId}`);
        return response.data;
    },
    getMembers: async (teamId) => {
        const response = await api.get(`/teams/${teamId}/members`);
        return response.data.data.members;
    },
    getMemberTasks: async (teamId, userId) => {
        const response = await api.get(`/teams/${teamId}/members/${userId}/tasks`);
        return response.data.data;
    },
    getTeamById: async (teamId) => {
        const response = await api.get(`/teams/${teamId}`);
        return response.data.data.team;
    },
    getMyTeams: async () => {
        const response = await api.get('/teams/my');
        return response.data.data.teams;
    }
};
