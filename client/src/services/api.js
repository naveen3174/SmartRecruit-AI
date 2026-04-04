import axios from 'axios';

const API_URL = `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const publicService = {
  getStats: () => api.get('/public/stats'),
  getPublicResults: (id) => api.get(`/public/results/${id}`),
};

export const interviewService = {
  getHistory: () => api.get('/interviews'),
  generateQuestions: (jobDescription) => api.post('/interviews/generate-questions', { jobDescription }),
  startAnalysis: (formData) => api.post('/interviews/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000 // 10 minutes timeout for long video uploads
  }),
  getResults: (id) => api.get(`/interviews/results/${id}`),
  askCoach: (interviewId, message) => api.post('/interviews/chat', { interviewId, message }),
  uploadResume: (formData) => api.post('/interviews/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getResumeStatus: () => api.get('/interviews/resume-status'),
};

export default api;
