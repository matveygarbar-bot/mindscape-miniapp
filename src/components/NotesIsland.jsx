import { useTranslation } from '../hooks/useTranslation';

export default function NotesIsland({ notes, activeId, onSelect, setShowArchive, addNotification }) {
  const { t } = useTranslation();

  return (
    <div className="island">
      <div className="island-title">{t('thoughtHistory')}</div>
      {notes.map(note => (
        <div
          key={note.id}
          className={`island-note ${note.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(note.id)}
        >
          {note.title}
        </div>
      ))}
      <button className="archive-button-thoughts" onClick={() => setShowArchive(true)}>
        {t('archive')}
      </button>
    </div>
  );
}