import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './NotFound.css';

export function NotFound() {
  const { tr } = useI18n();

  return (
    <div className="not-found">
      <p className="not-found-code" aria-hidden>
        404
      </p>
      <h1 className="not-found-title">{tr('Страница не найдена', 'Page not found')}</h1>
      <p className="not-found-text">
        {tr('Проверьте адрес или вернитесь на главную.', 'Check the URL or go back to home.')}
      </p>
      <Link to="/" className="btn btn-primary">
        {tr('На главную', 'Back to home')}
      </Link>
    </div>
  );
}
