import api from './axiosConfig';

export const analysisAPI = {
  getMatrix: (pid) => api.get(`/problems/${pid}/matrix/`),
  saveMatrix: (pid, matrix_data) => api.post(`/problems/${pid}/matrix/`, { matrix_data }),
  validateMatrix: (pid, matrix_data) => api.post(`/problems/${pid}/matrix/validate/`, { matrix_data }),
  analyze: (pid) => api.post(`/problems/${pid}/analyze/`),
  getResults: (pid) => api.get(`/problems/${pid}/results/`),
};
