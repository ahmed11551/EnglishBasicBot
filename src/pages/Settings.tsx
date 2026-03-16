import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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
          Цель на день
        </h2>
        <p className="settings-section-desc">Сколько слов в день хотите учить</p>
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
        <h2 className="settings-section-title">Звуки</h2>
        <p className="settings-section-desc">Звук при правильном и неправильном ответе, при достижении цели</p>
        <div className="settings-sound-row">
          <span className="settings-sound-label">Включить звуки</span>
          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            className={`settings-sound-toggle ${soundEnabled ? 'on' : 'off'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Выключить звуки' : 'Включить звуки'}
          >
            <span className="settings-sound-knob" />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Язык</h2>
        <p className="settings-section-desc">Тема оформления подставится автоматически</p>
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
          Приложение
        </h2>
        <ul className="settings-links">
          <li>
            <Link to="/privacy" className="settings-link">
              Политика конфиденциальности
            </Link>
          </li>
          <li>
            <Link to="/terms" className="settings-link">
              Пользовательское соглашение
            </Link>
          </li>
        </ul>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">
          <span className="settings-section-icon" aria-hidden><IconInfo /></span>
          О приложении
        </h2>
        <p className="settings-about">
          МГИМО BASIC ENGLISH — словарь для изучения базовой лексики (семья, еда, путешествия, работа и т.д.).
        </p>
        <p className="settings-version">Версия {APP_VERSION}</p>
      </section>

      <section className="settings-section settings-section-danger">
        <h2 className="settings-section-title">
          <span className="settings-section-icon" aria-hidden><IconWarning /></span>
          Сброс данных
        </h2>
        <p className="settings-section-desc">
          Удалить весь прогресс (слова, статистика, серии). Цель на день сохранится.
        </p>
        <button
          type="button"
          className={`btn ${confirmReset ? 'btn-danger' : 'btn-secondary'}`}
          onClick={handleReset}
          aria-live="polite"
        >
          {confirmReset ? 'Подтвердить сброс' : 'Сбросить прогресс'}
        </button>
        {confirmReset && (
          <button
            type="button"
            className="settings-cancel-reset"
            onClick={() => setConfirmReset(false)}
          >
            Отмена
          </button>
        )}
      </section>
    </div>
  );
}
