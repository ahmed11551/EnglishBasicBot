import type { CardProgress, ModuleStats } from './types';

const STORAGE_KEY_PROGRESS = 'dv_progress';
const STORAGE_KEY_STATS = 'dv_stats';
const STORAGE_KEY_LAST_SYNC = 'dv_last_sync';
const STORAGE_KEY_DAILY = 'dv_daily';
const STORAGE_KEY_LAST_MODULE = 'dv_last_module';
const STORAGE_KEY_DAILY_GOAL = 'dv_daily_goal';

function getStorageKey(prefix: string, telegramId?: string): string {
  if (telegramId) return `${prefix}_${telegramId}`;
  return prefix;
}

export function loadProgress(telegramId?: string): Map<string, CardProgress> {
  try {
    const key = getStorageKey(STORAGE_KEY_PROGRESS, telegramId);
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as CardProgress[];
    return new Map(arr.map((p) => [p.cardId, p]));
  } catch {
    return new Map();
  }
}

export function saveProgress(progress: Map<string, CardProgress>, telegramId?: string): void {
  const key = getStorageKey(STORAGE_KEY_PROGRESS, telegramId);
  const arr = Array.from(progress.values());
  localStorage.setItem(key, JSON.stringify(arr));
}

export function loadStats(telegramId?: string): Map<string, ModuleStats> {
  try {
    const key = getStorageKey(STORAGE_KEY_STATS, telegramId);
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as ModuleStats[];
    return new Map(arr.map((s) => [s.moduleId, s]));
  } catch {
    return new Map();
  }
}

export function saveStats(stats: Map<string, ModuleStats>, telegramId?: string): void {
  const key = getStorageKey(STORAGE_KEY_STATS, telegramId);
  const arr = Array.from(stats.values());
  localStorage.setItem(key, JSON.stringify(arr));
}

export function getLastSync(telegramId?: string): number | null {
  const key = getStorageKey(STORAGE_KEY_LAST_SYNC, telegramId);
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) : null;
}

export function setLastSync(telegramId?: string): void {
  const key = getStorageKey(STORAGE_KEY_LAST_SYNC, telegramId);
  localStorage.setItem(key, String(Date.now()));
}

/** Лог по дням: дата YYYY-MM-DD -> количество оттренированных слов за день */
export function loadDailyLog(telegramId?: string): Record<string, number> {
  try {
    const key = getStorageKey(STORAGE_KEY_DAILY, telegramId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDailyLog(log: Record<string, number>, telegramId?: string): void {
  const key = getStorageKey(STORAGE_KEY_DAILY, telegramId);
  localStorage.setItem(key, JSON.stringify(log));
}

/** Последний открытый модуль (для «Продолжить» как в WRD / 10 Minute English) */
export function loadLastModuleId(telegramId?: string): string | null {
  const key = getStorageKey(STORAGE_KEY_LAST_MODULE, telegramId);
  return localStorage.getItem(key);
}

export function saveLastModuleId(moduleId: string, telegramId?: string): void {
  const key = getStorageKey(STORAGE_KEY_LAST_MODULE, telegramId);
  localStorage.setItem(key, moduleId);
}

const DEFAULT_DAILY_GOAL = 10;

/** Цель слов в день (настройки) */
export function loadDailyGoal(telegramId?: string): number {
  try {
    const key = getStorageKey(STORAGE_KEY_DAILY_GOAL, telegramId);
    const raw = localStorage.getItem(key);
    if (raw == null) return DEFAULT_DAILY_GOAL;
    const n = parseInt(raw, 10);
    return n >= 5 && n <= 30 ? n : DEFAULT_DAILY_GOAL;
  } catch {
    return DEFAULT_DAILY_GOAL;
  }
}

export function saveDailyGoal(goal: number, telegramId?: string): void {
  const key = getStorageKey(STORAGE_KEY_DAILY_GOAL, telegramId);
  localStorage.setItem(key, String(Math.max(5, Math.min(30, goal))));
}

/** Сброс всего прогресса (для настроек) */
export function clearAllProgress(telegramId?: string): void {
  localStorage.removeItem(getStorageKey(STORAGE_KEY_PROGRESS, telegramId));
  localStorage.removeItem(getStorageKey(STORAGE_KEY_STATS, telegramId));
  localStorage.removeItem(getStorageKey(STORAGE_KEY_DAILY, telegramId));
  localStorage.removeItem(getStorageKey(STORAGE_KEY_LAST_MODULE, telegramId));
}

export type LanguageId = 'ru' | 'en' | 'es';
const STORAGE_KEY_LANGUAGE = 'dv_language';

export function loadLanguage(): LanguageId {
  try {
    const t = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (t === 'en' || t === 'es') return t;
    return 'ru';
  } catch {
    return 'ru';
  }
}

export function saveLanguage(lang: LanguageId): void {
  localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
}

/** Тема выводится из языка: испанский → España, иначе → USA */
export type ThemeId = 'usa' | 'es';
export function getThemeFromLanguage(lang: LanguageId): ThemeId {
  return lang === 'es' ? 'es' : 'usa';
}

const STORAGE_KEY_SOUND = 'dv_sound';

export function loadSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY_SOUND);
    if (v === '0' || v === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY_SOUND, enabled ? '1' : '0');
}
