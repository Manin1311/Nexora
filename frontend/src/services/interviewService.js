import api from './api'

export const interviewService = {
  getSessions: () => api.get('/interviews/'),
  startSession: (data) => api.post('/interviews/start/', data),
  getSession: (id) => api.get(`/interviews/${id}/`),
  submitAnswer: (sessionId, questionId, data) =>
    api.post(`/interviews/${sessionId}/answer/${questionId}/`, data),
  completeSession: (sessionId) => api.post(`/interviews/${sessionId}/complete/`),
}
