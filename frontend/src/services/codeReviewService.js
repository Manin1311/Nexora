import api from './api'

const codeReviewService = {
  submit: (repoUrl, forceRefresh = false) =>
    api.post('/codereview/submit/', { repo_url: repoUrl, force_refresh: forceRefresh }).then(r => r.data),

  getHistory: () =>
    api.get('/codereview/history/').then(r => r.data),

  getDetails: (id) =>
    api.get(`/codereview/${id}/`).then(r => r.data),

  refactor: (data) =>
    api.post('/codereview/refactor/', data).then(r => r.data),
}

export default codeReviewService
