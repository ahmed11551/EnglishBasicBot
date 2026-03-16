import { Link, useLocation } from 'react-router-dom';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden width="22" height="22">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

const APP_NAME = 'МГИМО BASIC ENGLISH';
const titles: Record<string, string> = {
  '/': APP_NAME,
  '/topics': 'Темы',
  '/stats': 'Прогресс',
  '/settings': 'Настройки',
};

function getTitle(pathname: string): string {
  if (pathname === '/') return titles['/'] ?? APP_NAME;
  if (pathname.startsWith('/topics')) return titles['/topics'] ?? 'Темы';
  if (pathname.startsWith('/stats')) return titles['/stats'] ?? 'Прогресс';
  if (pathname.startsWith('/settings')) return titles['/settings'] ?? 'Настройки';
  if (pathname.startsWith('/search')) return 'Поиск';
  if (pathname.startsWith('/privacy')) return 'Политика конфиденциальности';
  if (pathname.startsWith('/terms')) return 'Пользовательское соглашение';
  if (pathname.includes('/flash')) return 'Флэш-карты';
  if (pathname.includes('/trainer')) return 'Тренажёр';
  if (pathname.includes('/builder')) return 'Конструктор';
  if (pathname.includes('/listen')) return 'Аудирование';
  if (pathname.includes('/pronounce')) return 'Произношение';
  if (pathname.match(/^\/module\/[^/]+$/)) return 'Модуль';
  return APP_NAME;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const title = getTitle(location.pathname);
  const showBack = location.pathname !== '/' && !location.pathname.startsWith('/stats') && !location.pathname.startsWith('/topics') && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/privacy') && !location.pathname.startsWith('/terms');

  return (
    <>
      <header className="app-header">
        {showBack && (
          <Link to={location.pathname.includes('/module/') ? (/\/module\/[^/]+\/(flash|trainer|builder|listen|pronounce)/.test(location.pathname) ? `/module/${location.pathname.split('/')[2]}` : '/') : '/'} className="header-back" aria-label="Назад">
            ←
          </Link>
        )}
        <h1>{title}</h1>
        {(location.pathname === '/' || location.pathname.startsWith('/topics')) && (
          <Link to="/search" className="header-search" aria-label="Поиск по словарю">
            <SearchIcon />
          </Link>
        )}
      </header>
      <main className="app-main" id="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <Link to="/privacy" className="app-footer-link">Политика конфиденциальности</Link>
        <span className="app-footer-sep"> · </span>
        <Link to="/terms" className="app-footer-link">Пользовательское соглашение</Link>
      </footer>
    </>
  );
}
