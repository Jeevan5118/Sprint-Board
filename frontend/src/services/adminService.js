import api from './api';

export const adminService = {
  importCsv: async ({ importType, file }) => {
    const formData = new FormData();
    formData.append('import_type', importType);
    formData.append('file', file);

    const response = await api.post('/admin/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.data;
  }
};
