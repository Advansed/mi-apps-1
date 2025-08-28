import { useState, useEffect, useRef } from 'react'

// ============================================
// УНИВЕРСАЛЬНЫЕ ТИПЫ
// ============================================

// Базовый тип состояния - любой объект
type TState = Record<string, any>

// Базовый интерфейс для API ответов
interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error?: string
  message?: string
}

// Базовый тип для действий
interface StoreAction<T = any> {
  type: string
  data: T
}

// Тип для слушателей
interface StoreListener {
  num: number
  type: string
  func: () => void
}

// Базовый интерфейс конфигурации Store
interface StoreConfig<T extends TState> {
  initialState: T
  apiBaseUrl?: string
  enableDevTools?: boolean
  enableLogging?: boolean
}

// ============================================
// КОНКРЕТНЫЕ ТИПЫ ПРИЛОЖЕНИЯ (настраиваемые)
// ============================================

// Типы авторизации
interface AuthData {
  userId: string
  fullName: string
  role: 'master' | 'technician' | 'plumber' | 'dispatcher' | 'subcontractor' | ''
  token: string
}

interface AuthResponse {
  id: string
  phone: string
  fullName: string
  role: string
  token: string
}

// Основное состояние приложения
interface AppState {
  auth: boolean
  login: AuthData
  route: string
  back: number
  message: string
  toast: any | null
}

// ============================================
// УНИВЕРСАЛЬНЫЙ STORE CLASS
// ============================================

class UniversalStore<T extends TState> {
  private state: T
  private listeners: StoreListener[] = []
  private config: StoreConfig<T>

  constructor(config: StoreConfig<T>) {
    this.config = config
    this.state = { ...config.initialState }
    
    if (config.enableDevTools && typeof window !== 'undefined') {
      this.setupDevTools()
    }
  }

  // Получение текущего состояния
  getState(): T {
    return { ...this.state }
  }

  // Отправка действия
  dispatch<TData>(action: StoreAction<TData>): StoreAction<TData> {
    const oldState = { ...this.state }
    
    // Обновляем состояние
    if (this.state.hasOwnProperty(action.type)) {
      this.state = {
        ...this.state,
        [action.type]: action.data
      }
    }

    // Логирование (если включено)
    if (this.config.enableLogging) {
      console.group(`🔄 Store Action: ${action.type}`)
      console.log('Previous:', oldState[action.type])
      console.log('Action:', action)
      console.log('Next:', this.state[action.type])
      console.groupEnd()
    }

    // Уведомляем слушателей
    this.notifyListeners(action.type)

    return action
  }

  // Подписка на изменения
  subscribe(listener: StoreListener): void {
    const existingIndex = this.listeners.findIndex(l => l.num === listener.num)
    
    if (existingIndex >= 0) {
      this.listeners[existingIndex] = listener
    } else {
      this.listeners.push(listener)
    }
  }

  // Отписка от изменений
  unsubscribe(listenerId: number): void {
    this.listeners = this.listeners.filter(l => l.num !== listenerId)
  }

  // Уведомление слушателей
  private notifyListeners(actionType: string): void {
    this.listeners
      .filter(listener => listener.type === actionType)
      .forEach(listener => {
        try {
          listener.func()
        } catch (error) {
          console.error('Store listener error:', error)
        }
      })
  }

  // Настройка DevTools (если доступны)
  private setupDevTools(): void {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__
      // Базовая интеграция с Redux DevTools
      console.log('🛠 Redux DevTools available')
    }
  }

  // Очистка состояния
  reset(): void {
    this.state = { ...this.config.initialState }
    this.listeners.forEach(listener => listener.func())
  }

  // Получение части состояния
  getStateSlice<K extends keyof T>(key: K): T[K] {
    return this.state[key]
  }

  // Массовое обновление состояния
  batchUpdate(updates: Partial<T>): void {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...updates }
    
    // Уведомляем о всех изменениях
    Object.keys(updates).forEach(key => {
      this.notifyListeners(key)
    })

    if (this.config.enableLogging) {
      console.group('🔄 Batch Update')
      console.log('Updates:', updates)
      console.log('New State:', this.state)
      console.groupEnd()
    }
  }
}

// ============================================
// КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

