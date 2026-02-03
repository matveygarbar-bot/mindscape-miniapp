import TelegramBot from 'node-telegram-bot-api';

// Используем тот же токен, что и в основном боте
const TOKEN = '7975436192:AAERWNu43TbK_cpH-SE1v41fsHReNEZtBh8';
const CHANNEL_ID = -1002924310370;

const bot = new TelegramBot(TOKEN, { polling: false }); // polling: false для отправки сообщений

async function sendMessageToChannel() {
  try {
    const message = await bot.sendMessage(CHANNEL_ID, 'Добро пожаловать в MindScape! 🧠\n\nЗдесь вы можете планировать, развиваться и достигать целей с помощью ИИ-помощника.\n\nНаш канал - место для вдохновения, развития и продуктивности. Здесь вы найдете полезные материалы, советы и инструменты для саморазвития.\n\nДля связи с поддержкой используйте @MindScape_support_bot', {
      reply_markup: {
        inline_keyboard: [
          [{
            text: '📱 Открыть приложение',
            url: 'https://t.me/MindScapeAppBot'
          }]
        ]
      }
    });
    console.log('Сообщение успешно отправлено в канал');
    console.log('ID сообщения:', message.message_id);
    console.log('Полный объект сообщения:', JSON.stringify(message, null, 2));
  } catch (error) {
    console.error('Ошибка при отправки сообщения в канал:', error);
  }
}

sendMessageToChannel();