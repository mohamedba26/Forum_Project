import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('fm_user')
    const token  = localStorage.getItem('fm_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const { user, token } = await authService.login(credentials)
    localStorage.setItem('fm_token', token)
    localStorage.setItem('fm_user', JSON.stringify(user))
    setUser(user)
    return user
  }, [])

  const register = useCallback(async (data) => {
    const { user, token } = await authService.register(data)
    localStorage.setItem('fm_token', token)
    localStorage.setItem('fm_user', JSON.stringify(user))
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('fm_token')
    localStorage.removeItem('fm_user')
    setUser(null)
  }, [])

  const updateUser = useCallback(async (data) => {
    const updated = await authService.updateProfile(data)
    localStorage.setItem('fm_user', JSON.stringify(updated))
    setUser(updated)
    return updated
  }, [])

  const isAdmin      = user?.role === 'admin'
  const isModerator  = user?.role === 'moderateur' || user?.role === 'admin'
  const isUser       = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isModerator, isUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}