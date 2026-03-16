import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './Privacy.css';

/** Страница политики конфиденциальности (требование регламента публикации) */
export function Privacy() {
  const { tr } = useI18n();

  return (
    <div className="privacy-page">
      <h1>{tr('Политика конфиденциальности', 'Privacy policy')}</h1>
      <p className="privacy-updated">
        МГИМО BASIC ENGLISH. {tr('Последнее обновление: 2026.', 'Last updated: 2026.')}
      </p>
      <section>
        <h2>{tr('1. Данные приложения', '1. App data')}</h2>
        <p>
          {tr(
            'Приложение хранит прогресс обучения (выученные слова, даты повторений) локально на вашем устройстве (localStorage). При запуске через Telegram может использоваться идентификатор пользователя Telegram только для привязки данных к аккаунту.',
            'The app stores your learning progress (learned words, review dates) locally on your device (localStorage). When launched via Telegram, your Telegram user ID may be used only to link data to your account.',
          )}
        </p>
      </section>
      <section>
        <h2>{tr('2. Передача данных', '2. Data sharing')}</h2>
        <p>
          {tr(
            'Мы не передаём ваши данные третьим сторонам. Загрузка скрипта Telegram Web App выполняется с официального домена telegram.org.',
            'We do not share your data with third parties. The Telegram Web App script is loaded from the official telegram.org domain.',
          )}
        </p>
      </section>
      <section>
        <h2>{tr('3. Контакты', '3. Contacts')}</h2>
        <p>
          {tr(
            'По вопросам политики конфиденциальности и по любым другим вопросам вы можете связаться с нами:',
            'For privacy questions or any other issues, you can contact us:',
          )}
        </p>
        <p className="privacy-contact">
          <a href="mailto:info@mgimo-english.app" className="privacy-contact-link">
            {tr('Написать нам', 'Contact us')}
          </a>
          <span className="privacy-contact-email"> (info@mgimo-english.app)</span>
        </p>
      </section>
      <Link to="/" className="btn btn-secondary">
        {tr('На главную', 'Back to home')}
      </Link>
    </div>
  );
}
