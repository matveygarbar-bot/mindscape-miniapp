const TelegramBot = require('node-telegram-bot-api');

// Замените на токен вашего нового бота техподдержки
const TOKEN = '8588380956:AAEV38blNbK2UBjQq4RRgYU-Mo4pamS1iuc';
const bot = new TelegramBot(TOKEN, { polling: true });

// Состояния пользователей
const userStates = {};

// Хранение сообщений (для возможности удаления)
const userMessages = {}; // Сообщения пользователя
const botMessages = {}; // Сообщения бота

// Список администраторов (замените на реальные ID администраторов)
const ADMINS = [5020987929]; // ID администратора из основного бота

console.log('Бот технической поддержки запущен...');

// Функция для удаления предыдущих сообщений пользователя и бота (кроме с номером обращения)
async function deletePreviousMessages(chatId) {
  // Удаляем предыдущие сообщения пользователя
  if (userMessages[chatId]) {
    try {
      await bot.deleteMessage(chatId, userMessages[chatId]);
    } catch (error) {
      // Игнорируем ошибки при удалении (например, если сообщение уже удалено)
    }
    delete userMessages[chatId];
  }

  // Удаляем предыдущие сообщения бота (кроме с номером обращения)
  if (botMessages[chatId] && Array.isArray(botMessages[chatId])) {
    for (const messageId of botMessages[chatId]) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        // Игнорируем ошибки при удалении (например, если сообщение уже удалено)
      }
    }
    // Очищаем список сообщений после удаления
    botMessages[chatId] = [];
  }
}

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // Удаляем предыдущие сообщения (кроме с номером обращения)
  await deletePreviousMessages(chatId);

  // Сбрасываем состояние пользователя
  userStates[chatId] = { state: null, ticketId: null };

  const welcomeMessage = `
🤖 Добро пожаловать в службу поддержки MindScape!

Выберите интересующий вас раздел:
  `;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '❓ Вопросы', callback_data: 'faq' },
          { text: '🐛 Баг-репорт', callback_data: 'bug_report' }
        ],
        [
          { text: '👤 Сотрудник', url: 'https://t.me/matvey_ai' },
          { text: '⚙️ Другое', callback_data: 'other_question' }
        ]
      ]
    }
  };

  const sentMessage = await bot.sendMessage(chatId, welcomeMessage, options);

  // Сохраняем ID сообщения бота, если оно не содержит номера обращения
  if (!botMessages[chatId]) {
    botMessages[chatId] = [];
  }
  botMessages[chatId].push(sentMessage.message_id);
});

