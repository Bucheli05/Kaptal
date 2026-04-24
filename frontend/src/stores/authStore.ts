import { create } from 'zustand'
import { api } from '../lib/api'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName?: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  init: () => {
    set({ isAuthenticated: !!localStorage.getItem('access_token') })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      params.append('username', email)
      params.append('password', password)
      const { data } = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ isAuthenticated: true, isLoading: false })
      return true
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail[0]?.msg
        : typeof detail === 'string'
        ? detail
        : 'Error al iniciar sesión'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ isAuthenticated: true, isLoading: false })
      return true
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail[0]?.msg
        : typeof detail === 'string'
        ? detail
        : 'Error al registrarse'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ isAuthenticated: false, error: null })
  },

  clearError: () => set({ error: null }),
}))
