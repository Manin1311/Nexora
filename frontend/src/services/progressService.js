import api from './api'

export const progressService = {
  getSummary: () => api.get('/progress/summary/'),
  getActivity: () => api.get('/progress/activity/'),
  getAchievements: () => api.get('/progress/achievements/'),
  getCertificates: () => api.get('/progress/certificates/'),
}
