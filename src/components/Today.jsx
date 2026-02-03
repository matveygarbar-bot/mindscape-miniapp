import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import ReminderForm from './ReminderForm';

function Today({ isPremium, addNotification, animationClass, focusTime, isFocusActive, startFocusTimer, stopFocusTimer, formatTime }) { // Принимаем isPremium, addNotification и animationClass
  const { t } = useTranslation();

  // Используем переданные значения таймера вместо локального состояния
  // const [focusTime, setFocusTime] = useState(0); // Время в секундах для фокус-таймера
  // const [isActive, setIsActive] = useState(false); // Активен ли фокус-таймер

  // Если formatTime не передан, используем локальную функцию
  const localFormatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const displayFormatTime = formatTime || localFormatTime;
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminders, setReminders] = useState(() => {
    const savedReminders = localStorage.getItem('reminders');
    return savedReminders ? JSON.parse(savedReminders) : [];
  });

  // Сохраняем задачи в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync with calendar tasks for today's date
  useEffect(() => {
    const todayString = new Date().toISOString().split('T')[0];
    const calendarTasks = JSON.parse(localStorage.getItem('calendarTasks') || '{}');
    const todayCalendarTasks = calendarTasks[todayString] || [];

    // Merge calendar tasks with today's tasks
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks];
      todayCalendarTasks.forEach(calTask => {
        const exists = updatedTasks.some(task => task.id === calTask.id);
        if (!exists) {
          updatedTasks.push({
            id: calTask.id,
            text: calTask.text,
            completed: calTask.completed || false,
            createdAt: calTask.createdAt || todayString,
            createdAtFull: calTask.createdAtFull || new Date().toISOString(),
            type: calTask.type || 'task'
          });
        }
      });
      return updatedTasks;
    });
  }, []);

  // Функция для добавления напоминания
  const handleAddReminder = (reminderData) => {
    const newReminder = {
      id: Date.now(),
      ...reminderData,
      createdAt: new Date().toISOString(),
      notified: false
    };

    setReminders(prevReminders => [...prevReminders, newReminder]);
    localStorage.setItem('reminders', JSON.stringify([...reminders, newReminder]));

    // Показываем уведомление
    addNotification(t('reminderAdded') || 'Напоминание добавлено', reminderData.message);

    // Закрываем форму
    setShowReminderForm(false);
  };

  // Функция для удаления напоминания
  const deleteReminder = (id) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    setReminders(updatedReminders);
    localStorage.setItem('reminders', JSON.stringify(updatedReminders));
  };

  // Функция для проверки и отправки напоминаний
  useEffect(() => {
    const checkReminders = async () => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const currentDate = now.toISOString().split('T')[0];

      console.log('Проверка напоминаний:', {
        currentTime,
        currentDate,
        remindersCount: reminders.length,
        reminders: reminders.map(r => ({ id: r.id, time: r.time, date: r.date, notified: r.notified }))
      });

      // Получаем актуальные напоминания на момент проверки
      const currentReminders = [...reminders];

      for (const reminder of currentReminders) {
        // Проверяем, что время совпадает и напоминание еще не было отправлено
        if (!reminder.notified && reminder.time === currentTime && reminder.date === currentDate) {
          console.log('Найдено напоминание для отправки:', reminder);

          // Отправляем напоминание в бота
          try {
            // Попробуем получить userId из различных источников
            let userId = localStorage.getItem('userId');

            console.log('Данные из localStorage:', { userId: localStorage.getItem('userId') });
            console.log('Доступ к Telegram WebApp:', !!window.Telegram?.WebApp);
            console.log('Данные из initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
            console.log('Данные пользователя из WebApp:', window.Telegram?.WebApp?.initDataUnsafe?.user);

            if (!userId && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
              userId = window.Telegram.WebApp.initDataUnsafe.user.id;
              localStorage.setItem('userId', userId); // Сохраняем для дальнейшего использования
              console.log('UserId получен из WebApp и сохранен в localStorage:', userId);
            }

            // Если userId все еще нет, пробуем получить напрямую из WebApp
            if (!userId && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
              userId = window.Telegram.WebApp.initDataUnsafe.user.id;
              localStorage.setItem('userId', userId); // Сохраняем для дальнейшего использования
              console.log('UserId получен напрямую из WebApp и сохранен в localStorage:', userId);
            }

            // Дополнительно проверим, может ли userId быть в другом формате
            if (!userId && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
              userId = window.Telegram.WebApp.initDataUnsafe.user.id;
              localStorage.setItem('userId', userId);
              console.log('UserId получен в альтернативном формате и сохранен в localStorage:', userId);
            }

            // Проверим, может ли userId быть доступен в другом формате
            if (!userId && window.Telegram?.WebApp?.initData) {
              try {
                const initData = new URLSearchParams(window.Telegram.WebApp.initData);
                const userParam = initData.get('user');
                if (userParam) {
                  const userObj = JSON.parse(decodeURIComponent(userParam));
                  if (userObj.id) {
                    userId = userObj.id;
                    localStorage.setItem('userId', userId);
                    console.log('UserId получен из initData в другом формате и сохранен в localStorage:', userId);
                  }
                }
              } catch (error) {
                console.log('Ошибка при парсинге initData:', error);
              }
            }

            console.log('Полученный userId:', userId);

            if (userId) {
              console.log('Отправляем запрос в бота:', {
                url: 'https://ready-steaks-drop.loca.lt/reminders',
                data: {
                  userId: parseInt(userId),
                  message: reminder.message,
                  time: reminder.time,
                  date: reminder.date,
                  repeat: reminder.repeat
                }
              });

              const response = await fetch('https://ready-steaks-drop.loca.lt/reminders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: parseInt(userId),
                  message: reminder.message,
                  time: reminder.time,
                  date: reminder.date,
                  repeat: reminder.repeat
                }),
              });

              console.log('Ответ от бота:', response.status);

              if (response.ok) {
                // Успешно отправлено в бота
                addNotification(t('reminderSentToBot') || 'Напоминание отправлено в бот', reminder.message);

                // Обновляем состояние с помощью функционального обновления
                setReminders(prevReminders => {
                  const updatedReminders = prevReminders.map(r =>
                    r.id === reminder.id ? {...r, notified: true} : r
                  );

                  // Если напоминание с повторением, создаем новое напоминание
                  if (reminder.repeat !== 'no') {
                    const nextDate = getNextRepeatDate(reminder.date, reminder.repeat);
                    const newReminder = {
                      ...reminder,
                      date: nextDate,
                      notified: false,
                      id: Date.now() + Math.random() // Новый ID для следующего напоминания
                    };

                    // Удаляем старое напоминание и добавляем новое
                    const filteredReminders = updatedReminders.filter(r => r.id !== reminder.id);
                    const finalReminders = [...filteredReminders, newReminder];

                    // Сохраняем в localStorage
                    localStorage.setItem('reminders', JSON.stringify(finalReminders));
                    console.log('Создано новое повторяющееся напоминание:', newReminder);
                    return finalReminders;
                  } else {
                    // Если без повторения, просто обновляем статус
                    // Сохраняем в localStorage
                    localStorage.setItem('reminders', JSON.stringify(updatedReminders));
                    console.log('Напоминание отмечено как отправленное:', reminder.id);
                    return updatedReminders;
                  }
                });
              } else {
                // Если не удалось отправить в бота, показываем локальное уведомление
                console.log('Ошибка при отправке напоминания в бота:', response.status);
                addNotification(t('reminderNotification') || 'Напоминание', reminder.message);

                // Все равно отмечаем как отправленное, чтобы не пытаться отправить снова
                setReminders(prevReminders => {
                  const updatedReminders = prevReminders.map(r =>
                    r.id === reminder.id ? {...r, notified: true} : r
                  );

                  if (reminder.repeat !== 'no') {
                    const nextDate = getNextRepeatDate(reminder.date, reminder.repeat);
                    const newReminder = {
                      ...reminder,
                      date: nextDate,
                      notified: false,
                      id: Date.now() + Math.random()
                    };

                    const filteredReminders = updatedReminders.filter(r => r.id !== reminder.id);
                    const finalReminders = [...filteredReminders, newReminder];

                    // Сохраняем в localStorage
                    localStorage.setItem('reminders', JSON.stringify(finalReminders));
                    console.log('Создано новое повторяющееся напоминание после ошибки:', newReminder);
                    return finalReminders;
                  } else {
                    // Сохраняем в localStorage
                    localStorage.setItem('reminders', JSON.stringify(updatedReminders));
                    console.log('Напоминание отмечено как отправленное после ошибки:', reminder.id);
                    return updatedReminders;
                  }
                });
              }
            } else {
              // Если не удается получить userId, показываем локальное уведомление
              console.log('Не удалось получить userId для отправки напоминания');
              addNotification(t('reminderNotification') || 'Напоминание', reminder.message);

              // Отмечаем как отправленное, чтобы не пытаться отправить снова
              setReminders(prevReminders => {
                const updatedReminders = prevReminders.map(r =>
                  r.id === reminder.id ? {...r, notified: true} : r
                );

                if (reminder.repeat !== 'no') {
                  const nextDate = getNextRepeatDate(reminder.date, reminder.repeat);
                  const newReminder = {
                    ...reminder,
                    date: nextDate,
                    notified: false,
                    id: Date.now() + Math.random()
                  };

                  const filteredReminders = updatedReminders.filter(r => r.id !== reminder.id);
                  const finalReminders = [...filteredReminders, newReminder];

                  // Сохраняем в localStorage
                  localStorage.setItem('reminders', JSON.stringify(finalReminders));
                  console.log('Создано новое повторяющееся напоминание после ошибки получения userId:', newReminder);
                  return finalReminders;
                } else {
                  // Сохраняем в localStorage
                  localStorage.setItem('reminders', JSON.stringify(updatedReminders));
                  console.log('Напоминание отмечено как отправленное после ошибки получения userId:', reminder.id);
                  return updatedReminders;
                }
              });
            }
          } catch (error) {
            console.error('Error sending reminder to bot:', error);
            // В случае ошибки показываем локальное уведомление
            addNotification(t('reminderNotification') || 'Напоминание', reminder.message);

            // Отмечаем как отправленное, чтобы не пытаться отправить снова
            setReminders(prevReminders => {
              const updatedReminders = prevReminders.map(r =>
                r.id === reminder.id ? {...r, notified: true} : r
              );

              if (reminder.repeat !== 'no') {
                const nextDate = getNextRepeatDate(reminder.date, reminder.repeat);
                const newReminder = {
                  ...reminder,
                  date: nextDate,
                  notified: false,
                  id: Date.now() + Math.random()
                };

                const filteredReminders = updatedReminders.filter(r => r.id !== reminder.id);
                const finalReminders = [...filteredReminders, newReminder];

                // Сохраняем в localStorage
                localStorage.setItem('reminders', JSON.stringify(finalReminders));
                console.log('Создано новое повторяющееся напоминание после ошибки сети:', newReminder);
                return finalReminders;
              } else {
                // Сохраняем в localStorage
                localStorage.setItem('reminders', JSON.stringify(updatedReminders));
                console.log('Напоминание отмечено как отправленное после ошибки сети:', reminder.id);
                return updatedReminders;
              }
            });
          }
        }
      }
    };

    // Проверяем напоминания каждую секунду
    const interval = setInterval(checkReminders, 1000); // 1000 мс = 1 секунда

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(interval);
  }, [reminders, addNotification, t]);

  // Функция для вычисления следующей даты повтора
  const getNextRepeatDate = (currentDate, repeatType) => {
    const date = new Date(currentDate);

    switch (repeatType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return currentDate;
    }

    return date.toISOString().split('T')[0];
  };

  // Используем переданные функции из App.jsx
  // const formatTime = (seconds) => {
  //   const minutes = Math.floor(seconds / 60);
  //   const remainingSeconds = seconds % 60;
  //   return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  // };

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        createdAt: new Date().toISOString().split('T')[0], // Сохраняем дату в формате YYYY-MM-DD
        createdAtFull: new Date().toISOString()
      };
      setTasks([...tasks, task]);

      // Also add the task to the calendar for today
      addToCalendarTask(task);

      setNewTask('');
    }
  };

  // Function to add task to calendar
  const addToCalendarTask = (task) => {
    const dateString = task.createdAt; // Use the created date which is today
    const calendarTasks = JSON.parse(localStorage.getItem('calendarTasks') || '{}');

    if (!calendarTasks[dateString]) {
      calendarTasks[dateString] = [];
    }

    // Check if task already exists in calendar to avoid duplicates
    const taskExists = calendarTasks[dateString].some(calendarTask => calendarTask.id === task.id);
    if (!taskExists) {
      calendarTasks[dateString].push({
        ...task,
        type: 'task'
      });

      localStorage.setItem('calendarTasks', JSON.stringify(calendarTasks));
    }
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString().split('T')[0] : task.completedAt // Сохраняем дату выполнения
      } : task
    ));

    // Also update the task in calendar
    updateCalendarTask(id, !tasks.find(t => t.id === id)?.completed);
  };

  // Function to update task completion status in calendar
  const updateCalendarTask = (taskId, completed) => {
    const calendarTasks = JSON.parse(localStorage.getItem('calendarTasks') || '{}');

    for (const date in calendarTasks) {
      const taskIndex = calendarTasks[date].findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        calendarTasks[date][taskIndex].completed = completed;
        if (completed) {
          calendarTasks[date][taskIndex].completedAt = new Date().toISOString().split('T')[0];
        }
        break;
      }
    }

    localStorage.setItem('calendarTasks', JSON.stringify(calendarTasks));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));

    // Also delete the task from calendar
    deleteCalendarTask(id);
  };

  // Function to delete task from calendar
  const deleteCalendarTask = (taskId) => {
    const calendarTasks = JSON.parse(localStorage.getItem('calendarTasks') || '{}');

    for (const date in calendarTasks) {
      calendarTasks[date] = calendarTasks[date].filter(task => task.id !== taskId);
      // Clean up empty dates
      if (calendarTasks[date].length === 0) {
        delete calendarTasks[date];
      }
    }

    localStorage.setItem('calendarTasks', JSON.stringify(calendarTasks));
  };

  return (
    <div className={`section-with-sticky-header ${animationClass || ''}`} style={{height: 'calc(100vh - 64px - 68px)'}}>
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>{t('today')}</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? t('premium') : t('free')}
        </span>
      </div>
      <div className="section-content">

      <div className="today-section">
        <h2>{t('currentTasks')}</h2>
        <div className="add-task-form">
          <textarea
            placeholder={t('addNewTask').replace(/\n/g, '\n')}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddTask();
              }
            }}
            rows="2"
          />
          <button className="add-task-btn" onClick={handleAddTask}>+</button>
        </div>
        {tasks.length === 0 ? (
          <p>{t('noTasksYet')}</p>
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
                  title={t('delete')}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="today-section">
        <div className="section-header-with-button">
          <h2>{t('reminders') || 'Напоминания'}</h2>
          <button
            className="add-reminder-btn"
            onClick={() => setShowReminderForm(true)}
            title={t('addNewReminder') || 'Добавить напоминание'}
          >
            +
          </button>
        </div>

        {reminders.length === 0 ? (
          <p>{t('noRemindersYet') || 'Напоминаний пока нет.'}</p>
        ) : (
          <ul className="reminders-list">
            {reminders.map(reminder => (
              <li key={reminder.id} className="reminder-item">
                <div className="reminder-content">
                  <div className="reminder-message">{reminder.message}</div>
                  <div className="reminder-time-info">
                    <span className="reminder-date">{reminder.date}</span>
                    <span className="reminder-time">{reminder.time}</span>
                  </div>
                  {reminder.repeat !== 'no' && (
                    <div className="reminder-repeat">
                      {reminder.repeat === 'daily' && t('daily') || 'Каждый день'}
                      {reminder.repeat === 'weekly' && t('weekly') || 'Каждую неделю'}
                      {reminder.repeat === 'monthly' && t('monthly') || 'Каждый месяц'}
                      {reminder.repeat === 'yearly' && t('yearly') || 'Каждый год'}
                    </div>
                  )}
                </div>
                <button
                  className="delete-reminder-btn"
                  onClick={() => deleteReminder(reminder.id)}
                  title={t('delete')}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="today-section">
        <h2>{t('focusTimer')}</h2>
        <div className="focus-timer">
          <div className="timer-display">{displayFormatTime(focusTime)}</div>
          <div className="timer-controls">
            {!isFocusActive ? (
              <>
                <button onClick={() => startFocusTimer(25 * 60)}>{t('twentyFiveMinutes')}</button>
                <button onClick={() => startFocusTimer(5 * 60)}>{t('fiveMinutes')}</button>
              </>
            ) : (
              <button onClick={stopFocusTimer}>{t('stop')}</button>
            )}
          </div>
        </div>
      </div>

      {showReminderForm && (
        <ReminderForm
          onAddReminder={handleAddReminder}
          onCancel={() => setShowReminderForm(false)}
        />
      )}
    </div>
  </div>
  );
}

export default Today;