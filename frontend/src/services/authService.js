import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  getMe: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  getLeaderboard: () => api.get('/auth/leaderboard/'),
  googleLogin: (token) => api.post('/auth/google-login/', { token }),
}
