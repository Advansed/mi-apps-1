// src/hooks/useNavigation.ts

import { useCallback } from 'react'
import { UniversalStore, useStore, TState } from '../components/Store/Store'

// ============================================
// ТИПЫ НАВИГАЦИИ
// ============================================

export interface SectionNavigation {
  currentLevel: number        // текущий уровень вложенности (0 = главная страница)
  levelHistory: string[]      // история внутри раздела
  canGoBack: boolean         // можно ли вернуться назад внутри раздела
  data?: any                 // дополнительные данные уровня
}

export interface NavigationState extends TState {
  currentSection: string                                    // текущий раздел (Inbox, Outbox...)
  sectionHistory: string[]                                 // история переходов между разделами
  internalNavigation: { [sectionName: string]: SectionNavigation }  // навигация внутри разделов
}

export type BackType = 'internal' | 'global' | 'none'

// ============================================
// НАВИГАЦИОННЫЙ STORE
// ============================================

export const navigationStore = new UniversalStore<NavigationState>({
  initialState: {
    currentSection: 'Inbox',
    sectionHistory: ['Inbox'],
    internalNavigation: {}
  },
  enableLogging: false // отключаем для навигации, чтобы не засорять консоль
})

// ============================================
// ОСНОВНОЙ ХУК НАВИГАЦИИ
// ============================================

export function useNavigation() {
  const currentSection = useStore((state: NavigationState) => state.currentSection, 2001, navigationStore)
  const sectionHistory = useStore((state: NavigationState) => state.sectionHistory, 2002, navigationStore)
  const internalNavigation = useStore((state: NavigationState) => state.internalNavigation, 2003, navigationStore)

  // ============================================
  // ГЛОБАЛЬНАЯ НАВИГАЦИЯ (между разделами)
  // ============================================

  const navigateToSection = useCallback((section: string) => {
    // Не добавляем в историю если уже находимся в этом разделе
    if (section === currentSection) return

    const newHistory = [...sectionHistory, section]
    
    navigationStore.dispatch({ type: 'currentSection', data: section })
    navigationStore.dispatch({ type: 'sectionHistory', data: newHistory })
    
    // Сбрасываем внутреннюю навигацию нового раздела
    resetSectionNavigation(section)
  }, [currentSection, sectionHistory])

  const goBackToSection = useCallback(() => {
    if (sectionHistory.length <= 1) return false

    const newHistory = [...sectionHistory]
    newHistory.pop() // удаляем текущий
    const prevSection = newHistory[newHistory.length - 1]

    navigationStore.dispatch({ type: 'currentSection', data: prevSection })
    navigationStore.dispatch({ type: 'sectionHistory', data: newHistory })
    
    return true
  }, [sectionHistory])

  // ============================================
  // ВНУТРЕННЯЯ НАВИГАЦИЯ (внутри раздела)
  // ============================================

  const getCurrentSectionNav = useCallback((): SectionNavigation => {
    return internalNavigation[currentSection] || {
      currentLevel: 0,
      levelHistory: ['main'],
      canGoBack: false
    }
  }, [internalNavigation, currentSection])

  const navigateInside = useCallback((level: string, data?: any) => {
    const currentNav = getCurrentSectionNav()
    const newNav: SectionNavigation = {
      ...currentNav,
      currentLevel: currentNav.currentLevel + 1,
      levelHistory: [...currentNav.levelHistory, level],
      canGoBack: true,
      data
    }

    const updatedInternal = {
      ...internalNavigation,
      [currentSection]: newNav
    }

    navigationStore.dispatch({ type: 'internalNavigation', data: updatedInternal })
  }, [currentSection, internalNavigation, getCurrentSectionNav])

  const goBackInside = useCallback(() => {
    const currentNav = getCurrentSectionNav()
    
    if (currentNav.currentLevel <= 0) return false

    const newHistory = [...currentNav.levelHistory]
    newHistory.pop()

    const newNav: SectionNavigation = {
      ...currentNav,
      currentLevel: Math.max(0, currentNav.currentLevel - 1),
      levelHistory: newHistory,
      canGoBack: newHistory.length > 1
    }

    const updatedInternal = {
      ...internalNavigation,
      [currentSection]: newNav
    }

    navigationStore.dispatch({ type: 'internalNavigation', data: updatedInternal })
    return true
  }, [currentSection, internalNavigation, getCurrentSectionNav])

  const resetSectionNavigation = useCallback((section: string = currentSection) => {
    const updatedInternal = {
      ...internalNavigation,
      [section]: {
        currentLevel: 0,
        levelHistory: ['main'],
        canGoBack: false
      }
    }

    navigationStore.dispatch({ type: 'internalNavigation', data: updatedInternal })
  }, [internalNavigation, currentSection])

  // ============================================
  // УМНАЯ КНОПКА BACK
  // ============================================

  const getBackType = useCallback((): BackType => {
    const currentNav = getCurrentSectionNav()
    
    if (currentNav.canGoBack && currentNav.currentLevel > 0) {
      return 'internal'
    }
    
    if (sectionHistory.length > 1) {
      return 'global'
    }
    
    return 'none'
  }, [getCurrentSectionNav, sectionHistory])

  const canGoBack = useCallback((): boolean => {
    return getBackType() !== 'none'
  }, [getBackType])

  const goBack = useCallback(() => {
    const backType = getBackType()
    
    switch (backType) {
      case 'internal':
        return goBackInside()
      
      case 'global':
        return goBackToSection()
      
      case 'none':
        // Fallback на browser history если доступно
        if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back()
          return true
        }
        return false
      
      default:
        return false
    }
  }, [getBackType, goBackInside, goBackToSection])

  // ============================================
  // УТИЛИТАРНЫЕ МЕТОДЫ
  // ============================================

  const getCurrentLevel = useCallback((): string => {
    const currentNav = getCurrentSectionNav()
    return currentNav.levelHistory[currentNav.levelHistory.length - 1] || 'main'
  }, [getCurrentSectionNav])

  const getCurrentLevelData = useCallback((): any => {
    return getCurrentSectionNav().data
  }, [getCurrentSectionNav])

  const getSectionBreadcrumbs = useCallback((): string[] => {
    return getCurrentSectionNav().levelHistory
  }, [getCurrentSectionNav])

  const getGlobalBreadcrumbs = useCallback((): string[] => {
    return sectionHistory
  }, [sectionHistory])

  // ============================================
  // ВОЗВРАЩАЕМОЕ API
  // ============================================

  return {
    // Текущее состояние
    currentSection,
    sectionHistory,
    internalNavigation,
    
    // Глобальная навигация
    navigateToSection,
    goBackToSection,
    
    // Внутренняя навигация
    navigateInside,
    goBackInside,
    resetSectionNavigation,
    getCurrentSectionNav,
    getCurrentLevel,
    getCurrentLevelData,
    
    // Умная кнопка Back
    goBack,
    canGoBack,
    getBackType,
    
    // Утилиты
    getSectionBreadcrumbs,
    getGlobalBreadcrumbs
  }
}

// ============================================
// УТИЛИТАРНЫЕ ФУНКЦИИ ДЛЯ ЭКСПОРТА
// ============================================

export const getCurrentSection = () => navigationStore.getState().currentSection
export const canNavigateBack = () => {
  const state = navigationStore.getState()
  const currentNav = state.internalNavigation[state.currentSection]
  return (currentNav?.canGoBack && currentNav.currentLevel > 0) || state.sectionHistory.length > 1
}