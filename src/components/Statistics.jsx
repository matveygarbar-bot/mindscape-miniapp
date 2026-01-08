import React from 'react';

function Statistics({ isPremium }) {
  // Для прототипа используем статические или случайные данные
  const progress = 75; // Процент выполнения
  const motivation = 'Высокий'; // Уровень мотивации
  const tasksCompleted = 15;
  const totalTasks = 20;

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
          <h2>Прогресс</h2>
          <div className="progress-circle">
            <div className="progress-value">{progress}%</div>
          </div>
          <p>Выполнено {tasksCompleted} из {totalTasks} задач.</p>
        </div>

        <div className="statistic-card">
          <h2>Мотивация</h2>
          <p className="motivation-level">{motivation}</p>
          <p>Продолжайте в том же духе!</p>
        </div>

        <div className="statistic-card">
          <h2>Динамика развития</h2>
          {isPremium ? (
            <p>Ваша продуктивность растет на 10% за последнюю неделю. Расширенная статистика доступна!</p>
          ) : (
            <p>Базовая статистика. Обновитесь до Premium для расширенной аналитики.</p>
          )}
          <div className="dynamic-chart-placeholder">График</div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;