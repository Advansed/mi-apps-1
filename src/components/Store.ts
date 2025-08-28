import { useState, useEffect, useRef } from 'react'

// ============================================
// УНИВЕРСАЛЬНЫЕ ТИПЫ
// ============================================


export type TState = Record<string, any>


export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error?: string
  message?: string
}


export interface StoreAction<T = any> {
  type: string
  data: T
}


export interface StoreListener {
  num: number
  type: string
  func: () => void
}


export interface StoreConfig<T extends TState> {
  initialState: T
  enableDevTools?: boolean
  enableLogging?: boolean
}

// ============================================
// УНИВЕРСАЛЬНЫЙ STORE CLASS
// ============================================


export class UniversalStore<T extends TState> {
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

  getState(): T {
    return { ...this.state }
  }

  dispatch<TData>(action: StoreAction<TData>): StoreAction<TData> {
    const oldState = { ...this.state }
    
    if (this.state.hasOwnProperty(action.type)) {
      this.state = {
        ...this.state,
        [action.type]: action.data
      }
    }

    if (this.config.enableLogging) {
      console.group(`🔄 Store Action: ${action.type}`)
      console.log('Previous:', oldState[action.type])
      console.log('Action:', action)
      console.log('Next:', this.state[action.type])
      console.groupEnd()
    }

    this.notifyListeners(action.type)
    return action
  }

  subscribe(listener: StoreListener): void {
    const existingIndex = this.listeners.findIndex(l => l.num === listener.num)
    
    if (existingIndex >= 0) {
      this.listeners[existingIndex] = listener
    } else {
      this.listeners.push(listener)
    }
  }

  unsubscribe(listenerId: number): void {
    this.listeners = this.listeners.filter(l => l.num !== listenerId)
  }

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

  private setupDevTools(): void {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      console.log('🛠 Redux DevTools available')
    }
  }

  reset(): void {
    this.state = { ...this.config.initialState }
    this.listeners.forEach(listener => listener.func())
  }

  getStateSlice<K extends keyof T>(key: K): T[K] {
    return this.state[key]
  }

  batchUpdate(updates: Partial<T>): void {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...updates }
    
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
// УНИВЕРСАЛЬНЫЕ ХУКИ
// ============================================


export function useStore<T extends TState, TSelected>(
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
    
    setSelectedState(selector(storeInstance.getState()))

    const currentState = storeInstance.getState()
    const stateKeys = Object.keys(currentState)
    
    stateKeys.forEach(key => {
      storeInstance.subscribe({
        num: subscriptionId + key.length,
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


export function useStoreField<T extends TState, K extends keyof T>(
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
// УНИВЕРСАЛЬНЫЕ API ФУНКЦИИ
// ============================================


export async function apiCall<T = any>(
  url: string,
  method: string, 
  params: any = {},
  options: {
    timeout?: number
    headers?: Record<string, string>
  } = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 10000,
    headers = { 'Content-Type': 'application/json' }
  } = options

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url + method, {
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

// ============================================
// УНИВЕРСАЛЬНЫЕ УТИЛИТЫ
// ============================================

let uniqueId = 1000


export function generateId(): number {
  return ++uniqueId
}


export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString()
  } else {
    return d.toLocaleString()
  }
}


export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ""
  
  const digits = phone.replace(/\D/g, '')
  
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