import { useState, useEffect } from 'react';
import Toast from './components/Toast';
import PremiumPaywall from './components/PremiumPaywall';
import Notifications from './components/Notifications';
import { getInitialData } from './data';
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
  const [notifications, setNotifications] = useState([]);

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

    // Попытка включить полноэкранный режим при загрузке
    setTimeout(requestFullscreen, 100);
    enableFullscreenStyles();

    // Добавляем слушатель события для повторной попытки при взаимодействии пользователя
    const handleClick = () => requestFullscreen();
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        requestFullscreen();
      }
    };

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

  // Сохраняем статус isPremium в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('isPremium', JSON.stringify(isPremium));
  }, [isPremium]);

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

  // Функция для удаления уведомления
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'today':
        return <Today isPremium={isPremium} addNotification={addNotification} />;
      case 'calendar':
        return <Calendar isPremium={isPremium} addNotification={addNotification} />;
      case 'statistics':
        return <Statistics isPremium={isPremium} addNotification={addNotification} />;
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
          />
        );
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} isPremium={isPremium} setShowPaywall={setShowPaywall} addNotification={addNotification} />;
      default:
        return <Today isPremium={isPremium} addNotification={addNotification} />;
    }
  };

  return (
    <div className="app">
      <Toast message={toast} />
      <Notifications notifications={notifications} removeNotification={removeNotification} />

      {showPaywall && (
        <PremiumPaywall
          onClose={() => setShowPaywall(false)}
          onActivate={() => {
            setIsPremium(true);
            setShowPaywall(false);
            setToast('🎉 Премиум активирован!');
          }}
        />
      )}

      {renderSection()}

      <BottomNavigation activeSection={activeSection} setActiveSection={setActiveSection} />
    </div>
  );
}

export default App;