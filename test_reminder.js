// Тестовый скрипт для проверки системы напоминаний

const axios = require('axios');

// Замените на реальный ID пользователя Telegram
const TEST_USER_ID = process.env.TEST_USER_ID || '123456789'; // Замените на ваш реальный ID

// Получаем текущее время и добавляем 1 минуту для тестирования
const now = new Date();
now.setMinutes(now.getMinutes() + 1); // Устанавливаем напоминание на 1 минуту вперед

const testReminder = {
  userId: TEST_USER_ID,
  message: 'Тестовое напоминание для проверки системы',
  time: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
  date: now.toISOString().split('T')[0],
  repeat: 'no'
};

console.log('Отправляем тестовое напоминание:', testReminder);

// Отправляем запрос на сервер
axios.post('http://localhost:3001/reminders', testReminder)
  .then(response => {
    console.log('Напоминание успешно отправлено:', response.data);
    console.log('Ожидайте напоминание в боте в течение 1 минуты');
  })
  .catch(error => {
    console.error('Ошибка при отправке напоминания:', error.response?.data || error.message);
  });