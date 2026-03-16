import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { getCardsByIds } from '../data/cards';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { IconCelebrate } from '../components/Icons';
import { playCorrect, playWrong, playGoal } from '../utils/sounds';
import type { Card } from '../types';
import type { ReviewQuality } from '../types';
import './Trainer.css';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type OverrideItem = { cardId: string; moduleId: string };

export function Trainer() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const overrideCardIds = (location.state as { overrideCardIds?: OverrideItem[] } | undefined)?.overrideCardIds;
  const { getDueForModule, recordReview, dailyGoal, learnedToday, soundEnabled } = useApp();
  const { tr } = useI18n();
  const [step, setStep] = useState<'question' | 'result'>('question');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [lastSessionSize, setLastSessionSize] = useState(0);
  const prevLearnedRef = useRef(learnedToday);

  const module = MODULES.find((m) => m.id === moduleId);
  const dueIds = useMemo(() => {
    if (overrideCardIds?.length) return overrideCardIds.map((c) => c.cardId);
    return getDueForModule(moduleId ?? '');
  }, [overrideCardIds, moduleId, getDueForModule]);
  const cardToModule = useMemo(() => {
    if (overrideCardIds?.length) return new Map(overrideCardIds.map((c) => [c.cardId, c.moduleId]));
    return null;
  }, [overrideCardIds]);
  const allCards = useMemo(() => {
    if (overrideCardIds?.length) return getCardsByIds(overrideCardIds.map((c) => c.cardId));
    return module ? getCardsByIds(module.cardIds) : [];
  }, [module, overrideCardIds]);

  const currentCard = queue[queueIndex];
  const options = useMemo(() => {
    if (!currentCard) return [];
    const others = allCards.filter((c) => c.id !== currentCard.id);
    const pick = shuffle(others).slice(0, 3);
    return shuffle([currentCard, ...pick]);
  }, [currentCard, allCards]);

  const startSession = useCallback(() => {
    const ids = dueIds.length > 0 ? dueIds : (module?.cardIds ?? []);
    const cards = getCardsByIds(ids);
    if (cards.length === 0) return;
    setLastSessionSize(0);
    setQueue(shuffle(cards));
    setQueueIndex(0);
    setStep('question');
    setSelectedId(null);
  }, [dueIds, module]);

  useEffect(() => {
    if (soundEnabled && learnedToday === dailyGoal && dailyGoal > 0 && prevLearnedRef.current < dailyGoal) {
      playGoal();
    }
    prevLearnedRef.current = learnedToday;
  }, [learnedToday, dailyGoal, soundEnabled]);

  if (!module && !overrideCardIds?.length) {
    return (
      <div className="trainer">
        <p>{tr('Модуль не найден.', 'Module not found.')}</p>
        <Link to="/">{tr('На главную', 'Back to home')}</Link>
      </div>
    );
  }

  if (queue.length === 0 && lastSessionSize > 0) {
    return (
      <div className="trainer trainer-done">
        <div className="trainer-done-illo" aria-hidden><IconCelebrate /></div>
        <p className="trainer-done-title">{tr('Сессия завершена', 'Session finished')}</p>
        <p className="trainer-done-count">
          {tr('Повторено слов:', 'Reviewed words:')} {lastSessionSize}
        </p>
        <div className="trainer-done-actions">
          <button type="button" className="btn btn-primary" onClick={startSession}>
            {tr('Повторить', 'Repeat')}
          </button>
          {overrideCardIds?.length ? (
            <Link to="/" className="btn btn-ghost">
              {tr('На главную', 'Back to home')}
            </Link>
          ) : (
            <Link to={`/module/${moduleId}`} className="btn btn-ghost">
              {tr('К модулю', 'To module')}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (queue.length === 0 && queueIndex === 0) {
    const canStart = (overrideCardIds?.length ?? 0) > 0 || (module && (dueIds.length > 0 || (module.cardIds?.length ?? 0) > 0));
    return (
      <div className="trainer trainer-start">
        <p>{tr('Тренажёр: выбор перевода.', 'Trainer: choose the translation.')}</p>
        <p className="trainer-desc">
          {overrideCardIds?.length
            ? tr(
                `Будут показаны слова, в которых вы чаще ошибаетесь (${overrideCardIds.length}). Выберите правильный перевод.`,
                `You will see words you often get wrong (${overrideCardIds.length}). Choose the correct translation.`,
              )
            : module
              ? tr(
                  `Будут показаны слова из модуля «${module.titleRu}». Выберите правильный перевод.`,
                  `You will see words from module "${module.title}". Choose the correct translation.`,
                )
              : tr(
                  'Выберите правильный перевод из предложенных вариантов.',
                  'Choose the correct translation from the options.',
                )}
        </p>
        {canStart ? (
          <button type="button" className="btn btn-primary" onClick={startSession}>
            {tr('Начать', 'Start')}
          </button>
        ) : (
          <p className="trainer-no-cards">
            {tr(
              'В этом модуле пока нет карточек для тренировки. Попробуйте флэш-карты или другой модуль.',
              'There are no cards to train in this module yet. Try flashcards or another module.',
            )}
          </p>
        )}
        {overrideCardIds?.length ? (
          <Link to="/" className="btn btn-ghost">
            {tr('На главную', 'Back to home')}
          </Link>
        ) : (
          <Link to={moduleId ? `/module/${moduleId}` : '/'} className="btn btn-ghost">
            {module ? tr('К модулю', 'To module') : tr('На главную', 'Back to home')}
          </Link>
        )}
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="trainer trainer-done">
        <div className="trainer-done-illo" aria-hidden><IconCelebrate /></div>
        <p className="trainer-done-title">{tr('Сессия завершена', 'Session finished')}</p>
        {lastSessionSize > 0 && (
          <p className="trainer-done-count">
            {tr('Повторено слов:', 'Reviewed words:')} {lastSessionSize}
          </p>
        )}
        <div className="trainer-done-actions">
          <button type="button" className="btn btn-primary" onClick={startSession}>
            {tr('Повторить', 'Repeat')}
          </button>
          {overrideCardIds?.length ? (
            <Link to="/" className="btn btn-ghost">
              {tr('На главную', 'Back to home')}
            </Link>
          ) : (
            <Link to={`/module/${moduleId}`} className="btn btn-ghost">
              {tr('К модулю', 'To module')}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const correct = selectedId === currentCard.id;
  const showResult = step === 'result';

  const handleOption = (card: Card) => {
    if (showResult) return;
    setSelectedId(card.id);
    setStep('result');
    const quality: ReviewQuality = card.id === currentCard.id ? 'good' : 'again';
    const effectiveModuleId = cardToModule?.get(currentCard.id) ?? module?.id ?? '';
    recordReview(currentCard.id, effectiveModuleId, quality);
    if (soundEnabled) {
      if (card.id === currentCard.id) playCorrect();
      else playWrong();
    }
  };

  const handleNext = () => {
    if (queueIndex + 1 >= queue.length) {
      setLastSessionSize(queue.length);
      setQueue([]);
      setQueueIndex(0);
    } else {
      setQueueIndex((i) => i + 1);
      setStep('question');
      setSelectedId(null);
    }
  };

  return (
    <div className="trainer">
      <div className="trainer-progress">
        {queueIndex + 1} / {queue.length}
      </div>
      <div className="trainer-prompt">
        <span className="trainer-term">{currentCard.term}</span>
        <span className="trainer-transcription">{currentCard.transcription}</span>
      </div>
      <p className="trainer-instruction">
        {tr('Выберите правильный перевод:', 'Choose the correct translation:')}
      </p>
      <div className="trainer-options">
        {options.map((card) => {
          const isSelected = selectedId === card.id;
          const isCorrect = card.id === currentCard.id;
          let stateClass = '';
          if (showResult) {
            if (isCorrect) stateClass = 'correct';
            else if (isSelected && !isCorrect) stateClass = 'wrong';
          }
          return (
            <button
              key={card.id}
              type="button"
              className={`trainer-option ${stateClass}`}
              onClick={() => handleOption(card)}
              disabled={showResult}
            >
              {card.translation}
            </button>
          );
        })}
      </div>
      {showResult && (
        <div className="trainer-feedback">
          {correct ? (
            <span className="trainer-feedback-ok">{tr('Верно!', 'Correct!')}</span>
          ) : (
            <div className="trainer-feedback-fail-wrap">
              <span className="trainer-feedback-fail-label">{tr('Правильный ответ:', 'Correct answer:')}</span>
              <p className="trainer-feedback-fail" aria-live="polite">
                <strong>{currentCard.term}</strong> — {currentCard.translation}
              </p>
            </div>
          )}
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {queueIndex + 1 >= queue.length ? 'Завершить' : 'Далее'}
          </button>
        </div>
      )}
      {overrideCardIds?.length ? (
        <Link to="/" className="trainer-back btn btn-ghost">Выйти</Link>
      ) : (
        <Link to={`/module/${moduleId}`} className="trainer-back btn btn-ghost">Выйти</Link>
      )}
    </div>
  );
}
