/**
 * SM-2 Spaced Repetition Algorithm (упрощённая реализация по ТЗ).
 * Quality: 0-2 = incorrect, 3 = hard, 4 = good, 5 = easy.
 */

import type { CardProgress } from './types';

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const QUALITY_MIN_PASS = 3;

export function createInitialProgress(cardId: string, moduleId: string): CardProgress {
  return {
    cardId,
    moduleId,
    quality: 0,
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE,
    nextReviewAt: 0,
  };
}

/** Конвертация UI-оценки в quality 0-5 */
export function reviewQualityToNumber(quality: 'again' | 'hard' | 'good' | 'easy'): number {
  switch (quality) {
    case 'again': return 0;
    case 'hard': return 2;
    case 'good': return 4;
    case 'easy': return 5;
    default: return 3;
  }
}

export function nextReview(progress: CardProgress, quality: number): CardProgress {
  const q = Math.max(0, Math.min(5, quality));
  const next = { ...progress, lastReviewedAt: Date.now() };
  next.wrongCount = (progress.wrongCount ?? 0) + (q < QUALITY_MIN_PASS ? 1 : 0);

  if (q < QUALITY_MIN_PASS) {
    next.quality = q;
    next.repetitions = 0;
    next.interval = 0;
    next.nextReviewAt = Date.now() + 60 * 1000;
    next.easeFactor = Math.max(MIN_EASE, progress.easeFactor - 0.2);
    return next;
  }

  next.repetitions = progress.repetitions + 1;
  let intervalDays = progress.interval;

  if (progress.repetitions === 0) {
    intervalDays = 1;
  } else if (progress.repetitions === 1) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(progress.interval * progress.easeFactor);
  }

  const ef = progress.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  next.easeFactor = Math.max(MIN_EASE, Math.min(ef, 2.5));
  next.interval = intervalDays;
  next.nextReviewAt = Date.now() + intervalDays * 24 * 60 * 60 * 1000;
  next.quality = q;
  return next;
}

/** Карточки, которые нужно повторить сегодня */
export function getDueCardIds(progressMap: Map<string, CardProgress>, cardIds: string[]): string[] {
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);
  const endOfToday = dayEnd.getTime();

  return cardIds.filter((id) => {
    const p = progressMap.get(id);
    if (!p) return true;
    return p.nextReviewAt <= endOfToday || p.repetitions === 0;
  });
}
