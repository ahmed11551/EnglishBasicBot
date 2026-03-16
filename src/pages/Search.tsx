import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { searchCards } from '../data/cards';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import './Search.css';

export function Search() {
  const { activeModules } = useApp();
  const { tr } = useI18n();
  const [query, setQuery] = useState('');
  const activeCardIds = useMemo(() => {
    const ids = new Set<string>();
    activeModules.forEach((m) => m.cardIds.forEach((id) => ids.add(id)));
    return ids;
  }, [activeModules]);
  const results = useMemo(() => searchCards(query).filter((c) => activeCardIds.has(c.id)), [query, activeCardIds]);

  return (
    <div className="search-page">
      <div className="search-input-wrap">
        <input
          type="search"
          className="search-input"
          placeholder={tr('Термин или перевод...', 'Term or translation...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label={tr('Поиск по словарю', 'Dictionary search')}
        />
      </div>
      {query.trim() ? (
        <div className="search-results">
          {results.length > 0 ? (
            <ul className="search-list">
              {results.map((card) => {
                const mod = activeModules.find((m) => m.cardIds.includes(card.id));
                return (
                  <li key={card.id} className="search-item">
                    <div className="search-item-main">
                      <span className="search-term">{card.term}</span>
                      <span className="search-translation">{card.translation}</span>
                    </div>
                    {card.examples[0] && (
                      <p className="search-example">{card.examples[0]}</p>
                    )}
                    {mod && (
                      <Link
                        to={`/module/${mod.id}`}
                        className="search-module-link"
                        style={{ color: mod.coverColor }}
                      >
                        {mod.titleRu}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="search-empty">
              {tr('Ничего не найдено. Попробуйте другой запрос.', 'Nothing found. Try another query.')}
            </p>
          )}
        </div>
      ) : (
        <p className="search-hint">
          {tr('Введите термин на английском или перевод на русском', 'Type a term in English or a Russian translation')}
        </p>
      )}
    </div>
  );
}