// Обработка нажатий на кнопки
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  // Отвечаем на callback
  bot.answerCallbackQuery(callbackQuery.id);

  // Обновляем состояние пользователя
  if (!userStates[chatId]) {
    userStates[chatId] = { state: null, ticketId: null };
  }

  switch(data) {
    case 'faq':
      await showFAQ(chatId);
      break;

    case 'faq_back':
      await showMainMenu(chatId);
      break;

    case 'bug_report':
      userStates[chatId].state = 'waiting_for_bug_description';
      // Удаляем предыдущие сообщения (кроме с номером обращения)
      await deletePreviousMessages(chatId);
      const bugOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
          ]
        }
      };
      const bugMessage = await bot.sendMessage(chatId, 'Пожалуйста, опишите баг, который вы обнаружили. Приложите скриншоты, если возможно:', bugOptions);
      // Сохраняем ID сообщения бота, если оно не содержит номера обращения
      if (!botMessages[chatId]) {
        botMessages[chatId] = [];
      }
      botMessages[chatId].push(bugMessage.message_id);
      break;

    case 'contact_support':
      // Удаляем предыдущие сообщения (кроме с номером обращения)
      await deletePreviousMessages(chatId);
      const contactOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
          ]
        }
      };
      const contactMessage = await bot.sendMessage(chatId, 'Для связи с сотрудником поддержки перейдите в профиль: @matvey_ai', contactOptions);
      // Сохраняем ID сообщения бота, если оно не содержит номера обращения
      if (!botMessages[chatId]) {
        botMessages[chatId] = [];
      }
      botMessages[chatId].push(contactMessage.message_id);
      break;

    case 'other_question':
      userStates[chatId].state = 'waiting_for_other_question';
      // Удаляем предыдущие сообщения (кроме с номером обращения)
      await deletePreviousMessages(chatId);
      const otherOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
          ]
        }
      };
      const otherMessage = await bot.sendMessage(chatId, 'Пожалуйста, опишите ваш вопрос или проблему:', otherOptions);
      // Сохраняем ID сообщения бота, если оно не содержит номера обращения
      if (!botMessages[chatId]) {
        botMessages[chatId] = [];
      }
      botMessages[chatId].push(otherMessage.message_id);
      break;

    case 'return_to_main_menu':
      await showMainMenu(chatId);
      break;
  }
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Игнорируем команды
  if (msg.text?.startsWith('/')) return;

  // Проверяем состояние пользователя
  const userState = userStates[chatId];
  if (!userState) return;

  // Обновляем последнее сообщение пользователя
  userMessages[chatId] = msg.message_id;

  // Обработка фото
  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1]; // Берем фото в наилучшем качестве
    // Если пользователь ожидает отправить баг-репорт или другой вопрос, обрабатываем фото в этом контексте
    if (userState.state === 'waiting_for_bug_description') {
      // В этом случае отправляем фото как часть баг-репорта
      await handleBugReportWithMedia(chatId, msg, 'photo', photo.file_id);
    } else if (userState.state === 'waiting_for_other_question') {
      // В этом случае отправляем фото как часть другого вопроса
      await handleOtherQuestionWithMedia(chatId, msg, 'photo', photo.file_id);
    } else {
      await handleMediaMessage(chatId, msg, 'photo', photo.file_id);
    }
    return;
  }

  // Обработка видео
  if (msg.video) {
    // Если пользователь ожидает отправить баг-репорт или другой вопрос, обрабатываем видео в этом контексте
    if (userState.state === 'waiting_for_bug_description') {
      await handleBugReportWithMedia(chatId, msg, 'video', msg.video.file_id);
    } else if (userState.state === 'waiting_for_other_question') {
      await handleOtherQuestionWithMedia(chatId, msg, 'video', msg.video.file_id);
    } else {
      await handleMediaMessage(chatId, msg, 'video', msg.video.file_id);
    }
    return;
  }

  // Обработка текста
  if (msg.text) {
    switch(userState.state) {
      case 'waiting_for_bug_description':
        await handleBugReport(chatId, msg.text, msg);
        break;

      case 'waiting_for_message':
        // Эта функция больше не используется, так как связь с поддержкой осуществляется через профиль @matvey_ai
        // Удаляем предыдущие сообщения (кроме с номером обращения)
        await deletePreviousMessages(chatId);
        const supportOptions = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
            ]
          }
        };
        const supportMessage = await bot.sendMessage(chatId, 'Для связи с сотрудником поддержки перейдите в профиль: @matvey_ai', supportOptions);
        // Сохраняем ID сообщения бота, если оно не содержит номера обращения
        if (!botMessages[chatId]) {
          botMessages[chatId] = [];
        }
        botMessages[chatId].push(supportMessage.message_id);
        break;

      case 'waiting_for_other_question':
        await handleOtherQuestion(chatId, msg.text, msg);
        break;
    }
  }
});

