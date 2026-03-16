import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadProgress,
  saveProgress,
  loadStats,
  saveStats,
  loadDailyLog,
  saveDailyLog,
  getLastSync,
  setLastSync,
  loadLastModuleId,
  saveLastModuleId,
} from './storage';
import type { CardProgress, ModuleStats } from './types';

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key(i: number) {
      return Object.keys(store)[i] ?? null;
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
  } as Storage;
}

describe('storage', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
  });

  describe('progress', () => {
    it('loadProgress returns empty Map when no data', () => {
      const map = loadProgress();
      expect(map.size).toBe(0);
    });

    it('saveProgress and loadProgress roundtrip', () => {
      const progress = new Map<string, CardProgress>([
        [
          'card-1',
          {
            cardId: 'card-1',
            moduleId: 'mod-a',
            quality: 4,
            repetitions: 1,
            interval: 1,
            easeFactor: 2.5,
            nextReviewAt: 123,
          },
        ],
      ]);
      saveProgress(progress);
      const loaded = loadProgress();
      expect(loaded.size).toBe(1);
      expect(loaded.get('card-1')?.cardId).toBe('card-1');
      expect(loaded.get('card-1')?.nextReviewAt).toBe(123);
    });

    it('uses telegramId in key when provided', () => {
      saveProgress(new Map(), '12345');
      expect(mockStorage.getItem('dv_progress_12345')).not.toBeNull();
    });
  });

  describe('stats', () => {
    it('loadStats returns empty Map when no data', () => {
      expect(loadStats().size).toBe(0);
    });

    it('saveStats and loadStats roundtrip', () => {
      const stats = new Map<string, ModuleStats>([
        [
          'mod-a',
          {
            moduleId: 'mod-a',
            learnedCount: 5,
            totalCount: 10,
            dueToday: 2,
            streakDays: 3,
          },
        ],
      ]);
      saveStats(stats);
      const loaded = loadStats();
      expect(loaded.get('mod-a')?.streakDays).toBe(3);
    });
  });

  describe('daily log', () => {
    it('loadDailyLog returns {} when no data', () => {
      expect(loadDailyLog()).toEqual({});
    });

    it('saveDailyLog and loadDailyLog roundtrip', () => {
      const log = { '2025-03-01': 10, '2025-03-02': 5 };
      saveDailyLog(log);
      expect(loadDailyLog()).toEqual(log);
    });
  });

  describe('last sync', () => {
    it('getLastSync returns null when not set', () => {
      expect(getLastSync()).toBeNull();
    });

    it('setLastSync and getLastSync roundtrip', () => {
      setLastSync();
      const t = getLastSync();
      expect(t).not.toBeNull();
      expect(typeof t).toBe('number');
    });
  });

  describe('last module', () => {
    it('loadLastModuleId returns null when not set', () => {
      expect(loadLastModuleId()).toBeNull();
    });

    it('saveLastModuleId and loadLastModuleId roundtrip', () => {
      saveLastModuleId('diplomatic');
      expect(loadLastModuleId()).toBe('diplomatic');
    });

    it('scopes by telegramId when provided', () => {
      saveLastModuleId('un', 'user-1');
      saveLastModuleId('economics', 'user-2');
      expect(loadLastModuleId('user-1')).toBe('un');
      expect(loadLastModuleId('user-2')).toBe('economics');
    });
  });
});
