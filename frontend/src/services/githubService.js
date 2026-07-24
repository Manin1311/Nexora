import api from './api'

const githubService = {
  connect: (username) =>
    api.post('/auth/github/connect/', { username }).then(r => r.data),

  scan: () =>
    api.get('/auth/github/scan/').then(r => r.data),

  disconnect: () =>
    api.post('/auth/github/disconnect/').then(r => r.data),
}

export default githubService
