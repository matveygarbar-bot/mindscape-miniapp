import React, { useState } from 'react';

function Settings({ theme, setTheme, isPremium, setShowPaywall, addNotification }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('ru');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handlePremiumButtonClick = () => {
    if (!isPremium) {
      setShowPaywall(true);
    } else {
      alert('Premium доступ уже активен!');
    }
  };

  const resetAppData = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные приложения? Это действие нельзя отменить.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>Настройки</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? 'Premium' : 'Free'}
        </span>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h2>Тема приложения</h2>
          <p>Текущая тема: {theme === 'dark' ? 'Темная' : 'Светлая'}</p>
          <button onClick={toggleTheme}>
            Переключить на {theme === 'dark' ? 'светлую' : 'темную'} тему
          </button>
        </div>

        <div className="settings-card">
          <h2>Уведомления</h2>
          <p>Включить системные уведомления: {notificationsEnabled ? 'Да' : 'Нет'}</p>
          <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
            {notificationsEnabled ? 'Отключить' : 'Включить'} уведомления
          </button>
        </div>

        <div className="settings-card">
          <h2>Размер шрифта</h2>
          <p>Текущий размер: {fontSize}</p>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
            <option value="small">Маленький</option>
            <option value="medium">Средний</option>
            <option value="large">Большой</option>
          </select>
        </div>

        <div className="settings-card">
          <h2>Язык интерфейса</h2>
          <p>Текущий язык: {language === 'ru' ? 'Русский' : 'English'}</p>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        {!isPremium && ( // Показываем эту секцию только для Free-пользователей
          <div className="settings-card">
            <h2>Подключить Premium</h2>
            <p>Получите неограниченные заметки, расширенный календарь и статистику!</p>
            <button onClick={handlePremiumButtonClick}>Подключить Premium</button>
          </div>
        )}

        {isPremium && ( // Показываем эту секцию только для Premium-пользователей
          <div className="settings-card">
            <h2>Статус подписки</h2>
            <p>У вас активна Premium-подписка.</p>
            <button onClick={() => alert('Premium доступ уже активен!')}>Premium доступ открыт</button>
          </div>
        )}

        <div className="settings-card danger-zone">
          <h2>Дополнительно</h2>
          <p>Сбросить все данные приложения</p>
          <button className="danger" onClick={resetAppData}>
            Сбросить данные
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;