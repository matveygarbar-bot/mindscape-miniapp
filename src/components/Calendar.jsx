import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Стили по умолчанию для react-calendar

function CalendarSection({ isPremium, addNotification, animationClass, language }) {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('calendarTasks');
    return savedTasks ? JSON.parse(savedTasks) : {};
  }); // { 'YYYY-MM-DD': [{ id: 1, text: 'Задача' }] }
  const [newTask, setNewTask] = useState('');
  const [view, setView] = useState('month'); // 'month', 'week'

  // Функция для получения текущей недели (понедельник текущей недели)
  const getCurrentWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник текущей недели
    return new Date(d.setDate(diff));
  };

  // Функция для получения дня недели в винительном падеже
  const getCorrectWeekday = (date) => {
    const weekdays = {
      0: t('sunday'), // Воскресенье в винительном падеже
      1: t('monday'), // Понедельник в винительном падеже
      2: t('tuesday'),     // Вторник в винительном падеже
      3: t('wednesday'),       // Среда в винительном падеже
      4: t('thursday'),     // Четверг в винительном падеже
      5: t('friday'),     // Пятница в винительном падеже
      6: t('saturday')      // Суббота в винительном падеже
    };

    const dayIndex = date.getDay();
    return weekdays[dayIndex];
  };

  // Функция для получения месяца в родительном падеже
  const getCorrectMonth = (date) => {
    const months = {
      0: t('january'),
      1: t('february'),
      2: t('march'),
      3: t('april'),
      4: t('may'),
      5: t('june'),
      6: t('july'),
      7: t('august'),
      8: t('september'),
      9: t('october'),
      10: t('november'),
      11: t('december')
    };

    const monthIndex = date.getMonth();
    return months[monthIndex];
  };

  // Функция для получения названия месяца для заголовка календаря
  const getMonthName = (date) => {
    const months = {
      0: t('january'),
      1: t('february'),
      2: t('march'),
      3: t('april'),
      4: t('may'),
      5: t('june'),
      6: t('july'),
      7: t('august'),
      8: t('september'),
      9: t('october'),
      10: t('november'),
      11: t('december')
    };

    const monthIndex = date.getMonth();
    return months[monthIndex];
  };

  // Функция для отображения месяца и года
  const getMonthYearDisplay = (date) => {
    return `${getMonthName(date)} ${date.getFullYear()}`;
  };

  // Функция для обновления месяца
  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(date.getFullYear(), monthIndex, date.getDate());
    // Убедимся, что день месяца действителен для нового месяца
    const maxDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    newDate.setDate(Math.min(date.getDate(), maxDay));
    setDate(newDate);
  };

  // Функция для обновления года
  const handleYearChange = (yearValue) => {
    const newDate = new Date(yearValue, date.getMonth(), date.getDate());
    // Убедимся, что день месяца действителен для нового месяца
    const maxDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    newDate.setDate(Math.min(date.getDate(), maxDay));
    setDate(newDate);
  };

  // Компонент для выбора месяца и года (iOS-style picker)
  const MonthYearPicker = () => {
    const currentYear = date.getFullYear();
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;

    const months = [
      t('january'),
      t('february'),
      t('march'),
      t('april'),
      t('may'),
      t('june'),
      t('july'),
      t('august'),
      t('september'),
      t('october'),
      t('november'),
      t('december')
    ];

    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    // State for selected values
    const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
    const [selectedYear, setSelectedYear] = useState(date.getFullYear());

    // Handlers for when selection changes
    const handleMonthSelect = (monthIndex) => {
      setSelectedMonth(monthIndex);
    };

    const handleYearSelect = (yearValue) => {
      setSelectedYear(yearValue);
    };

    // Apply the selection
    const applySelection = () => {
      const newDate = new Date(selectedYear, selectedMonth, date.getDate());
      // Ensure the day is valid for the selected month
      const maxDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
      newDate.setDate(Math.min(date.getDate(), maxDay));
      setDate(newDate);
      setShowMonthYearPicker(false);
    };

    // Cancel without applying changes
    const cancelSelection = () => {
      setShowMonthYearPicker(false);
    };

    return (
      <div className="month-year-picker-ios-overlay">
        <div className="month-year-picker-ios-backdrop" onClick={cancelSelection}></div>
        <div className="month-year-picker-ios">
          <div className="picker-ios-header">
            <button className="picker-ios-cancel-btn" onClick={cancelSelection}>
              {t('cancel')}
            </button>
            <button className="picker-ios-done-btn" onClick={applySelection}>
              {t('done')}
            </button>
          </div>

          <div className="picker-ios-body">
            <div className="picker-wheel-container">
              <div className="picker-wheel-label">{t('month')}</div>
              <div className="picker-wheel">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
                  className="wheel-select"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="picker-wheel-container">
              <div className="picker-wheel-label">{t('year')}</div>
              <div className="picker-wheel">
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearSelect(parseInt(e.target.value))}
                  className="wheel-select"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button className="picker-center-close-btn" onClick={cancelSelection}>
            {t('back')}
          </button>
        </div>
      </div>
    );
  };

  // Сохраняем задачи в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('calendarTasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleDateChange = (newDate) => {
    // Ограничение на 7 дней вперед для Free-версии
    if (!isPremium) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (newDate > sevenDaysFromNow) {
        alert(t('freeVersionLimit'));
        return;
      }
    }
    // Немедленно устанавливаем дату без задержки
    setDate(newDate);
  };

  // Function to add task to Today section
  const addToTodayTask = (task) => {
    const todayTasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Check if task already exists in today's tasks to avoid duplicates
    const taskExists = todayTasks.some(todayTask => todayTask.id === task.id);
    if (!taskExists) {
      todayTasks.push({
        id: task.id,
        text: task.text,
        completed: false,
        createdAt: task.createdAt,
        createdAtFull: task.createdAtFull
      });

      localStorage.setItem('tasks', JSON.stringify(todayTasks));
    }
  };

  const handleAddTask = () => {
    const dateString = date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    if (newTask.trim() && dateString) {
      const task = {
        id: Date.now(),
        text: newTask.trim(),
        type: 'task',
        completed: false,
        createdAt: dateString, // Дата создания
        createdAtFull: new Date().toISOString()
      };
      setTasks(prevTasks => ({
        ...prevTasks,
        [dateString]: [...(prevTasks[dateString] || []), task]
      }));

      // Also add the task to the Today section if it's for today
      if (dateString === new Date().toISOString().split('T')[0]) {
        addToTodayTask(task);
      }

      setNewTask('');
    }
  };




  // Function to delete task from Today section
  const deleteFromTodayTask = (taskId, dateString) => {
    // Only delete from Today if the task was for today
    if (dateString === new Date().toISOString().split('T')[0]) {
      const todayTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const filteredTasks = todayTasks.filter(task => task.id !== taskId);
      localStorage.setItem('tasks', JSON.stringify(filteredTasks));
    }
  };

  const handleDeleteTask = (dateString, taskId) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [dateString]: prevTasks[dateString].filter(task => task.id !== taskId)
    }));

    // Also delete the task from Today section if it exists there
    deleteFromTodayTask(taskId, dateString);
  };



  // Function to update task completion status in Today section
  const updateTodayTaskCompletion = (taskId, completed, dateString) => {
    // Only update Today if the task was for today
    if (dateString === new Date().toISOString().split('T')[0]) {
      const todayTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = todayTasks.map(task =>
        task.id === taskId ? { ...task, completed, completedAt: completed ? new Date().toISOString().split('T')[0] : task.completedAt } : task
      );
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
  };

  const toggleTaskCompletion = (dateString, taskId) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [dateString]: prevTasks[dateString].map(task =>
        task.id === taskId && task.type === 'task'
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString().split('T')[0] : task.completedAt
            }
          : task
      )
    }));

    // Also update the task in Today section if it exists there
    updateTodayTaskCompletion(taskId, !tasks[dateString]?.find(t => t.id === taskId)?.completed, dateString);
  };



  const dateString = date.toISOString().split('T')[0];
  const tasksForSelectedDate = tasks[dateString] || [];

  // Функция для определения, есть ли задачи в определенный день
  const hasTasksForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks[dateString] && tasks[dateString].length > 0;
  };

  // Функция для отображения недели
  const renderWeekView = () => {
    const weekStart = getCurrentWeekStart();
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);

      const dayOfWeek = day.toLocaleDateString('ru-RU', { weekday: 'short' }).charAt(0).toUpperCase();
      const dayOfMonth = day.getDate();
      const dateString = day.toISOString().split('T')[0];
      const hasTasks = tasks[dateString] && tasks[dateString].length > 0;
      const isToday = day.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={i}
          className={`week-day ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''}`}
          onClick={() => setDate(day)}
        >
          <div className="week-day-name">{dayOfWeek}</div>
          <div className={`week-day-number ${isToday ? 'today-number' : ''}`}>{dayOfMonth}</div>
          {hasTasks && <div className="task-indicator"></div>}
        </div>
      );
    }

    return days;
  };

  // Кастомный тайлер для отображения дней с задачами и выделения будней
  const tileClassName = ({ date, view }) => {
    const classes = [];

    // Проверяем, находится ли день в текущей неделе
    const currentWeekStart = getCurrentWeekStart();
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

    if (view === 'week' && date >= currentWeekStart && date <= currentWeekEnd) {
      classes.push('current-week-day');
    }

    if (view === 'month' && hasTasksForDate(date)) {
      classes.push('calendar-day-with-tasks');
    }

    // Определяем, является ли день будним (понедельник-пятница)
    const dayOfWeek = date.getDay(); // 0 - воскресенье, 1 - понедельник, ..., 6 - суббота
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Понедельник-пятница
      classes.push('weekday');
    }

    return classes.join(' ');
  };

  return (
    <div className={`section-with-sticky-header ${animationClass || ''}`} style={{height: 'calc(100vh - 64px - 68px)'}}>
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>{t('calendar')}</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? t('premium') : t('free')}
        </span>
      </div>
      <div className="section-content">

      <div className="calendar-container">
        {/* Кнопка выбора месяца/года (расположена выше календаря) */}
        <div className="month-year-selector-container">
          <button className="month-year-selector" onClick={() => setShowMonthYearPicker(true)}>
            {getMonthYearDisplay(date)} ▼
          </button>
        </div>

        <div className="calendar-controls">
          <button
            className={view === 'month' ? 'active-view' : ''}
            onClick={() => {
              setView('month');
            }}
          >
            {t('month')}
          </button>
          <button
            className={view === 'week' ? 'active-view' : ''}
            onClick={() => {
              setView('week');
              setDate(getCurrentWeekStart());
            }}
          >
            {t('week')}
          </button>
        </div>

        {view === 'week' ? (
          <div className="custom-week-view">
            {renderWeekView()}
          </div>
        ) : (
          <div className="calendar-header">
            <Calendar
              onChange={handleDateChange}
              value={date}
              className="react-calendar-custom"
              tileClassName={tileClassName}
              showNeighboringMonth={false}
              nextLabel={null}
              prevLabel={null}
              next2Label={null}
              prev2Label={null}
              showNavigation={false} /* Completely hide the navigation bar */
              view={view}
              minDetail="month"
              maxDetail="month"
              navigationLabel={() => null} // Hide the default navigation
              formatDay={(locale, date) => date.toLocaleDateString(language, { day: 'numeric' })}
            />
            <button
              className="month-year-button"
              onClick={() => setShowMonthYearPicker(true)}
            >
              {getMonthYearDisplay(date)}
            </button>
          </div>
        )}


        <div className="tasks-for-date">
          <h2>{t('tasksForDate')} {getCorrectWeekday(date)} {date.getDate()} {getCorrectMonth(date)} {date.getFullYear()}</h2>

          {/* Форма для добавления задачи */}
          <div className="add-task-form">
            <input
              type="text"
              placeholder={t('newTaskName')}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
          </div>
          <div className="add-task-button-container">
            <button onClick={handleAddTask}>{t('add')}</button>
          </div>


          {tasksForSelectedDate.length === 0 ? (
            <p>{t('noTasksForDay')}</p>
          ) : (
            <ul className="tasks-list">
              {tasksForSelectedDate.map(task => (
                <li key={task.id} className={`task-item ${task.type} ${task.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(dateString, task.id)}
                  />
                  <span className="task-text">{task.text}</span>
                  <button
                    className="delete-task-btn"
                    onClick={() => handleDeleteTask(dateString, task.id)}
                    title={t('delete')}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showMonthYearPicker && <MonthYearPicker />}
    </div>
  </div>
  );
}

export default CalendarSection;