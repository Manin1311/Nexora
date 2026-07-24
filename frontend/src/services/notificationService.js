import api from './api'

export const notificationService = {
  getAll: () => api.get('/users/notifications/'),
  readAll: () => api.post('/users/notifications/read-all/'),
  read: (id) => api.post(`/users/notifications/${id}/read/`),
  clear: () => api.delete('/users/notifications/clear/'),
}
