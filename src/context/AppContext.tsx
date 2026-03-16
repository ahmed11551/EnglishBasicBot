import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CardProgress, ModuleStats, ReviewQuality } from '../types';
import { nextReview, reviewQualityToNumber, createInitialProgress, getDueCardIds } from '../spacedRepetition';
import { loadProgress, saveProgress, loadStats, saveStats, loadDailyLog, saveDailyLog, loadLastModuleId, saveLastModuleId, loadDailyGoal, saveDailyGoal, clearAllProgress, loadLanguage, saveLanguage, getThemeFromLanguage, loadSoundEnabled, saveSoundEnabled, type LanguageId, type ThemeId } from '../storage';
import { MODULES } from '../data/modules';


function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getStreak(log: Record<string, number>): number {
  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 366; i++) {
    const k = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`;
    if ((log[k] ?? 0) > 0) streak++;
    else break;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

type TelegramId = string | undefined;

interface AppState {
  progress: Map<string, CardProgress>;
  stats: Map<string, ModuleStats>;
  dailyLog: Record<string, number>;
  telegramId: TelegramId;
  lastModuleId: string | null;
  dailyGoal: number;
  language: LanguageId;
  soundEnabled: boolean;
}

interface AppContextValue extends AppState {
  learnedToday: number;
  streak: number;
  theme: ThemeId;
  /** Модули, отфильтрованные по текущему языку */
  activeModules: typeof MODULES;
  setTelegramId: (id: TelegramId) => void;
  setLastModuleId: (moduleId: string) => void;
  setDailyGoal: (goal: number) => void;
  setLanguage: (lang: LanguageId) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetProgress: () => void;
  recordReview: (cardId: string, moduleId: string, quality: ReviewQuality) => void;
  getProgress: (cardId: string) => CardProgress | undefined;
  getDueForModule: (moduleId: string) => string[];
  getMistakeCardIds: (limit?: number) => { cardId: string; moduleId: string }[];
  refreshFromStorage: () => void;
  getModuleStats: (moduleId: string) => ModuleStats;
  getCalendarDays: (days: number) => { date: string; count: number }[];
  getTodayCardIds: () => { cardId: string; moduleId: string }[];
  getRecentlyLearnedCardIds: (limit?: number) => { cardId: string; moduleId: string }[];
}

const defaultState: AppState = {
  progress: new Map(),
  stats: new Map(),
  dailyLog: {},
  telegramId: undefined,
  lastModuleId: loadLastModuleId() ?? null,
  dailyGoal: loadDailyGoal(),
  language: loadLanguage(),
  soundEnabled: loadSoundEnabled(),
};

const AppContext = createContext<AppContextValue | null>(null);

function getOrDefaultStats(stats: Map<string, ModuleStats>, moduleId: string, totalCount: number): ModuleStats {
  return stats.get(moduleId) ?? { moduleId, learnedCount: 0, totalCount, dueToday: 0, streakDays: 0 };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    ...defaultState,
    progress: loadProgress(),
    stats: loadStats(),
    dailyLog: loadDailyLog(),
    lastModuleId: loadLastModuleId() ?? null,
    dailyGoal: loadDailyGoal(),
    language: loadLanguage(),
    soundEnabled: loadSoundEnabled(),
  }));

  const theme = getThemeFromLanguage(state.language);

  const langForModules = state.language === 'es' ? 'es' : 'en';
  const activeModules = useMemo(
    () => MODULES.filter((m) => (m.language ?? 'en') === langForModules),
    [langForModules]
  );

  const setLanguage = useCallback((lang: LanguageId) => {
    saveLanguage(lang);
    setState((prev) => ({ ...prev, language: lang }));
    const t = getThemeFromLanguage(lang);
    document.documentElement.dataset.theme = t === 'usa' ? '' : t;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'usa' ? '' : theme;
  }, [theme]);

  const refreshFromStorage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      progress: loadProgress(prev.telegramId),
      stats: loadStats(prev.telegramId),
      dailyLog: loadDailyLog(prev.telegramId),
      lastModuleId: loadLastModuleId(prev.telegramId) ?? null,
      dailyGoal: loadDailyGoal(prev.telegramId),
    }));
  }, []);

  const setTelegramId = useCallback((telegramId: TelegramId) => {
    setState((prev) => ({
      ...prev,
      telegramId,
      progress: loadProgress(telegramId),
      stats: loadStats(telegramId),
      dailyLog: loadDailyLog(telegramId),
      lastModuleId: loadLastModuleId(telegramId) ?? null,
      dailyGoal: loadDailyGoal(telegramId),
    }));
  }, []);

  const setLastModuleId = useCallback((moduleId: string) => {
    setState((prev) => {
      saveLastModuleId(moduleId, prev.telegramId);
      return { ...prev, lastModuleId: moduleId };
    });
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    const clamped = Math.max(5, Math.min(30, goal));
    setState((prev) => {
      saveDailyGoal(clamped, prev.telegramId);
      return { ...prev, dailyGoal: clamped };
    });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    saveSoundEnabled(enabled);
    setState((prev) => ({ ...prev, soundEnabled: enabled }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => {
      clearAllProgress(prev.telegramId);
      return {
        ...prev,
        progress: new Map(),
        stats: new Map(),
        dailyLog: {},
        lastModuleId: null,
      };
    });
  }, []);

  const recordReview = useCallback((cardId: string, moduleId: string, quality: ReviewQuality) => {
    const q = reviewQualityToNumber(quality);
    const key = todayKey();
    setState((prev) => {
      const progress = new Map(prev.progress);
      let p = progress.get(cardId);
      if (!p) p = createInitialProgress(cardId, moduleId);
      p = nextReview(p, q);
      progress.set(cardId, p);

      const stats = new Map(prev.stats);
      const mod = MODULES.find((m) => m.id === moduleId);
      const totalCount = mod?.cardIds.length ?? 0;
      const existing = getOrDefaultStats(stats, moduleId, totalCount);
      const learned = Array.from(progress.values()).filter((x) => x.moduleId === moduleId && x.repetitions > 0).length;
      stats.set(moduleId, {
        ...existing,
        lastPracticeAt: Date.now(),
        learnedCount: learned,
        dueToday: getDueCardIds(progress, mod?.cardIds ?? []).length,
      });

      const dailyLog = { ...prev.dailyLog, [key]: (prev.dailyLog[key] ?? 0) + 1 };
      saveProgress(progress, prev.telegramId);
      saveStats(stats, prev.telegramId);
      saveDailyLog(dailyLog, prev.telegramId);
      return { ...prev, progress, stats, dailyLog };
    });
  }, []);

  const getProgress = useCallback(
    (cardId: string) => state.progress.get(cardId),
    [state.progress]
  );

  const getDueForModule = useCallback(
    (moduleId: string) => {
      const mod = MODULES.find((m) => m.id === moduleId);
      if (!mod) return [];
      return getDueCardIds(state.progress, mod.cardIds);
    },
    [state.progress]
  );

  const getModuleStats = useCallback(
    (moduleId: string): ModuleStats => {
      const mod = MODULES.find((m) => m.id === moduleId);
      const totalCount = mod?.cardIds.length ?? 0;
      return getOrDefaultStats(state.stats, moduleId, totalCount);
    },
    [state.stats]
  );

  const learnedToday = state.dailyLog[todayKey()] ?? 0;
  const streak = useMemo(() => getStreak(state.dailyLog), [state.dailyLog]);

  const getCalendarDays = useCallback(
    (days: number): { date: string; count: number }[] => {
      const result: { date: string; count: number }[] = [];
      const d = new Date();
      for (let i = 0; i < days; i++) {
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        result.push({ date: k, count: state.dailyLog[k] ?? 0 });
        d.setDate(d.getDate() - 1);
      }
      return result;
    },
    [state.dailyLog]
  );

  const getTodayCardIds = useCallback((): { cardId: string; moduleId: string }[] => {
    const pool: { cardId: string; moduleId: string }[] = [];
    for (const mod of activeModules) {
      const due = getDueCardIds(state.progress, mod.cardIds);
      due.forEach((cardId) => pool.push({ cardId, moduleId: mod.id }));
    }
    return pool.slice(0, state.dailyGoal);
  }, [state.progress, state.dailyGoal, activeModules]);

  const getRecentlyLearnedCardIds = useCallback((limit = 10): { cardId: string; moduleId: string }[] => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeModuleIds = new Set(activeModules.map((m) => m.id));
    const entries = Array.from(state.progress.values())
      .filter((p) => (p.lastReviewedAt ?? 0) >= weekAgo && activeModuleIds.has(p.moduleId))
      .sort((a, b) => (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0))
      .slice(0, limit)
      .map((p) => ({ cardId: p.cardId, moduleId: p.moduleId }));
    return entries;
  }, [state.progress, activeModules]);

  const getMistakeCardIds = useCallback((limit = 15): { cardId: string; moduleId: string }[] => {
    const activeModuleIds = new Set(activeModules.map((m) => m.id));
    return Array.from(state.progress.values())
      .filter((p) => (p.wrongCount ?? 0) > 0 && activeModuleIds.has(p.moduleId))
      .sort((a, b) => (b.wrongCount ?? 0) - (a.wrongCount ?? 0))
      .slice(0, limit)
      .map((p) => ({ cardId: p.cardId, moduleId: p.moduleId }));
  }, [state.progress, activeModules]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      learnedToday,
      streak,
      theme,
      activeModules,
      setTelegramId,
      setLastModuleId,
      setDailyGoal,
      setLanguage,
      setSoundEnabled,
      resetProgress,
      recordReview,
      getProgress,
      getDueForModule,
      getMistakeCardIds,
      refreshFromStorage,
      getModuleStats,
      getCalendarDays,
      getTodayCardIds,
      getRecentlyLearnedCardIds,
    }),
    [state, learnedToday, streak, theme, activeModules, setTelegramId, setLastModuleId, setDailyGoal, setLanguage, setSoundEnabled, resetProgress, recordReview, getProgress, getDueForModule, getMistakeCardIds, refreshFromStorage, getModuleStats, getCalendarDays, getTodayCardIds, getRecentlyLearnedCardIds]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
