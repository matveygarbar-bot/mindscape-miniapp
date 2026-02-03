import { useState, useEffect, useRef } from 'react';
import Toast from './components/Toast';
import PremiumPaywall from './components/PremiumPaywall';
import Notifications from './components/Notifications';
import { getInitialData } from './data';
import { TranslationProvider } from './hooks/useTranslation';
import { translations } from './translations';
import './styles.css';

// Импортируем новые компоненты разделов
import Today from './components/Today';
import Calendar from './components/Calendar';
import Statistics from './components/Statistics';
import Thoughts from './components/Thoughts';
import Settings from './components/Settings';
import BottomNavigation from './components/BottomNavigation'; // Будет создан

function App() {
  const [notes, setNotes] = useState(() => getInitialData().initialNotes);
  const [archive, setArchive] = useState(() => getInitialData().initialArchive);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(() => {
    const storedPremiumStatus = localStorage.getItem('isPremium');
    if (storedPremiumStatus) {
      return JSON.parse(storedPremiumStatus);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const versionParam = urlParams.get('version');
    if (versionParam === 'free') {
      return false;
    } else if (versionParam === 'premium') {
      return true;
    }

    return false; // Значение по умолчанию
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('today');
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    return savedFontSize || 'medium';
  });
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'ru';
  });
  const [notifications, setNotifications] = useState([]);

  // Состояния для таймера фокуса
  const [focusTime, setFocusTime] = useState(0); // Время в секундах для фокус-таймера
  const [isFocusActive, setIsFocusActive] = useState(false); // Активен ли фокус-таймер

  // Section order for swipe navigation
  const sections = ['today', 'calendar', 'statistics', 'thoughts', 'settings'];
  const currentIndex = sections.indexOf(activeSection);

  // Swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const touchCurrentY = useRef(0);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'horizontal' or 'vertical'
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1, percentage of swipe
  const [isSwiping, setIsSwiping] = useState(false);
  const [targetSection, setTargetSection] = useState(null);
  const [previousSection, setPreviousSection] = useState(activeSection);
  const [isAnimating, setIsAnimating] = useState(false);
  const appRef = useRef(null);

  // Update previous section when active section changes via navigation
  useEffect(() => {
    if (!isAnimating && !isSwiping) {
      setPreviousSection(activeSection);
    }
  }, [activeSection, isAnimating, isSwiping]);

  useEffect(() => {
    // Функция для включения полноэкранного режима
    const requestFullscreen = async () => {
      try {
        // Проверяем, поддерживается ли полноэкранный режим
        if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
              await document.documentElement.webkitRequestFullscreen();
            }
          }
        }
      } catch (err) {
        console.log('Не удалось включить полноэкранный режим:', err);
      }
    };

    // Также добавляем класс для стилей полноэкранного режима
    const enableFullscreenStyles = () => {
      document.body.classList.add('fullscreen-app');
    };

    // Добавляем класс для стилей полноэкранного режима сразу
    enableFullscreenStyles();

    // Добавляем слушатель события для повторной попытки при взаимодействии пользователя
    // Убираем автоматический вызов, который мог мешать первому взаимодействию
    const handleClick = (e) => {
      // Проверяем, что клик произошел по элементу, а не внутри него
      if (e.target === document.body || e.target === document.documentElement) {
        requestFullscreen();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        requestFullscreen();
      }
    };

    // Убираем автоматический запуск через setTimeout, чтобы не мешать первому взаимодействию
    // setTimeout(requestFullscreen, 100);

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  // // Применяем размер шрифта
  useEffect(() => {
    // Устанавливаем класс в зависимости от размера шрифта
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${fontSize}`);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Сохраняем статус isPremium в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('isPremium', JSON.stringify(isPremium));
  }, [isPremium]);

  // Получаем и сохраняем userId при загрузке приложения
  useEffect(() => {
    // Проверяем, доступен ли Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Инициализируем WebApp
      window.Telegram.WebApp.ready();

      // Получаем userId из initData
      const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id;

      if (userId) {
        // Сохраняем userId в localStorage для дальнейшего использования
        localStorage.setItem('userId', userId);
        console.log('Telegram WebApp userId получен и сохранен:', userId);
      } else {
        console.log('Telegram WebApp userId недоступен');
      }
    } else {
      console.log('Telegram WebApp недоступен');
    }
  }, []);

  // Функция для добавления нового уведомления
  const addNotification = (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  // Эффект для обработки таймера фокуса
  useEffect(() => {
    let interval = null;
    if (isFocusActive && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (focusTime === 0 && isFocusActive) {
      if (interval) clearInterval(interval);
      // Показываем уведомление о завершении таймера
      if (addNotification) {
        addNotification('Фокус-таймер', 'Время вышло! Пора сделать перерыв.', 'success');
      } else {
        alert('Фокус-таймер завершен!');
      }
      setIsFocusActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusActive, focusTime, addNotification]);

  // Функция для форматирования времени
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Функция для удаления уведомления
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Определение направления свайпа
  const determineSwipeDirection = (dx, dy) => {
    // Порог для определения направления (10px)
    const threshold = 10;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      return 'horizontal';
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
      return 'vertical';
    }
    return null;
  };

  // Обработчики свайпа - переписанная система с физикой
  const touchStartTime = useRef(0);
  const touchPositions = useRef([]);
  const animationFrameRef = useRef(null);

  // Функция для расчета скорости свайпа
  const calculateVelocity = () => {
    if (touchPositions.current.length < 2) return 0;

    const recentPoints = touchPositions.current.slice(-5); // Берем последние 5 точки
    const firstPoint = recentPoints[0];
    const lastPoint = recentPoints[recentPoints.length - 1];

    const deltaTime = lastPoint.time - firstPoint.time;
    const deltaX = lastPoint.x - firstPoint.x;

    return deltaTime > 0 ? deltaX / deltaTime : 0; // px/ms
  };

  // Функция для анимации с физикой
  const animateToPosition = (direction) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsAnimating(true);
    const startX = swipeOffset;
    const startTime = Date.now();
    const duration = 300; // ms

    // Целевая позиция: 0 для возврата, ±window.innerWidth для перехода
    const targetX = direction === 0 ? 0 : (direction > 0 ? -window.innerWidth : window.innerWidth);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Используем плавную easing-функцию (easeOutCubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentX = startX + (targetX - startX) * easedProgress;

      setSwipeOffset(currentX);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Завершение анимации
        if (direction !== 0) {
          // Если произошел переход, обновляем активный раздел
          if (direction > 0 && currentIndex > 0) { // Свайп вправо
            setActiveSection(sections[currentIndex - 1]);
          } else if (direction < 0 && currentIndex < sections.length - 1) { // Свайп влево
            setActiveSection(sections[currentIndex + 1]);
          }
        }

        setSwipeOffset(0);
        setIsAnimating(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleTouchStart = (e) => {
    // Проверяем, не происходит ли касание на элементе, который должен обрабатывать свои собственные события
    const target = e.target;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.editor textarea')
    ) {
      return; // Не начинать свайп, если касание произошло на интерактивном элементе
    }

    if (isAnimating) return; // Не начинать свайп во время анимации

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
    touchStartTime.current = Date.now();

    // Очищаем предыдущие позиции
    touchPositions.current = [];
    // Сохраняем начальную позицию
    touchPositions.current.push({
      x: touch.clientX,
      time: Date.now()
    });

    setIsSwiping(true);
    setSwipeOffset(0);

    // Блокируем скролл
    document.body.style.overflow = 'hidden';
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || isAnimating) return;

    // Проверяем, не происходит ли движение на элементе, который должен обрабатывать свои собственные события
    const target = e.target;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.editor textarea')
    ) {
      return; // Не обрабатывать свайп, если движение произошло на интерактивном элементе
    }

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    const dx = currentX - touchStartX.current;
    const dy = currentY - touchStartY.current;

    // Определяем направление свайпа (горизонтальное или вертикальное)
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault(); // Блокируем вертикальный скролл при горизонтальном свайпе

      // Ограничиваем свайп только между соседними секциями
      let newOffset = dx;
      if (currentIndex === 0 && dx > 0) {
        // Если на первой секции и свайп вправо - ограничиваем
        newOffset = Math.min(dx, window.innerWidth * 0.3);
      } else if (currentIndex === sections.length - 1 && dx < 0) {
        // Если на последней секции и свайп влево - ограничиваем
        newOffset = Math.max(dx, -window.innerWidth * 0.3);
      }

      setSwipeOffset(newOffset);

      // Сохраняем позицию для расчета скорости
      touchPositions.current.push({
        x: currentX,
        time: Date.now()
      });

      // Ограничиваем количество сохраненных позиций
      if (touchPositions.current.length > 10) {
        touchPositions.current.shift();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    setIsSwiping(false);

    // Восстанавливаем скролл
    document.body.style.overflow = '';

    const velocity = calculateVelocity();
    const threshold = window.innerWidth * 0.5; // 50% ширины экрана
    const flickThreshold = 0.1; // Порог скорости для "флик" свайпа

    const absOffset = Math.abs(swipeOffset);
    const absVelocity = Math.abs(velocity);

    // Решение о навигации на основе смещения и скорости
    const shouldNavigate = absOffset > threshold || absVelocity > flickThreshold;

    if (shouldNavigate && Math.abs(swipeOffset) > 30) { // Минимальное смещение для навигации
      if (swipeOffset > 0 && currentIndex > 0) {
        // Свайп вправо - переход к предыдущему разделу
        animateToPosition(1); // Положительное значение для свайпа вправо
      } else if (swipeOffset < 0 && currentIndex < sections.length - 1) {
        // Свайп влево - переход к следующему разделу
        animateToPosition(-1); // Отрицательное значение для свайпа влево
      }
    } else {
      // Возвращаемся к текущему разделу
      animateToPosition(0);
    }
  };

  // Очищаем анимацию при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset animation state after animation completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setSwipeDirection(null);
      }, 300); // Match the CSS animation duration (0.3s ease-out)

      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const renderSection = () => {
    const isTransitioning = isSwiping || isAnimating;
    const currentIndex = sections.indexOf(activeSection);

    // Определяем соседние разделы
    const leftSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
    const rightSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

    // Вычисляем смещения для соседних секций
    let currentOffset = 0;
    let leftOffset = -100; // Слева от текущей секции
    let rightOffset = 100;  // Справа от текущей секции

    // Если происходит свайп, вычисляем смещения на основе движения пальца
    if (isSwiping && swipeDirection === 'horizontal') {
      const deltaX = touchCurrentX.current - touchStartX.current;
      const progress = Math.abs(deltaX) / window.innerWidth;

      if (deltaX > 0 && leftSection) { // Свайп вправо - показываем левую секцию
        currentOffset = deltaX;
        leftOffset = deltaX - window.innerWidth;
      } else if (deltaX < 0 && rightSection) { // Свайп влево - показываем правую секцию
        currentOffset = deltaX;
        rightOffset = deltaX + window.innerWidth;
      }
    }

    return (
      <div className="section-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        {/* Левый соседний раздел */}
        {leftSection && (
          <div
            className="section-page"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: `translateX(${leftOffset}%)`,
              zIndex: leftOffset === 0 ? 3 : 0, // Повышаем z-index если секция становится активной
              visibility: leftOffset > -100 && leftOffset < 100 ? 'visible' : 'hidden'
            }}
          >
            {(() => {
              switch (leftSection) {
                case 'today':
                  return <Today
                    isPremium={isPremium}
                    addNotification={addNotification}
                    animationClass=""
                    focusTime={focusTime}
                    isFocusActive={isFocusActive}
                    startFocusTimer={startFocusTimer}
                    stopFocusTimer={stopFocusTimer}
                    formatTime={formatTime}
                  />;
                case 'calendar':
                  return <Calendar isPremium={isPremium} addNotification={addNotification} animationClass="" language={language} />;
                case 'statistics':
                  return <Statistics isPremium={isPremium} addNotification={addNotification} animationClass="" />;
                case 'thoughts':
                  return (
                    <Thoughts
                      notes={notes}
                      setNotes={setNotes}
                      archive={archive}
                      setArchive={setArchive}
                      activeNoteId={activeNoteId}
                      setActiveNoteId={setActiveNoteId}
                      actionsOpen={actionsOpen}
                      setActionsOpen={setActionsOpen}
                      isPremium={isPremium}
                      setToast={setToast}
                      showArchive={showArchive}
                      setShowArchive={setShowArchive}
                      addNotification={addNotification}
                      animationClass=""
                    />
                  );
                case 'settings':
                  return <Settings theme={theme} setTheme={setTheme} isPremium={isPremium} setShowPaywall={setShowPaywall} addNotification={addNotification} animationClass="" />;
                default:
                  return <Today
                    isPremium={isPremium}
                    addNotification={addNotification}
                    animationClass=""
                    focusTime={focusTime}
                    isFocusActive={isFocusActive}
                    startFocusTimer={startFocusTimer}
                    stopFocusTimer={stopFocusTimer}
                    formatTime={formatTime}
                  />;
              }
            })()}
          </div>
        )}

        {/* Правый соседний раздел */}
        {rightSection && (
          <div
            className="section-page"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: `translateX(${rightOffset}%)`,
              zIndex: rightOffset === 0 ? 3 : 0, // Повышаем z-index если секция становится активной
              visibility: rightOffset > -100 && rightOffset < 100 ? 'visible' : 'hidden'
            }}
          >
            {(() => {
              switch (rightSection) {
                case 'today':
                  return <Today
                    isPremium={isPremium}
                    addNotification={addNotification}
                    animationClass=""
                    focusTime={focusTime}
                    isFocusActive={isFocusActive}
                    startFocusTimer={startFocusTimer}
                    stopFocusTimer={stopFocusTimer}
                    formatTime={formatTime}
                  />;
                case 'calendar':
                  return <Calendar isPremium={isPremium} addNotification={addNotification} animationClass="" language={language} />;
                case 'statistics':
                  return <Statistics isPremium={isPremium} addNotification={addNotification} animationClass="" />;
                case 'thoughts':
                  return (
                    <Thoughts
                      notes={notes}
                      setNotes={setNotes}
                      archive={archive}
                      setArchive={setArchive}
                      activeNoteId={activeNoteId}
                      setActiveNoteId={setActiveNoteId}
                      actionsOpen={actionsOpen}
                      setActionsOpen={setActionsOpen}
                      isPremium={isPremium}
                      setToast={setToast}
                      showArchive={showArchive}
                      setShowArchive={setShowArchive}
                      addNotification={addNotification}
                      animationClass=""
                    />
                  );
                case 'settings':
                  return <Settings theme={theme} setTheme={setTheme} isPremium={isPremium} setShowPaywall={setShowPaywall} addNotification={addNotification} animationClass="" />;
                default:
                  return <Today
                    isPremium={isPremium}
                    addNotification={addNotification}
                    animationClass=""
                    focusTime={focusTime}
                    isFocusActive={isFocusActive}
                    startFocusTimer={startFocusTimer}
                    stopFocusTimer={stopFocusTimer}
                    formatTime={formatTime}
                  />;
              }
            })()}
          </div>
        )}

        {/* Текущий раздел */}
        <div
          className="section-active"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translateX(${currentOffset}%)`,
            zIndex: currentOffset === 0 ? 2 : 1,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out' // Плавная анимация возврата
          }}
        >
          {(() => {
            switch (activeSection) {
              case 'today':
                return <Today
                  isPremium={isPremium}
                  addNotification={addNotification}
                  animationClass=""
                  focusTime={focusTime}
                  isFocusActive={isFocusActive}
                  startFocusTimer={startFocusTimer}
                  stopFocusTimer={stopFocusTimer}
                  formatTime={formatTime}
                />;
              case 'calendar':
                return <Calendar isPremium={isPremium} addNotification={addNotification} animationClass="" language={language} />;
              case 'statistics':
                return <Statistics isPremium={isPremium} addNotification={addNotification} animationClass="" />;
              case 'thoughts':
                return (
                  <Thoughts
                    notes={notes}
                    setNotes={setNotes}
                    archive={archive}
                    setArchive={setArchive}
                    activeNoteId={activeNoteId}
                    setActiveNoteId={setActiveNoteId}
                    actionsOpen={actionsOpen}
                    setActionsOpen={setActionsOpen}
                    isPremium={isPremium}
                    setToast={setToast}
                    showArchive={showArchive}
                    setShowArchive={setShowArchive}
                    addNotification={addNotification}
                    animationClass=""
                  />
                );
              case 'settings':
                return <Settings
                  theme={theme}
                  setTheme={setTheme}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  language={language}
                  setLanguage={setLanguage}
                  isPremium={isPremium}
                  setShowPaywall={setShowPaywall}
                  addNotification={addNotification}
                  animationClass=""
                />;
              default:
                return <Today
                  isPremium={isPremium}
                  addNotification={addNotification}
                  animationClass=""
                  focusTime={focusTime}
                  isFocusActive={isFocusActive}
                  startFocusTimer={startFocusTimer}
                  stopFocusTimer={stopFocusTimer}
                  formatTime={formatTime}
                />;
            }
          })()}
        </div>
      </div>
    );
  };


  // Function to handle section change with optional animation
  const handleSectionChange = (section, animate = true) => {
    if (section !== activeSection) {
      if (animate && !isSwiping) {
        // Calculate the direction for the transition
        const currentIndex = sections.indexOf(activeSection);
        const targetIndex = sections.indexOf(section);
        const direction = targetIndex > currentIndex ? -1 : 1; // -1 for moving right, 1 for moving left

        // Set the initial offset for the animation
        setSwipeOffset(direction * window.innerWidth);

        // Animate to the target section
        animateToPosition(direction);
      } else {
        // Without animation (when clicking navigation)
        setActiveSection(section);
      }
    }
  };

  // Функции для управления таймером фокуса
  const startFocusTimer = (duration) => {
    setFocusTime(duration);
    setIsFocusActive(true);
  };

  const stopFocusTimer = () => {
    setIsFocusActive(false);
    setFocusTime(0);
  };

  return (
    <TranslationProvider language={language}>
      <div
        ref={appRef}
        className="app"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Toast message={toast} />
        <Notifications notifications={notifications} removeNotification={removeNotification} />

        {showPaywall && (
          <PremiumPaywall
            onClose={() => setShowPaywall(false)}
            onActivate={() => {
              setIsPremium(true);
              setShowPaywall(false);
              setToast(translations[language]['premiumActivated'] || '🎉 Премиум активирован!');
            }}
          />
        )}

        {renderSection()}

        <BottomNavigation
          activeSection={activeSection}
          setActiveSection={(section) => {
            handleSectionChange(section, false); // Без анимации
          }}
          language={language}
        />
      </div>
    </TranslationProvider>
  );
}

export default App;