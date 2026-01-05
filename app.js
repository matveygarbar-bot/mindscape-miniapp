// подключаем Telegram WebApp
const tg = window.Telegram.WebApp;

// говорим Telegram, что приложение готово
tg.ready();

// получаем пользователя
const user = tg.initDataUnsafe?.user;

// если приложение открыли НЕ через Telegram
if (!user) {
  document.body.innerHTML = `
    <h2>❌ Ошибка</h2>
    <p>Откройте приложение через Telegram-бота</p>
  `;
  throw new Error('Telegram user not found');
}

// userId из Telegram (настоящий)
const userId = user.id;

// показываем в интерфейсе
document.getElementById('user').innerText =
  `Ваш Telegram ID: ${userId}`;

// отправляем сигнал боту
tg.sendData(JSON.stringify({
  action: 'open_app'
}));
