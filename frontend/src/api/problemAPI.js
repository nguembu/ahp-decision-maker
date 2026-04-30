import api from './axiosConfig';

export const problemAPI = {
  getAll: () => api.get('/problems/'),
  getById: (id) => api.get(`/problems/${id}/`),
  create: (data) => api.post('/problems/', data),
  update: (id, data) => api.put(`/problems/${id}/`, data),
  delete: (id) => api.delete(`/problems/${id}/`),
  duplicate: (id) => api.post(`/problems/${id}/duplicate/`),

  // Criteria
  getCriteria: (pid) => api.get(`/problems/${pid}/criteria/`),
  createCriterion: (pid, data) => api.post(`/problems/${pid}/criteria/`, data),
  updateCriterion: (pid, cid, data) => api.put(`/problems/${pid}/criteria/${cid}/`, data),
  deleteCriterion: (pid, cid) => api.delete(`/problems/${pid}/criteria/${cid}/`),

  // Scale preferences
  getScales: (pid, cid) => api.get(`/problems/${pid}/criteria/${cid}/scales/`),
  createScale: (pid, cid, data) => api.post(`/problems/${pid}/criteria/${cid}/scales/`, data),
  deleteScale: (pid, cid, sid) => api.delete(`/problems/${pid}/criteria/${cid}/scales/${sid}/`),

  // Alternatives
  getAlternatives: (pid) => api.get(`/problems/${pid}/alternatives/`),
  createAlternative: (pid, data) => api.post(`/problems/${pid}/alternatives/`, data),
  updateAlternative: (pid, aid, data) => api.put(`/problems/${pid}/alternatives/${aid}/`, data),
  deleteAlternative: (pid, aid) => api.delete(`/problems/${pid}/alternatives/${aid}/`),

  // Scores
  getScores: (pid, aid) => api.get(`/problems/${pid}/alternatives/${aid}/scores/`),
  saveScore: (pid, aid, data) => api.post(`/problems/${pid}/alternatives/${aid}/scores/`, data),
  updateScore: (pid, aid, sid, data) => api.put(`/problems/${pid}/alternatives/${aid}/scores/${sid}/`, data),
};
