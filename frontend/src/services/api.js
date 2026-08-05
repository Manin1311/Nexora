import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Public endpoints that must NOT carry a Bearer token
// (JWT middleware would reject a stale token before AllowAny view runs)
const PUBLIC_PATHS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/google-login/',
  '/auth/token/',
  '/auth/token/refresh/',
]

// Attach access token to every request EXCEPT public auth endpoints
api.interceptors.request.use((config) => {
  const isPublic = PUBLIC_PATHS.some(p => config.url?.includes(p))
  if (!isPublic) {
    const token = localStorage.getItem('nexora_access')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401 & uniform error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('nexora_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh })
          localStorage.setItem('nexora_access', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('nexora_access')
          localStorage.removeItem('nexora_refresh')
          window.location.href = '/login'
        }
      }
    }
    // Handle 502 / 503 / Bad Gateway / Offline backend server errors cleanly
    if (!error.response || error.response.status === 502 || error.response.status === 503) {
      const offlineMsg = 'Backend server is offline or unreachable (502 Bad Gateway). Please make sure the Django backend is running.'
      if (!error.response) {
        error.response = { status: 502, data: { error: offlineMsg } }
      } else if (typeof error.response.data !== 'object' || !error.response.data || !error.response.data.error) {
        error.response.data = { error: offlineMsg }
      }
    }
    return Promise.reject(error)
  }
)

export default api
