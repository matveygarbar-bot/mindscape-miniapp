import React, { useState, useEffect } from 'react';

const TelegramNotifier = ({ isPremium }) => {
  const [reminders, setReminders] = useState(() => {
    const savedReminders = localStorage.getItem('reminders');
    return savedReminders ? JSON.parse(savedReminders) : [];
  });
  const [sentReminders, setSentReminders] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Обновляем локальные напоминания при изменении в localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedReminders = localStorage.getItem('reminders');
      setReminders(savedReminders ? JSON.parse(savedReminders) : []);
    };

    // Слушаем изменение localStorage
    window.addEventListener('storage', handleStorageChange);

    // Инициализируем при монтировании
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Эффект для получения напоминаний с сервера при необходимости
  useEffect(() => {
    // В реальной реализации здесь может быть запрос к серверу для получения статуса отправленных напоминаний
    // Пока что просто оставляем базовую функциональность отображения
  }, []);

  // Запрашиваем разрешение на уведомления при монтировании компонента
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const clearNotifications = () => {
    setSentReminders([]);
  };

  return (
    <div className="telegram-notifier">
      <button 
        className="notifications-toggle"
        onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
      >
        {showNotificationsPanel ? 'Скрыть' : 'Показать'} отправленные напоминания ({sentReminders.length})
      </button>
      
      {showNotificationsPanel && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Отправленные напоминания</h3>
            {sentReminders.length > 0 && (
              <button className="clear-notifications" onClick={clearNotifications}>
                Очистить
              </button>
            )}
          </div>
          
          {sentReminders.length === 0 ? (
            <p className="no-notifications">Нет отправленных напоминаний</p>
          ) : (
            <ul className="sent-reminders-list">
              {sentReminders.map(reminder => (
                <li key={reminder.id} className="sent-reminder-item">
                  <div className="reminder-content">
                    <strong>Вам пришло напоминание:</strong> {reminder.title}
                  </div>
                  <div className="reminder-meta">
                    <span className="reminder-time">{reminder.timestamp}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TelegramNotifier;