// Функция показа главного меню
async function showMainMenu(chatId) {
  // Удаляем предыдущие сообщения (кроме с номером обращения)
  await deletePreviousMessages(chatId);

  const welcomeMessage = `
🤖 Добро пожаловать в службу поддержки MindScape!

Выберите интересующий вас раздел:
  `;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '❓ Вопросы', callback_data: 'faq' },
          { text: '🐛 Баг-репорт', callback_data: 'bug_report' }
        ],
        [
          { text: '👤 Сотрудник', url: 'https://t.me/matvey_ai' },
          { text: '⚙️ Другое', callback_data: 'other_question' }
        ]
      ]
    }
  };

  const sentMessage = await bot.sendMessage(chatId, welcomeMessage, options);

  // Сохраняем ID сообщения бота, если оно не содержит номера обращения
  if (!botMessages[chatId]) {
    botMessages[chatId] = [];
  }
  botMessages[chatId].push(sentMessage.message_id);
}

// Функция показа FAQ
async function showFAQ(chatId) {
  // Удаляем предыдущие сообщения (кроме с номером обращения)
  await deletePreviousMessages(chatId);

  const faqMessage = `
❓ Частые вопросы:

1. Как активировать премиум?
   • Перейдите в настройки и выберите "Подключить Premium"

2. Не приходят уведомления?
   • Проверьте настройки уведомлений в приложении и в системе

3. Как восстановить данные?
   • Ваши данные привязаны к вашему аккаунту Telegram

4. Проблемы с оплатой?
   • Убедитесь, что карта поддерживает международные платежи

5. Как связаться с поддержкой?
   • Нажмите кнопку "Сотрудник" или перейдите в профиль: @matvey_ai

6. Как удалить аккаунт?
   • Перейдите в настройки -> "Дополнительно" -> "Сбросить данные"

7. Не работает мини-приложение?
   • Попробуйте обновить Telegram или очистить кэш

8. Как перенести данные на другое устройство?
   • Ваши данные автоматически синхронизируются через Telegram

9. Как отключить напоминания?
   • Перейдите в настройки напоминаний и отключите их

10. Проблемы с ИИ-помощником?
    • Попробуйте перезапустить приложение или обратиться в поддержку

  `;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };

  const sentMessage = await bot.sendMessage(chatId, faqMessage, options);

  // Сохраняем ID сообщения бота, если оно не содержит номера обращения
  if (!botMessages[chatId]) {
    botMessages[chatId] = [];
  }
  botMessages[chatId].push(sentMessage.message_id);
}

// Функция обработки сообщения о баге
async function handleBugReport(chatId, description, originalMsg) {
  // Генерируем ID тикета
  const ticketId = `BUG-${Date.now()}`;

  // Сохраняем состояние
  userStates[chatId].ticketId = ticketId;
  userStates[chatId].state = null;

  // Отправляем пользователю подтверждение
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };

  // Отправляем сообщение пользователю (не удаляем предыдущие сообщения, т.к. содержит номер обращения)
  await bot.sendMessage(chatId, `Спасибо за сообщение о баге! 🐛

ID вашего тикета: ${ticketId}

Мы рассмотрим вашу проблему и свяжемся с вами в ближайшее время.`, options);

  // Отправляем администраторам информацию о баге
  const adminMessage = `🚨 Новый баг-репорт:

ID тикета: ${ticketId}
Пользователь: ${originalMsg.from.first_name} (@${originalMsg.from.username || 'N/A'})
ID пользователя: ${chatId}

Описание бага:
${description}`;

  ADMINS.forEach(adminId => {
    bot.sendMessage(adminId, adminMessage);
  });
}

