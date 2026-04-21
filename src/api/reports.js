import apiClient from './client';

const reportApi = {
  getReport: async (type, from, to) => {
    const params = { type };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  }
};

export default reportApi;
