/** Приветствие по времени суток (как в Easy Ten / Duolingo) */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Доброе утро';
  if (h >= 12 && h < 18) return 'Добрый день';
  if (h >= 18 && h < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

export const MOTIVATIONAL_TIPS = [
  '10 слов в день = 70 в неделю',
  'Повторение — мать учения',
  'Маленькие шаги каждый день',
  'Каждое слово приближает к цели',
  '5 минут в день — и слова запомнятся',
  'Дипломатия начинается со словаря',
];

export function getRandomTip(): string {
  return MOTIVATIONAL_TIPS[Math.floor(Math.random() * MOTIVATIONAL_TIPS.length)];
}

/** Фразы при достижении дневной цели — как в Duolingo / Easy Ten */
export const GOAL_PHRASES = [
  'Отлично! Цель на сегодня выполнена 🎉',
  'Вы молодец! День не зря',
  'Супер! Завтра снова?',
  'Цель достигнута! Так держать 💪',
  'Идеально! Носитель использует ~3000 слов — вы приближаетесь',
  'За неделю — десятки новых слов. Отлично!',
  'Маленькими шагами к большому словарю',
  'Сегодня вы на шаг ближе к свободному владению',
];

export function getRandomGoalPhrase(): string {
  return GOAL_PHRASES[Math.floor(Math.random() * GOAL_PHRASES.length)];
}

/** Фразы для пустых состояний (нет слов на сегодня, новый пользователь) */
export const EMPTY_STATE_PHRASES = [
  '5 минут в день — и слова запомнятся',
  'Выберите модуль и начните с малого',
  'Каждое слово приближает к цели',
  'Дипломатия начинается со словаря',
  'Повторение — мать учения',
];

export function getRandomEmptyPhrase(): string {
  return EMPTY_STATE_PHRASES[Math.floor(Math.random() * EMPTY_STATE_PHRASES.length)];
}
