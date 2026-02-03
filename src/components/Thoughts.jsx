import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import NotesIsland from './NotesIsland';
import NoteEditor from './NoteEditor';
import Archive from './Archive';

function Thoughts({
  notes,
  setNotes,
  archive,
  setArchive,
  activeNoteId,
  setActiveNoteId,
  actionsOpen,
  setActionsOpen,
  isPremium,
  setToast,
  showArchive,
  setShowArchive,
  addNotification,
  animationClass
}) {
  const { t } = useTranslation();

  return (
    <div className={`section-with-sticky-header ${animationClass || ''}`} style={{height: 'calc(100vh - 64px - 68px)'}}>
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>{t('thoughts')}</h1>
        <span className={`premium-status ${isPremium ? 'premium' : 'free'}`}>
          {isPremium ? t('premium') : t('free')}
        </span>
      </div>
      <div className="section-content thoughts-layout"> {/* Добавил thoughts-layout для Flexbox */}

      {showArchive ? (
        <Archive
          archive={archive}
          setArchive={setArchive}
          notes={notes}
          setNotes={setNotes}
          isPremium={isPremium}
          onBack={() => setShowArchive(false)}
          setToast={setToast}
          addNotification={addNotification}
        />
      ) : (
        <>
          <NotesIsland
            notes={notes}
            activeId={activeNoteId}
            onSelect={id => {
              setActiveNoteId(id);
              setActionsOpen(false);
            }}
            setShowArchive={setShowArchive} // Передаем функцию для открытия архива
            addNotification={addNotification}
          />
          <NoteEditor
            notes={notes}
            setNotes={setNotes}
            archive={archive}
            setArchive={setArchive}
            activeNoteId={activeNoteId}
            actionsOpen={actionsOpen}
            setActionsOpen={setActionsOpen}
            isPremium={isPremium}
            setToast={setToast}
            addNotification={addNotification}
          />
        </>
      )}
    </div>
  </div>
  );
}

export default Thoughts;