import { Link, useLocation } from 'react-router-dom';
import { IconToday, IconTopics, IconProgress, IconSettings } from './BottomNavIcons';
import { useI18n } from '../i18n';
import './BottomNav.css';

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { tr } = useI18n();

  return (
    <nav className="bottom-nav" aria-label={tr('Главная навигация', 'Main navigation')}>
      <Link
        to="/"
        className={`bottom-nav-item ${path === '/' ? 'active' : ''}`}
        aria-current={path === '/' ? 'page' : undefined}
      >
        <span className="bottom-nav-icon"><IconToday /></span>
        <span className="bottom-nav-label">{tr('Сегодня', 'Today')}</span>
      </Link>
      <Link
        to="/topics"
        className={`bottom-nav-item ${path.startsWith('/topics') ? 'active' : ''}`}
        aria-current={path.startsWith('/topics') ? 'page' : undefined}
      >
        <span className="bottom-nav-icon"><IconTopics /></span>
        <span className="bottom-nav-label">{tr('Темы', 'Topics')}</span>
      </Link>
      <Link
        to="/stats"
        className={`bottom-nav-item ${path.startsWith('/stats') ? 'active' : ''}`}
        aria-current={path.startsWith('/stats') ? 'page' : undefined}
      >
        <span className="bottom-nav-icon"><IconProgress /></span>
        <span className="bottom-nav-label">{tr('Прогресс', 'Progress')}</span>
      </Link>
      <Link
        to="/settings"
        className={`bottom-nav-item ${path.startsWith('/settings') ? 'active' : ''}`}
        aria-current={path.startsWith('/settings') ? 'page' : undefined}
      >
        <span className="bottom-nav-icon"><IconSettings /></span>
        <span className="bottom-nav-label">{tr('Настройки', 'Settings')}</span>
      </Link>
    </nav>
  );
}
