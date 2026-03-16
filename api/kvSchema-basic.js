// Единая схема ключей Vercel KV для BASIC ENGLISH бота
// Используем только эти функции/константы во всех обработчиках.

export const KV_KEYS = {
  subscribers: 'basic_daily_subscribers',
  allUsers: 'basic_all_users',
  userLevel: (chatId) => `basic_user_level:${chatId}`,
  userTopic: (chatId) => `basic_user_topic:${chatId}`,
  userSeen: (chatId) => `basic_seen:${chatId}`,
  userSeenDaily: (chatId, dateStr) => `basic_seen_daily:${chatId}:${dateStr}`,
  userDailyGoal: (chatId) => `basic_daily_goal:${chatId}`,
  userQuizTotal: (chatId) => `basic_quiz_total:${chatId}`,
  userQuizCorrect: (chatId) => `basic_quiz_correct:${chatId}`,
  userQuizTotalByLevel: (chatId, level) => `basic_quiz_total_level:${chatId}:${level}`,
  userQuizCorrectByLevel: (chatId, level) => `basic_quiz_correct_level:${chatId}:${level}`,
};

