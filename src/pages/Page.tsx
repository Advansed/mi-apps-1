// src/pages/Page.tsx - пример использования PageHeader

import React, { useEffect } from 'react';
import { IonButtons, IonButton, IonIcon, IonContent, IonPage } from '@ionic/react';
import { useParams } from 'react-router';
import { addOutline, searchOutline, ellipsisVerticalOutline } from 'ionicons/icons';
import { useNavigation } from '../hooks/useNavigation';
import PageHeader from './PageHeader';

const Page: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const { 
    navigateToSection, 
    getCurrentLevel, 
    navigateInside,
    getCurrentSectionNav 
  } = useNavigation();

  // Синхронизируем URL параметр с навигационным стейтом
  useEffect(() => {
    if (name) {
      navigateToSection(name);
    }
  }, [name, navigateToSection]);

  // Получаем текущий уровень навигации
  const currentLevel = getCurrentLevel();
  const sectionNav = getCurrentSectionNav();

  // ============================================
  // ДОПОЛНИТЕЛЬНЫЕ КНОПКИ ДЛЯ HEADER
  // ============================================

  const renderRightButtons = () => {
    switch (name) {
      case 'Inbox':
        return (
          <>
          </>
        );
      
      case 'Outbox':
        return (
          <></>
        );
      
      default:
        return (
          <></>
        );
    }
  };

  // ============================================
  // ЗАГОЛОВОК В ЗАВИСИМОСТИ ОТ УРОВНЯ
  // ============================================

  const getPageTitle = () => {
    if (currentLevel === 'main') {
      return name || 'Страница';
    }
    
    // Показываем более детальный заголовок для глубоких уровней
    switch (name) {
      case 'Inbox':
        if (currentLevel === 'details') return 'Письмо';
        if (currentLevel === 'attachments') return 'Вложения';
        break;
      
      case 'Outbox':
        if (currentLevel === 'compose') return 'Новое письмо';
        if (currentLevel === 'draft') return 'Черновик';
        break;
    }
    
    return name || 'Страница';
  };

  // ============================================
  // РЕНДЕР КОНТЕНТА ПО УРОВНЯМ
  // ============================================

  const renderContent = () => {
    switch (name) {
      case 'Inbox':
        return renderInboxContent(currentLevel, sectionNav.data);
      
      case 'Outbox':
        return renderOutboxContent(currentLevel, sectionNav.data);
      
      case 'Favorites':
        return renderFavoritesContent(currentLevel, sectionNav.data);
        
      default:
        return <></>;
    }
  };

  const renderInboxContent = (level: string, data?: any) => {
    switch (level) {
      case 'main':
        return (
          <div className="p-md">
            <h2>Входящие письма</h2>
            <div className="corporate-card" onClick={() => navigateInside('details', { id: 1, subject: 'Тестовое письмо' })}>
              <p><strong>Тестовое письмо</strong></p>
              <p className="text-muted">От: test@example.com</p>
            </div>
          </div>
        );
      
      case 'details':
        return (
          <div className="p-md">
            <h2>{data?.subject}</h2>
            <p className="text-muted">От: {data?.from || 'test@example.com'}</p>
            <div className="mt-md">
              <p>Содержание письма...</p>
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={() => navigateInside('attachments', data)}
                className="mt-md"
              >
                Просмотреть вложения
              </IonButton>
            </div>
          </div>
        );
      
      case 'attachments':
        return (
          <div className="p-md">
            <h2>Вложения</h2>
            <p className="text-muted">К письму: {data?.subject}</p>
            <div className="mt-md">
              <div className="corporate-card">
                <p>📄 document.pdf</p>
              </div>
              <div className="corporate-card">
                <p>🖼️ image.jpg</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Неизвестный уровень: {level}</div>;
    }
  };

  const renderOutboxContent = (level: string, data?: any) => {
    switch (level) {
      case 'main':
        return (
          <div className="p-md">
            <h2>Исходящие</h2>
            <IonButton 
              expand="block" 
              onClick={() => navigateInside('compose')}
            >
              Написать письмо
            </IonButton>
          </div>
        );
      
      case 'compose':
        return (
          <div className="p-md">
            <h2>Новое письмо</h2>
            <form>
              <input type="email" placeholder="Кому" className="borders p-sm mb-sm w-full" />
              <input type="text" placeholder="Тема" className="borders p-sm mb-sm w-full" />
              <textarea placeholder="Сообщение" className="borders p-sm mb-md w-full" rows={10}></textarea>
              <div className="flex gap-sm">
                <IonButton expand="block" color="primary">Отправить</IonButton>
                <IonButton expand="block" fill="outline">Сохранить</IonButton>
              </div>
            </form>
          </div>
        );
      
      default:
        return <div>Неизвестный уровень: {level}</div>;
    }
  };

  const renderFavoritesContent = (level: string, data?: any) => {
    return (
      <div className="p-md">
        <h2>Избранное</h2>
        <p>Контент раздела Избранное</p>
      </div>
    );
  };

  // ============================================
  // ОСНОВНОЙ РЕНДЕР
  // ============================================

  return (
    <IonPage>
      <PageHeader
        title={getPageTitle()}
        rightButtons={renderRightButtons()}
        variant="glass" // или 'default', 'corporate'
      />
      
      <IonContent fullscreen>
        {renderContent()}
      </IonContent>
    </IonPage>
  );
};

export default Page;