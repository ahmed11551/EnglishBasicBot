import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { IconFlame, IconModule } from '../components/Icons';
import { useI18n } from '../i18n';
import './Stats.css';

export function Stats() {
  const { getModuleStats, getDueForModule, learnedToday, dailyGoal, streak, activeModules } = useApp();
  const { tr } = useI18n();

  const totalLearned = activeModules.reduce((acc, m) => acc + getModuleStats(m.id).learnedCount, 0);
  const totalCards = activeModules.reduce((acc, m) => acc + getModuleStats(m.id).totalCount, 0);
  const totalDue = activeModules.reduce((acc, m) => acc + getDueForModule(m.id).length, 0);
  const xp = totalLearned * 10;
  const level = 1 + Math.floor(xp / 100);
  const xpInLevel = xp % 100;
  const xpForNext = 100;

  return (
    <div className="stats animate-fade-in">
      <h1>{tr('Прогресс', 'Progress')}</h1>
      <div className="stats-overview card-surface">
        <div className="stats-row stats-row-hero">
          <span className="stats-label">{tr('Уровень', 'Level')}</span>
          <span className="stats-level-badge" aria-label={`Уровень ${level}`}>{level}</span>
        </div>
        <div className="stats-xp-bar-wrap">
          <div className="stats-xp-bar">
            <div className="stats-xp-fill" style={{ width: `${(xpInLevel / xpForNext) * 100}%` }} />
          </div>
          <span className="stats-xp-label">
            {xpInLevel} / {xpForNext} XP {tr('до уровня', 'to level')} {level + 1}
          </span>
        </div>
        <div className="stats-row">
          <span className="stats-label">{tr('Опыт (XP)', 'Experience (XP)')}</span>
          <span className="stats-value">{xp}</span>
        </div>
        <div className="stats-row">
          <span className="stats-label">{tr('Сегодня', 'Today')}</span>
          <span className="stats-value">
            {learnedToday} / {dailyGoal} {tr('слов', 'words')}
          </span>
        </div>
        <div className={`stats-row ${streak > 0 ? 'stats-row-streak' : ''}`}>
          <span className="stats-label">{tr('Серия дней', 'Streak')}</span>
          <span className="stats-value stats-value-streak">
            {streak > 0 ? <><IconFlame /><span>{streak}</span></> : '0'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stats-label">{tr('Выучено слов', 'Words learned')}</span>
          <span className="stats-value">{totalLearned} / {totalCards}</span>
        </div>
        <div className="stats-row">
          <span className="stats-label">{tr('На повтор сегодня', 'Due today')}</span>
          <span className="stats-value">{totalDue}</span>
        </div>
      </div>
      <h2>{tr('По модулям', 'By modules')}</h2>
      <ul className="stats-modules">
        {activeModules.map((mod) => {
          const stats = getModuleStats(mod.id);
          const pct = stats.totalCount ? Math.round((stats.learnedCount / stats.totalCount) * 100) : 0;
          const due = getDueForModule(mod.id).length;
          return (
            <li key={mod.id} className="stats-module card-surface" style={{ borderLeftColor: mod.coverColor }}>
              <div className="stats-module-header">
                <span className="stats-module-icon" style={{ background: `color-mix(in srgb, ${mod.coverColor} 12%, transparent)`, borderColor: `color-mix(in srgb, ${mod.coverColor} 22%, transparent)` }} aria-hidden><IconModule /></span>
                <span className="stats-module-title">{mod.titleRu}</span>
                <span className="stats-module-count">{stats.learnedCount} / {stats.totalCount}</span>
              </div>
              <div className="stats-module-bar">
                <div className="stats-module-fill" style={{ width: `${pct}%`, background: mod.coverColor }} />
              </div>
              {due > 0 && (
                <p className="stats-module-due">
                  {tr('К повтору:', 'Due:')} {due}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <Link to="/" className="btn btn-secondary stats-back">
        {tr('На главную', 'Back to home')}
      </Link>
    </div>
  );
}
