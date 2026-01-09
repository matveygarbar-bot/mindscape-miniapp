import React, { useState, useEffect } from 'react';
import TelegramNotifier from './TelegramNotifier';

function Today({ isPremium, addNotification }) { // Принимаем isPremium и addNotification
  const [reminders, setReminders] = useState(() => {
    const savedReminders = localStorage.getItem('reminders');
    return savedReminders ? JSON.parse(savedReminders) : [];
  });
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderRepeat, setNewReminderRepeat] = useState('no'); // 'no', 'daily', 'weekly', 'monthly'
  const [focusTime, setFocusTime] = useState(0); // Время в секундах для фокус-таймера
  const [isActive, setIsActive] = useState(false); // Активен ли фокус-таймер
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    let interval = null;
    if (isActive && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (focusTime === 0) {
      if (interval) clearInterval(interval);
      // Показываем уведомление о завершении таймера
      if (isActive) {
        if (addNotification) {
          addNotification('Фокус-таймер', 'Время вышло! Пора сделать перерыв.', 'success');
        } else {
          alert('Фокус-таймер завершен!');
        }
        setIsActive(false);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, focusTime, addNotification]);

  // Сохраняем напоминания в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  const handleAddReminder = async () => {
    if (newReminderTitle && newReminderTime) {
      // Получаем дату из поля ввода или используем сегодняшнюю, если не указана
      const selectedDate = document.getElementById('reminder-date')?.value || new Date().toISOString().split('T')[0];

      const reminder = {
        id: Date.now(),
        title: newReminderTitle,
        time: newReminderTime,
        repeat: newReminderRepeat,
        date: selectedDate, // используем выбранную дату
        createdAt: new Date().toISOString()
      };

      // Добавляем напоминание в локальный список
      setReminders(prevReminders => [...prevReminders, reminder]);
      setNewReminderTitle('');
      setNewReminderTime('');
      setNewReminderRepeat('no');

      // Отправляем напоминание на сервер для регистрации
      try {
        // Получаем ID пользователя из Telegram WebApp
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

        if (!userId) {
          // Если ID пользователя недоступен, показываем предупреждение
          if (addNotification) {
            addNotification('Внимание', 'Напоминание сохранено локально. Для отправки в бот откройте приложение через Telegram.', 'warning');
          }
          // Добавляем напоминание только локально
          return;
        }

        console.log('Отправляем напоминание на сервер:', {
          userId: userId,
          message: newReminderTitle,
          time: newReminderTime,
          date: selectedDate,
          repeat: newReminderRepeat
        });

        const response = await fetch('http://localhost:3001/reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            message: newReminderTitle,
            time: newReminderTime,
            date: selectedDate,
            repeat: newReminderRepeat
          })
        });

        console.log('Ответ от сервера:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Напоминание успешно зарегистрировано:', result);
          if (addNotification) {
            addNotification('Напоминание', 'Напоминание зарегистрировано и будет отправлено в бот', 'success');
          }
        } else {
          console.error('Ошибка при сохранении напоминания на сервере:', await response.text());
          if (addNotification) {
            addNotification('Ошибка', 'Не удалось зарегистрировать напоминание', 'error');
          }
        }
      } catch (error) {
        console.error('Ошибка при отправке напоминания:', error);
        if (addNotification) {
          addNotification('Ошибка', 'Не удалось подключиться к серверу напоминаний', 'error');
        }
      }
    }
  };

  const handleDeleteReminder = (id) => {
    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);
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

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        createdAt: new Date()
      };
      setTasks([...tasks, task]);
      setNewTask('');
    }
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
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
        <div className="add-task-form">
          <input
            type="text"
            placeholder="Добавить новую задачу"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <button className="add-task-btn" onClick={handleAddTask}>+</button>
        </div>
        {tasks.length === 0 ? (
          <p>Задач пока нет.</p>
        ) : (
          <ul className="tasks-list">
            {tasks.map(task => (
              <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(task.id)}
                />
                <span className="task-text">{task.text}</span>
                <button
                  className="delete-task-btn"
                  onClick={() => deleteTask(task.id)}
                  title="Удалить задачу"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
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
        <h2>Напоминания</h2>
        <div className="reminder-form">
          <input
            type="text"
            placeholder="Название напоминания"
            value={newReminderTitle}
            onChange={(e) => setNewReminderTitle(e.target.value)}
          />
          <div className="time-and-repeat">
            <div className="date-selector">
              <label htmlFor="reminder-date">Дата:</label>
              <input
                id="reminder-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="time-selector">
              <label htmlFor="reminder-time">Время:</label>
              <input
                id="reminder-time"
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
              />
            </div>
            <div className="repeat-selector">
              <label htmlFor="reminder-repeat">Повтор:</label>
              <select
                id="reminder-repeat"
                value={newReminderRepeat}
                onChange={(e) => setNewReminderRepeat(e.target.value)}
              >
                <option value="no">Без повтора</option>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>
          </div>
          <button onClick={handleAddReminder}>Добавить напоминание</button>
        </div>
        <div className="reminder-list">
          {reminders.length === 0 ? (
            <p>Напоминаний пока нет.</p>
          ) : (
            <ul>
              {reminders.map(r => (
                <li key={r.id}>
                  <div className="reminder-info">
                    <span>{r.title} в {r.time}</span>
                    {r.repeat !== 'no' && (
                      <span className="repeat-indicator">🔄 {r.repeat === 'daily' ? 'ежедн.' : r.repeat === 'weekly' ? 'еженед.' : 'ежемес.'}</span>
                    )}
                  </div>
                  <button
                    className="delete-reminder-btn"
                    onClick={() => handleDeleteReminder(r.id)}
                    title="Удалить напоминание"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <TelegramNotifier isPremium={isPremium} />
    </div>
  );
}

export default Today;