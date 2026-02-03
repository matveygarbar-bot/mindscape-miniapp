const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const TOKEN = '7975436192:AAERWNu43TbK_cpH-SE1v41fsHReNEZtBh8';
const CHANNEL_ID = -1002924310370;
const CHANNEL_URL = 'https://t.me/MindScape_app';
const bot = new TelegramBot(TOKEN, { polling: true });

// =====================
// 🔧 КОНФИГУРАЦИЯ
// =====================
const YOUR_CARD = '2200 7021 0247 8562';
const YOUR_NAME = 'Матвей Денисович';

const PRICES = {
  p7:  { days: 7,   price: 129 },
  p30: { days: 30,  price: 499 },
  p90: { days: 90,  price: 999 }
};

// =====================
// 🧪 TEST MODE
// =====================
const TEST_PREMIUM = true;

// =====================
// 📦 ХРАНИЛИЩЕ
// =====================
const USERS_FILE = 'users.json';
const PAYMENTS_FILE = 'payments.json';
let users = {};
let payments = {};

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
} else {
  fs.writeFileSync(USERS_FILE, '{}');
}

if (fs.existsSync(PAYMENTS_FILE)) {
  payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
} else {
  fs.writeFileSync(PAYMENTS_FILE, '{}');
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function savePayments() {
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
}

function generatePaymentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function ensureUser(id) {
  if (!users[id]) {
    users[id] = {
      mode: 'none',
      expiresAt: null,
      notifiedUnsubscribed: false,
      currentPaymentCode: null,
      createdAt: Date.now(),
      lastAccess: Date.now()
    };
    saveUsers();
  }
  return users[id];
}

// =====================
// 🧹 СИСТЕМА УДАЛЕНИЯ СООБЩЕНИЙ
// =====================
const lastBotMessages = {};

// =====================
// 🔔 СИСТЕМА НАПОМИНАНИЙ
// =====================
const reminders = {};

// Функция для добавления напоминания
function addReminder(userId, message, time, date, repeat = 'no') {
  const reminderId = Date.now().toString();

  if (!reminders[userId]) {
    reminders[userId] = {};
  }

  reminders[userId][reminderId] = {
    id: reminderId,
    message: message,
    time: time,
    date: date,
    repeat: repeat,
    createdAt: Date.now()
  };

  console.log(`Напоминание добавлено для пользователя ${userId}: ${message} на ${date} ${time}`);
  return reminderId;
}

// Функция для проверки и отправки напоминаний
async function checkAndSendReminders() {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const currentDate = now.toISOString().split('T')[0];

  console.log(`Проверка напоминаний: ${currentTime}, ${currentDate}`);
  console.log(`Всего пользователей с напоминаниями: ${Object.keys(reminders).length}`);

  for (const userId in reminders) {
    console.log(`Проверяем напоминания для пользователя ${userId}, всего: ${Object.keys(reminders[userId]).length}`);
    for (const reminderId in reminders[userId]) {
      const reminder = reminders[userId][reminderId];
      console.log(`Проверяем напоминание: ${reminderId}, время: ${reminder.time}, дата: ${reminder.date}, сообщение: ${reminder.message}`);

      if (reminder.time === currentTime && reminder.date === currentDate) {
        try {
          // Отправляем напоминание пользователю
          await bot.sendMessage(userId, `🔔 Вам пришло напоминание:\n\n${reminder.message}`);

          console.log(`Напоминание отправлено пользователю ${userId}: ${reminder.message}`);

          // Если напоминание с повтором, обновляем дату
          if (reminder.repeat !== 'no') {
            const newDate = getNextRepeatDate(reminder.date, reminder.repeat);
            reminder.date = newDate;
            console.log(`Обновлена дата напоминания для повтора: ${newDate}`);
          } else {
            // Удаляем одноразовое напоминание
            delete reminders[userId][reminderId];
            if (Object.keys(reminders[userId]).length === 0) {
              delete reminders[userId];
            }
            console.log(`Удалено одноразовое напоминание для пользователя ${userId}`);
          }
        } catch (error) {
          console.error(`Ошибка при отправке напоминания пользователю ${userId}:`, error);
          // Если ошибка связанна с тем, что пользователь заблокировал бота, удаляем напоминание
          if (error.response && error.response.body &&
              (error.response.body.error_code === 403 || error.response.body.description.includes('blocked'))) {
            delete reminders[userId][reminderId];
            if (Object.keys(reminders[userId]).length === 0) {
              delete reminders[userId];
            }
          }
        }
      }
    }
  }
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
setInterval(checkAndSendReminders, 60000); // 60000 мс = 1 минута

async function setMenuButton(chatId) {
  try {
    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: '🚀 Открыть',
        web_app: { url: 'https://matveygarbar-bot.github.io/mindscape-miniapp/' }
      }
    });
  } catch (error) {
    console.error('Ошибка установки кнопки меню:', error);
  }
}

