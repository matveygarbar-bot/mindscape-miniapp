import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Стили по умолчанию для react-calendar

function CalendarSection({ isPremium, addNotification }) {
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState({}); // { 'YYYY-MM-DD': [{ id: 1, text: 'Задача' }] }
  const [newTask, setNewTask] = useState('');
  const [newReminder, setNewReminder] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderRepeat, setNewReminderRepeat] = useState('no'); // 'no', 'daily', 'weekly', 'monthly'

  // Проверка напоминаний каждую минуту
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const currentDate = now.toISOString().split('T')[0];

      // Проверяем все задачи на всех датах
      Object.keys(tasks).forEach(dateString => {
        tasks[dateString].forEach(task => {
          if (task.type === 'reminder' && task.time === currentTime && dateString === currentDate) {
            if (addNotification) {
              addNotification('Напоминание', task.text, 'info');
            } else {
              alert(`Напоминание: ${task.text}`);
            }
          }
        });
      });
    };

    // Проверяем напоминания каждую минуту
    const reminderInterval = setInterval(checkReminders, 60000);

    // Проверяем напоминания сразу при загрузке
    checkReminders();

    return () => {
      clearInterval(reminderInterval);
    };
  }, [tasks, addNotification]);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'

  const handleDateChange = (newDate) => {
    // Ограничение на 7 дней вперед для Free-версии
    if (!isPremium) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (newDate > sevenDaysFromNow) {
        alert('В Free-версии можно планировать только на 7 дней вперед.');
        return;
      }
    }
    setDate(newDate);
  };

  const handleAddTask = () => {
    const dateString = date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    if (newTask.trim() && dateString) {
      const task = {
        id: Date.now(),
        text: newTask.trim(),
        type: 'task',
        completed: false
      };
      setTasks(prevTasks => ({
        ...prevTasks,
        [dateString]: [...(prevTasks[dateString] || []), task]
      }));
      setNewTask('');
    }
  };

  const handleAddReminder = async () => {
    const dateString = date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    if (newReminder.trim() && newReminderTime && dateString) {
      const reminder = {
        id: Date.now(),
        text: newReminder.trim(),
        time: newReminderTime,
        repeat: newReminderRepeat,
        type: 'reminder'
      };

      setTasks(prevTasks => ({
        ...prevTasks,
        [dateString]: [...(prevTasks[dateString] || []), reminder]
      }));
      setNewReminder('');
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

        const response = await fetch('http://localhost:3000/reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            message: newReminder.trim(),
            time: newReminderTime,
            date: dateString,
            repeat: newReminderRepeat
          })
        });

        if (response.ok) {
          const result = await response.json();
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

  const handleDeleteTask = (dateString, taskId) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [dateString]: prevTasks[dateString].filter(task => task.id !== taskId)
    }));
  };

  const toggleTaskCompletion = (dateString, taskId) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [dateString]: prevTasks[dateString].map(task =>
        task.id === taskId && task.type === 'task'
          ? { ...task, completed: !task.completed }
          : task
      )
    }));
  };

  const dateString = date.toISOString().split('T')[0];
  const tasksForSelectedDate = tasks[dateString] || [];

  // Функция для определения, есть ли задачи в определенный день
  const hasTasksForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks[dateString] && tasks[dateString].length > 0;
  };

  // Кастомный тайлер для отображения дней с задачами
  const tileClassName = ({ date, view }) => {
    if (view === 'month' && hasTasksForDate(date)) {
      return 'calendar-day-with-tasks';
    }
  };

  return (
    <div className="section-content">
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>Календарь</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? 'Premium' : 'Free'}
        </span>
      </div>

      <div className="calendar-container">
        <div className="calendar-controls">
          <button
            className={view === 'month' ? 'active-view' : ''}
            onClick={() => setView('month')}
          >
            Месяц
          </button>
          <button
            className={view === 'week' ? 'active-view' : ''}
            onClick={() => setView('week')}
          >
            Неделя
          </button>
          <button
            className={view === 'day' ? 'active-view' : ''}
            onClick={() => setView('day')}
          >
            День
          </button>
        </div>

        <Calendar
          onChange={handleDateChange}
          value={date}
          className="react-calendar-custom"
          tileClassName={tileClassName}
          showNeighboringMonth={false}
          next2Label={null}
          prev2Label={null}
        />

        <div className="tasks-for-date">
          <h2>Задачи на {date.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>

          {/* Форма для добавления задачи */}
          <div className="add-task-form">
            <input
              type="text"
              placeholder="Добавить новую задачу"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <button onClick={handleAddTask}>Добавить</button>
          </div>

          {/* Форма для добавления напоминания */}
          <div className="add-reminder-form">
            <div className="reminder-input-group">
              <input
                type="text"
                placeholder="Добавить напоминание"
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
              />
              <div className="time-and-repeat-small">
                <div className="time-selector-small">
                  <label htmlFor="calendar-reminder-time">Время:</label>
                  <input
                    id="calendar-reminder-time"
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                  />
                </div>
                <div className="repeat-selector-small">
                  <label htmlFor="calendar-reminder-repeat">Повтор:</label>
                  <select
                    id="calendar-reminder-repeat"
                    value={newReminderRepeat}
                    onChange={(e) => setNewReminderRepeat(e.target.value)}
                  >
                    <option value="no">Без</option>
                    <option value="daily">Д</option>
                    <option value="weekly">Н</option>
                    <option value="monthly">М</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleAddReminder}>Напомнить</button>
          </div>

          {tasksForSelectedDate.length === 0 ? (
            <p>На этот день задач и напоминаний нет.</p>
          ) : (
            <ul className="tasks-list">
              {tasksForSelectedDate.map(task => (
                <li key={task.id} className={`task-item ${task.type} ${task.completed ? 'completed' : ''}`}>
                  {task.type === 'task' ? (
                    <>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(dateString, task.id)}
                      />
                      <span className="task-text">{task.text}</span>
                    </>
                  ) : (
                    <>
                      <span className="reminder-icon">⏰</span>
                      <div className="reminder-details">
                        <span className="task-text">{task.text} в {task.time}</span>
                        {task.repeat !== 'no' && (
                          <span className="repeat-indicator">🔄 {task.repeat === 'daily' ? 'ежедн.' : task.repeat === 'weekly' ? 'еженед.' : 'ежемес.'}</span>
                        )}
                      </div>
                    </>
                  )}
                  <button
                    className="delete-task-btn"
                    onClick={() => handleDeleteTask(dateString, task.id)}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarSection;