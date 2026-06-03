import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fm_token')
      localStorage.removeItem('fm_user')
      window.location.href = '/auth'
    }
    return Promise.reject(err.response?.data?.message || 'Une erreur est survenue')
  }
)

export default api