// Функция обработки медиафайлов (фото и видео)
async function handleMediaMessage(chatId, originalMsg, mediaType, fileId) {
  // Генерируем ID тикета
  const ticketId = `MEDIA-${Date.now()}`;

  // Сохраняем состояние
  userStates[chatId].ticketId = ticketId;
  userStates[chatId].state = null;

  // Отправляем пользователю подтверждение
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };

  let mediaTypeName = mediaType === 'photo' ? 'фотографию' : 'видео';

  // Отправляем сообщение пользователю (не удаляем предыдущие сообщения, т.к. содержит номер обращения)
  await bot.sendMessage(chatId, `Спасибо за отправку ${mediaTypeName}! 📎\n\nID вашего тикета: ${ticketId}\n\nМы рассмотрим ваше сообщение и свяжемся с вами в ближайшее время.`, options);

  // Отправляем администраторам информацию о медиафайле
  const adminMessage = `${mediaType === 'photo' ? '📷' : '🎥'} Новое сообщение с медиафайлом:\n\nID тикета: ${ticketId}\nПользователь: ${originalMsg.from.first_name} (@${originalMsg.from.username || 'N/A'})\nID пользователя: ${chatId}`;

  // Отправляем медиафайл администраторам
  for (const adminId of ADMINS) {
    try {
      if (mediaType === 'photo') {
        await bot.sendPhoto(adminId, fileId, { caption: adminMessage });
      } else {
        await bot.sendVideo(adminId, fileId, { caption: adminMessage });
      }
    } catch (error) {
      console.error(`Ошибка при отправке медиафайла администратору ${adminId}:`, error);
      // Если не удалось отправить медиа, отправляем хотя бы текстовое сообщение
      await bot.sendMessage(adminId, `${adminMessage}\nТип медиа: ${mediaType}\nFile ID: ${fileId}`);
    }
  }
}

// Функция обработки баг-репорта с медиафайлом
async function handleBugReportWithMedia(chatId, originalMsg, mediaType, fileId) {
  // Генерируем ID тикета
  const ticketId = `BUG-${Date.now()}`;

  // Сохраняем состояние
  userStates[chatId].ticketId = ticketId;
  userStates[chatId].state = null;

  // Отправляем пользователю подтверждение
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };

  // Отправляем сообщение пользователю (не удаляем предыдущие сообщения, т.к. содержит номер обращения)
  await bot.sendMessage(chatId, `Спасибо за сообщение о баге с медиафайлом! 🐛\n\nID вашего тикета: ${ticketId}\n\nМы рассмотрим вашу проблему и свяжемся с вами в ближайшее время.`, options);

  // Отправляем администраторам информацию о баге с медиафайлом
  const adminMessage = `🚨 Новый баг-репорт с медиафайлом:\n\nID тикета: ${ticketId}\nПользователь: ${originalMsg.from.first_name} (@${originalMsg.from.username || 'N/A'})\nID пользователя: ${chatId}`;

  // Отправляем медиафайл администраторам
  for (const adminId of ADMINS) {
    try {
      if (mediaType === 'photo') {
        await bot.sendPhoto(adminId, fileId, { caption: adminMessage });
      } else {
        await bot.sendVideo(adminId, fileId, { caption: adminMessage });
      }
    } catch (error) {
      console.error(`Ошибка при отправке медиафайла администратору ${adminId}:`, error);
      // Если не удалось отправить медиа, отправляем хотя бы текстовое сообщение
      await bot.sendMessage(adminId, `${adminMessage}\nТип медиа: ${mediaType}\nFile ID: ${fileId}`);
    }
  }
}

// Функция обработки другого вопроса с медиафайлом
async function handleOtherQuestionWithMedia(chatId, originalMsg, mediaType, fileId) {
  // Генерируем ID тикета
  const ticketId = `OTH-${Date.now()}`;

  // Сохраняем состояние
  userStates[chatId].ticketId = ticketId;
  userStates[chatId].state = null;

  // Отправляем пользователю подтверждение
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };

  // Отправляем сообщение пользователю (не удаляем предыдущие сообщения, т.к. содержит номер обращения)
  await bot.sendMessage(chatId, `Ваш вопрос с медиафайлом принят! 📝\n\nID вашего тикета: ${ticketId}\n\nМы рассмотрим ваш вопрос и свяжемся с вами в ближайшее время.`, options);

  // Отправляем администраторам информацию о вопросе с медиафайлом
  const adminMessage = `❓ Новый вопрос с медиафайлом:\n\nID тикета: ${ticketId}\nПользователь: ${originalMsg.from.first_name} (@${originalMsg.from.username || 'N/A'})\nID пользователя: ${chatId}`;

  // Отправляем медиафайл администраторам
  for (const adminId of ADMINS) {
    try {
      if (mediaType === 'photo') {
        await bot.sendPhoto(adminId, fileId, { caption: adminMessage });
      } else {
        await bot.sendVideo(adminId, fileId, { caption: adminMessage });
      }
    } catch (error) {
      console.error(`Ошибка при отправке медиафайла администратору ${adminId}:`, error);
      // Если не удалось отправить медиа, отправляем хотя бы текстовое сообщение
      await bot.sendMessage(adminId, `${adminMessage}\nТип медиа: ${mediaType}\nFile ID: ${fileId}`);
    }
  }
}

