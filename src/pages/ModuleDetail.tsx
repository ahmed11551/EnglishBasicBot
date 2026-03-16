import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { useApp } from '../context/AppContext';
import { IconModule, IconCards, IconPencil, IconLetters, IconSpeaker, IconMic } from '../components/Icons';
import './ModuleDetail.css';

export function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { getModuleStats, getDueForModule, setLastModuleId } = useApp();
  const module = MODULES.find((m) => m.id === moduleId);

  useEffect(() => {
    if (module?.id) setLastModuleId(module.id);
  }, [module?.id, setLastModuleId]);

  if (!module) {
    return (
      <div className="module-detail">
        <p>Модуль не найден.</p>
        <Link to="/">На главную</Link>
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
          <span>Выучено: {stats.learnedCount} / {stats.totalCount}</span>
          {dueToday > 0 && <span>На повтор: {dueToday}</span>}
        </div>
      </div>

      <div className="module-detail-actions">
        <Link
          to={`/module/${module.id}/flash`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconCards /></span>
          <span className="action-card-title">Флэш-карты</span>
          <span className="action-card-desc">Быстрое пролистывание</span>
        </Link>
        <Link
          to={`/module/${module.id}/trainer`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconPencil /></span>
          <span className="action-card-title">Тренажёр</span>
          <span className="action-card-desc">Выбор правильного перевода из 4 вариантов</span>
        </Link>
        <Link
          to={`/module/${module.id}/builder`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconLetters /></span>
          <span className="action-card-title">Конструктор</span>
          <span className="action-card-desc">Соберите термин из букв по переводу</span>
        </Link>
        <Link
          to={`/module/${module.id}/listen`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconSpeaker /></span>
          <span className="action-card-title">Аудирование</span>
          <span className="action-card-desc">Прослушайте термин и выберите перевод</span>
        </Link>
        <Link
          to={`/module/${module.id}/pronounce`}
          className="action-card card-surface"
        >
          <span className="action-card-icon"><IconMic /></span>
          <span className="action-card-title">Произношение</span>
          <span className="action-card-desc">Произнесите термин — проверка через микрофон</span>
        </Link>
      </div>
    </div>
  );
}
