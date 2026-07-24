import api from './api'

export const showcaseService = {
  getAll: (params) => api.get('/showcase/', { params }),
  getMyProjects: () => api.get('/showcase/my/'),
  getTags: () => api.get('/showcase/tags/'),
  getById: (id) => api.get(`/showcase/${id}/`),
  create: (data) => api.post('/showcase/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.patch(`/showcase/${id}/`, data),
  delete: (id) => api.delete(`/showcase/${id}/`),
  like: (id) => api.post(`/showcase/${id}/like/`),
  critique: (id) => api.post(`/showcase/${id}/critique/`),
}