async function deletePreviousMessage(chatId) {
  if (lastBotMessages[chatId]) {
    try {
      await bot.deleteMessage(chatId, lastBotMessages[chatId]);
    } catch (e) {
      // Сообщение уже удалено или недоступно
    }
    delete lastBotMessages[chatId];
  }
}

async function sendAndSave(chatId, text, options = {}) {
  await deletePreviousMessage(chatId);
  const msg = await bot.sendMessage(chatId, text, options);
  lastBotMessages[chatId] = msg.message_id;
  return msg;
}

// Удаляем сообщения пользователей (кроме команд)
bot.on('message', async (msg) => {
  if (msg.chat.type === 'private') {
    await setMenuButton(msg.chat.id);
  }
  
  if (msg.text && msg.text !== '/start') {
    try {
      await bot.deleteMessage(msg.chat.id, msg.message_id);
    } catch (e) {
      // Игнорируем ошибки удаления
    }
  }
});

// =====================
// ▶️ START
// =====================
bot.onText(/\/start/, async (msg) => {
  ensureUser(msg.from.id);
  
  await sendAndSave(
    msg.chat.id,
    '👋 Привет! Добро пожаловать в MindScape.\n\nДля использования приложения необходимо подписаться на наш канал 👇',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📺 Наш канал', url: CHANNEL_URL }],
          [{ text: '✅ Проверить подписку', callback_data: 'check' }]
        ]
      }
    }
  );
});

// Добавляем обработчик для /start с параметром premium_plans
bot.onText(/\/start premium_plans/, async (msg) => {
  ensureUser(msg.from.id);

  await sendAndSave(
    msg.chat.id,
    '⭐ **Выберите тариф Premium:**\n\n' +
    '_После оплата доступ откроется автоматически_',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '7 дней — 129₽', callback_data: 'p7' }],
          [{ text: '30 дней — 499₽', callback_data: 'p30' }],
          [{ text: '90 дней — 999₽', callback_data: 'p90' }],
          [{ text: '⬅️ Назад', callback_data: 'check' }]
        ]
      }
    }
  );
});

