import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

function Today({ isPremium, addNotification, animationClass, focusTime, isFocusActive, startFocusTimer, stopFocusTimer, formatTime }) { // Принимаем isPremium, addNotification и animationClass
  const { t } = useTranslation();

  // Состояния для задач
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');

  // Сохраняем задачи в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Функция для добавления задачи в календарь
  const addToCalendarTask = (task) => {
    const dateString = task.createdAt; // Используем дату создания задачи (сегодня)
    const calendarTasks = JSON.parse(localStorage.getItem('calendarTasks') || '{}');

    if (!calendarTasks[dateString]) {
      calendarTasks[dateString] = [];
    }

    // Проверяем, существует ли задача в календаре, чтобы избежать дубликатов
    const taskExists = calendarTasks[dateString].some(calendarTask => calendarTask.id === task.id);
    if (!taskExists) {
      calendarTasks[dateString].push({
        ...task,
        type: 'task'
      });

      localStorage.setItem('calendarTasks', JSON.stringify(calendarTasks));
    }
  };

  // Функция для добавления задачи
  const addTask = () => {
    if (newTask.trim()) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Формат YYYY-MM-DD

      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        createdAt: todayString, // Сегодняшняя дата в формате YYYY-MM-DD
        createdAtFull: today.toISOString()
      };

      setTasks([...tasks, task]);

      // Также добавляем задачу в календарь на сегодня
      addToCalendarTask(task);

      setNewTask('');
    }
  };

  // Функция для переключения статуса задачи
  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString().split('T')[0] : task.completedAt // Сохраняем дату выполнения
      } : task
    ));

    // Обновляем статус задачи в календаре
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateCalendarTask(id, !task.completed);
    }
  };

  // Функция для обновления задачи в календаре
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

  // Функция для удаления задачи из календаря
  const deleteCalendarTask = (taskId) => {
    const calendarTasks = JSON.parse(localStorage.getItem('calendarTasks') || '{}');

    for (const date in calendarTasks) {
      calendarTasks[date] = calendarTasks[date].filter(task => task.id !== taskId);
      // Очищаем пустые даты
      if (calendarTasks[date].length === 0) {
        delete calendarTasks[date];
      }
    }

    localStorage.setItem('calendarTasks', JSON.stringify(calendarTasks));
  };

  // Функция для удаления задачи
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));

    // Также удаляем задачу из календаря
    deleteCalendarTask(id);
  };

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
                addTask();
              }
            }}
            rows="2"
          />
          <button className="add-task-btn" onClick={addTask}>+</button>
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
        <h2>{t('focusTimer')}</h2>
        <div className="focus-timer">
          <div className="timer-display">{formatTime(focusTime)}</div>
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
    </div>
  </div>
  );
}

export default Today;