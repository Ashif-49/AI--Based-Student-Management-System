import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const shouldRedirectToLogin = (error) => {
  if (error.response?.status !== 401) {
    return false;
  }

  const requestUrl = error.config?.url || '';
  const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect);
  const isPublicAuthRequest = /\/auth\/(login|register)$/.test(requestUrl);
  const isAlreadyOnAuthPage = ['/login', '/register'].includes(window.location.pathname);

  return !skipAuthRedirect && !isPublicAuthRequest && !isAlreadyOnAuthPage;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle expired tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();

      if (shouldRedirectToLogin(error)) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data, { skipAuthRedirect: true }),
  register: (data) => api.post('/auth/register', data, { skipAuthRedirect: true }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }, { skipAuthRedirect: true }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }, { skipAuthRedirect: true }),
  me: () => api.get('/auth/me'),
};

export const adminApprovalAPI = {
  getPending: () => api.get('/auth/pending-approvals'),
  approve: (userId) => api.post(`/auth/approve/${userId}`),
  reject: (userId) => api.post(`/auth/reject/${userId}`),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/password', data),
};

export const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (Array.isArray(responseData?.errors) && responseData.errors[0]?.msg) {
    return responseData.errors[0].msg;
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the backend server. Start the backend on port 5000 and try again.';
  }

  if (!error?.response && error?.message) {
    return error.message;
  }

  return fallbackMessage;
};

// Students
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Attendance
export const attendanceAPI = {
  getByStudent: (studentId, params) => api.get(`/attendance/${studentId}`, { params }),
  mark: (data) => api.post('/attendance', data),
  bulkMark: (records) => api.post('/attendance/bulk', { records }),
  getSummaryAll: () => api.get('/attendance/summary/all'),
};

// Grades
export const gradesAPI = {
  getByStudent: (studentId, params) => api.get(`/grades/${studentId}`, { params }),
  add: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  delete: (id) => api.delete(`/grades/${id}`),
};

// Predictions
export const predictionsAPI = {
  generate: (studentId) => api.post(`/predictions/generate/${studentId}`),
  getLatest: (studentId) => api.get(`/predictions/${studentId}`),
  getHistory: (studentId) => api.get(`/predictions/${studentId}/history`),
  getAllAtRisk: () => api.get('/predictions/all/at-risk'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getPerformanceTrend: () => api.get('/dashboard/performance-trend'),
};

export const chatbotAPI = {
  sendMessage: (message) => api.post('/chatbot', { message }),
};

export default api;
