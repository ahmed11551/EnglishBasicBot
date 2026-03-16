import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { getCardsByIds } from '../data/cards';
import { useApp } from '../context/AppContext';
import { playTerm, unlockAudio } from '../utils/audio';
import { recognizeSpeech, isMatch, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { IconSpeaker, IconMic } from '../components/Icons';
import { useI18n } from '../i18n';
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
  const { tr } = useI18n();
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
        <p>{tr('Модуль не найден.', 'Module not found.')}</p>
        <Link to="/">{tr('На главную', 'Back to home')}</Link>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="pronounce pronounce-unsupported">
        <p>{tr('Распознавание речи недоступно в этом браузере.', 'Speech recognition is not available in this browser.')}</p>
        <p className="pronounce-hint">
          {tr('Используйте Chrome или Safari на поддерживаемом устройстве.', 'Use Chrome or Safari on a supported device.')}
        </p>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">
          {tr('К модулю', 'To module')}
        </Link>
      </div>
    );
  }

  if (queue.length === 0 && index === 0 && lastSessionSize > 0) {
    return (
      <div className="pronounce pronounce-done">
        <p>
          {tr('Сессия завершена! Вы произнесли', 'Session finished! You pronounced')} {lastSessionSize}{' '}
          {tr('слов.', 'words.')}
        </p>
        <button type="button" className="btn btn-primary" onClick={startSession}>
          {tr('Повторить', 'Repeat')}
        </button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">
          {tr('К модулю', 'To module')}
        </Link>
      </div>
    );
  }

  if (queue.length === 0 && index === 0) {
    return (
      <div className="pronounce pronounce-start">
        <p>{tr('Произношение: прочитайте термин вслух.', 'Pronunciation: read the term aloud.')}</p>
        <p className="pronounce-desc">
          {tr('Озвучьте термин — приложение проверит произношение.', 'Say the term — the app will check your pronunciation.')}
        </p>
        <button type="button" className="btn btn-primary" onClick={startSession}>
          {tr('Начать', 'Start')}
        </button>
        <Link to={`/module/${moduleId}`} className="btn btn-ghost">
          {tr('К модулю', 'To module')}
        </Link>
      </div>
    );
  }

  return (
    <div className="pronounce">
      <div className="pronounce-progress">{index + 1} / {queue.length}</div>
      <p className="pronounce-term">{currentCard.term}</p>
      {currentCard.transcription && <p className="pronounce-transcription">{currentCard.transcription}</p>}
      <button type="button" className="btn btn-secondary pronounce-listen" onClick={handleListen}>
        <>
          <IconSpeaker /> {tr('Прослушать образец', 'Listen to sample')}
        </>
      </button>
      {status !== 'listening' && status !== 'result' && (
        <button type="button" className="pronounce-mic-btn" onClick={handleRecord} aria-label="Записать">
          <>
            <IconMic /> {tr('Произнесите термин', 'Say the term')}
          </>
        </button>
      )}
      {status === 'listening' && <p className="pronounce-status">{tr('Говорите...', 'Speak...')}</p>}
      {status === 'result' && result && (
        <div className="pronounce-feedback">
          {result.correct ? (
            <p className="pronounce-ok">{tr('Верно!', 'Correct!')}</p>
          ) : (
            <p className="pronounce-fail">
              {tr('Ожидалось:', 'Expected:')} {currentCard.term}
              {result.spoken ? ` · ${tr('Вы сказали:', 'You said:')} ${result.spoken}` : ''}
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {index + 1 >= queue.length ? tr('Завершить', 'Finish') : tr('Далее', 'Next')}
          </button>
        </div>
      )}
      <Link to={`/module/${moduleId}`} className="pronounce-back btn btn-ghost">
        {tr('Выйти', 'Exit')}
      </Link>
    </div>
  );
}
