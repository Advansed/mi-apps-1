import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonButton,
  IonAvatar,
  IonBadge
} from '@ionic/react';

import { useLocation } from 'react-router-dom';
import { 
  archiveOutline, archiveSharp, bookmarkOutline, heartOutline, heartSharp, 
  mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, trashOutline, 
  trashSharp, warningOutline, warningSharp, logOutOutline, personCircleOutline 
} from 'ionicons/icons';
import { useLogin } from './Store/useLogin';
import './Menu.css';

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
}

const appPages: AppPage[] = [
  {
    title: 'Inbox',
    url: '/folder/Inbox',
    iosIcon: mailOutline,
    mdIcon: mailSharp
  },
  {
    title: 'Outbox',
    url: '/folder/Outbox',
    iosIcon: paperPlaneOutline,
    mdIcon: paperPlaneSharp
  },
  {
    title: 'Favorites',
    url: '/folder/Favorites',
    iosIcon: heartOutline,
    mdIcon: heartSharp
  },

];

const labels = ['Family', 'Friends' ];

const Menu: React.FC = () => {
  const location = useLocation();
  const { name, role, logout } = useLogin();

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      logout();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return 'primary';
      case 'technician': return 'secondary';
      case 'plumber': return 'tertiary';
      case 'dispatcher': return 'warning';
      case 'subcontractor': return 'success';
      default: return 'medium';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master': return 'Мастер';
      case 'technician': return 'Техник';
      case 'plumber': return 'Сантехник';
      case 'dispatcher': return 'Диспетчер';
      case 'subcontractor': return 'Подрядчик';
      default: return role;
    }
  };

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        
        {/* USER PROFILE SECTION */}
        <div className="user-profile-section">
          <div className="user-profile-card glass">
            <div className="user-avatar-container">
              <IonAvatar className="user-avatar">
                <IonIcon icon={personCircleOutline} className="user-avatar-icon" />
              </IonAvatar>
              <div className="user-status-dot"></div>
            </div>
            
            <div className="user-info">
              <h3 className="user-name gradient-text-primary">
                {name || 'Пользователь'}
              </h3>
              
              <IonBadge 
                color={getRoleColor(role || '')} 
                className="user-role-badge"
              >
                {getRoleLabel(role || '')}
              </IonBadge>
            </div>
            
            <IonButton
              fill="clear"
              size="small"
              className="logout-button"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <IonList className="navigation-list">
          <IonListHeader className="nav-header">
            <span className="gradient-text-secondary">Навигация</span>
          </IonListHeader>
          
          {appPages.map((appPage, index) => {
            const isSelected = location.pathname === appPage.url;
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem 
                  className={`nav-item ${isSelected ? 'selected' : ''}`}
                  routerLink={appPage.url} 
                  routerDirection="none" 
                  lines="none" 
                  detail={false}
                >
                  <div className="nav-item-content">
                    <div className="nav-icon-container">
                      <IonIcon 
                        aria-hidden="true" 
                        icon={appPage.iosIcon}
                        md={appPage.mdIcon}
                        className="nav-icon"
                      />
                      {isSelected && <div className="nav-icon-glow"></div>}
                    </div>
                    <IonLabel className="nav-label">{appPage.title}</IonLabel>
                    {isSelected && <div className="nav-item-indicator"></div>}
                  </div>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>

        {/* LABELS SECTION */}
        <IonList className="labels-list">
          <IonListHeader className="nav-header">
            <span className="gradient-text-accent">Метки</span>
          </IonListHeader>
          
          {labels.map((label, index) => (
            <IonItem 
              lines="none" 
              key={index}
              className="label-item"
            >
              <div className="label-item-content">
                <div className="label-icon-container">
                  <IonIcon 
                    aria-hidden="true" 
                    icon={bookmarkOutline}
                    className="label-icon"
                  />
                </div>
                <IonLabel className="label-text">{label}</IonLabel>
              </div>
            </IonItem>
          ))}
        </IonList>

        {/* FOOTER */}
        <div className="menu-footer">
          <IonNote className="footer-note">
            MI Apps v2.0
          </IonNote>
        </div>

      </IonContent>
    </IonMenu>
  );
};

export default Menu;