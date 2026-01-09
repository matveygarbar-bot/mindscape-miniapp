// server.js - Сервер для мини-приложения Telegram с напоминаниями

const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Telegram Bot API configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Пример базы данных напоминаний (в реальном приложении используйте MongoDB, PostgreSQL и т.д.)
let reminders = [
  {
    id: 1,
    userId: 123456789, // ID пользователя Telegram
    message: "Напоминание о встрече",
    time: "15:30",
    date: "2023-12-25",
    repeat: "no" // 'no', 'daily', 'weekly', 'monthly'
  }
];

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(chatId, message) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    console.log('Сообщение отправлено:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error.response?.data || error.message);
    throw error;
  }
}

// Функция проверки и отправки напоминаний
function checkAndSendReminders() {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const currentDate = now.toISOString().split('T')[0];

  reminders.forEach(async (reminder) => {
    if (reminder.time === currentTime && reminder.date === currentDate) {
      try {
        // Формируем сообщение для отправки
        const message = `🔔 Вам пришло напоминание:\n\n${reminder.message}`;
        
        // Отправляем сообщение пользователю
        await sendTelegramMessage(reminder.userId, message);
        
        console.log(`Напоминание отправлено пользователю ${reminder.userId}: ${reminder.message}`);
        
        // Если напоминание с повтором, обновляем дату
        if (reminder.repeat !== 'no') {
          const updatedDate = getNextRepeatDate(reminder.date, reminder.repeat);
          reminder.date = updatedDate;
        } else {
          // Удаляем одноразовое напоминание
          reminders = reminders.filter(r => r.id !== reminder.id);
        }
      } catch (error) {
        console.error('Ошибка при отправке напоминания:', error);
      }
    }
  });
}

// Функция для вычисления следующей даты повтора
function getNextRepeatDate(currentDate, repeatType) {
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
    default:
      return currentDate;
  }
  
  return date.toISOString().split('T')[0];
}

// Планировщик задач - проверяет напоминания каждую минуту
cron.schedule('* * * * *', () => {
  console.log('Проверка напоминаний:', new Date().toISOString());
  checkAndSendReminders();
});

// API endpoint для добавления напоминания из веб-приложения
app.post('/api/reminders', async (req, res) => {
  try {
    const { userId, message, time, date, repeat = 'no' } = req.body;

    if (!userId || !message || !time || !date) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    const newReminder = {
      id: Date.now(),
      userId,
      message,
      time,
      date,
      repeat
    };

    reminders.push(newReminder);

    res.status(201).json({ success: true, reminder: newReminder });
  } catch (error) {
    console.error('Ошибка при добавлении напоминания:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API endpoint для получения всех напоминаний пользователя
app.get('/api/reminders/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userReminders = reminders.filter(r => r.userId == userId);
    res.json({ reminders: userReminders });
  } catch (error) {
    console.error('Ошибка при получении напоминаний:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API endpoint для удаления напоминания
app.delete('/api/reminders/:id', (req, res) => {
  try {
    const { id } = req.params;
    reminders = reminders.filter(r => r.id != id);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении напоминания:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Telegram webhook endpoint
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      const { from, text } = update.message;
      console.log(`Сообщение от пользователя ${from.id}: ${text}`);
      
      // Отправляем подтверждение
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Неверный формат обновления' });
    }
  } catch (error) {
    console.error('Ошибка при обработке webhook:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Маршрут для получения информации о боте
app.get('/api/bot-info', async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    res.json(response.data);
  } catch (error) {
    console.error('Ошибка при получении информации о боте:', error);
    res.status(500).json({ error: 'Не удалось получить информацию о боте' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Telegram Bot API URL: ${TELEGRAM_API_URL}`);
});

module.exports = app;