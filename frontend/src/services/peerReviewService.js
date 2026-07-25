import api from './api'

export const peerReviewService = {
  getAll: (params) => api.get('/peer-reviews/', { params }),
  getById: (id) => api.get(`/peer-reviews/${id}/`),
  create: (data) => api.post('/peer-reviews/', data),
  updateStatus: (id, status) => api.patch(`/peer-reviews/${id}/`, { status }),
  toggleUpvote: (id) => api.post(`/peer-reviews/${id}/upvote/`),
  getComments: (id) => api.get(`/peer-reviews/${id}/comments/`),
  addComment: (id, data) => api.post(`/peer-reviews/${id}/comments/`, data),
  toggleCommentUpvote: (commentId) => api.post(`/peer-reviews/comments/${commentId}/upvote/`),
}

export default peerReviewService
