import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { getCardsByIds } from '../data/cards';
import { useApp } from '../context/AppContext';
import { IconSparkle } from '../components/Icons';
import { playCorrect, playWrong, playGoal } from '../utils/sounds';
import type { ReviewQuality } from '../types';
import './Builder.css';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function Builder() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getDueForModule, recordReview, dailyGoal, learnedToday, soundEnabled } = useApp();
  const [queue, setQueue] = useState<{ card: { id: string; term: string; translation: string }; letters: string[] }[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [lastSessionSize, setLastSessionSize] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const prevLearnedRef = useRef(learnedToday);

  useEffect(() => {
    if (soundEnabled && learnedToday === dailyGoal && dailyGoal > 0 && prevLearnedRef.current < dailyGoal) {
      playGoal();
    }
    prevLearnedRef.current = learnedToday;
  }, [learnedToday, dailyGoal, soundEnabled]);

  const module = MODULES.find((m) => m.id === moduleId);
  const dueIds = useMemo(() => getDueForModule(moduleId ?? ''), [moduleId, getDueForModule]);

  const startSession = useCallback(() => {
    const ids = dueIds.length > 0 ? dueIds : module?.cardIds ?? [];
    const cards = getCardsByIds(ids);
    const withLetters = cards.map((card) => {
      const letters = card.term.split('').filter((c) => c !== ' ');
      return { card, letters: shuffle(letters) };
    });
    const shuffled = shuffle(withLetters);
    setLastSessionSize(0);
    setQueue(shuffled);
    setIndex(0);
    setPicked([]);
    setRemaining(shuffled[0]?.letters ?? []);
    setDone(false);
    setShowResult(null);
  }, [dueIds, module]);

  const current = queue[index];
  const isCorrect = current && picked.join('').toLowerCase() === current.card.term.toLowerCase().replace(/\s/g, '');

  const handleLetter = (letter: string, fromPicked: boolean, pickedIndex?: number) => {
    if (!current) return;
    if (fromPicked && pickedIndex !== undefined) {
      setPicked((p) => p.filter((_, i) => i !== pickedIndex));
      setRemaining((r) => [...r, letter]);
    } else if (!fromPicked) {
      setRemaining((r) => {
        const i = r.indexOf(letter);
        if (i === -1) return r;
        const next = [...r];
        next.splice(i, 1);
        return next;
      });
      setPicked((p) => [...p, letter]);
    }
  };

  const handleCheck = () => {
    if (!current || !module) return;
    setShowResult(isCorrect ? 'correct' : 'wrong');
    const quality: ReviewQuality = isCorrect ? 'good' : 'again';
    recordReview(current.card.id, module.id, quality);
    if (soundEnabled) {
      if (isCorrect) playCorrect();
      else playWrong();
    }
  };

  const handleNext = () => {
    setShowResult(null);
    if (index + 1 >= queue.length) {
      setLastSessionSize(queue.length);
      setQueue([]);
      setIndex(0);
      setDone(true);
    } else {
      const next = queue[index + 1];
      setIndex((i) => i + 1);
      setPicked([]);
      setRemaining(next?.letters ?? []);
    }
  };

  if (!module) {
    return (
      <div className="builder">
        <p>Модуль не найден.</p>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  if (queue.length === 0 && !done) {
    return (
      <div className="builder builder-start">
        <p>Конструктор: соберите слово из букв.</p>
        <p className="builder-desc">Будет показан перевод — наберите термин по буквам.</p>
        <button type="button" className="btn btn-primary" onClick={startSession}>Начать</button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="builder builder-done">
        <div className="builder-done-illo" aria-hidden><IconSparkle /></div>
        <p className="builder-done-title">Сессия завершена</p>
        {lastSessionSize > 0 && (
          <p className="builder-done-count">Собрано слов: {lastSessionSize}</p>
        )}
        <div className="builder-done-actions">
          <button type="button" className="btn btn-primary" onClick={startSession}>Повторить</button>
          <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="builder">
      <div className="builder-progress">{index + 1} / {queue.length}</div>
      <p className="builder-translation">{current.card.translation}</p>
      <div className={`builder-answer ${showResult === 'correct' ? 'builder-answer-correct' : ''} ${showResult === 'wrong' ? 'builder-answer-wrong' : ''}`}>
        {picked.map((letter, i) => (
          <button key={`p-${i}-${letter}`} type="button" className="builder-letter builder-letter-picked" onClick={() => !showResult && handleLetter(letter, true, i)} disabled={!!showResult}>
            {letter}
          </button>
        ))}
      </div>
      {!showResult && (
        <div className="builder-letters">
          {remaining.map((letter, i) => (
            <button key={`r-${i}-${letter}`} type="button" className="builder-letter" onClick={() => handleLetter(letter, false)}>
              {letter}
            </button>
          ))}
        </div>
      )}
      {!showResult ? (
        <button type="button" className="btn btn-primary builder-check" onClick={handleCheck} disabled={picked.length === 0}>
          Проверить
        </button>
      ) : (
        <div className="builder-feedback-wrap">
          {showResult === 'correct' && <p className="builder-feedback builder-feedback-correct">Верно!</p>}
          {showResult === 'wrong' && (
            <p className="builder-feedback builder-feedback-wrong">
              Неверно. Правильно: <strong>{current.card.term}</strong>
            </p>
          )}
          <button type="button" className="btn btn-primary builder-check" onClick={handleNext}>
            {index + 1 >= queue.length ? 'Завершить' : 'Далее'}
          </button>
        </div>
      )}
      <Link to={`/module/${moduleId}`} className="builder-back btn btn-ghost">Выйти</Link>
    </div>
  );
}
