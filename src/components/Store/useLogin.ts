// src/components/Store/useLogin.ts

import { useCallback } from 'react'
import { 
  UniversalStore, 
  useStore, 
  apiCall, 
  ApiResponse, 
  TState 
} from './Store'
import { useToast } from '../Toast'

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

export const API_URL = "https://fhd.aostng.ru/dashboard/mi/"

// ============================================
// ТИПЫ
// ============================================

export interface AppState extends TState {
  auth:         boolean
  id:           string | null
  name:         string | null
  token:        string | null
  role:         string | null
  isLoading:    boolean
}

interface LoginResponse {
    id:         string
    phone:      string
    fullName:   string
    role:       string
    token:      string
}

// ============================================
// STORE
// ============================================

export const appStore = new UniversalStore<AppState>({
  initialState: { 
    auth: false,
    id: null,
    name: null,
    token: null,
    role: null,
    isLoading: false,
    error: null
  },
  enableLogging: true
})

// ============================================
// HOOK
// ============================================

export function useLogin() {
  const auth        = useStore((state: AppState) => state.auth, 1001, appStore)
  const id          = useStore((state: AppState) => state.id, 1002, appStore)
  const name        = useStore((state: AppState) => state.name, 1003, appStore)
  const token       = useStore((state: AppState) => state.token, 1004, appStore)
  const role        = useStore((state: AppState) => state.role, 1005, appStore)
  const isLoading   = useStore((state: AppState) => state.isLoading, 1006, appStore)

  const toast       = useToast()

  const login = useCallback(async (phone: string, password: string): Promise<boolean> => {
    appStore.dispatch({ type: 'isLoading', data: true })

    try {
      const response: ApiResponse<LoginResponse> = await apiCall(
        API_URL, 'AUTHORIZATION', { login: phone, password: password }
      )

      if (response.success && response.data) {

        const userData = response.data
        
        appStore.dispatch({ type: 'auth',       data: true })
        appStore.dispatch({ type: 'id',         data: userData.id })
        appStore.dispatch({ type: 'name',       data: userData.fullName })
        appStore.dispatch({ type: 'token',      data: userData.token })
        appStore.dispatch({ type: 'role',       data: userData.role })
        appStore.dispatch({ type: 'isLoading',  data: false })
        appStore.dispatch({ type: 'error',      data: null })
      
        toast.success( 'Авторизация успешна')

        return true
      }

      appStore.dispatch({ type: 'isLoading',    data: false })
      appStore.dispatch({ type: 'auth',         data: false })

      toast.error( response.message || 'Ошибка авторизации')
      
      return false

    } catch (error: any) {
      appStore.dispatch({ type: 'isLoading',    data: false })
      appStore.dispatch({ type: 'error',        data: error instanceof Error ? error.message : 'Сетевая ошибка' })
      appStore.dispatch({ type: 'auth',         data: false })

      toast.error( error?.message || 'Ошибка авторизации')
      
      return false
    }
  }, [])

  const logout = useCallback(() => {
    appStore.dispatch({ type: 'auth',           data: false })
    appStore.dispatch({ type: 'id', data: null })
    appStore.dispatch({ type: 'name',           data: null })
    appStore.dispatch({ type: 'token',          data: null })
    appStore.dispatch({ type: 'role',           data: null })
    appStore.dispatch({ type: 'error',          data: null })

    toast.info("Выход с авторизации")
  }, [])


  return {
    auth,
    id,
    name,
    token,
    role,
    isLoading,
    login,
    logout
  }
}

// ============================================
// УТИЛИТЫ ДЛЯ ДРУГИХ КОМПОНЕНТОВ
// ============================================

export const getToken = () => appStore.getState().token
export const getName = () => appStore.getState().name || ''
export const getRole = () => appStore.getState().role || ''
export const getId = () => appStore.getState().id || ''
export const isAuthenticated = () => appStore.getState().auth

export const getAuthData = () => {
  const state = appStore.getState()
  return {
    auth: state.auth,
    id: state.id,
    name: state.name,
    token: state.token,
    role: state.role
  }
}