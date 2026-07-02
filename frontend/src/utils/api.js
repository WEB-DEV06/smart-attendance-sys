import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const studentsAPI = {
  getAll: () => API.get('/students'),
  getDescriptors: () => API.get('/students/descriptors'),
  register: (data) => API.post('/students/register', data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
};

export const attendanceAPI = {
  getAll: (params) => API.get('/attendance', { params }),
  getSummary: () => API.get('/attendance/summary'),
  mark: (studentId) => API.post('/attendance/mark', { studentId }),
  delete: (id) => API.delete(`/attendance/${id}`),
};

export default API;
