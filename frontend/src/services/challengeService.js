import api from './api'

export const challengeService = {
  getAll: (params) => api.get('/challenges/', { params }),
  getTopics: () => api.get('/challenges/topics/'),
  getDaily: () => api.get('/challenges/daily/'),
  getById: (id) => api.get(`/challenges/${id}/`),
  submit: (id, data) => api.post(`/challenges/${id}/submit/`, data),
  generateAIChallenge: (data) => api.post('/challenges/generate-ai/', data),
  getActivity: () => api.get('/challenges/activity/').then(r => r.data),
}
