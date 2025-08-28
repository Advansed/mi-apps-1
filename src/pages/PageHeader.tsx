// src/components/PageHeader/PageHeader.tsx

import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonMenuButton
} from '@ionic/react';
import { arrowBackOutline, chevronBackOutline } from 'ionicons/icons';
import { useNavigation } from '../hooks/useNavigation';
import styles from './PageHeader.module.css';

// ============================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================

export interface PageHeaderProps {
  title: string;                          // заголовок страницы
  showBackButton?: boolean;               // принудительно показать/скрыть кнопку назад
  showMenuButton?: boolean;               // показать кнопку меню (по умолчанию true)
  onBackClick?: () => void;               // кастомный обработчик кнопки назад
  backButtonText?: string;                // текст рядом с кнопкой назад
  rightButtons?: React.ReactNode;         // дополнительные кнопки справа
  className?: string;                     // дополнительные CSS классы
  variant?: 'default' | 'glass' | 'corporate'; // стилевые варианты
}

// ============================================
// КОМПОНЕНТ PageHeader
// ============================================

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton,
  showMenuButton = true,
  onBackClick,
  backButtonText,
  rightButtons,
  className = '',
  variant = 'glass'
}) => {
  const { goBack, canGoBack, getBackType } = useNavigation();

  // ============================================
  // ЛОГИКА КНОПКИ BACK
  // ============================================

  const shouldShowBackButton = showBackButton !== undefined ? showBackButton : canGoBack();
  const backType = getBackType();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      goBack();
    }
  };

  // Выбираем иконку в зависимости от типа возврата
  const getBackIcon = () => {
    switch (backType) {
      case 'internal':
        return arrowBackOutline;    // стрелка назад для внутренней навигации
      case 'global':
        return chevronBackOutline;  // шеврон для глобальной навигации
      default:
        return arrowBackOutline;
    }
  };

  // ============================================
  // CSS КЛАССЫ
  // ============================================

  const headerClasses = [
    styles.header,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  const toolbarClasses = [
    styles.toolbar
  ].join(' ');

  const titleClasses = [
    styles.title
  ].join(' ');

  // ============================================
  // РЕНДЕР КОМПОНЕНТА
  // ============================================

  return (
    <IonHeader className={headerClasses}>
      <IonToolbar className={toolbarClasses}>
        
       {/* КНОПКА НАЗАД (СЛЕВА) */}
        {shouldShowBackButton && (
          <IonButtons slot="start">
            <IonButton 
              fill="clear" 
              onClick={handleBackClick}
              className={styles.backButton}
            >
              <IonIcon icon={getBackIcon()} className={styles.backIcon} />
              {backButtonText && (
                <span className={styles.backText}>{backButtonText}</span>
              )}
            </IonButton>
          </IonButtons>
        )}

        {/* ЗАГОЛОВОК (ЦЕНТР) */}
        <IonTitle className={titleClasses}>
          {title}
        </IonTitle>

        {/* КНОПКА МЕНЮ (СПРАВА) */}
        {showMenuButton && (
          <IonButtons slot="end">
            <IonMenuButton className={styles.menuButton} />
          </IonButtons>
        )}

        {/* ДОПОЛНИТЕЛЬНЫЕ КНОПКИ (СПРАВА) */}
        {rightButtons && (
          <IonButtons slot="end">
            {rightButtons}
          </IonButtons>
        )}

      </IonToolbar>
    </IonHeader>
  );
};

export default PageHeader;