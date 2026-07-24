import api from './api'

const resumeService = {
  /** Load the current user's resume (GET /api/users/resume/) */
  getResume: () => api.get('/users/resume/'),

  /** Save resume builder data (PUT /api/users/resume/) */
  saveResume: (data) => api.put('/users/resume/', data),

  /** Upload a PDF/TXT and parse via AI (POST /api/users/resume/analyze/) */
  analyzeUpload: (formData) =>
    api.post('/users/resume/analyze/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Run ATS audit for a target role (POST /api/users/resume/audit/) */
  runAudit: (target_role) => api.post('/users/resume/audit/', { target_role }),

  /** Tailor resume against a Job Description (POST /api/users/resume/tailor/) */
  tailorResume: (job_description) => api.post('/users/resume/tailor/', { job_description }),

  /** Simulate premium unlock (POST /api/users/resume/premium/) */
  unlockPremium: () => api.post('/users/resume/premium/'),
}

export default resumeService