// =====================
// 🔘 CALLBACKS
// =====================
bot.on('callback_query', async (q) => {
  bot.answerCallbackQuery(q.id).catch(() => {});
  const chatId = q.message.chat.id;
  const userId = q.from.id;

  ensureUser(userId);

  // Проверка подписки
  if (q.data === 'check') {
    try {
      const member = await bot.getChatMember(CHANNEL_ID, userId);

      if (!['member', 'administrator', 'creator'].includes(member.status)) {
        await sendAndSave(
          chatId,
          '❌ Вы еще не подписаны на наш канал.\nПожалуйста, подпишитесь и нажмите "✅ Я подписался"',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📺 Наш канал', url: CHANNEL_URL }],
                [{ text: '✅ Я подписался', callback_data: 'check' }]
              ]
            }
          }
        );
        return;
      }

      await sendAndSave(
        chatId,
        `✅ Отлично!\nПодписка подтверждена.\n\nВыберите версию:\n(подробнее о каждой версии можно узнать в нашем <a href="https://t.me/MindScape_app/12">канале</a> 😉)`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🆓 Free версия', callback_data: 'free' }],
              [{ text: '⭐ Premium версия', callback_data: 'premium' }]
            ]
          }
        }
      );
      
    } catch (error) {
      console.error('Ошибка проверки подписки:', error);
      await sendAndSave(chatId, '⚠️ Ошибка проверки подписки. Попробуйте позже.');
    }
    return;
  }

  // FREE
  if (q.data === 'free') {
    users[userId].mode = 'free';
    saveUsers();
  
    await sendAndSave(
      chatId,
      '🎉 Отлично! Доступ к Free версии открыт.\n\nНажмите кнопку ниже, чтобы начать использовать MindScape:',
      {
        reply_markup: {
          inline_keyboard: [
            [{
              text: '🚀 Открыть Free версию',
              web_app: {
                url: 'https://matveygarbar-bot.github.io/mindscape-miniapp/?version=free'
              }
            }],
            [{ text: '⬅️ Назад', callback_data: 'check' }]
          ]
        }
      }
    );
    return;
  }

  // PREMIUM МЕНЮ
  if (q.data === 'premium' || q.data === 'show_premium_plans') {
    await sendAndSave(
      chatId,
      '⭐ **Выберите тариф Premium:**\n\n' +
      '_После оплаты доступ откроется автоматически_',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '7 дней — 129₽', callback_data: 'p7' }],
            [{ text: '30 дней — 499₽', callback_data: 'p30' }],
            [{ text: '90 дней — 999₽', callback_data: 'p90' }],
            [{ text: '⬅️ Назад', callback_data: 'check' }]
          ]
        }
      }
    );
    return;
  }

  // ОБРАБОТКА ВЫБОРА ТАРИФА
  if (['p7', 'p30', 'p90'].includes(q.data)) {
    const plan = PRICES[q.data];
    
    if (TEST_PREMIUM) {
      users[userId].mode = 'premium';
      users[userId].expiresAt = Date.now() + plan.days * 86400000;
      users[userId].currentPaymentCode = null;
      saveUsers();
    
      await sendAndSave(
        chatId,
        `✨ *Premium активирован!*\n\n` +
        `✅ Доступ открыт на ${plan.days} дней.\n\n` +
        `Теперь вам доступны все функции MindScape 🚀`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{
                text: '🚀 Открыть Premium версию',
                web_app: {
                  url: 'https://matveygarbar-bot.github.io/mindscape-miniapp/?version=premium'
                }
              }]
            ]
          }
        }
      );
      return;
    }

    const paymentCode = generatePaymentCode();
    
    // Сохраняем платеж
    payments[paymentCode] = {
      userId: userId,
      plan: q.data,
      amount: plan.price,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1800000 // 30 минут
    };
    
    users[userId].currentPaymentCode = paymentCode;
    saveUsers();
    savePayments();
    
    // Инструкция по оплате
    const instructions = `
💳 **Оплата Premium ${plan.days} дней**

Сумма: *${plan.price}₽*

📋 **Как оплатить:**

1. Откройте приложение вашего банка
2. Переведите *${plan.price}₽* на карту:
   \`${YOUR_CARD}\`
   *${YOUR_NAME}*

3. **ВАЖНО:** В комментарии к переводу укажите:
   \`${paymentCode}\`

4. После перевода отправьте сюда скриншот чека
5. Мы активируем доступ в течение 5-15 минут

⏰ *Код действителен 30 минут*
🆘 *Проблемы с оплатой?* Пишите: @ваша_поддержка
`;

    await sendAndSave(
      chatId,
      instructions,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📸 Отправить скриншот чека', callback_data: `screenshot_${paymentCode}` }],
            [{ text: '❌ Отменить оплату', callback_data: `cancel_${paymentCode}` }],
            [{ text: '🔄 Проверить статус', callback_data: `status_${paymentCode}` }]
          ]
        }
      }
    );
    
    return;
  }

  // КНОПКА "ОТПРАВИТЬ СКРИНШОТ"
  if (q.data.startsWith('screenshot_')) {
    const paymentCode = q.data.replace('screenshot_', '');
    
    await sendAndSave(
      chatId,
      '📸 **Отправьте скриншот чека об оплате**\n\n' +
      '1. Сделайте скриншот успешного перевода\n' +
      '2. Отправьте его как фото в этот чат\n' +
      '3. Мы проверим и активируем доступ\n\n' +
      `Ваш код: \`${paymentCode}\``,
      { parse_mode: 'Markdown' }
    );
    
    return;
  }

  // ПРОВЕРКА СТАТУСА
  if (q.data.startsWith('status_')) {
    const paymentCode = q.data.replace('status_', '');
    const payment = payments[paymentCode];
    
    if (!payment || payment.userId !== userId) {
      await bot.answerCallbackQuery(q.id, {
        text: '❌ Платеж не найден',
        show_alert: true
      });
      return;
    }
    
    switch (payment.status) {
      case 'confirmed':
        await bot.answerCallbackQuery(q.id, {
          text: '✅ Оплата подтверждена! Доступ открыт.',
          show_alert: true
        });
        break;
        
      case 'pending':
        const minutesLeft = Math.ceil((payment.expiresAt - Date.now()) / 60000);
        await bot.answerCallbackQuery(q.id, {
          text: `⏳ Ожидаем оплату...\nКод: ${paymentCode}\nОсталось: ${minutesLeft} мин`,
          show_alert: true
        });
        break;
        
      case 'timeout':
        await bot.answerCallbackQuery(q.id, {
          text: '⏰ Время на оплату истекло',
          show_alert: true
        });
        break;
        
      default:
        await bot.answerCallbackQuery(q.id, {
          text: '❓ Статус неизвестен',
          show_alert: true
        });
    }
    return;
  }

  // ОТМЕНА ПЛАТЕЖА
  if (q.data.startsWith('cancel_')) {
    const paymentCode = q.data.replace('cancel_', '');
    const payment = payments[paymentCode];
    
    if (payment && payment.userId === userId) {
      payment.status = 'cancelled';
      savePayments();
      
      users[userId].currentPaymentCode = null;
      saveUsers();
      
      await sendAndSave(
        chatId,
        '❌ Платеж отменен.\n\nХотите выбрать другой тариф?',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '⭐ Выбрать тариф', callback_data: 'premium' }],
              [{ text: '🆓 Free версия', callback_data: 'free' }]
            ]
          }
        }
      );
    }
  }
});

