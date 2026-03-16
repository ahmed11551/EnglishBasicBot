import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getCardById } from '../data/cards';
import { getGreeting, getRandomGoalPhrase, getRandomTip, getRandomEmptyPhrase } from '../utils/greeting';
import { EmptyStateIllustration } from '../components/EmptyStateIllustration';
import { IconLightning, IconCalendar, IconBook, IconFolder, IconFlame, IconModule, IconWarning } from '../components/Icons';
import './Home.css';

const ESTIMATED_MINUTES = 5;

export function Home() {
  const { getModuleStats, dailyGoal, learnedToday, streak, getCalendarDays, getTodayCardIds, getRecentlyLearnedCardIds, getMistakeCardIds, lastModuleId, activeModules } = useApp();
  const { tr, formatMonthYear, weekdayLabel } = useI18n();
  const calendarDays = [...getCalendarDays(7)].reverse();
  const todayCards = getTodayCardIds();
  const progressPct = Math.min(100, (learnedToday / dailyGoal) * 100);
  const firstModuleWithDue = activeModules.find((m) => getModuleStats(m.id).dueToday > 0) ?? activeModules[0];
  const continueModule = lastModuleId ? activeModules.find((m) => m.id === lastModuleId) : null;
  const quickAccessModules = activeModules.slice(0, 4);
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const recentlyLearned = getRecentlyLearnedCardIds(10);
  const mistakeCards = getMistakeCardIds(15);
  const goalReached = learnedToday >= dailyGoal && dailyGoal > 0;
  const hasNoProgress = learnedToday === 0 && todayCards.length === 0;
  const greeting = getGreeting();
  const goalPhrase = useMemo(() => getRandomGoalPhrase(), []);
  const dailyTip = useMemo(() => getRandomTip(), []);
  const emptyPhrase = useMemo(() => getRandomEmptyPhrase(), []);

  return (
    <div className="home home-easyten">
      <div className="home-hero animate-fade-in">
        <p className="home-greeting">{greeting}</p>
        <p className="home-tip">{dailyTip}</p>
      </div>
      <section className={`home-today animate-fade-in ${goalReached ? 'home-today-done' : ''}`}>
        <h2 className="home-today-title">{tr('Сегодня', 'Today')}</h2>
        <div className={`home-today-ring-wrap ${goalReached ? 'ring-complete' : ''}`}>
          <div className="home-today-ring" aria-hidden>
            <svg viewBox="0 0 36 36" className="ring-svg">
              <path
                className="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="ring-fill"
                strokeDasharray={`${progressPct}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
          <div className="home-today-count">
            <span className="home-today-num">{learnedToday}</span>
            <span className="home-today-of">/ {dailyGoal}</span>
          </div>
        </div>
        <p className="home-today-label">
          {tr('слов за сегодня', 'words today')}{' '}
          <span className="home-today-time">· ~{ESTIMATED_MINUTES} {tr('мин', 'min')}</span>
        </p>
        {goalReached && <p className="home-today-message home-today-success">{goalPhrase}</p>}
        {hasNoProgress && (
          <p className="home-today-message home-today-hint">
            {tr('5 минут в день — и слова запомнятся', '5 minutes a day — and words will stick')}
          </p>
        )}
        {streak > 0 && (
          <div className="home-streak">
            <span className="home-streak-icon"><IconFlame /></span>
            <span className="home-streak-num">{streak}</span>
            <span className="home-streak-text">{tr('дней подряд', 'days in a row')}</span>
          </div>
        )}
        {todayCards.length > 0 ? (
          <Link to={`/module/${firstModuleWithDue.id}/trainer`} className="home-cta btn btn-primary">
            {goalReached ? tr('Повторить слова', 'Review words') : tr(`Продолжить: ${firstModuleWithDue.titleRu}`, `Continue: ${firstModuleWithDue.title}`)}
          </Link>
        ) : (
          <Link to={`/module/${continueModule?.id ?? activeModules[0]?.id}`} className="home-cta btn btn-primary">
            {continueModule
              ? tr(`Продолжить: ${continueModule.titleRu}`, `Continue: ${continueModule.title}`)
              : tr('Выбрать модуль', 'Choose a module')}
          </Link>
        )}
      </section>

      <section className="home-quick-access animate-fade-in animate-delay-1">
        <h3 className="home-quick-access-title">
          <span className="home-section-icon" aria-hidden><IconLightning /></span>
          {tr('Быстрый доступ', 'Quick access')}
        </h3>
        <div className="home-quick-access-list">
          {quickAccessModules.map((mod) => {
            const stats = getModuleStats(mod.id);
            const due = stats.dueToday;
            return (
              <Link
                key={mod.id}
                to={`/module/${mod.id}`}
                className="home-quick-chip"
                style={{ '--chip-color': mod.coverColor } as React.CSSProperties}
              >
                <span className="home-quick-chip-icon" aria-hidden><IconModule /></span>
                <span className="home-quick-chip-name">{mod.titleRu}</span>
                {due > 0 && <span className="home-quick-chip-due">{due}</span>}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-calendar animate-fade-in animate-delay-2">
        <h3 className="home-calendar-title">
          <span className="home-section-icon" aria-hidden><IconCalendar /></span>
          {tr('Неделя', 'Week')}
        </h3>
        <p className="home-calendar-month" aria-hidden>
          {formatMonthYear(new Date())}
        </p>
        <div className="home-calendar-strip">
          {calendarDays.map(({ date, count }) => {
            const d = new Date(date);
            const dayName = weekdayLabel(d.getDay());
            const dayNum = d.getDate();
            const isToday = date === todayStr;
            return (
              <div key={date} className={`home-calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'done' : ''}`}>
                <span className="home-calendar-dayname">{dayName}</span>
                <span className="home-calendar-daynum">{dayNum}</span>
                {count > 0 && <span className="home-calendar-dot" />}
              </div>
            );
          })}
        </div>
      </section>

      {recentlyLearned.length > 0 && (
        <section className="home-recently home-recently-compact animate-fade-in animate-delay-2">
          <h3 className="home-recently-title">{tr('Недавно выученные', 'Recently learned')}</h3>
          <div className="home-recently-strip" role="list">
            {recentlyLearned.slice(0, 4).map(({ cardId, moduleId }) => {
              const card = getCardById(cardId);
              const mod = activeModules.find((m) => m.id === moduleId);
              return card ? (
                <div key={cardId} className="home-recently-chip" role="listitem">
                  <span className="home-recently-chip-term">{card.term}</span>
                  <span className="home-recently-chip-translation">{card.translation}</span>
                  {mod && <span className="home-recently-chip-module" style={{ color: mod.coverColor }}>{mod.titleRu}</span>}
                </div>
              ) : null;
            })}
          </div>
        </section>
      )}

      {mistakeCards.length > 0 && (
        <section className="home-mistakes animate-fade-in animate-delay-2">
          <h3 className="home-mistakes-title">
            <span className="home-section-icon home-mistakes-icon" aria-hidden><IconWarning /></span>
            {tr('Слова, в которых чаще ошибаешься', 'Words you often get wrong')}
          </h3>
          <ul className="home-mistakes-list" role="list">
            {mistakeCards.slice(0, 8).map(({ cardId, moduleId }) => {
              const card = getCardById(cardId);
              const mod = activeModules.find((m) => m.id === moduleId);
              return card ? (
                <li key={cardId} className="home-mistakes-item" role="listitem">
                  <span className="home-mistakes-term">{card.term}</span>
                  <span className="home-mistakes-translation">{card.translation}</span>
                  {mod && <span className="home-mistakes-module" style={{ color: mod.coverColor }}>{mod.titleRu}</span>}
                </li>
              ) : null;
            })}
          </ul>
          <Link
            to={`/module/${mistakeCards[0].moduleId}/trainer`}
            state={{ overrideCardIds: mistakeCards }}
            className="home-mistakes-cta btn btn-secondary"
          >
            {tr('Повторить', 'Review')}
          </Link>
        </section>
      )}

      {todayCards.length > 0 ? (
        <section className="home-words-preview animate-fade-in animate-delay-3">
          <h3 className="home-words-title">
            <span className="home-section-icon" aria-hidden><IconBook /></span>
            {tr('Слова на сегодня', 'Today\'s words')}
          </h3>
          <ul className="home-words-list">
            {todayCards.slice(0, 5).map(({ cardId, moduleId }) => {
              const card = getCardById(cardId);
              const mod = activeModules.find((m) => m.id === moduleId);
              return card ? (
                <li key={cardId} className="home-word-item">
                  <span className="home-word-term">{card.term}</span>
                  {card.transcription ? <span className="home-word-transcription" aria-label="Транскрипция">{card.transcription}</span> : null}
                  <span className="home-word-translation">{card.translation}</span>
                  {mod && <span className="home-word-module" style={{ color: mod.coverColor }}>{mod.titleRu}</span>}
                </li>
              ) : null;
            })}
          </ul>
          <p className="home-words-hint">
            {tr(
              'Озвучка — в карточках модуля (флэш-карты, раздел «Произношение»)',
              'Audio is available in the module cards (flashcards, "Pronounce" section)',
            )}
          </p>
        </section>
      ) : (
        <section className="home-words-empty animate-fade-in animate-delay-3">
          <div className="home-words-empty-illo" aria-hidden>
            <EmptyStateIllustration />
          </div>
          <p className="home-words-empty-text">Выберите модуль ниже и начните с 10 слов в день</p>
          <p className="home-words-empty-tip">{emptyPhrase}</p>
        </section>
      )}

      <section className="home-modules animate-fade-in animate-delay-4">
        <h3 className="home-modules-title">
          <span className="home-section-icon" aria-hidden><IconFolder /></span>
          Модули
        </h3>
        <nav className="module-list" aria-label="Модули">
          {activeModules.map((mod) => {
            const stats = getModuleStats(mod.id);
            const progressPctMod = stats.totalCount ? Math.round((stats.learnedCount / stats.totalCount) * 100) : 0;
            return (
              <Link
                key={mod.id}
                to={`/module/${mod.id}`}
                className="module-card module-card-easyten"
                style={{ '--module-color': mod.coverColor } as React.CSSProperties}
              >
                <div className="module-card-icon-wrap">
                  <span className="module-card-icon" aria-hidden><IconModule /></span>
                </div>
                <div className="module-card-body">
                  <div className="module-card-header">
                    <span className="module-card-title">{mod.titleRu}</span>
                    <span className="module-card-count">{stats.learnedCount} / {stats.totalCount}</span>
                  </div>
                  <p className="module-card-desc">{mod.description}</p>
                  <div className="module-card-progress">
                    <div className="module-card-progress-bar" style={{ width: `${progressPctMod}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </section>

      <Link to="/stats" className="home-stats-link btn btn-secondary">
        Статистика и прогресс
      </Link>
    </div>
  );
}
