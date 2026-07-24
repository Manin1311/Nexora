import api from './api'

const roadmapService = {
  generate: (targetRole) =>
    api.post('/roadmap/generate/', { target_role: targetRole }).then(r => r.data),

  get: () =>
    api.get('/roadmap/').then(r => r.data),

  completeTask: (taskId) =>
    api.patch(`/roadmap/task/${taskId}/complete/`).then(r => r.data),

  getTaskContent: (taskId) =>
    api.get(`/roadmap/task/${taskId}/content/`).then(r => r.data),

  clear: () =>
    api.delete('/roadmap/').then(r => r.data),

  getYoutubeResources: (query) =>
    api.get(`/roadmap/youtube-resources/?query=${encodeURIComponent(query)}`).then(r => r.data),
}

export default roadmapService
