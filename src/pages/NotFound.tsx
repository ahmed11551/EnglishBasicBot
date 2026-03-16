import { Link } from 'react-router-dom';
import './NotFound.css';

export function NotFound() {
  return (
    <div className="not-found">
      <p className="not-found-code" aria-hidden>404</p>
      <h1 className="not-found-title">Страница не найдена</h1>
      <p className="not-found-text">Проверьте адрес или вернитесь на главную.</p>
      <Link to="/" className="btn btn-primary">На главную</Link>
    </div>
  );
}
