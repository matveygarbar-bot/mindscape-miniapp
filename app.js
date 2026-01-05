const tg = window.Telegram.WebApp;
tg.ready();

// получаем userId из Telegram
const userId = tg.initDataUnsafe?.user?.id;

// элемент для текста
const statusEl = document.getElementById('status');

// если вдруг открыли не из Telegram
if (!userId) {
  statusEl.innerText = '❌ Откройте приложение через Telegram';
  throw new Error('No Telegram user');
}

// проверяем доступ через API
fetch('http://localhost:3000/check-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ userId })
})
  .then(res => res.json())
  .then(data => {
    if (data.access === 'none') {
      statusEl.innerText = '❌ Доступа нет';
    }

    if (data.access === 'free') {
      statusEl.innerHTML = '✅ Доступ открыт<br>Версия: <b>Free</b>';
    }

    if (data.access === 'premium') {
      statusEl.innerHTML = '⭐ Доступ открыт<br>Версия: <b>PREMIUM</b>';
    }
  })
  .catch(err => {
    console.error(err);
    statusEl.innerText = '⚠️ Ошибка проверки доступа';
  });
