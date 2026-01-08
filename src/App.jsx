import { useState, useEffect } from 'react';
import Toast from './components/Toast';
import PremiumPaywall from './components/PremiumPaywall';
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
  const [notes, setNotes] = useState([]);
  const [archive, setArchive] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Инициализируем из localStorage
  const [showPaywall, setShowPaywall] = useState(false);
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('today');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const { initialNotes, initialArchive } = getInitialData();
    setNotes(initialNotes);
    setArchive(initialArchive);

    // Загружаем статус isPremium из localStorage
    const storedPremiumStatus = localStorage.getItem('isPremium');
    if (storedPremiumStatus) {
      setIsPremium(JSON.parse(storedPremiumStatus));
    }

    // Читаем URL-параметр 'version'
    const urlParams = new URLSearchParams(window.location.search);
    const versionParam = urlParams.get('version');
    if (versionParam === 'free') {
      setIsPremium(false);
    } else if (versionParam === 'premium') {
      setIsPremium(true);
    }

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

  const renderSection = () => {
    switch (activeSection) {
      case 'today':
        return <Today isPremium={isPremium} />;
      case 'calendar':
        return <Calendar isPremium={isPremium} />;
      case 'statistics':
        return <Statistics isPremium={isPremium} />;
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
          />
        );
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} isPremium={isPremium} setShowPaywall={setShowPaywall} />;
      default:
        return <Today isPremium={isPremium} />;
    }
  };

  return (
    <div className="app">
      <Toast message={toast} />

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