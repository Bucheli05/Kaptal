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
      const { data } = await api.post('/auth/login', {
        username: email,
        password,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ isAuthenticated: true, isLoading: false })
      return true
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Error al iniciar sesión',
        isLoading: false,
      })
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
      set({
        error: err.response?.data?.detail || 'Error al registrarse',
        isLoading: false,
      })
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
