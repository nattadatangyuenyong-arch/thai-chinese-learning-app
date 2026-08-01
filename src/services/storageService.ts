import { VocabularyDeck, AppSettings } from "../types";

const DECKS_KEY = "cizhi.decks.v1";

function decksKey(scope: string = "guest") {
  return `${DECKS_KEY}.${scope}`;
}
const SETTINGS_KEY = "cizhi.settings.v1";
const RECENT_DECKS_KEY = "cizhi.recentDecks.v1";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  dailyGoal: 20,
  pinyinVisible: true,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storageService = {
  loadDecks(scope: string = "guest"): VocabularyDeck[] {
    const scoped = safeParse<VocabularyDeck[]>(localStorage.getItem(decksKey(scope)), []);
    if (scoped.length || scope !== "guest") return scoped;
    // Migrate decks saved by older versions into guest storage.
    const legacy = safeParse<VocabularyDeck[]>(localStorage.getItem(DECKS_KEY), []);
    if (legacy.length) {
      localStorage.setItem(decksKey("guest"), JSON.stringify(legacy));
      localStorage.removeItem(DECKS_KEY);
    }
    return legacy;
  },

  saveDecks(decks: VocabularyDeck[], scope: string = "guest"): void {
    localStorage.setItem(decksKey(scope), JSON.stringify(decks));
  },

  loadSettings(): AppSettings {
    return safeParse<AppSettings>(localStorage.getItem(SETTINGS_KEY), DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  loadRecentDeckIds(): string[] {
    return safeParse<string[]>(localStorage.getItem(RECENT_DECKS_KEY), []);
  },

  pushRecentDeckId(deckId: string): void {
    const existing = storageService.loadRecentDeckIds().filter((id) => id !== deckId);
    existing.unshift(deckId);
    localStorage.setItem(RECENT_DECKS_KEY, JSON.stringify(existing.slice(0, 5)));
  },
};
