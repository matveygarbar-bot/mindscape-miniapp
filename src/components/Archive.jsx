import React from 'react';

export default function Archive({
  archive,
  setArchive,
  notes,
  setNotes,
  isPremium,
  onBack,
  setToast,
}) {
  function restoreNote(noteToRestore) {
    if (notes.length >= 5 && !isPremium) {
      setToast('⛔ Максимум 5 заметок в Free версии');
      return;
    }
    setArchive(archive.filter(note => note.id !== noteToRestore.id));
    setNotes([...notes, { ...noteToRestore, isNew: false }]);
  }

  return (
    <div className="archive-screen">
      <div className="section-header">
        <img src="https://image2url.com/r2/bucket2/images/1767882523704-04e18a2f-2f0d-4a00-976e-b8da71e68fdc.png" alt="App Logo" className="app-logo" />
        <h1>Архив</h1>
        <button onClick={onBack}>Назад</button>
      </div>

      {archive.length === 0 ? (
        <p>Архив пуст.</p>
      ) : (
        archive.map(note => (
          <div key={note.id} className="archive-row">
            <span>{note.title || 'Без названия'}</span>
            <button onClick={() => restoreNote(note)}>Восстановить</button>
          </div>
        ))
      )}
    </div>
  );
}