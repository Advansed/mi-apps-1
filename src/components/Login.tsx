import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon
} from '@ionic/react';
import { logInOutline, phonePortraitOutline, lockClosedOutline } from 'ionicons/icons';
import { useLogin } from '../components/Store/useLogin';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, login } = useLogin();

  const handleLogin = async () => {
    // Валидация полей
    if (!phone.trim() || !password.trim()) {
      return;
    }

    await login(phone.trim(), password);
    // Редирект будет обработан автоматически в App.tsx
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="bg-light">
        {/* Главный контейнер */}
        <div className="flex items-center justify-center p-lg" style={{ minHeight: '100vh' }}>
          
          {/* Карточка авторизации */}
          <div className="glass corporate-card rounded-xl p-2xl mx-auto" style={{ maxWidth: '400px', width: '100%' }}>
            
            {/* Заголовок */}
            <div className="text-center m-lg">
              <h1 className="gradient-text-primary text-3xl font-bold leading-tight">
                Авторизация
              </h1>
              <p className="text-muted text-base m-sm">
                Введите данные для входа в систему
              </p>
            </div>

            {/* Форма */}
            <div className="p-md">
              
              {/* Поле телефона */}
              <div className="m-md">
                <div className="glass-input rounded p-sm flex items-center">
                  <IonIcon 
                    icon={phonePortraitOutline} 
                    className="text-primary m-sm" 
                  />
                  <IonInput
                    value={phone}
                    onIonInput={(e) => setPhone(e.detail.value!)}
                    onKeyPress={handleKeyPress}
                    placeholder="Номер телефона"
                    type="tel"
                    disabled={isLoading}
                    className="text-base"
                  />
                </div>
              </div>

              {/* Поле пароля */}
              <div className="m-md">
                <div className="glass-input rounded p-sm flex items-center">
                  <IonIcon 
                    icon={lockClosedOutline} 
                    className="text-primary m-sm" 
                  />
                  <IonInput
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    onKeyPress={handleKeyPress}
                    placeholder="Пароль"
                    type="password"
                    disabled={isLoading}
                    className="text-base"
                  />
                </div>
              </div>

              {/* Кнопка входа */}
              <div className="m-lg">
                <IonButton
                  expand="block"
                  onClick={handleLogin}
                  disabled={isLoading || !phone.trim() || !password.trim()}
                  className="btn-corporate glow-blue rounded transition"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <IonSpinner 
                        name="crescent" 
                        className="m-sm neon-border-blue"
                      />
                      <span className="text-white font-medium">Вход...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <IonIcon 
                        icon={logInOutline} 
                        className="m-sm" 
                      />
                      <span className="text-white font-medium">Войти</span>
                    </div>
                  )}
                </IonButton>
              </div>

            </div>

            {/* Дополнительная информация */}
            <div className="text-center p-md">
              <p className="text-muted text-sm">
                Используйте корпоративные учетные данные
              </p>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;