import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('nexora_access')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authService.getMe()
      setUser(data)
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('nexora_access')
      localStorage.removeItem('nexora_refresh')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password })
    localStorage.setItem('nexora_access', data.tokens.access)
    localStorage.setItem('nexora_refresh', data.tokens.refresh)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  const register = async (formData) => {
    const { data } = await authService.register(formData)
    localStorage.setItem('nexora_access', data.tokens.access)
    localStorage.setItem('nexora_refresh', data.tokens.refresh)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('nexora_refresh')
      if (refresh) await authService.logout(refresh)
    } catch {}
    localStorage.removeItem('nexora_access')
    localStorage.removeItem('nexora_refresh')
    setUser(null)
    setIsAuthenticated(false)
  }

  const refreshUser = async () => {
    try {
      const { data } = await authService.getMe()
      setUser(data)
    } catch {}
  }

  const loginWithGoogle = async (googleToken) => {
    const { data } = await authService.googleLogin(googleToken)
    localStorage.setItem('nexora_access', data.tokens.access)
    localStorage.setItem('nexora_refresh', data.tokens.refresh)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  const [isPro, setIsPro] = useState(() => {
    return localStorage.getItem('nexora_is_pro') === 'true'
  })

  const activatePro = () => {
    localStorage.setItem('nexora_is_pro', 'true')
    setIsPro(true)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isPro, activatePro, login, register, logout, refreshUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
