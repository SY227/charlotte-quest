const PACK_KEY = "charlotteQuest.learningPack.wordComprehension.v2";
const HISTORY_KEY = "charlotteQuest.history.v1";
const SETTINGS_KEY = "charlotteQuest.settings.v1";

export function loadLearningPack() {
  return readJson(PACK_KEY, null);
}

export function saveLearningPack(pack) {
  localStorage.setItem(PACK_KEY, JSON.stringify(pack));
}

export function loadHistory() {
  const history = readJson(HISTORY_KEY, []);
  return Array.isArray(history) ? history : [];
}

export function addHistoryEntry(entry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}

export function loadSettings() {
  return readJson(SETTINGS_KEY, {
    childName: "Charlotte",
    grade: 3,
    soundEnabled: true
  });
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAllLocalData() {
  localStorage.removeItem(PACK_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
