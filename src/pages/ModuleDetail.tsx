import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { IconModule, IconCards, IconPencil, IconLetters, IconSpeaker, IconMic } from '../components/Icons';
import './ModuleDetail.css';

export function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getModuleStats, getDueForModule, setLastModuleId } = useApp();
  const { tr } = useI18n();
  const module = MODULES.find((m) => m.id === moduleId);

  useEffect(() => {
    if (module?.id) setLastModuleId(module.id);
  }, [module?.id, setLastModuleId]);

  if (!module) {
    return (
      <div className="module-detail">
        <p>{tr('Модуль не найден.', 'Module not found.')}</p>
        <Link to="/">{tr('На главную', 'Back to home')}</Link>
      </div>
    );
  }

  const stats = getModuleStats(module.id);
  const dueToday = getDueForModule(module.id).length;

  return (
    <div className="module-detail">
      <div className="module-detail-header" style={{ background: module.coverColor }}>
        <div className="module-detail-icon-wrap" aria-hidden>
          <span className="module-detail-icon"><IconModule /></span>
        </div>
        <h1>{module.titleRu}</h1>
        <p className="module-detail-en">{module.title}</p>
        <p className="module-detail-desc">{module.description}</p>
        <div className="module-detail-meta">
          <span>
            {tr('Выучено:', 'Learned:')} {stats.learnedCount} / {stats.totalCount}
          </span>
          {dueToday > 0 && <span>{tr('На повтор:', 'Due today:')} {dueToday}</span>}
        </div>
      </div>

      <div className="module-detail-actions">
        <Link
          to={`/module/${module.id}/flash`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconCards /></span>
          <span className="action-card-title">{tr('Флэш-карты', 'Flashcards')}</span>
          <span className="action-card-desc">
            {tr('Быстрое пролистывание', 'Quick browsing')}
          </span>
        </Link>
        <Link
          to={`/module/${module.id}/trainer`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconPencil /></span>
          <span className="action-card-title">{tr('Тренажёр', 'Trainer')}</span>
          <span className="action-card-desc">
            {tr('Выбор правильного перевода из 4 вариантов', 'Choose the correct translation from 4 options')}
          </span>
        </Link>
        <Link
          to={`/module/${module.id}/builder`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconLetters /></span>
          <span className="action-card-title">{tr('Конструктор', 'Builder')}</span>
          <span className="action-card-desc">
            {tr('Соберите термин из букв по переводу', 'Build the term from letters by translation')}
          </span>
        </Link>
        <Link
          to={`/module/${module.id}/listen`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconSpeaker /></span>
          <span className="action-card-title">{tr('Аудирование', 'Listening')}</span>
          <span className="action-card-desc">
            {tr('Прослушайте термин и выберите перевод', 'Listen to the term and choose the translation')}
          </span>
        </Link>
        <Link
          to={`/module/${module.id}/pronounce`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconMic /></span>
          <span className="action-card-title">{tr('Произношение', 'Pronunciation')}</span>
          <span className="action-card-desc">
            {tr('Произнесите термин — проверка через микрофон', 'Say the term — speech will be checked via microphone')}
          </span>
        </Link>
      </div>
    </div>
  );
}
