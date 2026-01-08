import React, { useState, useEffect } from 'react';

function Today({ isPremium }) { // Принимаем isPremium
  const [reminders, setReminders] = useState([]);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [focusTime, setFocusTime] = useState(0); // Время в секундах для фокус-таймера
  const [isActive, setIsActive] = useState(false); // Активен ли фокус-таймер

  useEffect(() => {
    let interval = null;
    if (isActive && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (focusTime === 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (focusTime === 0) setIsActive(false);
    };
  }, [isActive, focusTime]);

  const handleAddReminder = () => {
    if (newReminderTitle && newReminderTime) {
      setReminders([...reminders, { title: newReminderTitle, time: newReminderTime }]);
      setNewReminderTitle('');
      setNewReminderTime('');
    }
  };

  const startFocusTimer = (duration) => {
    setFocusTime(duration);
    setIsActive(true);
  };

  const stopFocusTimer = () => {
    setIsActive(false);
    setFocusTime(0);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>Сегодня</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? 'Premium' : 'Free'}
        </span>
      </div>

      <div className="today-section">
        <h2>Текущие задачи</h2>
        {/* Здесь будет список задач */}
        <p>Список задач пока пуст.</p>
      </div>

      <div className="today-section">
        <h2>Фокус-таймер</h2>
        <div className="focus-timer">
          <div className="timer-display">{formatTime(focusTime)}</div>
          <div className="timer-controls">
            {!isActive ? (
              <>
                <button onClick={() => startFocusTimer(25 * 60)}>25 мин</button>
                <button onClick={() => startFocusTimer(5 * 60)}>5 мин</button>
              </>
            ) : (
              <button onClick={stopFocusTimer}>Стоп</button>
            )}
          </div>
        </div>
      </div>

      <div className="today-section">
        <h2>Уведомления</h2>
        <div className="reminder-form">
          <input
            type="text"
            placeholder="Название напоминания"
            value={newReminderTitle}
            onChange={(e) => setNewReminderTitle(e.target.value)}
          />
          <input
            type="time"
            value={newReminderTime}
            onChange={(e) => setNewReminderTime(e.target.value)}
          />
          <button onClick={handleAddReminder}>Добавить напоминание</button>
        </div>
        <div className="reminder-list">
          {reminders.length === 0 ? (
            <p>Напоминаний пока нет.</p>
          ) : (
            <ul>
              {reminders.map((r, index) => (
                <li key={index}>
                  {r.title} в {r.time}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Today;