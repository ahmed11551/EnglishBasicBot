import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialProgress,
  reviewQualityToNumber,
  nextReview,
  getDueCardIds,
} from './spacedRepetition';
import type { CardProgress } from './types';

describe('spacedRepetition', () => {
  const baseTime = 1000000000000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
  });

  describe('createInitialProgress', () => {
    it('returns progress with cardId and moduleId', () => {
      const p = createInitialProgress('card-1', 'mod-a');
      expect(p.cardId).toBe('card-1');
      expect(p.moduleId).toBe('mod-a');
    });

    it('has zero repetitions and interval, default ease', () => {
      const p = createInitialProgress('c', 'm');
      expect(p.repetitions).toBe(0);
      expect(p.interval).toBe(0);
      expect(p.easeFactor).toBe(2.5);
      expect(p.nextReviewAt).toBe(0);
    });
  });

  describe('reviewQualityToNumber', () => {
    it('maps again -> 0', () => expect(reviewQualityToNumber('again')).toBe(0));
    it('maps hard -> 2', () => expect(reviewQualityToNumber('hard')).toBe(2));
    it('maps good -> 4', () => expect(reviewQualityToNumber('good')).toBe(4));
    it('maps easy -> 5', () => expect(reviewQualityToNumber('easy')).toBe(5));
  });

  describe('nextReview', () => {
    it('on fail (quality < 3) resets repetitions and schedules soon', () => {
      const progress: CardProgress = {
        cardId: 'c',
        moduleId: 'm',
        quality: 4,
        repetitions: 2,
        interval: 6,
        easeFactor: 2.5,
        nextReviewAt: baseTime + 1,
      };
      const next = nextReview(progress, 0);
      expect(next.repetitions).toBe(0);
      expect(next.interval).toBe(0);
      expect(next.nextReviewAt).toBe(baseTime + 60 * 1000);
      expect(next.easeFactor).toBeLessThanOrEqual(progress.easeFactor);
    });

    it('on pass (quality >= 3) increases repetitions and interval', () => {
      const progress: CardProgress = {
        cardId: 'c',
        moduleId: 'm',
        quality: 4,
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewAt: 0,
      };
      const next = nextReview(progress, 4);
      expect(next.repetitions).toBe(1);
      expect(next.interval).toBe(1);
      expect(next.nextReviewAt).toBe(baseTime + 24 * 60 * 60 * 1000);
    });

    it('second repetition gives 6-day interval', () => {
      const progress: CardProgress = {
        cardId: 'c',
        moduleId: 'm',
        quality: 4,
        repetitions: 1,
        interval: 1,
        easeFactor: 2.5,
        nextReviewAt: baseTime,
      };
      const next = nextReview(progress, 4);
      expect(next.repetitions).toBe(2);
      expect(next.interval).toBe(6);
    });
  });

  describe('getDueCardIds', () => {
    it('returns all card ids when no progress', () => {
      const progressMap = new Map<string, CardProgress>();
      const cardIds = ['a', 'b', 'c'];
      expect(getDueCardIds(progressMap, cardIds)).toEqual(['a', 'b', 'c']);
    });

    it('returns cards with nextReviewAt in the past or repetitions === 0', () => {
      const endOfToday = new Date(baseTime);
      endOfToday.setHours(23, 59, 59, 999);
      const progressMap = new Map<string, CardProgress>([
        [
          'due',
          {
            cardId: 'due',
            moduleId: 'm',
            quality: 4,
            repetitions: 1,
            interval: 1,
            easeFactor: 2.5,
            nextReviewAt: endOfToday.getTime() - 1,
          },
        ],
        [
          'future',
          {
            cardId: 'future',
            moduleId: 'm',
            quality: 4,
            repetitions: 2,
            interval: 6,
            easeFactor: 2.5,
            nextReviewAt: endOfToday.getTime() + 86400000,
          },
        ],
      ]);
      const cardIds = ['due', 'future', 'new'];
      const due = getDueCardIds(progressMap, cardIds);
      expect(due).toContain('due');
      expect(due).toContain('new');
      expect(due).not.toContain('future');
    });
  });
});
