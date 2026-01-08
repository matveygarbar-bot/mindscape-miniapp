import React from 'react';

function Settings({ theme, setTheme, isPremium, setShowPaywall }) {
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handlePremiumButtonClick = () => {
    if (!isPremium) {
      // Открываем бота с меню выбора тарифа
      // Замените 'YOUR_BOT_USERNAME' на реальное имя пользователя вашего бота
      window.open('https://t.me/MindScape_app_bot?start=premium_plans', '_blank'); // Обновлено имя пользователя бота
    } else {
      alert('Premium доступ уже активен!');
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
      <div className="settings-card">
        <h2>Тема приложения</h2>
        <p>Текущая тема: {theme === 'dark' ? 'Темная' : 'Светлая'}</p>
        <button onClick={toggleTheme}>Переключить тему</button>
      </div>
      {!isPremium && ( // Показываем эту секцию только для Free-пользователей
        <div className="settings-card" style={{ marginTop: '20px' }}>
          <h2>Подключить Premium</h2>
          <p>Получите неограниченные заметки, расширенный календарь и статистику!</p>
          <button onClick={handlePremiumButtonClick}>Подключить Premium</button>
        </div>
      )}
      {isPremium && ( // Показываем эту секцию только для Premium-пользователей
        <div className="settings-card" style={{ marginTop: '20px' }}>
          <h2>Статус подписки</h2>
          <p>У вас активна Premium-подписка.</p>
          <button onClick={() => alert('Premium доступ уже активен!')}>Premium доступ открыт</button>
        </div>
      )}
    </div>
  );
}

export default Settings;