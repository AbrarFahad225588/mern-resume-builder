import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the bearer token (when one exists) to every outgoing request.
// Doing it here keeps components free of any mutation of the shared instance
// and means the header survives a full page reload.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth api functions

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me/'),
};
// resume api functions
export const resumeApi = {
  createResume:  (resumeData)       => api.post('/resumes', resumeData),
  getResumes:    ()                 => api.get('/resumes'),
  getResumeById: (id)               => api.get(`/resumes/${id}`),
  updateResume:  (id, resumeData)   => api.put(`/resumes/${id}`, resumeData),
  deleteResume:  (id)               => api.delete(`/resumes/${id}`),
  // multipart/form-data — FormData must be passed by the caller. Not tied to a
  // resume, so it works on an unsaved draft; responds with { pictureUrl }.
  uploadPicture: (formData)         => api.post('/resumes/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// template api functions
export const templateApi = {
  getTemplates: () => api.get('/templates'),
  getTemplateById: (id) => api.get(`/templates/${id}`),
};

export default api;