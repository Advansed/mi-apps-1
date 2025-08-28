import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon
} from '@ionic/react';
import { logInOutline, phonePortraitOutline, lockClosedOutline } from 'ionicons/icons';
import { Maskito } from '@maskito/core';
import { maskitoPhoneOptionsGenerator } from '@maskito/phone';
import metadata from 'libphonenumber-js/mobile/metadata';
import { useLogin } from './Store/useLogin';
import styles from './Login.module.css';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, login } = useLogin();
  
  // Refs для Maskito
  const phoneInputRef = useRef<HTMLIonInputElement>(null);
  const maskitoRef = useRef<Maskito | null>(null);

  // Инициализация Maskito для телефона
  useEffect(() => {
    const initMaskito = async () => {
      if (phoneInputRef.current && !maskitoRef.current) {
        try {
          // Получаем нативный input элемент из IonInput
          const inputElement = await phoneInputRef.current.getInputElement();
          
          if (inputElement) {
            // Настройки для российского номера
            const phoneOptions = maskitoPhoneOptionsGenerator({
              countryIsoCode: 'RU',
              metadata,
              strict: false, // Позволяет частично заполненные номера
            });

            // Кастомная маска для российского номера +7 (XXX) XXX-XX-XX
            const customMask = [
              '+',
              '7',
              ' ',
              '(',
              /\d/,
              /\d/,
              /\d/,
              ')',
              ' ',
              /\d/,
              /\d/,
              /\d/,
              '-',
              /\d/,
              /\d/,
              '-',
              /\d/,
              /\d/
            ];

            // Инициализируем Maskito с кастомными настройками
            maskitoRef.current = new Maskito(inputElement, {
              mask: customMask,
              preprocessors: [
                // Предобработчик для нормализации ввода
                ({ elementState, data }) => {
                  const { value, selection } = elementState;
                  
                  // Если пользователь начинает вводить с 8 или без +7
                  if (data === '8' && value === '') {
                    return {
                      elementState: {
                        value: '+7 (',
                        selection: [4, 4] // Курсор после +7 (
                      },
                      data: ''
                    };
                  }
                  
                  // Если вводят цифру в пустое поле, добавляем +7 (
                  if (/\d/.test(data) && value === '') {
                    return {
                      elementState: {
                        value: '+7 (',
                        selection: [4, 4]
                      },
                      data
                    };
                  }

                  return { elementState, data };
                }
              ],
              postprocessors: [
                // Постобработчик для корректировки результата
                ({ value, selection }) => {
                  // Если значение короче минимального, оставляем как есть
                  if (value.length < 4) {
                    return { value: '+7 (', selection: [4, 4] };
                  }
                  
                  return { value, selection };
                }
              ],
              overwriteMode: 'replace' // Режим замещения
            });

            // Устанавливаем начальное значение если нужно
            if (phone && !phone.startsWith('+7')) {
              const cleanPhone = phone.replace(/\D/g, '');
              if (cleanPhone) {
                let formattedPhone = '+7 (';
                if (cleanPhone.length > 1) {
                  const digits = cleanPhone.startsWith('7') ? cleanPhone.slice(1) : cleanPhone;
                  for (let i = 0; i < digits.length && i < 10; i++) {
                    if (i === 3) formattedPhone += ') ';
                    else if (i === 6) formattedPhone += '-';
                    else if (i === 8) formattedPhone += '-';
                    formattedPhone += digits[i];
                  }
                }
                setPhone(formattedPhone);
              }
            }
          }
        } catch (error) {
          console.error('Ошибка инициализации Maskito:', error);
        }
      }
    };

    initMaskito();

    // Cleanup при размонтировании
    return () => {
      if (maskitoRef.current) {
        maskitoRef.current.destroy();
        maskitoRef.current = null;
      }
    };
  }, []);

  // Получение чистого номера для отправки на сервер
  const getCleanPhone = (formattedPhone: string): string => {
    return formattedPhone.replace(/\D/g, '');
  };

  // Проверка валидности номера
  const isPhoneValid = (): boolean => {
    const clean = getCleanPhone(phone);
    return clean.length === 11 && clean.startsWith('7');
  };

  const handleLogin = async () => {
    if (!isPhoneValid() || !password.trim()) {
      return;
    }

    const cleanPhone = getCleanPhone(phone);
    await login(cleanPhone, password);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  const handlePhoneInput = (event: CustomEvent) => {
    const value = event.detail.value || '';
    setPhone(value);
  };

  const handlePasswordInput = (event: CustomEvent) => {
    setPassword(event.detail.value || '');
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className={styles.container}>
          
          <div className={styles.card}>
            
            {/* Заголовок */}
            <div>
              <h1 className={styles.title}>
                Вход в систему
              </h1>
              <p className={styles.subtitle}>
                Введите свои учетные данные для доступа к приложению
              </p>
            </div>

            {/* Поле телефона с Maskito */}
            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <IonIcon 
                  icon={phonePortraitOutline} 
                  className={styles.inputIcon}
                />
                <IonInput
                  ref={phoneInputRef}
                  value={phone}
                  onIonInput={handlePhoneInput}
                  onKeyPress={handleKeyPress}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                  disabled={isLoading}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Поле пароля */}
            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <IonIcon 
                  icon={lockClosedOutline} 
                  className={styles.inputIcon}
                />
                <IonInput
                  value={password}
                  onIonInput={handlePasswordInput}
                  onKeyPress={handleKeyPress}
                  placeholder="Пароль"
                  type="password"
                  disabled={isLoading}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Кнопка входа */}
            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={isLoading || !isPhoneValid() || !password.trim()}
              className={styles.loginButton}
              fill="clear"
            >
              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <IonSpinner 
                    name="crescent" 
                    className={styles.spinner}
                  />
                  <span>Вход...</span>
                </div>
              ) : (
                <div className={styles.loadingContainer}>
                  <IonIcon icon={logInOutline} />
                  <span>Войти</span>
                </div>
              )}
            </IonButton>

            <div className={styles.footer}>
              Используйте корпоративные данные для входа
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;