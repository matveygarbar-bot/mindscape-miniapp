class MindScapeApp {
  constructor() {
      this.tg = window.Telegram.WebApp;
      this.initData = this.tg.initData || {};
      this.userId = this.tg.initDataUnsafe?.user?.id || null;
      
      this.tasks = [];
      this.currentView = 'tasks';
      this.accessType = 'none'; // 'none', 'free', 'premium'
      this.taskLimit = 5;
      this.focusTime = 0;
      this.timerInterval = null;
      this.timerSeconds = 1500; // 25 минут
      
      this.init();
  }

  async init() {
      this.initElements();
      this.initEvents();
      this.updateDate();
      
      // Инициализируем Telegram Web App
      this.initTelegramWebApp();
      
      // Проверяем доступ пользователя
      if (this.userId) {
          await this.checkUserAccess();
      } else {
          // Тестовый режим для разработки
          this.accessType = 'free';
          this.updateUI();
      }
      
      this.loadTasks();
      
      // Показываем приложение
      this.tg.ready();
  }

  initTelegramWebApp() {
      // Настраиваем Telegram Web App
      this.tg.expand();
      this.tg.enableClosingConfirmation();
      this.tg.setHeaderColor('#7c3aed');
      this.tg.setBackgroundColor('#0f172a');
      
      // Настраиваем кнопку
      this.tg.MainButton.setText('🚀 Открыть MindScape');
      this.tg.MainButton.show();
      
      this.tg.MainButton.onClick(() => {
          // Действие при нажатии на кнопку
          this.showNotification('Приложение готово к использованию!');
      });
  }

  initElements() {
      // Основные элементы
      this.taskInput = document.getElementById('task-input');
      this.addTaskBtn = document.getElementById('add-task-btn');
      this.tasksList = document.getElementById('tasks-list');
      this.emptyState = document.getElementById('empty-state');
      
      // Элементы доступа
      this.accessText = document.getElementById('access-text');
      this.versionBadge = document.getElementById('version-badge');
      this.upgradeBtn = document.getElementById('upgrade-btn');
      this.premiumBanner = document.getElementById('premium-banner');
      this.bannerUpgradeBtn = document.getElementById('banner-upgrade-btn');
      this.proNote = document.getElementById('pro-note');
      
      // Статистика
      this.totalTasksEl = document.getElementById('total-tasks');
      this.completedTasksEl = document.getElementById('completed-tasks');
      this.focusTimeEl = document.getElementById('focus-time');
      this.taskLimitEl = document.getElementById('task-limit');
      this.progressFill = document.getElementById('progress-fill');
      this.progressText = document.getElementById('progress-text');
      
      // Фильтры и сортировка
      this.filterBtns = document.querySelectorAll('.filter-btn');
      this.sortSelect = document.getElementById('sort-select');
      
      // Навигация
      this.navBtns = document.querySelectorAll('.nav-btn');
      
      // Модальное окно
      this.upgradeModal = document.getElementById('upgrade-modal');
      this.closeModalBtn = document.querySelector('.close-btn');
      this.priceCards = document.querySelectorAll('.price-card');
      this.paymentInfo = document.getElementById('payment-info');
      this.paymentCard = document.getElementById('payment-card');
      this.paymentName = document.getElementById('payment-name');
      this.paymentCode = document.getElementById('payment-code');
      this.copyCodeBtn = document.getElementById('copy-code');
      this.openBotBtn = document.getElementById('open-bot-btn');
      
      // Таймер
      this.focusTimer = document.getElementById('focus-timer');
      this.timerText = document.getElementById('timer-text');
      this.timerStartBtn = document.getElementById('timer-start');
      this.timerPauseBtn = document.getElementById('timer-pause');
      this.timerResetBtn = document.getElementById('timer-reset');
  }

  initEvents() {
      // Добавление задачи
      this.addTaskBtn.addEventListener('click', () => this.addTask());
      this.taskInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.addTask();
      });
      
      // Фильтры
      this.filterBtns.forEach(btn => {
          btn.addEventListener('click', () => this.filterTasks(btn.dataset.filter));
      });
      
      // Сортировка
      this.sortSelect.addEventListener('change', () => this.sortTasks());
      
      // Навигация
      this.navBtns.forEach(btn => {
          btn.addEventListener('click', () => this.switchView(btn.dataset.view));
      });
      
      // Кнопки апгрейда
      if (this.upgradeBtn) {
          this.upgradeBtn.addEventListener('click', () => this.showUpgradeModal());
      }
      
      if (this.bannerUpgradeBtn) {
          this.bannerUpgradeBtn.addEventListener('click', () => this.showUpgradeModal());
      }
      
      // Модальное окно
      if (this.closeModalBtn) {
          this.closeModalBtn.addEventListener('click', () => this.hideUpgradeModal());
      }
      
      this.priceCards.forEach(card => {
          card.addEventListener('click', (e) => {
              if (e.target.classList.contains('btn-select-plan')) {
                  this.selectPlan(card.dataset.plan);
              }
          });
      });
      
      if (this.copyCodeBtn) {
          this.copyCodeBtn.addEventListener('click', () => this.copyPaymentCode());
      }
      
      if (this.openBotBtn) {
          this.openBotBtn.addEventListener('click', () => this.openBotForPayment());
      }
      
      // Таймер
      if (this.timerStartBtn) {
          this.timerStartBtn.addEventListener('click', () => this.startTimer());
      }
      
      if (this.timerPauseBtn) {
          this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
      }
      
      if (this.timerResetBtn) {
          this.timerResetBtn.addEventListener('click', () => this.resetTimer());
      }
      
      // Закрытие модального окна по клику вне его
      window.addEventListener('click', (e) => {
          if (e.target === this.upgradeModal) {
              this.hideUpgradeModal();
          }
      });
  }

  async checkUserAccess() {
    try {
        if (this.userId) {
            // Определяем URL API в зависимости от среды
            let API_URL;
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                API_URL = 'http://localhost:3000';
            } else {
                // Для GitHub Pages или продакшена
                API_URL = 'https://ваш-бекенд-домен.com'; // ЗАМЕНИТЕ НА ВАШ ДОМЕН
            }
            
            console.log('Проверяем доступ для userId:', this.userId, 'через API:', API_URL);
            
            const response = await fetch(`${API_URL}/check-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: this.userId })
            });
            
            console.log('Ответ API:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Данные доступа:', data);
                
                this.accessType = data.access;
                
                if (data.access === 'premium') {
                    this.premiumExpires = new Date(data.expiresAt);
                    this.daysLeft = data.daysLeft;
                    console.log('Premium доступ до:', this.premiumExpires);
                } else if (data.access === 'free') {
                    // Обновляем lastAccess в БД
                    try {
                        await fetch(`${API_URL}/user/${this.userId}`);
                    } catch (e) {
                        // Игнорируем ошибки обновления
                    }
                }
                
                this.updateUI();
            } else {
                console.error('Ошибка ответа API:', await response.text());
                this.accessType = 'free';
                this.updateUI();
            }
        } else {
            console.log('userId не найден, тестовый режим');
            this.accessType = 'free';
            this.updateUI();
        }
    } catch (error) {
        console.error('Ошибка проверки доступа:', error);
        this.accessType = 'free';
        this.updateUI();
    }
}
  updateUI() {
      // Обновляем бейдж версии
      if (this.versionBadge) {
          if (this.accessType === 'premium') {
              this.versionBadge.textContent = 'PREMIUM';
              this.versionBadge.className = 'badge premium';
          } else {
              this.versionBadge.textContent = 'FREE';
              this.versionBadge.className = 'badge free';
          }
      }
      
      // Обновляем текст доступа
      if (this.accessText) {
          if (this.accessType === 'premium') {
              this.accessText.textContent = `Premium (осталось ${this.daysLeft} дней)`;
          } else if (this.accessType === 'free') {
              this.accessText.textContent = 'Бесплатный доступ';
          } else {
              this.accessText.textContent = 'Нет доступа';
          }
      }
      
      // Показываем/скрываем кнопку апгрейда
      if (this.upgradeBtn) {
          this.upgradeBtn.style.display = this.accessType === 'free' ? 'flex' : 'none';
      }
      
      // Показываем/скрываем баннер премиума
      if (this.premiumBanner) {
          this.premiumBanner.style.display = this.accessType === 'free' ? 'flex' : 'none';
      }
      
      // Показываем/скрываем заметку о Pro функциях
      if (this.proNote) {
          this.proNote.style.display = this.accessType === 'free' ? 'flex' : 'none';
      }
      
      // Обновляем лимит задач
      this.taskLimit = this.accessType === 'premium' ? Infinity : 5;
      this.updateStats();
  }

  updateDate() {
      const now = new Date();
      const dateEl = document.getElementById('current-date');
      if (dateEl) {
          const options = { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
          };
          dateEl.textContent = now.toLocaleDateString('ru-RU', options);
      }
  }

  loadTasks() {
      try {
          const saved = localStorage.getItem('mindscape_tasks');
          if (saved) {
              this.tasks = JSON.parse(saved);
              this.tasks.forEach(task => {
                  task.created = new Date(task.created);
                  if (task.time) task.time = new Date(task.time);
              });
          }
      } catch (error) {
          console.error('Ошибка загрузки задач:', error);
          this.tasks = [];
      }
      
      this.renderTasks();
      this.updateStats();
  }

  saveTasks() {
      try {
          localStorage.setItem('mindscape_tasks', JSON.stringify(this.tasks));
      } catch (error) {
          console.error('Ошибка сохранения задач:', error);
      }
  }

  addTask() {
      // Проверяем доступ
      if (this.accessType === 'none') {
          this.showNotification('Пожалуйста, активируйте доступ в боте');
          return;
      }
      
      const text = this.taskInput.value.trim();
      if (!text) {
          this.showNotification('Введите текст задачи');
          return;
      }
      
      // Проверяем лимит задач для бесплатной версии
      if (this.accessType === 'free') {
          const today = new Date().toDateString();
          const todayTasks = this.tasks.filter(task => 
              task.created.toDateString() === today && !task.completed
          ).length;
          
          if (todayTasks >= this.taskLimit) {
              this.showNotification(`Лимит задач (${this.taskLimit}) исчерпан! Перейдите на Premium`);
              this.showUpgradeModal();
              return;
          }
      }
      
      const task = {
          id: Date.now(),
          text: text,
          completed: false,
          created: new Date(),
          priority: document.getElementById('priority-select').value,
          time: document.getElementById('task-time').value || null
      };
      
      this.tasks.unshift(task);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      
      this.taskInput.value = '';
      this.showNotification('Задача добавлена!');
      
      // Тактильная обратная связь в Telegram
      if (this.tg && this.tg.HapticFeedback) {
          this.tg.HapticFeedback.impactOccurred('light');
      }
  }

  toggleTask(id) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
          task.completed = !task.completed;
          task.completedAt = task.completed ? new Date() : null;
          
          this.saveTasks();
          this.renderTasks();
          this.updateStats();
          
          // Тактильная обратная связь
          if (this.tg && this.tg.HapticFeedback) {
              this.tg.HapticFeedback.impactOccurred('light');
          }
      }
  }

  deleteTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      
      this.showNotification('Задача удалена');
      
      // Тактильная обратная связь
      if (this.tg && this.tg.HapticFeedback) {
          this.tg.HapticFeedback.impactOccurred('medium');
      }
  }

  renderTasks(filter = 'all') {
      if (!this.tasksList) return;
      
      let filteredTasks = [...this.tasks];
      
      // Применяем фильтр
      const today = new Date().toDateString();
      switch(filter) {
          case 'today':
              filteredTasks = filteredTasks.filter(t => 
                  t.created.toDateString() === today
              );
              break;
          case 'important':
              filteredTasks = filteredTasks.filter(t => 
                  t.priority === 'high' && !t.completed
              );
              break;
          case 'completed':
              filteredTasks = filteredTasks.filter(t => t.completed);
              break;
          case 'pending':
              filteredTasks = filteredTasks.filter(t => !t.completed);
              break;
      }
      
      // Применяем сортировку
      const sortBy = this.sortSelect ? this.sortSelect.value : 'time';
      this.sortTasksList(filteredTasks, sortBy);
      
      // Рендерим
      if (filteredTasks.length === 0) {
          this.tasksList.innerHTML = this.emptyState.outerHTML;
          return;
      }
      
      this.tasksList.innerHTML = filteredTasks.map(task => `
          <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
              <div class="task-checkbox" onclick="mindscape.toggleTask(${task.id})">
                  ${task.completed ? '<i class="fas fa-check"></i>' : ''}
              </div>
              <div class="task-content">
                  <div class="task-text">${this.escapeHtml(task.text)}</div>
                  <div class="task-meta">
                      ${task.time ? `
                          <span class="task-time">
                              <i class="far fa-clock"></i> ${task.time}
                          </span>
                      ` : ''}
                      <span class="task-priority ${task.priority}">
                          ${this.getPriorityText(task.priority)}
                      </span>
                  </div>
              </div>
              <div class="task-actions">
                  <button class="task-action-btn" onclick="mindscape.deleteTask(${task.id})">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          </div>
      `).join('');
  }

  sortTasksList(tasks, sortBy) {
      switch(sortBy) {
          case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
              break;
              
          case 'time':
              tasks.sort((a, b) => {
                  if (a.time && b.time) return new Date(a.time) - new Date(b.time);
                  if (a.time) return -1;
                  if (b.time) return 1;
                  return b.created - a.created;
              });
              break;
              
          case 'date':
              tasks.sort((a, b) => b.created - a.created);
              break;
      }
  }

  filterTasks(filter) {
      this.filterBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      this.renderTasks(filter);
  }

  sortTasks() {
      this.renderTasks();
  }

  updateStats() {
      const today = new Date().toDateString();
      const todayTasks = this.tasks.filter(t => 
          t.created.toDateString() === today
      );
      
      const total = todayTasks.length;
      const completed = todayTasks.filter(t => t.completed).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Обновляем значения
      if (this.totalTasksEl) this.totalTasksEl.textContent = total;
      if (this.completedTasksEl) this.completedTasksEl.textContent = completed;
      if (this.focusTimeEl) {
          const hours = Math.floor(this.focusTime / 60);
          const minutes = this.focusTime % 60;
          this.focusTimeEl.textContent = `${hours > 0 ? hours + 'ч ' : ''}${minutes}м`;
      }
      if (this.taskLimitEl) {
          this.taskLimitEl.textContent = this.accessType === 'premium' 
              ? `∞` 
              : `${total}/${this.taskLimit}`;
      }
      
      // Обновляем прогресс-бар
      if (this.progressFill) {
          this.progressFill.style.width = `${progress}%`;
      }
      if (this.progressText) {
          this.progressText.textContent = `${progress}%`;
      }
  }

  switchView(view) {
      this.currentView = view;
      
      // Обновляем активную кнопку навигации
      this.navBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.view === view);
      });
      
      // Показываем/скрываем соответствующие секции
      const sections = ['tasks', 'calendar', 'focus', 'stats'];
      sections.forEach(section => {
          const element = document.querySelector(`.${section}-section`);
          if (element) {
              element.style.display = section === view ? 'block' : 'none';
          }
      });
      
      // Показываем/скрываем таймер
      if (this.focusTimer) {
          this.focusTimer.style.display = view === 'focus' ? 'block' : 'none';
      }
  }

  showUpgradeModal() {
      if (this.upgradeModal) {
          this.upgradeModal.style.display = 'flex';
          this.paymentInfo.style.display = 'none';
      }
  }

  hideUpgradeModal() {
      if (this.upgradeModal) {
          this.upgradeModal.style.display = 'none';
      }
  }

  async selectPlan(plan) {
    try {
        this.showNotification('Создаем платеж...');
        
        // Используем API для создания платежа
        const paymentData = await this.createPayment(plan);
        
        if (!paymentData) {
            this.showNotification('Не удалось создать платеж');
            return;
        }
        
        console.log('Данные платежа:', paymentData);
        
        // Устанавливаем информацию о платеже
        if (this.paymentCard) {
            this.paymentCard.textContent = paymentData.cardNumber;
        }
        
        if (this.paymentName) {
            this.paymentName.textContent = paymentData.cardName;
        }
        
        if (this.paymentCode) {
            this.paymentCode.textContent = paymentData.paymentCode;
        }
        
        // Показываем секцию с информацией об оплате
        this.paymentInfo.style.display = 'block';
        
        // Прокручиваем к оплате
        this.paymentInfo.scrollIntoView({ behavior: 'smooth' });
        
        // Сохраняем информацию о платеже
        localStorage.setItem('pending_payment', JSON.stringify({
            code: paymentData.paymentCode,
            plan: plan,
            amount: paymentData.amount,
            days: paymentData.days,
            timestamp: Date.now(),
            expiresAt: paymentData.expiresAt
        }));
        
        this.showNotification('Платеж создан! Скопируйте код для оплаты.');
        
        // Запускаем проверку статуса платежа
        this.startPaymentPolling(paymentData.paymentCode);
        
    } catch (error) {
        console.error('Ошибка выбора плана:', error);
        this.showNotification('Ошибка создания платежа');
    }
}

startPaymentPolling(paymentCode) {
    // Проверяем статус платежа каждые 10 секунд
    const checkInterval = setInterval(async () => {
        const payment = await this.checkPaymentStatus(paymentCode);
        
        if (payment && payment.status === 'confirmed') {
            clearInterval(checkInterval);
            this.showNotification('✅ Платеж подтвержден! Premium доступ активирован.');
            
            // Перезагружаем доступ
            await this.checkUserAccess();
            
            // Закрываем модальное окно
            this.hideUpgradeModal();
            
            // Обновляем приложение
            this.updateUI();
        } else if (payment && (payment.status === 'cancelled' || payment.status === 'timeout')) {
            clearInterval(checkInterval);
            this.showNotification('❌ Платеж отменен или истек');
        }
    }, 10000); // Проверяем каждые 10 секунд
}

  generatePaymentCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
  }

  async createPayment(plan) {
    try {
        // Определяем URL API
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:3000';
        } else {
            API_URL = 'https://ваш-бекенд-домен.com'; // ЗАМЕНИТЕ НА ВАШ ДОМЕН
        }
        
        const response = await fetch(`${API_URL}/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: this.userId, 
                plan: plan 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Ошибка создания платежа');
        }
    } catch (error) {
        console.error('Ошибка создания платежа:', error);
        this.showNotification('Ошибка создания платежа');
        return null;
    }
}

