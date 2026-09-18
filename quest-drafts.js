// Device-local drafts are scoped by student and quest; no session token is stored.
export function createQuestDraftStore(getStorage = () => localStorage) {
  const memory = new Map();
  const keyFor = (student, quest) => student == null || student === '' || quest == null ? null :
    `classRpgQuestDraft:v1:${encodeURIComponent(student)}:${encodeURIComponent(quest)}`;
  function read(key) {
    if (!key) return null;
    if (memory.has(key)) return memory.get(key);
    try {
      const value = JSON.parse(getStorage().getItem(key) || 'null');
      if (!value || typeof value.text !== 'string' || typeof value.image !== 'string') return null;
      memory.set(key, value);
      return value;
    } catch { return null; }
  }
  function save(key, text, image) {
    if (!key) return false;
    const value = { text, image, savedAt: Date.now() };
    memory.set(key, value);
    try { getStorage().setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
  function clear(key) {
    if (!key) return;
    memory.delete(key);
    try { getStorage().removeItem(key); } catch { /* Storage may be disabled. */ }
  }
  return { keyFor, read, save, clear };
}
