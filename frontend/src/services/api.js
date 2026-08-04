import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Auth api functions
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};
// resume api functions
export const resumeApi = {
  createResume: (resumeData) => api.post('/resumes', resumeData),
  getResumes: () => api.get('/resumes'),
    getResumeById: (id) => api.get(`/resumes/${id}`),
    updateResume: (id, resumeData) => api.put(`/resumes/${id}`, resumeData),
    deleteResume: (id) => api.delete(`/resumes/${id}`),
};

// template api functions
export const templateApi = {
  getTemplates: () => api.get('/templates'),
  getTemplateById: (id) => api.get(`/templates/${id}`),
};

export default api;