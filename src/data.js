const FREE_LIMIT = 5;

export function getInitialData() {
  // Здесь можно загружать данные из localStorage или другого источника
  return {
    initialNotes: [],
    initialArchive: []
  };
}

export function canCreateNote(notes, isPremium) {
  if (isPremium) return true;
  return notes.length < FREE_LIMIT;
}