import { useApp } from './context/AppContext';

export function useI18n() {
  const { language } = useApp();
  const isEn = language === 'en';

  const tr = (ru: string, en: string): string => (isEn ? en : ru);

  const formatMonthYear = (date: Date): string =>
    isEn
      ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const weekdayLabel = (dayIndex: number): string => {
    const ru = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const en = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return isEn ? en[dayIndex] : ru[dayIndex];
  };

  return {
    language,
    isEn,
    tr,
    formatMonthYear,
    weekdayLabel,
  };
}

