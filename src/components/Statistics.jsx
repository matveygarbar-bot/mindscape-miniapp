import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

function Statistics({ isPremium, addNotification, animationClass }) {
  const { t } = useTranslation();
  // Состояния для хранения статистики
  const [stats, setStats] = useState({
    progress: 75, // Процент выполнения
    tasksCompleted: 15,
    totalTasks: 20,
    weeklyProgress: [65, 70, 72, 78, 80, 82, 85], // Прогресс за последние 7 дней
    monthlyProgress: [45, 50, 55, 60, 65, 70, 75, 72, 74, 76, 78, 80], // Прогресс за последние 12 месяцев
    streak: 5, // Текущая серия дней подряд
    focusTime: { hours: 2, minutes: 5, seconds: 30 } // Время в фокусе
  });

  // Функция для вычисления серии дней с выполненной задачей
  const calculateStreak = () => {
    // Получаем все выполненные задачи из localStorage (из Today и Calendar)
    const todayTasksStr = localStorage.getItem('tasks');
    const calendarTasksStr = localStorage.getItem('calendarTasks');

    let allCompletedTasks = [];

    // Добавляем задачи из Today
    if (todayTasksStr) {
      const todayTasks = JSON.parse(todayTasksStr);
      const todayCompletedTasks = todayTasks.filter(task => task.completed && task.completedAt);
      allCompletedTasks = [...allCompletedTasks, ...todayCompletedTasks];
    }

    // Добавляем задачи из Calendar
    if (calendarTasksStr) {
      const calendarTasks = JSON.parse(calendarTasksStr);
      // Преобразуем задачи из календаря в плоский массив
      Object.keys(calendarTasks).forEach(date => {
        const dateTasks = calendarTasks[date];
        const completedDateTasks = dateTasks.filter(task => task.completed && task.completedAt);
        allCompletedTasks = [...allCompletedTasks, ...completedDateTasks];
      });
    }

    if (allCompletedTasks.length === 0) return 0;

    // Преобразуем даты в формат Date и сортируем
    const completedDates = [...new Set(allCompletedTasks.map(task => task.completedAt))]
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a - b);

    if (completedDates.length === 0) return 0;

    // Находим текущую серию
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня

    // Проверяем, была ли задача выполнена сегодня
    const todayStr = currentDate.toISOString().split('T')[0];
    const isTodayCompleted = completedDates.some(date =>
      date.toISOString().split('T')[0] === todayStr
    );

    if (!isTodayCompleted) {
      // Если сегодня не было выполнено задач, уменьшаем дату на 1 день
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Подсчитываем серию
    let checkDate = new Date(currentDate);
    let daysBack = 0;

    while (true) {
      const checkDateStr = checkDate.toISOString().split('T')[0];
      const isCompleted = completedDates.some(date =>
        date.toISOString().split('T')[0] === checkDateStr
      );

      if (isCompleted) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        daysBack++;

        // Ограничиваем проверку последних 30 дней, чтобы избежать бесконечного цикла
        if (daysBack > 30) break;
      } else {
        break;
      }
    }

    return streak;
  };

  // Моковая функция для получения статистики (в реальном приложении это будет API вызов)
  useEffect(() => {
    // Здесь может быть вызов API для получения актуальной статистики
    // Пока используем mock данные и вычисляем серию
    const streak = calculateStreak();
    setStats(prevStats => ({
      ...prevStats,
      streak: streak
    }));
  }, []);

  // Функция для рендеринга еженедельного прогресса
  const renderWeeklyProgress = (data) => {
    const daysOfWeek = [t('monday').substring(0, 2), t('tuesday').substring(0, 2), t('wednesday').substring(0, 2), t('thursday').substring(0, 2), t('friday').substring(0, 2), t('saturday').substring(0, 2), t('sunday').substring(0, 2)];
    const today = new Date().getDay(); // 0 - воскресенье, 1 - понедельник, ...

    return (
      <div className="weekly-progress-chart">
        {data.map((value, index) => {
          // Если день еще не наступил в текущей неделе, показываем пустой столбик
          const isPastDay = (index < today) || (today === 0 && index < 6); // Если сегодня воскресенье

          return (
            <div key={index} className="weekly-bar-container">
              <div className="weekly-bar-label">{daysOfWeek[index]}</div>
              <div className={`weekly-bar ${isPastDay ? '' : 'future-day'}`} style={{ height: isPastDay ? `${value}%` : '0%' }}>
                <span className="weekly-bar-value">{isPastDay ? value : ''}</span>
              </div>
              <div className="weekly-bar-sublabel">{isPastDay ? `${value}/10` : ''}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Функция для рендеринга ежемесячной активности
  const renderMonthlyActivity = (data) => {
    const months = [t('january').substring(0, 1), t('february').substring(0, 1), t('march').substring(0, 1), t('april').substring(0, 1), t('may').substring(0, 1), t('june').substring(0, 1), t('july').substring(0, 1), t('august').substring(0, 1), t('september').substring(0, 1), t('october').substring(0, 1), t('november').substring(0, 1), t('december').substring(0, 1)]; // Первые буквы месяцев

    return (
      <div className="monthly-activity-chart">
        {data.map((value, index) => (
          <div key={index} className="monthly-bar-container">
            <div className="monthly-bar-label">{months[index]}</div>
            <div className="monthly-bar" style={{ height: `${value}%` }}>
              <span className="monthly-bar-value">{value}</span>
            </div>
            <div className="monthly-bar-sublabel">{value}</div>
          </div>
        ))}
      </div>
    );
  };

  // Функция для форматирования времени фокуса
  const formatFocusTime = (timeObj) => {
    return `${timeObj.hours}${t('hours')} ${timeObj.minutes}${t('minutes')} ${timeObj.seconds}${t('seconds')}`;
  };

  // Рассчитываем дополнительные метрики
  const completionRate = Math.round((stats.tasksCompleted / stats.totalTasks) * 100);
  const remainingTasks = stats.totalTasks - stats.tasksCompleted;

  return (
    <div className={`section-with-sticky-header ${animationClass || ''}`} style={{height: 'calc(100vh - 64px - 68px)'}}>
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>{t('statistics')}</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? t('premium') : t('free')}
        </span>
      </div>
      <div className="section-content">

      <div className="statistics-grid">
        <div className="statistic-card">
          <h2>{t('overallProgress')}</h2>
          <div className="progress-circle">
            <div className="progress-value">{completionRate}%</div>
          </div>
          <p>{t('tasksCompleted', { completed: stats.tasksCompleted, total: stats.totalTasks })}</p>
          <p>{t('tasksRemaining', { remaining: remainingTasks })}</p>
        </div>

        <div className="statistic-card">
          <h2>{t('motivation')}</h2>
          <p>{t('streak', { count: stats.streak })}</p>
          <p>{t('continueLikeThis')}</p>
        </div>

        <div className="statistic-card">
          <h2>{t('weeklyProgress')}</h2>
          <div className="weekly-chart-container">
            {renderWeeklyProgress(stats.weeklyProgress)}
          </div>
        </div>

        <div className="statistic-card">
          <h2>{t('monthlyActivity')}</h2>
          <div className="monthly-chart-container">
            {renderMonthlyActivity(stats.monthlyProgress)}
          </div>
        </div>

        <div className="statistic-card">
          <h2>{t('focusTime')}</h2>
          <div className="focus-time-display">
            <div className="focus-time-value">{formatFocusTime(stats.focusTime)}</div>
            <p>{t('focusTimeDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

export default Statistics;