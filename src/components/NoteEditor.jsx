import { useState, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { canCreateNote } from '../data';

const SYMBOL_MAP = {
  '○': { off: '○', on: '●' },
  '▢': { off: '▢', on: '▣' },
  '•': { off: '•', on: '◉' },
  '✔': { off: '✔', on: '✔️' },
  '→': { off: '→', on: '✓' },
  '☐': { off: '☐', on: '☑' },
  '◦': { off: '◦', on: '●' },
  '□': { off: '□', on: '■' }
};

export default function NoteEditor({
  notes,
  setNotes,
  archive,
  setArchive,
  activeNoteId,
  actionsOpen,
  setActionsOpen,
  isPremium,
  setToast,
  addNotification
}) {
  const { t } = useTranslation();
  const active = notes.find(n => n.id === activeNoteId);

  const [tempTitle, setTempTitle] = useState(() => active?.isNew ? '' : active?.title || '');
  const [showSymbols, setShowSymbols] = useState(false);
  const textareaRef = useRef(null);
  const touchStartX = useRef(0);

  function createNote() {
    if (!canCreateNote(notes, isPremium)) {
      if (addNotification) {
        addNotification(t('notificationError'), t('maxNotesFree'), 'error');
      } else {
        setToast('⛔ ' + t('maxNotesFree'));
      }
      return;
    }

    const note = {
      id: Date.now(),
      title: '',
      text: '',
      isNew: true
    };

    setNotes([...notes, note]);

    if (addNotification) {
      addNotification(t('notificationSuccess'), t('newNoteCreated'), 'success');
    }
  }

  function finalizeTitle() {
    if (!active) return;

    let title = tempTitle.trim();

    if (!title) {
      const firstLine = active.text.trim().split('\n')[0];
      if (firstLine) {
        title = firstLine.split(' ').slice(0, 3).join(' ');
      } else {
        title = t('noTasksYet'); // Using 'noTasksYet' as a placeholder for "Untitled"
      }
    }

    setNotes(notes.map(n =>
      n.id === active.id
        ? { ...n, title, isNew: false }
        : n
    ));
  }

  function updateText(text) {
    setNotes(notes.map(n =>
      n.id === active.id ? { ...n, text } : n
    ));
  }

  function removeNote() {
    setNotes(notes.filter(n => n.id !== active.id));
    setArchive([...archive, active]);
    setActionsOpen(false);
  }

  function insertSymbol(symbol) {
    if (!active || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const text = active.text;

    const cursor = textarea.selectionStart;
    const before = text.slice(0, cursor);

    const lineStart = before.lastIndexOf('\n') + 1;
    const line = text.slice(lineStart).split('\n')[0];

    const trimmed = line.trim();
    const firstChar = trimmed[0];

    let newSymbol = symbol;

    if (SYMBOL_MAP[symbol]) {
      const { off, on } = SYMBOL_MAP[symbol];
      if (firstChar === off) newSymbol = on;
      else if (firstChar === on) newSymbol = off;
    }

    const cleanLine = line.replace(/^[✔○●▢▣•◉→✓☐☑◦□■]\s*/, '');
    const newLine = `${newSymbol} ${cleanLine}`;

    const newText =
      text.slice(0, lineStart) +
      newLine +
      text.slice(lineStart + line.length);

    setNotes(notes.map(n =>
      n.id === active.id ? { ...n, text: newText } : n
    ));

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd =
        lineStart + newLine.length;
      textarea.focus();
    });

    // Скрываем панель символов после вставки
    setShowSymbols(false);
  }

  if (!active) {
    return (
      <button className="new-note-btn" onClick={createNote}>
        {t('newNote')}
      </button>
    );
  }

  return (
    <div
      className="editor"
      onTouchStart={e => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={e => {
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (delta > 60) setActionsOpen(true);   // swipe left
        if (delta < -60) setActionsOpen(false); // swipe right
      }}
    >
      {active.isNew && (
        <div className="title-bar">
          <input
            placeholder={t('enterShortTitle')}
            value={tempTitle}
            onChange={e => setTempTitle(e.target.value)}
          />
          <button onClick={finalizeTitle}>{t('save')}</button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        placeholder={t('startWriting')}
        value={active.text}
        onChange={e => updateText(e.target.value)}
      />

      <div className="symbols-controls">
        <button
          className="symbols-toggle"
          onClick={() => setShowSymbols(!showSymbols)}
        >
          {showSymbols ? t('hideSymbols') : t('showSymbols')}
        </button>

        {showSymbols && (
          <div className="symbols">
            {['✔', '○', '▢', '•', '→', '☐', '◦', '□'].map(s => (
              <button
                key={s}
                onClick={() => insertSymbol(s)}
                title={t('symbolToggle', { symbol: s })}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`actions ${actionsOpen ? 'show' : ''}`}>
        <button
          onClick={() => {
            setTempTitle(active.title);
            setNotes(notes.map(n =>
              n.id === active.id ? { ...n, isNew: true } : n
            ));
          }}
        >
          {t('edit')}
        </button>
        <button onClick={removeNote}>{t('delete')}</button>
      </div>
    </div>
  );
}