export default function NotesIsland({ notes, activeId, onSelect, setShowArchive, addNotification }) {
  return (
    <div className="island">
      <div className="island-title">История мыслей</div>
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
        Архив
      </button>
    </div>
  );
}