// Начальное состояние приложения
const initialAppState: AppState = {
  auth: false,
  login: { userId: "", fullName: "", role: "", token: "" },
  route: "",
  back: 0,
  message: '',
  toast: null
}

// Создание экземпляра Store
const store = new UniversalStore<AppState>({
  initialState: initialAppState,
  apiBaseUrl: "https://fhd.aostng.ru/dashboard/mi/",
  enableDevTools: process.env.NODE_ENV === 'development',
  enableLogging: process.env.NODE_ENV === 'development'
})

// ============================================
// УНИВЕРСАЛЬНЫЕ ХУКИ
// ============================================

// Базовый хук для подписки на Store
function useStore<T extends TState, TSelected>(
  selector: (state: T) => TSelected,
  subscriptionId: number,
  storeInstance: UniversalStore<T>
): TSelected {
  const [selectedState, setSelectedState] = useState<TSelected>(
    selector(storeInstance.getState())
  )
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    // Устанавливаем начальное состояние
    setSelectedState(selector(storeInstance.getState()))

    // Подписываемся на изменения всех полей (универсально)
    const currentState = storeInstance.getState()
    const stateKeys = Object.keys(currentState)
    
    stateKeys.forEach(key => {
      storeInstance.subscribe({
        num: subscriptionId + key.length, // уникальный ID для каждого поля
        type: key,
        func: () => {
          if (isMountedRef.current) {
            const newState = selector(storeInstance.getState())
            setSelectedState(newState)
          }
        }
      })
    })

    return () => {
      isMountedRef.current = false
      stateKeys.forEach(key => {
        storeInstance.unsubscribe(subscriptionId + key.length)
      })
    }
  }, [selector, subscriptionId, storeInstance])

  return selectedState
}

// Хук для конкретного поля
function useStoreField<T extends TState, K extends keyof T>(
  fieldName: K,
  subscriptionId: number,
  storeInstance: UniversalStore<T>
): T[K] {
  const [fieldValue, setFieldValue] = useState<T[K]>(
    storeInstance.getStateSlice(fieldName)
  )
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    setFieldValue(storeInstance.getStateSlice(fieldName))

    storeInstance.subscribe({
      num: subscriptionId,
      type: fieldName as string,
      func: () => {
        if (isMountedRef.current) {
          setFieldValue(storeInstance.getStateSlice(fieldName))
        }
      }
    })

    return () => {
      isMountedRef.current = false
      storeInstance.unsubscribe(subscriptionId)
    }
  }, [fieldName, subscriptionId, storeInstance])

  return fieldValue
}

// ============================================
// СПЕЦИАЛИЗИРОВАННЫЕ ХУКИ ДЛЯ ПРИЛОЖЕНИЯ
// ============================================

// Хук авторизации
function useAuth(): [AuthData, boolean, (authData: AuthData) => void, () => void] {
  const login = useStoreField('login', 1001, store)
  const auth = useStoreField('auth', 1002, store)

  const setAuth = (authData: AuthData) => {
    store.batchUpdate({
      login: authData,
      auth: true
    } as Partial<AppState>)
  }

  const logout = () => {
    store.batchUpdate({
      login: { userId: "", fullName: "", role: "", token: "" },
      auth: false
    } as Partial<AppState>)
  }

  return [login, auth, setAuth, logout]
}

// Хук сообщений
function useMessage(): [string, (message: string) => void, () => void] {
  const message = useStoreField('message', 1003, store)

  const setMessage = (msg: string) => {
    store.dispatch({ type: 'message', data: msg })
  }

  const clearMessage = () => {
    store.dispatch({ type: 'message', data: '' })
  }

  return [message, setMessage, clearMessage]
}

// Хук навигации
function useNavigation(): [string, number, (route: string) => void, () => void] {
  const route = useStoreField('route', 1004, store)
  const back = useStoreField('back', 1005, store)

  const setRoute = (newRoute: string) => {
    store.batchUpdate({
      route: newRoute,
      back: back + 1
    } as Partial<AppState>)
  }

  const goBack = () => {
    store.dispatch({ type: 'back', data: Math.max(0, back - 1) })
  }

  return [route, back, setRoute, goBack]
}

// ============================================
// API СИСТЕМА
// ============================================