// =====================
// 📸 ОБРАБОТКА СКРИНШОТОВ
// =====================
bot.on('photo', async (msg) => {
  const userId = msg.from.id;
  const user = users[userId];
  
  if (!user || !user.currentPaymentCode) return;
  
  const paymentCode = user.currentPaymentCode;
  const payment = payments[paymentCode];
  
  if (!payment || payment.status !== 'pending') return;
  
  // Сохраняем file_id скриншота
  payment.screenshotId = msg.photo[msg.photo.length - 1].file_id;
  payment.screenshotSentAt = Date.now();
  savePayments();
  
  // Уведомляем пользователя
  await sendAndSave(
    msg.chat.id,
    '✅ Скриншот получен!\n\nМы проверим платеж и активируем Premium доступ.\nОбычно это занимает 5-15 минут.\n\nВы получите уведомление, когда доступ будет открыт.'
  );
  
  // Уведомляем админа
  const ADMIN_ID = 5020987929;
  try {
    await bot.sendPhoto(ADMIN_ID, payment.screenshotId, {
      caption: `📸 Новый скриншот!\n\nКод: ${paymentCode}\nСумма: ${payment.amount}₽\nID пользователя: ${userId}\nТариф: ${payment.plan}`
    });
    
    await bot.sendMessage(
      ADMIN_ID,
      'Для активации доступа отправьте команду:\n' +
      `/activate ${paymentCode}`
    );
  } catch (error) {
    console.error('Ошибка уведомления админа:', error);
  }
});

// =====================
// 🛠 АДМИН КОМАНДЫ
// =====================
bot.onText(/\/admin/, async (msg) => {
  const ADMIN_ID = 5020987929;
  if (msg.from.id !== ADMIN_ID) return;
  
  // Статистика
  const pendingCount = Object.values(payments).filter(p => p.status === 'pending').length;
  const totalPayments = Object.keys(payments).length;
  
  await bot.sendMessage(
    msg.chat.id,
    `👑 *Админ-панель*\n\n` +
    `⏳ Ожидают проверки: ${pendingCount}\n` +
    `💳 Всего платежей: ${totalPayments}\n` +
    `👥 Пользователей: ${Object.keys(users).length}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Список платежей', callback_data: 'admin_payments' }],
          [{ text: '🔄 Обновить', callback_data: 'admin_refresh' }]
        ]
      }
    }
  );
});

// Активация платежа
bot.onText(/\/activate (.+)/, async (msg, match) => {
  const ADMIN_ID = 5020987929;
  if (msg.from.id !== ADMIN_ID) return;
  
  const paymentCode = match[1];
  const payment = payments[paymentCode];
  
  if (!payment) {
    await bot.sendMessage(msg.chat.id, '❌ Платеж не найден');
    return;
  }
  
  if (payment.status !== 'pending') {
    await bot.sendMessage(msg.chat.id, `❌ Платеж уже имеет статус: ${payment.status}`);
    return;
  }
  
  // Активируем премиум
  const user = users[payment.userId];
  const plan = PRICES[payment.plan];
  
  user.mode = 'premium';
  user.expiresAt = Date.now() + plan.days * 86400000;
  user.currentPaymentCode = null;
  
  payment.status = 'confirmed';
  payment.confirmedAt = Date.now();
  
  saveUsers();
  savePayments();
  
  // Уведомляем пользователя
  try {
    await sendAndSave(
      payment.userId,
      `🎉 *Оплата подтверждена!*\n\n` +
      `✅ Premium доступ активирован на ${plan.days} дней.\n\n` +
      `Теперь у вас есть полный доступ ко всем функциям MindScape!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '🚀 Открыть Premium версию',
              web_app: {
                url: 'https://matveygarbar-bot.github.io/mindscape-miniapp/?version=premium'
              }
            }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка уведомления пользователя:', error);
  }
  
  await bot.sendMessage(
    msg.chat.id,
    `✅ Платеж ${paymentCode} активирован!\n` +
    `Пользователь: ${payment.userId}\n` +
    `Тариф: ${plan.days} дней\n` +
    `Сумма: ${payment.amount}₽`
  );
});