// Функция обработки запроса в поддержку (не используется, так как теперь через профиль)
async function handleSupportRequest(chatId, message, originalMsg) {
  // Эта функция больше не используется, так как связь с поддержкой осуществляется через профиль @matvey_ai
  // Удаляем предыдущие сообщения (кроме с номером обращения)
  await deletePreviousMessages(chatId);
  const supportOptions = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };
  const sentMessage = await bot.sendMessage(chatId, 'Для связи с сотрудником поддержки перейдите в профиль: @matvey_ai', supportOptions);
  // Сохраняем ID сообщения бота, если оно не содержит номера обращения
  if (!botMessages[chatId]) {
    botMessages[chatId] = [];
  }
  botMessages[chatId].push(sentMessage.message_id);
}

// Функция обработки другого вопроса
async function handleOtherQuestion(chatId, question, originalMsg) {
  // Генерируем ID тикета
  const ticketId = `OTH-${Date.now()}`;

  // Сохраняем состояние
  userStates[chatId].ticketId = ticketId;
  userStates[chatId].state = null;

  // Отправляем пользователю подтверждение
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'return_to_main_menu' }]
      ]
    }
  };

  // Отправляем сообщение пользователю (не удаляем предыдущие сообщения, т.к. содержит номер обращения)
  await bot.sendMessage(chatId, `Ваш вопрос принят! 📝

ID вашего тикета: ${ticketId}

Мы рассмотрим ваш вопрос и свяжемся с вами в ближайшее время.`, options);

  // Отправляем администраторам информацию о вопросе
  const adminMessage = `❓ Новый вопрос от пользователя:

ID тикета: ${ticketId}
Пользователь: ${originalMsg.from.first_name} (@${originalMsg.from.username || 'N/A'})
ID пользователя: ${chatId}

Вопрос:
${question}`;

  ADMINS.forEach(adminId => {
    bot.sendMessage(adminId, adminMessage);
  });
}

// Обработка команды /stats для администраторов
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  
  if (ADMINS.includes(chatId)) {
    const totalUsers = Object.keys(userStates).length;
    const activeTickets = Object.values(userStates).filter(state => state.ticketId).length;
    
    bot.sendMessage(chatId, `📊 Статистика поддержки:

Всего пользователей: ${totalUsers}
Активных тикетов: ${activeTickets}
    `);
  }
});

// Обработка команды /broadcast для администраторов
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const broadcastMessage = match[1];
  
  if (ADMINS.includes(chatId)) {
    const userIds = Object.keys(userStates).map(Number);
    
    let sentCount = 0;
    userIds.forEach(userId => {
      bot.sendMessage(userId, `📢 Сообщение от администрации:\n\n${broadcastMessage}`)
        .then(() => sentCount++)
        .catch(err => console.log(`Ошибка отправки пользователю ${userId}:`, err));
    });
    
    bot.sendMessage(chatId, `📢 Рассылка завершена. Отправлено ${sentCount} пользователям.`);
  }
});

console.log('Бот технической поддержки запущен и готов к работе!');