import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

function Settings({ theme, setTheme, fontSize, setFontSize, language, setLanguage, isPremium, setShowPaywall, addNotification, animationClass }) {
  const { t } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // Используем переданные значения вместо локального состояния

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handlePremiumButtonClick = async () => {
    if (!isPremium) {
      // Получаем userId из localStorage или другого источника
      const userId = localStorage.getItem('userId') || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

      if (userId) {
        try {
          // Отправляем запрос в бота для отправки сообщения с тарифами Premium
          // ЗАМЕНИТЕ НА ВАШ ПУБЛИЧНЫЙ URL СЕРВЕРА БОТА
          const response = await fetch('https://your-bot-server-url.com/send-premium-plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: parseInt(userId) }),
          });

          if (response.ok) {
            addNotification(t('premiumActivated'), t('premiumActivated'), 'success');
          } else {
            console.error('Failed to send premium plans message');
            setShowPaywall(true);
          }
        } catch (error) {
          console.error('Error sending premium plans message:', error);
          setShowPaywall(true);
        }
      } else {
        // Если не удается получить userId, показываем стандартный paywall
        setShowPaywall(true);
      }
    } else {
      alert(t('premiumAlreadyActive'));
    }
  };

  const resetAppData = () => {
    if (window.confirm(t('confirmReset'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`section-with-sticky-header ${animationClass || ''}`} style={{height: 'calc(100vh - 64px - 68px)'}}>
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>{t('settings')}</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? t('premium') : t('free')}
        </span>
      </div>
      <div className="section-content">

      <div className="settings-grid">
        <div className="settings-card">
          <h2>{t('appTheme')}</h2>
          <p>{t('currentTheme', { theme: t(theme === 'dark' ? 'darkTheme' : 'lightTheme') })}</p>
          <button onClick={toggleTheme}>
            {t('switchToTheme', { theme: t(theme === 'dark' ? 'light' : 'dark') })}
          </button>
        </div>

        <div className="settings-card">
          <h2>{t('notifications')}</h2>
          <p>{t('systemNotifications', { enabled: notificationsEnabled ? t('enable') : t('disable') })}</p>
          <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
            {notificationsEnabled ? t('disable') : t('enable')} {t('notifications').toLowerCase()}
          </button>
        </div>

        <div className="settings-card">
          <h2>{t('fontSize')}</h2>
          <p>{t('currentSize', { size: t(fontSize + 'Font') })}</p>
          <select value={fontSize} onChange={(e) => {
            setFontSize(e.target.value);
            localStorage.setItem('fontSize', e.target.value);
          }}>
            <option value="small">{t('small')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="large">{t('large')}</option>
          </select>
        </div>

        <div className="settings-card">
          <h2>{t('interfaceLanguage')}</h2>
          <p>{t('currentLanguage', { language: t(language === 'ru' ? 'russian' : 'english') })}</p>
          <select value={language} onChange={(e) => {
            setLanguage(e.target.value);
            localStorage.setItem('language', e.target.value);
          }}>
            <option value="ru">{t('russian')}</option>
            <option value="en">{t('english')}</option>
          </select>
        </div>

        {!isPremium && ( // Показываем эту секцию только для Free-пользователей
          <div className="settings-card">
            <h2>{t('activatePremium')}</h2>
            <p>{t('getUnlimitedNotes')}</p>
            <button onClick={handlePremiumButtonClick}>{t('subscribePremium')}</button>
          </div>
        )}

        {isPremium && ( // Показываем эту секцию только для Premium-пользователей
          <div className="settings-card">
            <h2>{t('subscriptionStatus')}</h2>
            <p>{t('premiumActive')}</p>
            <button onClick={() => alert(t('premiumAlreadyActive'))}>{t('premiumAccess')}</button>
          </div>
        )}

        <div className="settings-card danger-zone">
          <h2>{t('additional')}</h2>
          <p>{t('resetAppData')}</p>
          <button className="danger" onClick={resetAppData}>
            {t('resetData')}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}

export default Settings;