async checkPaymentStatus(paymentCode) {
    try {
        // Определяем URL API
        let API_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_URL = 'http://localhost:3000';
        } else {
            API_URL = 'https://ваш-бекенд-домен.com'; // ЗАМЕНИТЕ НА ВАШ ДОМЕН
        }
        
        const response = await fetch(`${API_URL}/check-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentCode: paymentCode })
        });
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Ошибка проверки платежа:', error);
    }
    return null;
}

  copyPaymentCode() {
      const code = this.paymentCode.textContent;
      navigator.clipboard.writeText(code)
          .then(() => {
              this.showNotification('Код скопирован!');
          })
          .catch(err => {
              console.error('Ошибка копирования:', err);
          });
  }

  openBotForPayment() {
      // Открываем бота для отправки скриншота
      const botUrl = `https://t.me/mindscape_app_bot`;
      if (this.tg && this.tg.openLink) {
          this.tg.openLink(botUrl);
      } else {
          window.open(botUrl, '_blank');
      }
  }

  // Таймер фокуса
  startTimer() {
      if (this.timerInterval) return;
      
      this.timerInterval = setInterval(() => {
          this.timerSeconds--;
          this.updateTimerDisplay();
          
          if (this.timerSeconds <= 0) {
              this.timerComplete();
          }
      }, 1000);
      
      this.timerStartBtn.disabled = true;
      this.timerPauseBtn.disabled = false;
  }

  pauseTimer() {
      if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
          this.timerStartBtn.disabled = false;
          this.timerPauseBtn.disabled = true;
      }
  }

  resetTimer() {
      this.pauseTimer();
      this.timerSeconds = 1500; // 25 минут
      this.updateTimerDisplay();
      this.timerStartBtn.disabled = false;
  }

  updateTimerDisplay() {
      const minutes = Math.floor(this.timerSeconds / 60);
      const seconds = this.timerSeconds % 60;
      this.timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  timerComplete() {
      this.pauseTimer();
      this.focusTime += 25; // Добавляем 25 минут к общему времени фокуса
      this.updateStats();
      
      this.showNotification('Таймер завершен! Отличная работа!');
      
      // Вибрация в Telegram
      if (this.tg && this.tg.HapticFeedback) {
          this.tg.HapticFeedback.notificationOccurred('success');
      }
      
      // Можно добавить уведомление
      if (this.tg && this.tg.showAlert) {
          this.tg.showAlert('Таймер завершен! Время для короткого перерыва.');
      }
  }

  // Вспомогательные функции
  escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
  }

  getPriorityText(priority) {
      const texts = {
          low: 'Низкий',
          medium: 'Средний',
          high: 'Высокий'
      };
      return texts[priority] || priority;
  }

  showNotification(message, type = 'success') {
      // Создаем уведомление
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      
      // Добавляем в DOM
      document.body.appendChild(notification);
      
      // Удаляем через 3 секунды
      setTimeout(() => {
          notification.remove();
      }, 3000);
  }
}

// Инициализация приложения
let mindscape;
document.addEventListener('DOMContentLoaded', () => {
  mindscape = new MindScapeApp();
  window.mindscape = mindscape; // Делаем глобально доступным
});