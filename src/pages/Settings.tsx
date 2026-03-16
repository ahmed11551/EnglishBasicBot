import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import type { LanguageId } from '../storage';
import { IconTarget, IconLink, IconInfo, IconWarning } from '../components/Icons';
import './Settings.css';

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 25, 30];
const LANGUAGE_OPTIONS: { id: LanguageId; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];
const APP_VERSION = '1.0.0';

export function Settings() {
  const { dailyGoal, setDailyGoal, language, setLanguage, soundEnabled, setSoundEnabled, resetProgress } = useApp();
  const { tr } = useI18n();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetProgress();
    setConfirmReset(false);
  };

  return (
    <div className="settings-page">
      <section className="settings-section">
        <h2 className="settings-section-title">
          <span className="settings-section-icon" aria-hidden><IconTarget /></span>
          {tr('Цель на день', 'Daily goal')}
        </h2>
        <p className="settings-section-desc">
          {tr('Сколько слов в день хотите учить', 'How many words you want to learn per day')}
        </p>
        <div className="settings-goal-grid">
          {DAILY_GOAL_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`settings-goal-btn ${dailyGoal === n ? 'active' : ''}`}
              onClick={() => setDailyGoal(n)}
              aria-pressed={dailyGoal === n}
              aria-label={`${n} слов`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">{tr('Звуки', 'Sounds')}</h2>
        <p className="settings-section-desc">
          {tr(
            'Звук при правильном и неправильном ответе, при достижении цели',
            'Sound on correct / wrong answers and when reaching the goal',
          )}
        </p>
        <div className="settings-sound-row">
          <span className="settings-sound-label">{tr('Включить звуки', 'Enable sounds')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            className={`settings-sound-toggle ${soundEnabled ? 'on' : 'off'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? tr('Выключить звуки', 'Turn sounds off') : tr('Включить звуки', 'Turn sounds on')}
          >
            <span className="settings-sound-knob" />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">{tr('Язык', 'Language')}</h2>
        <p className="settings-section-desc">
          {tr('Тема оформления подставится автоматически', 'Theme will be applied automatically')}
        </p>
        <div className="settings-goal-grid settings-theme-grid">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`settings-goal-btn settings-theme-btn ${language === opt.id ? 'active' : ''}`}
              onClick={() => setLanguage(opt.id)}
              aria-pressed={language === opt.id}
              aria-label={opt.label}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">
          <span className="settings-section-icon" aria-hidden><IconLink /></span>
          {tr('Приложение', 'Application')}
        </h2>
        <ul className="settings-links">
          <li>
            <Link to="/privacy" className="settings-link">
              {tr('Политика конфиденциальности', 'Privacy policy')}
            </Link>
          </li>
          <li>
            <Link to="/terms" className="settings-link">
              {tr('Пользовательское соглашение', 'Terms of use')}
            </Link>
          </li>
        </ul>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">
          <span className="settings-section-icon" aria-hidden><IconInfo /></span>
          {tr('О приложении', 'About the app')}
        </h2>
        <p className="settings-about">
          {tr(
            'МГИМО BASIC ENGLISH — словарь для изучения базовой лексики (семья, еда, путешествия, работа и т.д.).',
            'MGIMO BASIC ENGLISH — a dictionary for learning basic vocabulary (family, food, travel, work, etc.).',
          )}
        </p>
        <p className="settings-version">
          {tr('Версия', 'Version')} {APP_VERSION}
        </p>
      </section>

      <section className="settings-section settings-section-danger">
        <h2 className="settings-section-title">
          <span className="settings-section-icon" aria-hidden><IconWarning /></span>
          {tr('Сброс данных', 'Reset data')}
        </h2>
        <p className="settings-section-desc">
          {tr(
            'Удалить весь прогресс (слова, статистика, серии). Цель на день сохранится.',
            'Delete all progress (words, stats, streak). Daily goal will stay the same.',
          )}
        </p>
        <button
          type="button"
          className={`btn ${confirmReset ? 'btn-danger' : 'btn-secondary'}`}
          onClick={handleReset}
          aria-live="polite"
        >
          {confirmReset ? tr('Подтвердить сброс', 'Confirm reset') : tr('Сбросить прогресс', 'Reset progress')}
        </button>
        {confirmReset && (
          <button
            type="button"
            className="settings-cancel-reset"
            onClick={() => setConfirmReset(false)}
          >
            {tr('Отмена', 'Cancel')}
          </button>
        )}
      </section>
    </div>
  );
}
