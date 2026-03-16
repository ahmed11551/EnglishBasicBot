import { Link } from 'react-router-dom';
import './Privacy.css';

/** Страница политики конфиденциальности (требование регламента публикации) */
export function Privacy() {
  return (
    <div className="privacy-page">
      <h1>Политика конфиденциальности</h1>
      <p className="privacy-updated">МГИМО BASIC ENGLISH. Последнее обновление: 2026.</p>
      <section>
        <h2>1. Данные приложения</h2>
        <p>Приложение хранит прогресс обучения (выученные слова, даты повторений) локально на вашем устройстве (localStorage). При запуске через Telegram может использоваться идентификатор пользователя Telegram только для привязки данных к аккаунту.</p>
      </section>
      <section>
        <h2>2. Передача данных</h2>
        <p>Мы не передаём ваши данные третьим сторонам. Загрузка скрипта Telegram Web App выполняется с официального домена telegram.org.</p>
      </section>
      <section>
        <h2>3. Контакты</h2>
        <p>По вопросам политики конфиденциальности и по любым другим вопросам вы можете связаться с нами:</p>
        <p className="privacy-contact">
          <a href="mailto:info@mgimo-english.app" className="privacy-contact-link">Написать нам</a>
          <span className="privacy-contact-email"> (info@mgimo-english.app)</span>
        </p>
      </section>
      <Link to="/" className="btn btn-secondary">На главную</Link>
    </div>
  );
}
