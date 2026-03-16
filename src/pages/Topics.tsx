import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { IconModule } from '../components/Icons';
import './Topics.css';

/** Страница «Темы» — быстрый доступ ко всем модулям (как в WRD / 10 Minute English) */
export function Topics() {
  const { getModuleStats, getDueForModule, activeModules } = useApp();
  const { tr } = useI18n();

  return (
    <div className="topics-page">
      <h2 className="topics-title">{tr('Все темы', 'All topics')}</h2>
      <p className="topics-desc">
        {tr('Выберите модуль и начните с 10 слов в день', 'Pick a module and start with 10 words a day')}
      </p>
      <nav className="topics-grid" aria-label={tr('Модули', 'Modules')}>
        {activeModules.map((mod) => {
          const stats = getModuleStats(mod.id);
          const due = getDueForModule(mod.id).length;
          const progressPct = stats.totalCount ? Math.round((stats.learnedCount / stats.totalCount) * 100) : 0;
          return (
            <Link
              key={mod.id}
              to={`/module/${mod.id}`}
              className="topics-card"
              style={{ '--topic-color': mod.coverColor } as React.CSSProperties}
            >
              <div className="topics-card-icon-wrap">
                <span className="topics-card-icon" aria-hidden><IconModule /></span>
              </div>
              <div className="topics-card-body">
                <span className="topics-card-title">{mod.titleRu}</span>
                <span className="topics-card-meta">{stats.learnedCount} / {stats.totalCount}</span>
                {due > 0 && <span className="topics-card-due">{tr('На повтор:', 'Due today:')} {due}</span>}
                <div className="topics-card-progress">
                  <div className="topics-card-progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
