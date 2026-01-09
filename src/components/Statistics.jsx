import React, { useState, useEffect } from 'react';

function Statistics({ isPremium, addNotification }) {
  // Состояния для хранения статистики
  const [stats, setStats] = useState({
    progress: 75, // Процент выполнения
    tasksCompleted: 15,
    totalTasks: 20,
    weeklyProgress: [65, 70, 72, 78, 80, 82, 85], // Прогресс за последние 7 дней
    monthlyProgress: [45, 50, 55, 60, 65, 70, 75, 72, 74, 76, 78, 80, 82, 85], // Прогресс за последние 14 дней
    productivity: 82, // Уровень продуктивности
    streak: 5, // Текущая серия дней подряд
    focusTime: 125 // Время в фокусе в минутах
  });

  // Моковая функция для получения статистики (в реальном приложении это будет API вызов)
  useEffect(() => {
    // Здесь может быть вызов API для получения актуальной статистики
    // Пока используем mock данные
  }, []);

  // Функция для рендеринга простого графика
  const renderSimpleChart = (data, maxValue = 100) => {
    return (
      <div className="simple-chart">
        {data.map((value, index) => (
          <div key={index} className="chart-bar" style={{ height: `${(value / maxValue) * 100}%` }}>
            <span className="chart-value">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Рассчитываем дополнительные метрики
  const completionRate = Math.round((stats.tasksCompleted / stats.totalTasks) * 100);
  const remainingTasks = stats.totalTasks - stats.tasksCompleted;
  const productivityLevel = stats.productivity >= 80 ? 'Очень высокий' :
                           stats.productivity >= 60 ? 'Высокий' :
                           stats.productivity >= 40 ? 'Средний' : 'Низкий';

  return (
    <div className="section-content">
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>Статистика</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? 'Premium' : 'Free'}
        </span>
      </div>

      <div className="statistics-grid">
        <div className="statistic-card">
          <h2>Общий прогресс</h2>
          <div className="progress-circle">
            <div className="progress-value">{completionRate}%</div>
          </div>
          <p>Выполнено {stats.tasksCompleted} из {stats.totalTasks} задач</p>
          <p>Осталось {remainingTasks} задач</p>
        </div>

        <div className="statistic-card">
          <h2>Мотивация</h2>
          <p className="motivation-level">{productivityLevel}</p>
          <p>Продуктивность: {stats.productivity}%</p>
          <p>Серия: 🔥 {stats.streak} дней</p>
        </div>

        <div className="statistic-card">
          <h2>Еженедельный прогресс</h2>
          <div className="chart-container">
            {renderSimpleChart(stats.weeklyProgress, 100)}
          </div>
          <p>Среднее: {Math.round(stats.weeklyProgress.reduce((a, b) => a + b, 0) / stats.weeklyProgress.length)}%</p>
        </div>

        <div className="statistic-card">
          <h2>Ежемесячная активность</h2>
          <div className="chart-container">
            {renderSimpleChart(stats.monthlyProgress, 100)}
          </div>
          <p>В фокусе: {stats.focusTime} мин</p>
        </div>

        <div className="statistic-card">
          <h2>Эффективность</h2>
          <div className="efficiency-meter">
            <div className="efficiency-bar" style={{ width: `${stats.productivity}%` }}></div>
          </div>
          <p>Уровень эффективности: {stats.productivity}%</p>
          {isPremium && (
            <p className="premium-feature">Расширенная аналитика доступна</p>
          )}
        </div>

        <div className="statistic-card">
          <h2>Цели на неделю</h2>
          <div className="goal-progress">
            <div className="goal-item">
              <span>Задачи</span>
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: `${(stats.tasksCompleted / 25) * 100}%` }}></div>
              </div>
              <span>{stats.tasksCompleted}/25</span>
            </div>
            <div className="goal-item">
              <span>Фокус-время</span>
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: `${(stats.focusTime / 200) * 100}%` }}></div>
              </div>
              <span>{stats.focusTime}/200 мин</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;