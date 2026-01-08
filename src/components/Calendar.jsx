import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Стили по умолчанию для react-calendar

function CalendarSection({ isPremium }) {
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState({}); // { 'YYYY-MM-DD': [{ id: 1, text: 'Задача' }] }
  const [newTask, setNewTask] = useState('');

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
      setTasks(prevTasks => ({
        ...prevTasks,
        [dateString]: [...(prevTasks[dateString] || []), { id: Date.now(), text: newTask.trim() }]
      }));
      setNewTask('');
    }
  };

  const handleDeleteTask = (dateString, taskId) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [dateString]: prevTasks[dateString].filter(task => task.id !== taskId)
    }));
  };

  const dateString = date.toISOString().split('T')[0];
  const tasksForSelectedDate = tasks[dateString] || [];

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
        <Calendar
          onChange={handleDateChange}
          value={date}
          className="react-calendar-custom"
        />

        <div className="tasks-for-date">
          <h2>Задачи на {date.toLocaleDateString()}</h2>
          <div className="add-task-form">
            <input
              type="text"
              placeholder="Добавить новую задачу"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button onClick={handleAddTask}>Добавить</button>
          </div>
          {tasksForSelectedDate.length === 0 ? (
            <p>На этот день задач нет.</p>
          ) : (
            <ul>
              {tasksForSelectedDate.map(task => (
                <li key={task.id}>
                  {task.text}
                  <button onClick={() => handleDeleteTask(dateString, task.id)}>Удалить</button>
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