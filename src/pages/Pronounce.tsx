import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { getCardsByIds } from '../data/cards';
import { useApp } from '../context/AppContext';
import { playTerm, unlockAudio } from '../utils/audio';
import { recognizeSpeech, isMatch, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { IconSpeaker, IconMic } from '../components/Icons';
import './Pronounce.css';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function Pronounce() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getDueForModule, recordReview } = useApp();
  const [queue, setQueue] = useState<ReturnType<typeof getCardsByIds>>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'result'>('idle');
  const [result, setResult] = useState<{ correct: boolean; spoken: string } | null>(null);
  const [lastSessionSize, setLastSessionSize] = useState(0);

  const module = MODULES.find((m) => m.id === moduleId);
  const dueIds = useMemo(() => getDueForModule(moduleId ?? ''), [moduleId, getDueForModule]);

  const currentCard = queue[index];
  const supported = isSpeechRecognitionSupported();

  const startSession = useCallback(() => {
    unlockAudio();
    const ids = dueIds.length > 0 ? dueIds : module?.cardIds ?? [];
    const cards = getCardsByIds(ids);
    setLastSessionSize(0);
    setQueue(shuffle(cards));
    setIndex(0);
    setStatus('idle');
    setResult(null);
  }, [dueIds, module]);

  const handleListen = useCallback(() => {
    if (!currentCard) return;
    setStatus('idle');
    setResult(null);
    playTerm(currentCard.term, currentCard.audioUrl).catch(() => {});
  }, [currentCard]);

  const handleRecord = useCallback(async () => {
    if (!currentCard || !module) return;
    setStatus('listening');
    setResult(null);
    try {
      const spoken = await recognizeSpeech('en-GB');
      const correct = isMatch(spoken, currentCard.term);
      setResult({ correct, spoken });
      setStatus('result');
      recordReview(currentCard.id, module.id, correct ? 'good' : 'again');
    } catch (e) {
      setResult({ correct: false, spoken: '' });
      setStatus('result');
      recordReview(currentCard.id, module.id, 'again');
    }
  }, [currentCard, module, recordReview]);

  const handleNext = useCallback(() => {
    if (index + 1 >= queue.length) {
      setLastSessionSize(queue.length);
      setQueue([]);
      setIndex(0);
      setStatus('idle');
      setResult(null);
    } else {
      setIndex((i) => i + 1);
      setStatus('idle');
      setResult(null);
    }
  }, [index, queue.length]);

  if (!module) {
    return (
      <div className="pronounce">
        <p>Модуль не найден.</p>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="pronounce pronounce-unsupported">
        <p>Распознавание речи недоступно в этом браузере.</p>
        <p className="pronounce-hint">Используйте Chrome или Safari на поддерживаемом устройстве.</p>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
      </div>
    );
  }

  if (queue.length === 0 && index === 0 && lastSessionSize > 0) {
    return (
      <div className="pronounce pronounce-done">
        <p>Сессия завершена! Вы произнесли {lastSessionSize} слов.</p>
        <button type="button" className="btn btn-primary" onClick={startSession}>Повторить</button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
      </div>
    );
  }

  if (queue.length === 0 && index === 0) {
    return (
      <div className="pronounce pronounce-start">
        <p>Произношение: прочитайте термин вслух.</p>
        <p className="pronounce-desc">Озвучьте термин — приложение проверит произношение.</p>
        <button type="button" className="btn btn-primary" onClick={startSession}>Начать</button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">К модулю</Link>
      </div>
    );
  }

  return (
    <div className="pronounce">
      <div className="pronounce-progress">{index + 1} / {queue.length}</div>
      <p className="pronounce-term">{currentCard.term}</p>
      {currentCard.transcription && <p className="pronounce-transcription">{currentCard.transcription}</p>}
      <button type="button" className="btn btn-secondary pronounce-listen" onClick={handleListen}>
        <><IconSpeaker /> Прослушать образец</>
      </button>
      {status !== 'listening' && status !== 'result' && (
        <button type="button" className="pronounce-mic-btn" onClick={handleRecord} aria-label="Записать">
          <><IconMic /> Произнесите термин</>
        </button>
      )}
      {status === 'listening' && <p className="pronounce-status">Говорите...</p>}
      {status === 'result' && result && (
        <div className="pronounce-feedback">
          {result.correct ? (
            <p className="pronounce-ok">Верно!</p>
          ) : (
            <p className="pronounce-fail">Ожидалось: {currentCard.term}{result.spoken ? ` · Вы сказали: ${result.spoken}` : ''}</p>
          )}
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {index + 1 >= queue.length ? 'Завершить' : 'Далее'}
          </button>
        </div>
      )}
      <Link to={`/module/${moduleId}`} className="pronounce-back btn btn-ghost">Выйти</Link>
    </div>
  );
}