// Универсальная функция API запроса
async function apiCall<T = any>(
  method: string, 
  params: any = {},
  options: {
    timeout?: number
    headers?: Record<string, string>
    baseUrl?: string
  } = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 10000,
    headers = { 'Content-Type': 'application/json' },
    baseUrl = store.getState().login?.token ? 
      "https://fhd.aostng.ru/dashboard/mi/" : 
      "https://fhd.aostng.ru/dashboard/mi/"
  } = options

  // Добавляем токен если есть
  const token = store.getStateSlice('login').token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(baseUrl + method, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Специализированные API функции
async function authUser(
  login: string, 
  password: string
): Promise<ApiResponse<AuthResponse>> {
  return await apiCall<AuthResponse>('p_authorization', { login, password })
}

async function getInvoices(token: string): Promise<ApiResponse<any[]>> {
  return await apiCall('p_get_invoices', { token })
}

// Универсальная функция выполнения с обновлением состояния
async function execAndUpdate<T>(
  method: string, 
  params: any, 
  stateKey: keyof AppState
): Promise<void> {
  const result = await apiCall<T>(method, params)
  if (result.success && result.data) {
    store.dispatch({ type: stateKey as string, data: result.data })
  }
}

// ============================================
// УТИЛИТЫ
// ============================================

// Нормализация телефона (универсальная)
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ""
  
  // Извлекаем только цифры
  const digits = phone.replace(/\D/g, '')
  
  // Обработка различных форматов
  if (digits.length === 11 && digits.startsWith('8')) {
    return '+7' + digits.slice(1)
  } else if (digits.length === 11 && digits.startsWith('7')) {
    return '+' + digits
  } else if (digits.length === 10 && digits.startsWith('9')) {
    return '+7' + digits
  } else if (digits.length >= 11) {
    return '+' + digits
  }
  
  return digits
}

// Генератор уникальных ID
let uniqueId = 1000
function generateId(): number {
  return ++uniqueId
}

// Форматирование даты (универсальная)
function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString()
  } else {
    return d.toLocaleString()
  }
}

// ============================================
// ОБРАТНАЯ СОВМЕСТИМОСТЬ
// ============================================

// Старые хуки для совместимости
function useSelector<T>(
  selector: (state: AppState) => T, 
  subscriptionId: number
): T {
  return useStore(selector, subscriptionId, store)
}

function useStoreFieldCompat<K extends keyof AppState>(
  fieldName: K, 
  subscriptionId: number
): AppState[K] {
  return useStoreField(fieldName, subscriptionId, store)
}

// Старые функции для совместимости
async function getData(method: string, params: any): Promise<any> {
  const result = await apiCall(method, params)
  return { data: result.data }
}

async function exec(method: string, params: any, name: keyof AppState): Promise<void> {
  await execAndUpdate(method, params, name)
}

function Phone(phone: string): string {
  return normalizePhone(phone)
}

// ============================================
// ЭКСПОРТЫ
// ============================================

// Основной Store (совместимость)
export const Store = {
  getState: () => store.getState(),
  dispatch: (action: StoreAction) => store.dispatch(action),
  subscribe: (listener: StoreListener) => store.subscribe(listener),
  unSubscribe: (id: number) => store.unsubscribe(id)
}

// Универсальные классы и типы
export { 
  UniversalStore, 
  type TState,
  type StoreConfig, 
  type ApiResponse, 
  type StoreAction,
  type StoreListener
}

// Универсальные хуки
export { useStore, useStoreField }

// Хуки для приложения
export { useAuth, useMessage, useNavigation }

// Хуки совместимости
export { 
  useSelector, 
  useStoreField as useStoreFieldCompat
}

// API функции
export { 
  apiCall, 
  authUser, 
  getInvoices, 
  execAndUpdate
}

// API совместимости
export { getData, exec }

// Утилиты
export { 
  normalizePhone, 
  generateId, 
  formatDate
}

// Утилиты совместимости
export { Phone }

// Константы
export const URL = "https://fhd.aostng.ru/dashboard/mi/"

// Типы для компонентов
export type { 
  AppState, 
  AuthData, 
  AuthResponse,
  ApiResponse as ApiResponseType,
  StoreAction as StoreActionType,
  StoreListener as StoreListenerType
}

// Прямой доступ к экземпляру store (для продвинутого использования)
export { store as storeInstance }