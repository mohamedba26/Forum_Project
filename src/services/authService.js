import api from './api'

export const authService = {
  login:         (data) => api.post('/auth/login',    data),
  register:      (data) => api.post('/auth/register', data),
  me:            ()     => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
}