import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { getCardsByIds } from '../data/cards';
import { useApp } from '../context/AppContext';
import { playTerm, unlockAudio } from '../utils/audio';
import { IconSpeaker, IconSpinner } from '../components/Icons';
import type { Card } from '../types';
import type { ReviewQuality } from '../types';
import './Listen.css';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function Listen() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getDueForModule, recordReview } = useApp();
  const [step, setStep] = useState<'question' | 'result'>('question');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lastSessionSize, setLastSessionSize] = useState(0);

  const module = MODULES.find((m) => m.id === moduleId);
  const dueIds = useMemo(() => getDueForModule(moduleId ?? ''), [moduleId, getDueForModule]);
  const allCards = useMemo(() => (module ? getCardsByIds(module.cardIds) : []), [module]);

  const currentCard = queue[queueIndex];
  const options = useMemo(() => {
    if (!currentCard) return [];
    const others = allCards.filter((c) => c.id !== currentCard.id);
    const pick = shuffle(others).slice(0, 3);
    return shuffle([currentCard, ...pick]);
  }, [currentCard, allCards]);

  const startSession = useCallback(() => {
    unlockAudio();
    const ids = dueIds.length > 0 ? dueIds : module?.cardIds ?? [];
    const cards = getCardsByIds(ids);
    const shuffled = shuffle(cards);
    setLastSessionSize(0);
    setQueue(shuffled);
    setQueueIndex(0);
    setStep('question');
    setSelectedId(null);
  }, [dueIds, module]);

  const handlePlay = useCallback(() => {
    if (!currentCard) return;
    setPlaying(true);
    playTerm(currentCard.term, currentCard.audioUrl).finally(() => setPlaying(false));
  }, [currentCard]);

  if (!module) {
    return (
      <div className="listen">
        <p>Модуль не найден.</p>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  if (queue.length === 0 && queueIndex === 0 && lastSessionSize > 0) {
    return (
      <div className="listen listen-done">
        <p>Сессия завершена! Вы прослушали {lastSessionSize} слов.</p>
        <button type="button" className="btn btn-primary" onClick={startSession}>Повторить</button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
      </div>
    );
  }

  if (queue.length === 0 && queueIndex === 0) {
    return (
      <div className="listen listen-start">
        <p>Аудирование: прослушайте термин и выберите перевод.</p>
        <p className="listen-desc">Термин будет озвучен — выберите правильный вариант ответа.</p>
        <p className="listen-mobile-hint">На мобильном: нажмите «Воспроизвести» — звук включится после первого нажатия.</p>
        <button type="button" className="btn btn-primary" onClick={startSession}>Начать</button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
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
    recordReview(currentCard.id, module.id, quality);
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
    <div className="listen">
      <div className="listen-progress">{queueIndex + 1} / {queue.length}</div>
      <p className="listen-instruction">Прослушайте термин и выберите перевод:</p>
      <button
        type="button"
        className="listen-play-btn"
        onClick={handlePlay}
        disabled={playing}
        aria-label="Прослушать"
      >
        {playing ? <><IconSpinner /> Звучит...</> : <><IconSpeaker /> Воспроизвести</>}
      </button>
      <div className="listen-options">
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
              className={`listen-option ${stateClass}`}
              onClick={() => handleOption(card)}
              disabled={showResult}
            >
              {card.translation}
            </button>
          );
        })}
      </div>
      {showResult && (
        <div className="listen-feedback">
          {correct ? <span className="listen-feedback-ok">Верно!</span> : <span className="listen-feedback-fail">Правильно: {currentCard.translation}</span>}
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {queueIndex + 1 >= queue.length ? 'Завершить' : 'Далее'}
          </button>
        </div>
      )}
      <Link to={`/module/${moduleId}`} className="listen-back btn btn-ghost">Выйти</Link>
    </div>
  );
}
