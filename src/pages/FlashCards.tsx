import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { getCardsByIds } from '../data/cards';
import { playTerm } from '../utils/audio';
import { IconSpeaker } from '../components/Icons';
import './FlashCards.css';

export function FlashCards() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const module = MODULES.find((m) => m.id === moduleId);
  const cards = useMemo(() => {
    if (!module) return [];
    return getCardsByIds(module.cardIds);
  }, [module]);

  if (!module || cards.length === 0) {
    return (
      <div className="flash-cards">
        <p>Нет карточек в этом модуле.</p>
        <Link to={`/module/${moduleId}`}>Назад</Link>
      </div>
    );
  }

  const card = cards[index];
  const isLast = index >= cards.length - 1;
  const isFirst = index <= 0;

  return (
    <div className="flash-cards">
      <div className="flash-progress">
        <span>{index + 1} / {cards.length}</span>
        <div className="flash-progress-bar" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={cards.length}>
          <div className="flash-progress-fill" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
        </div>
      </div>
      <button
        type="button"
        className="flash-card"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Показать термин' : 'Показать перевод'}
      >
        <div className={`flash-card-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flash-card-front">
            <span className="flash-term">{card.term}</span>
            {card.transcription && <span className="flash-transcription">{card.transcription}</span>}
            <button type="button" className="flash-audio-btn" onClick={(e) => { e.stopPropagation(); playTerm(card.term, card.audioUrl).catch(() => {}); }} aria-label="Прослушать"><IconSpeaker /></button>
            <span className="flash-hint">Нажмите, чтобы перевернуть</span>
          </div>
          <div className="flash-card-back">
            <span className="flash-translation">{card.translation}</span>
            {card.examples[0] && <p className="flash-example">{card.examples[0]}</p>}
          </div>
        </div>
      </button>
      <div className="flash-nav">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isFirst}
          onClick={() => { setIndex((i) => i - 1); setFlipped(false); }}
        >
          Назад
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isLast}
          onClick={() => { setIndex((i) => i + 1); setFlipped(false); }}
        >
          Далее
        </button>
      </div>
      <Link to={`/module/${moduleId}`} className="flash-back-link btn btn-ghost">
        К модулю
      </Link>
    </div>
  );
}
