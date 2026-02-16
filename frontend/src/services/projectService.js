import api from './api';

export const projectService = {
    getAllProjects: async () => {
        const response = await api.get('/projects');
        return response.data.data.projects;
    },
    getProjectById: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data.data.project;
    },
    createProject: async (projectData) => {
        const response = await api.post('/projects', projectData);
        return response.data.data.project;
    }
};
