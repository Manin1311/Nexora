import api from './api'

export const mentorService = {
  getConversations: () => api.get('/mentor/'),
  createConversation: (data) => api.post('/mentor/', data),
  getConversation: (id) => api.get(`/mentor/${id}/`),
  sendMessage: (id, data) => api.post(`/mentor/${id}/message/`, data),
}
