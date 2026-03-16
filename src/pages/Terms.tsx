import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './Terms.css';

/** Страница пользовательского соглашения (требование регламента публикации) */
export function Terms() {
  const { tr } = useI18n();

  return (
    <div className="terms-page">
      <h1>{tr('Пользовательское соглашение', 'Terms of use')}</h1>
      <p className="terms-updated">
        МГИМО BASIC ENGLISH. {tr('Последнее обновление: 2026.', 'Last updated: 2026.')}
      </p>
      <section>
        <h2>{tr('1. Принятие условий', '1. Acceptance of terms')}</h2>
        <p>
          {tr(
            'Использование приложения «МГИМО BASIC ENGLISH» означает согласие с настоящим соглашением. Если вы не согласны с условиями, пожалуйста, не используйте приложение.',
            'Using the “МГИМО BASIC ENGLISH” app means you accept these terms. If you do not agree, please do not use the app.',
          )}
        </p>
      </section>
      <section>
        <h2>{tr('2. Использование сервиса', '2. Use of the service')}</h2>
        <p>
          {tr(
            'Приложение предназначено для образовательных целей — изучения базовой английской лексики. Запрещается использовать приложение для распространения незаконного контента или в целях, противоречащих законодательству.',
            'The app is intended for educational purposes — learning basic English vocabulary. It must not be used to distribute illegal content or for purposes that violate the law.',
          )}
        </p>
      </section>
      <section>
        <h2>{tr('3. Интеллектуальная собственность', '3. Intellectual property')}</h2>
        <p>
          {tr(
            'Контент приложения (тексты, структура, дизайн) защищён авторским правом. Допускается личное некоммерческое использование. Копирование и распространение материалов в коммерческих целях без разрешения правообладателя запрещено.',
            'The app content (texts, structure, design) is protected by copyright. Personal non‑commercial use is allowed. Copying or distributing materials for commercial purposes without permission is prohibited.',
          )}
        </p>
      </section>
      <section>
        <h2>{tr('4. Ограничение ответственности', '4. Limitation of liability')}</h2>
        <p>
          {tr(
            'Приложение предоставляется «как есть». Мы не гарантируем бесперебойную работу и не несём ответственности за косвенные убытки, связанные с использованием или невозможностью использования сервиса.',
            'The app is provided “as is”. We do not guarantee uninterrupted operation and are not liable for indirect damages related to using or being unable to use the service.',
          )}
        </p>
      </section>
      <section>
        <h2>{tr('5. Контакты', '5. Contacts')}</h2>
        <p>
          {tr(
            'По вопросам пользовательского соглашения:',
            'For questions about these terms:',
          )}{' '}
          <a href="mailto:info@mgimo-english.app" className="terms-contact-link">
            info@mgimo-english.app
          </a>
          .
        </p>
      </section>
      <Link to="/" className="btn btn-secondary">
        {tr('На главную', 'Back to home')}
      </Link>
    </div>
  );
}
