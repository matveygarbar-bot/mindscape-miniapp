const tg = window.Telegram.WebApp;

// Сообщаем Telegram, что Mini App готов
tg.ready();

// Данные пользователя
const user = tg.initDataUnsafe?.user;

const userBlock = document.getElementById('user');

if (user) {
  userBlock.textContent = `👋 Привет, ${user.first_name}!`;
} else {
  userBlock.textContent = '❌ Не удалось получить данные пользователя';
}

// Расширяем Mini App на весь экран
tg.expand();
