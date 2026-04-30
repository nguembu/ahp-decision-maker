import api from './axiosConfig';

export const authAPI = {
  login: (username, password) => api.post('/auth/token/', { username, password }),
  refresh: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  register: (username, email, password) => api.post('/auth/register/', { username, email, password }),
};