// =====================
// 🌐 API ДЛЯ МИНИ-ПРИЛОЖЕНИЯ
// =====================

// 1. Проверка доступа пользователя
app.post('/check-access', (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const user = users[userId];

        if (!user) {
            return res.json({ access: 'none' });
        }

        if (user.mode === 'premium' && user.expiresAt > Date.now()) {
            const daysLeft = Math.ceil((user.expiresAt - Date.now()) / 86400000);
            return res.json({ 
                access: 'premium',
                expiresAt: user.expiresAt,
                daysLeft: daysLeft
            });
        }

        if (user.mode === 'free') {
            return res.json({ access: 'free' });
        }

        return res.json({ access: 'none' });
    } catch (error) {
        console.error('Error in /check-access:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Получение информации о пользователе
app.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const user = users[userId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        userId: userId,
        mode: user.mode,
        expiresAt: user.expiresAt,
        createdAt: user.createdAt,
        lastAccess: user.lastAccess
    });
});

// 3. Проверка статуса платежа
app.post('/check-payment', (req, res) => {
    try {
        const { paymentCode } = req.body;
        
        if (!paymentCode) {
            return res.status(400).json({ error: 'Payment code is required' });
        }
        
        const payment = payments[paymentCode];
        
        if (!payment) {
            return res.json({ status: 'not_found' });
        }
        
        res.json({
            status: payment.status,
            plan: payment.plan,
            amount: payment.amount,
            createdAt: payment.createdAt,
            userId: payment.userId
        });
    } catch (error) {
        console.error('Error in /check-payment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Создание нового платежа (для мини-приложения)
app.post('/create-payment', (req, res) => {
    try {
        const { userId, plan } = req.body;
        
        if (!userId || !plan) {
            return res.status(400).json({ error: 'User ID and plan are required' });
        }
        
        if (!PRICES[plan]) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        
        const user = ensureUser(userId);
        const paymentCode = generatePaymentCode();
        const planInfo = PRICES[plan];
        
        // Создаем платеж
        payments[paymentCode] = {
            userId: userId,
            plan: plan,
            amount: planInfo.price,
            status: 'pending',
            createdAt: Date.now(),
            expiresAt: Date.now() + 1800000 // 30 минут
        };
        
        user.currentPaymentCode = paymentCode;
        
        savePayments();
        saveUsers();
        
        res.json({
            success: true,
            paymentCode: paymentCode,
            amount: planInfo.price,
            days: planInfo.days,
            cardNumber: YOUR_CARD,
            cardName: YOUR_NAME,
            expiresAt: Date.now() + 1800000 // 30 минут для клиента
        });
        
    } catch (error) {
        console.error('Error in /create-payment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Добавление напоминания
app.post('/reminders', (req, res) => {
    console.log('Получен запрос на создание напоминания:', req.body);
    try {
        const { userId, message, time, date, repeat = 'no' } = req.body;

        if (!userId || !message || !time || !date) {
            console.log('Ошибка: Отсутствуют обязательные поля', { userId, message, time, date });
            return res.status(400).json({ error: 'User ID, message, time, and date are required' });
        }

        const reminderId = addReminder(userId, message, time, date, repeat);

        console.log(`Напоминание успешно добавлено для пользователя ${userId}:`, { reminderId, message, time, date, repeat });

        res.json({
            success: true,
            reminderId: reminderId,
            message: 'Напоминание успешно добавлено'
        });
    } catch (error) {
        console.error('Error in /reminders:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 6. Получение напоминаний пользователя
app.get('/reminders/:userId', (req, res) => {
    const { userId } = req.params;

    if (!reminders[userId]) {
        return res.json({ reminders: [] });
    }

    const userReminders = Object.values(reminders[userId]);
    res.json({ reminders: userReminders });
});

// 7. Удаление напоминания
app.delete('/reminders/:userId/:reminderId', (req, res) => {
    const { userId, reminderId } = req.params;

    if (!reminders[userId] || !reminders[userId][reminderId]) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    delete reminders[userId][reminderId];

    // Если у пользователя больше нет напоминаний, удаляем его из списка
    if (Object.keys(reminders[userId]).length === 0) {
        delete reminders[userId];
    }

    res.json({
        success: true,
        message: 'Напоминание успешно удалено'
    });
});

// 8. Проверка состояния сервера
app.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        users: Object.keys(users).length,
        payments: Object.keys(payments).length,
        pendingPayments: Object.values(payments).filter(p => p.status === 'pending').length,
        reminders: Object.keys(reminders).reduce((count, userId) => count + Object.keys(reminders[userId]).length, 0)
    });
});

// =====================
// 🔁 АВТОПРОВЕРКА ПОДПИСКИ
// =====================
setInterval(async () => {
  for (const userId in users) {
    try {
      const member = await bot.getChatMember(CHANNEL_ID, userId);

      if (!['member', 'administrator', 'creator'].includes(member.status)) {
        if (!users[userId].notifiedUnsubscribed) {
          users[userId].notifiedUnsubscribed = true;
          users[userId].mode = 'free';
          users[userId].expiresAt = null;
          saveUsers();

          await sendAndSave(
            userId,
            '🚫 Вы отписались от канала.\nДоступ к приложению временно ограничен.\n\nПодпишитесь снова, чтобы восстановить доступ:',
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📺 Наш канал', url: CHANNEL_URL }],
                  [{ text: '✅ Я подписался', callback_data: 'check' }]
                ]
              }
            }
          );
        }
      }
    } catch (error) {
      // Игнорируем ошибки проверки
    }
  }
}, 60000);

// =====================
// 🧹 ОЧИСТКА СТАРЫХ ПЛАТЕЖЕЙ
// =====================
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [code, payment] of Object.entries(payments)) {
    if (payment.status === 'pending' && payment.expiresAt < now) {
      payment.status = 'timeout';
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    savePayments();
    console.log(`Очищено ${cleaned} просроченных платежей`);
  }
}, 300000);

// =====================
// 🚀 ЗАПУСК СЕРВЕРА
// =====================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🌐 Сервер запущен на порту ${PORT}`);
  console.log(`🔗 API эндпоинты:`);
  console.log(`   POST /check-access - Проверка доступа пользователя`);
  console.log(`   GET  /user/:userId - Информация о пользователе`);
  console.log(`   POST /check-payment - Проверка статуса платежа`);
  console.log(`   POST /create-payment - Создание платежа`);
  console.log(`   POST /reminders - Создание напоминания`);
  console.log(`   GET  /reminders/:userId - Получение напоминаний пользователя`);
  console.log(`   DELETE /reminders/:userId/:reminderId - Удаление напоминания`);
  console.log(`   GET  /status - Статус сервера`);
});

console.log('🤖 MindScape бот запущен!');
console.log('💳 Режим: Ручные переводы на карту');
console.log('🧹 Автоочистка сообщений: ВКЛЮЧЕНА');
console.log('📱 Кнопка меню: УСТАНОВЛЕНА');
// 9. Эндпоинт для отправки сообщения с тарифами Premium пользователю
app.post('/send-premium-plans', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Отправляем сообщение пользователю с тарифами Premium
        await bot.sendMessage(
            userId,
            '⭐ **Выберите тариф Premium:**\n\n' +
            '_После оплата доступ откроется автоматически_',
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '7 дней — 129₽', callback_data: 'p7' }],
                        [{ text: '30 дней — 499₽', callback_data: 'p30' }],
                        [{ text: '90 дней — 999₽', callback_data: 'p90' }],
                        [{ text: '⬅️ Назад', callback_data: 'check' }]
                    ]
                }
            }
        );

        res.json({
            success: true,
            message: 'Premium plans message sent successfully'
        });
    } catch (error) {
        console.error('Error sending premium plans:', error);
        res.status(500).json({ error: 'Failed to send premium plans message' });
    }
});

console.log('🌐 API для мини-приложения: ГОТОВ');