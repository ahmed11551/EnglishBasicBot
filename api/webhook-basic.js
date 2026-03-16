/**
 * Telegram Bot Webhook — BASIC ENGLISH (general English).
 * Команды: /start, /words, /learn, /quiz, /subscribe, /unsubscribe, /menu.
 * Одна языковая база: 🇬🇧 BASIC_WORDS (A1–B1, повседневные темы).
 */

import {
  getWordsOfDayBasic,
  getRandomWordsBasic,
  getRandomWordBasic,
  getWordByIdBasic,
  getQuizQuestionBasic,
  BASIC_WORDS,
} from './basicWordsData.js';
import {
  addSubscriber,
  addUserToAllUsers,
  getDailyGoal,
  getDailySeenCount,
  getUserProfile,
  getUserQuizProgress,
  getUserQuizProgressByLevel,
  getUserSeenIds,
  incrementQuizStats,
  markWordSeen,
  resetUserStats,
  setDailyGoal,
  setUserLevel,
  setUserTopic,
} from './storage-basic.js';

const LEVELS = ['A1', 'A2', 'B1'];
const TOPICS_PAGE_SIZE = 8;

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeLevel(level) {
  if (!level) return 'A1';
  const s = String(level).trim().toUpperCase();
  return LEVELS.includes(s) ? s : 'A1';
}

function levelLabel(level) {
  const l = normalizeLevel(level);
  if (l === 'A2') return 'A2 (продолжающий)';
  if (l === 'B1') return 'B1 (продвинутый)';
  return 'A1 (начинающий)';
}

function buildLevelRow(level) {
  const l = normalizeLevel(level);
  return [
    { text: l === 'A1' ? '✅ A1' : 'A1', callback_data: 'basic_level_A1' },
    { text: l === 'A2' ? '✅ A2' : 'A2', callback_data: 'basic_level_A2' },
    { text: l === 'B1' ? '✅ B1' : 'B1', callback_data: 'basic_level_B1' },
  ];
}

function normalizeTopic(topic) {
  if (!topic) return 'ALL';
  const t = String(topic).trim();
  return t ? t : 'ALL';
}

function topicLabel(topic) {
  const t = normalizeTopic(topic);
  return t === 'ALL' ? 'Все темы' : t;
}

function filterByLevel(words, level) {
  const l = normalizeLevel(level);
  return words.filter((w) => (w?.level ? normalizeLevel(w.level) === l : l === 'A1'));
}

function filterByTopic(words, topic) {
  const t = normalizeTopic(topic);
  if (t === 'ALL') return words;
  return words.filter((w) => String(w?.moduleRu || '').trim() === t);
}

function getTopicsForLevel(level) {
  const pool = filterByLevel(BASIC_WORDS, level);
  const set = new Set();
  for (const w of pool) {
    const m = String(w?.moduleRu || '').trim();
    if (m) set.add(m);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
}

function buildTopicsKeyboard(level, topic, page = 0) {
  const topics = getTopicsForLevel(level);
  const totalPages = Math.max(1, Math.ceil(topics.length / TOPICS_PAGE_SIZE));
  const p = Math.min(Math.max(0, page), totalPages - 1);

  const start = p * TOPICS_PAGE_SIZE;
  const slice = topics.slice(start, start + TOPICS_PAGE_SIZE);
  const rows = [];

  // "Все темы" — отдельной кнопкой
  rows.push([{ text: normalizeTopic(topic) === 'ALL' ? '✅ Все темы' : 'Все темы', callback_data: 'basic_topic_set_-1' }]);

  for (let i = 0; i < slice.length; i += 2) {
    const leftIdx = start + i;
    const rightIdx = start + i + 1;
    const left = topics[leftIdx];
    const right = topics[rightIdx];
    const row = [];
    if (left) {
      const checked = normalizeTopic(topic) === left;
      row.push({ text: checked ? `✅ ${left}` : left, callback_data: `basic_topic_set_${leftIdx}`.slice(0, 64) });
    }
    if (right) {
      const checked = normalizeTopic(topic) === right;
      row.push({ text: checked ? `✅ ${right}` : right, callback_data: `basic_topic_set_${rightIdx}`.slice(0, 64) });
    }
    rows.push(row);
  }

  const nav = [];
  if (totalPages > 1) {
    nav.push({ text: '⬅️', callback_data: `basic_topics_page_${Math.max(0, p - 1)}`.slice(0, 64) });
    nav.push({ text: `Стр. ${p + 1}/${totalPages}`, callback_data: 'basic_topics_noop' });
    nav.push({ text: '➡️', callback_data: `basic_topics_page_${Math.min(totalPages - 1, p + 1)}`.slice(0, 64) });
    rows.push(nav);
  }

  rows.push([{ text: '⬅️ Назад в меню', callback_data: 'basic_menu' }]);
  return { inline_keyboard: rows };
}

function buildQuickNavKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
    ],
  };
}

function computeSeenBreakdown(seenIds) {
  const byLevel = { A1: 0, A2: 0, B1: 0 };
  const byTopic = new Map(); // moduleRu -> count
  for (const id of seenIds) {
    const w = getWordByIdBasic(String(id));
    if (!w) continue;
    const lvl = normalizeLevel(w.level);
    byLevel[lvl] = (byLevel[lvl] || 0) + 1;
    const m = String(w.moduleRu || '').trim() || 'Без темы';
    byTopic.set(m, (byTopic.get(m) || 0) + 1);
  }
  const topTopics = [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { byLevel, topTopics };
}

function computeCurrentSelectionProgress(seenIds, level, topic) {
  const pool = filterByTopic(filterByLevel(BASIC_WORDS, level), topic);
  const poolIds = new Set(pool.map((w) => String(w.id)));
  let seenInPool = 0;
  for (const id of seenIds) {
    if (poolIds.has(String(id))) seenInPool++;
  }
  const total = pool.length;
  const percent = total > 0 ? Math.round((seenInPool / total) * 100) : 0;
  return { total, seenInPool, percent };
}

function formatWordsMessage(words, title) {
  const lines = words.map((w, i) => {
    const num = i + 1;
    let ex = '';
    if (w.example) {
      ex = `\n   <i>${escapeHtml(w.example)}</i>`;
    }
    return `${num}. <b>${escapeHtml(w.term)}</b> — ${escapeHtml(w.translation)}${ex}`;
  });
  return `${title}\n\n${lines.join('\n\n')}`;
}

async function sendMessage(token, chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) console.error('Telegram API error (basic):', data);
  return data;
}

async function editMessageText(token, chatId, messageId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) console.error('Telegram API editMessageText error (basic):', data);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }

  const token = process.env.BASIC_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    console.error('BASIC_BOT_TOKEN (или BOT_TOKEN) не задан');
    res.status(500).json({ ok: false });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = body?.message;
    const chatId = message?.chat?.id;
    const text = (message?.text || '').trim();

    if (chatId != null) {
      await addUserToAllUsers(chatId);
    }

    if (chatId == null && !body?.callback_query) {
      res.status(200).json({ ok: true });
      return;
    }

    const profile = chatId != null ? await getUserProfile(chatId) : { level: 'A1', topic: 'ALL' };
    let userLevel = normalizeLevel(profile.level);
    let userTopic = normalizeTopic(profile.topic);

    const isStart = text === '/start' || text === '/start start';
    const isHelp = /^\/help(@\w+)?$/i.test(text);
    const isWords = /^\/words(@\w+)?$/i.test(text) || /^(слова дня|новые слова|слова|ещё слова)$/i.test(text);
    const isLearn = /^\/learn(@\w+)?$/i.test(text) || /^(учить|учиться|обучение|слово)$/i.test(text);
    const isQuiz = /^\/quiz(@\w+)?$/i.test(text) || /^(квиз|тест|проверка)$/i.test(text);
    const isGoal = /^\/goal(@\w+)?/i.test(text) || /^(цель|цель дня)$/i.test(text);
    const isMenu = /^\/menu(@\w+)?$/i.test(text);
    const isSubscribe = /^\/subscribe(@\w+)?$/i.test(text);
    const isUnsubscribe = /^\/unsubscribe(@\w+)?$/i.test(text);

    const showMainMenu = async (targetChatId, withIntro, currentLevel = 'A1', currentTopic = 'ALL') => {
      const current = normalizeLevel(currentLevel);
      const topic = normalizeTopic(currentTopic);
      const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, current), topic).length;
      const [progress, goal, dailySeen] = await Promise.all([
        getUserQuizProgress(targetChatId),
        getDailyGoal(targetChatId),
        getDailySeenCount(targetChatId),
      ]);
      const intro = withIntro
        ? '👋 <b>Базовый английский</b>\n\n' +
          'Учите слова для повседневной жизни: дом, еда, поездки, работа и т.д.\n' +
          `📚 В базе: ${BASIC_WORDS.length} слов.\n\n`
        : '';

      const description =
        `🎚️ <b>Уровень</b>: ${escapeHtml(levelLabel(current))}\n\n` +
        `📂 <b>Тема</b>: ${escapeHtml(topicLabel(topic))}\n\n` +
        `📌 <b>В подборке</b>: ${poolCount} слов\n\n` +
        `🎯 <b>Цель дня</b>: ${dailySeen}/${goal}\n\n` +
        '📝 <b>Слова дня</b> — 3, 5 или 10 слов на сегодня\n' +
        '📖 <b>Учить</b> — одно слово → перевод → пример\n' +
        '🎯 <b>Квиз</b> — выберите правильный перевод\n\n' +
        '💡 Совет: проговорите слово вслух и придумайте своё предложение.';

      const textMenu = intro + description;

      const keyboard = {
        inline_keyboard: [
          buildLevelRow(current),
          [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }],
          [{ text: '📝 Слова дня', callback_data: 'basic_words_day' }],
          [{ text: '📖 Учить слова', callback_data: 'basic_learn_next' }],
          [{ text: '🎯 Квиз', callback_data: 'basic_quiz_next' }],
          [{ text: '🎯 Цель дня', callback_data: 'basic_goal' }],
        ],
      };

      keyboard.inline_keyboard.push([
        { text: '📬 Подписаться', callback_data: 'basic_subscribe_daily' },
        { text: '❌ Отписаться', callback_data: 'basic_unsubscribe_daily' },
      ]);

      await sendMessage(token, targetChatId, textMenu, keyboard);
    };

    if (isStart) {
      await showMainMenu(chatId, true, userLevel, userTopic);
    } else if (isHelp || isMenu) {
      await showMainMenu(chatId, false, userLevel, userTopic);
    } else if (isGoal) {
      const goal = await getDailyGoal(chatId);
      const dailySeen = await getDailySeenCount(chatId);
      await sendMessage(
        token,
        chatId,
        `🎯 <b>Цель дня</b>\n\nСегодня: <b>${dailySeen}/${goal}</b>\n\nВыберите новую цель:`,
        {
          inline_keyboard: [
            [{ text: '3', callback_data: 'basic_goal_set_3' }, { text: '5', callback_data: 'basic_goal_set_5' }, { text: '10', callback_data: 'basic_goal_set_10' }],
            [{ text: '15', callback_data: 'basic_goal_set_15' }, { text: '20', callback_data: 'basic_goal_set_20' }],
            [{ text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        },
      );
    } else if (isSubscribe) {
      const ok = await addSubscriber(chatId);
      if (ok) {
        await sendMessage(
          token,
          chatId,
          '✅ Вы подписаны на ежедневные простые слова.\nКаждый день бот пришлёт набор базовых слов.\n\nОтписаться: /unsubscribe',
        );
      } else {
        await sendMessage(
          token,
          chatId,
          '⚠️ Подписка временно недоступна. Попробуйте позже. Команды /words, /learn и /quiz работают без подписки.',
        );
      }
    } else if (isUnsubscribe) {
      const ok = await removeSubscriber(chatId);
      if (ok) {
        await sendMessage(token, chatId, 'Вы отписаны от рассылки. Подписаться снова: /subscribe');
      } else {
        await sendMessage(token, chatId, 'Не удалось отписаться. Попробуйте позже.');
      }
    } else if (isLearn) {
      const pool = filterByTopic(filterByLevel(BASIC_WORDS, userLevel), userTopic);
      const word = pool.length ? pool[Math.floor(Math.random() * pool.length)] : getRandomWordBasic();
      const msg = `📖 🇬🇧 <b>Как переводится?</b>\n\n<code>${escapeHtml(word.term)}</code>`;
      const keyboard = {
        inline_keyboard: [
          buildLevelRow(userLevel),
          [
            { text: 'Показать перевод', callback_data: `basic_learn_show_${word.id}` },
            { text: 'Следующее →', callback_data: 'basic_learn_next' },
          ],
          [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
        ],
      };
      await sendMessage(token, chatId, msg, keyboard);
    } else if (isQuiz) {
      // вопрос только из выбранного уровня
      const pool = filterByTopic(filterByLevel(BASIC_WORDS, userLevel), userTopic);
      const baseWord = pool.length ? pool[Math.floor(Math.random() * pool.length)] : getRandomWordBasic();
      const basePool = pool.length ? pool : filterByLevel(BASIC_WORDS, userLevel);
      const others = basePool.filter((w) => w.id !== baseWord.id);
      const wrong = [];
      const usedTranslations = new Set([baseWord.translation]);
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
      for (const w of shuffledOthers) {
        if (wrong.length >= 3) break;
        if (!usedTranslations.has(w.translation)) {
          wrong.push(w.translation);
          usedTranslations.add(w.translation);
        }
      }
      const options = [{ text: baseWord.translation, correct: true }, ...wrong.map((t) => ({ text: t, correct: false }))];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      const correctIndex = options.findIndex((o) => o.correct);
      const optionsWithData = options.map((o, idx) => ({
        text: o.text,
        callbackData: `quiz_basic_${baseWord.id}__${correctIndex}__${idx}`.slice(0, 64),
      }));
      const word = baseWord;
      const msg =
        `🎯 🇬🇧 <b>Как переводится</b> <code>${escapeHtml(word.term)}</code>?\n\n` +
        'Выберите правильный перевод.\n\n' +
        '💡 Сначала попробуйте вспомнить сами, потом нажимайте вариант.';
      const keyboard = {
        inline_keyboard: [
          buildLevelRow(userLevel),
          ...optionsWithData.map((o) => [{ text: o.text, callback_data: o.callbackData }]),
          [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
        ],
      };
      await sendMessage(token, chatId, msg, keyboard);
    } else if (isWords) {
      const goal = await getDailyGoal(chatId); // 3,5,10
      const words = filterByTopic(filterByLevel(getWordsOfDayBasic(goal, null), userLevel), userTopic);
      const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, userLevel), userTopic).length;
      const msg =
        formatWordsMessage(
          words,
          `📚 🇬🇧 <b>Слова дня — ${escapeHtml(levelLabel(userLevel))}</b>\n${escapeHtml(topicLabel(userTopic))}.`,
        ) +
        `\n\n📌 В подборке: <b>${poolCount}</b> слов\n\n` +
        '💡 Совет: повторите вслух и придумайте своё предложение.';
      const wButtons = [
        buildLevelRow(userLevel),
        [{ text: '🔄 Ещё 5 слов', callback_data: 'basic_words_more' }],
        [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
      ];
      await sendMessage(token, chatId, msg, { inline_keyboard: wButtons });
    } else if (text && !body?.callback_query) {
      await sendMessage(token, chatId, 'Используйте /start для списка команд.');
    } else if (body?.callback_query) {
      const cb = body.callback_query;
      const data = cb.data;
      const cbChatId = cb.message?.chat?.id;

      if (cbChatId == null) {
        res.status(200).json({ ok: true });
        return;
      }

      const cbProfile = await getUserProfile(cbChatId);
      let cbUserLevel = normalizeLevel(cbProfile.level);
      let cbUserTopic = normalizeTopic(cbProfile.topic);

      const answerCb = () =>
        fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: cb.id }),
        });

      if (data === 'basic_level_A1' || data === 'basic_level_A2' || data === 'basic_level_B1') {
        const nextLevel = data.replace('basic_level_', '');
        await answerCb();
        await setUserLevel(cbChatId, normalizeLevel(nextLevel));
        // если текущей темы нет в новом уровне — сбрасываем на ALL
        try {
          const topics = getTopicsForLevel(nextLevel);
          if (normalizeTopic(cbUserTopic) !== 'ALL' && !topics.includes(cbUserTopic)) {
            cbUserTopic = 'ALL';
            await setUserTopic(cbChatId, 'ALL');
          }
        } catch {
          // ignore
        }
        await showMainMenu(cbChatId, false, nextLevel, cbUserTopic);
      } else if (data === 'basic_menu') {
        await answerCb();
        await showMainMenu(cbChatId, false, cbUserLevel, cbUserTopic);
      } else if (data === 'basic_goal') {
        await answerCb();
        const goal = await getDailyGoal(cbChatId);
        const dailySeen = await getDailySeenCount(cbChatId);
        await sendMessage(
          token,
          cbChatId,
          `🎯 <b>Цель дня</b>\n\nСегодня: <b>${dailySeen}/${goal}</b>\n\nВыберите новую цель:`,
          {
            inline_keyboard: [
              [{ text: '3', callback_data: 'basic_goal_set_3' }, { text: '5', callback_data: 'basic_goal_set_5' }, { text: '10', callback_data: 'basic_goal_set_10' }],
              [{ text: '15', callback_data: 'basic_goal_set_15' }, { text: '20', callback_data: 'basic_goal_set_20' }],
              [{ text: '🏠 Меню', callback_data: 'basic_menu' }],
            ],
          },
        );
      } else if (data.startsWith('basic_goal_set_')) {
        await answerCb();
        const n = parseInt(data.slice('basic_goal_set_'.length), 10);
        if (Number.isFinite(n) && n > 0 && n <= 50) {
          await setDailyGoal(cbChatId, n);
        }
        await showMainMenu(cbChatId, false, cbUserLevel, cbUserTopic);
      } else if (data === 'basic_topics_noop') {
        await answerCb();
      } else if (data.startsWith('basic_topics_page_')) {
        await answerCb();
        const page = parseInt(data.slice('basic_topics_page_'.length), 10);
        await sendMessage(
          token,
          cbChatId,
          `📂 <b>Выберите тему</b>\n\n🎚️ Уровень: <b>${escapeHtml(levelLabel(cbUserLevel))}</b>\nТекущая тема: <b>${escapeHtml(
            topicLabel(cbUserTopic),
          )}</b>`,
          buildTopicsKeyboard(cbUserLevel, cbUserTopic, Number.isFinite(page) ? page : 0),
        );
      } else if (data.startsWith('basic_topic_set_')) {
        await answerCb();
        const idxRaw = data.slice('basic_topic_set_'.length);
        const idx = parseInt(idxRaw, 10);
        const topics = getTopicsForLevel(cbUserLevel);
        const nextTopic = idx === -1 ? 'ALL' : topics[idx] || 'ALL';
        await setUserTopic(cbChatId, normalizeTopic(nextTopic));
        cbUserTopic = normalizeTopic(nextTopic);
        await showMainMenu(cbChatId, false, cbUserLevel, cbUserTopic);
      } else if (data === 'basic_words_day') {
        const goal = await getDailyGoal(cbChatId);
        const words = filterByTopic(filterByLevel(getWordsOfDayBasic(goal, null), cbUserLevel), cbUserTopic);
        const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic).length;
        const msg =
          formatWordsMessage(words, `📚 🇬🇧 <b>Слова дня — ${escapeHtml(levelLabel(cbUserLevel))}</b>`) +
          `\n\n📌 В подборке: <b>${poolCount}</b> слов`;
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [{ text: '🔄 Ещё слова', callback_data: 'basic_words_more' }],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        });
        await answerCb();
      } else if (data === 'basic_words_more') {
        const goal = await getDailyGoal(cbChatId);
        const words = filterByTopic(filterByLevel(getRandomWordsBasic(goal), cbUserLevel), cbUserTopic);
        const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic).length;
        const msg = formatWordsMessage(
          words,
          `📚 🇬🇧 <b>Ещё слова — ${escapeHtml(levelLabel(cbUserLevel))}</b>\n${escapeHtml(topicLabel(cbUserTopic))}.`,
        ) + `\n\n📌 В подборке: <b>${poolCount}</b> слов`;
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [{ text: '🔄 Ещё слова', callback_data: 'basic_words_more' }],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        });
        await answerCb();
      } else if (data === 'basic_learn_next') {
        await answerCb();
        const pool = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic);
        const word = pool.length ? pool[Math.floor(Math.random() * pool.length)] : getRandomWordBasic();
        const msg = `📖 🇬🇧 <b>Как переводится?</b>\n\n<code>${escapeHtml(word.term)}</code>`;
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [
              { text: 'Показать перевод', callback_data: `basic_learn_show_${word.id}` },
              { text: 'Следующее →', callback_data: 'basic_learn_next' },
            ],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        });
      } else if (data.startsWith('basic_learn_show_')) {
        const wordId = data.slice('basic_learn_show_'.length);
        const word = getWordByIdBasic(wordId);
        if (word) {
          // отметить слово как "выученное" (показали перевод)
          await markWordSeen(cbChatId, wordId);
          let ex = '';
          if (word.example) {
            ex = `\n\n<i>${escapeHtml(word.example)}</i>`;
          }
          let exRu = '';
          if (word.exampleRu) {
            exRu = `\n<i>${escapeHtml(word.exampleRu)}</i>`;
          }
          const msg =
            `📖 🇬🇧 <b>${escapeHtml(word.term)}</b>\n\n→ ${escapeHtml(word.translation)}${ex}${exRu}\n\n<i>${escapeHtml(
              word.moduleRu,
            )}</i>`;
          await editMessageText(token, cbChatId, cb.message.message_id, msg, {
            inline_keyboard: [
              buildLevelRow(cbUserLevel),
              [
                { text: 'Следующее слово →', callback_data: 'basic_learn_next' },
                { text: '📂 Темы', callback_data: 'basic_topics_page_0' },
              ],
              [{ text: '🏠 Меню', callback_data: 'basic_menu' }],
            ],
          });
        }
        await answerCb();
      } else if (data === 'basic_quiz_next') {
        await answerCb();
        const pool = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic);
        const baseWord = pool.length ? pool[Math.floor(Math.random() * pool.length)] : getRandomWordBasic();
        const basePool = pool.length ? pool : filterByLevel(BASIC_WORDS, cbUserLevel);
        const others = basePool.filter((w) => w.id !== baseWord.id);
        const wrong = [];
        const usedTranslations = new Set([baseWord.translation]);
        const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
        for (const w of shuffledOthers) {
          if (wrong.length >= 3) break;
          if (!usedTranslations.has(w.translation)) {
            wrong.push(w.translation);
            usedTranslations.add(w.translation);
          }
        }
        const options = [{ text: baseWord.translation, correct: true }, ...wrong.map((t) => ({ text: t, correct: false }))];
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        const correctIndex = options.findIndex((o) => o.correct);
        const optionsWithData = options.map((o, idx) => ({
          text: o.text,
          callbackData: `quiz_basic_${baseWord.id}__${correctIndex}__${idx}`.slice(0, 64),
        }));
        const word = baseWord;
        const msg =
          `🎯 🇬🇧 <b>Как переводится</b> <code>${escapeHtml(word.term)}</code>?\n\n` +
          'Выберите правильный перевод.\n\n' +
          '💡 Сначала попробуйте вспомнить сами, потом нажимайте вариант.';
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            ...optionsWithData.map((o) => [{ text: o.text, callback_data: o.callbackData }]),
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        });
      } else if (data.startsWith('quiz_basic_')) {
        const parts = data.split('__');
        const questionId = (parts[0] || '').replace(/^quiz_basic_/, '');
        const correctIndex = parseInt(parts[1], 10);
        const chosenIndex = parseInt(parts[2], 10);
        const word = getWordByIdBasic(questionId);
        const isCorrect = word && correctIndex === chosenIndex;
        const base = word
          ? isCorrect
            ? `✅ <b>Верно!</b>\n\n<code>${escapeHtml(word.term)}</code> — ${escapeHtml(word.translation)}`
            : `❌ <b>Неверно.</b> Правильно: <code>${escapeHtml(word.term)}</code> — ${escapeHtml(word.translation)}`
          : 'Ошибка';
        // статистика квиза
        const lvl = normalizeLevel(word?.level);
        await incrementQuizStats(cbChatId, lvl, isCorrect);
        const hint = '\n\n💡 Можно повторить это слово ещё раз в режиме «📖 Учить слова».';
        const resultMsg = base + hint;
        await editMessageText(token, cbChatId, cb.message.message_id, resultMsg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [{ text: 'Следующий вопрос →', callback_data: 'basic_quiz_next' }],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        });
        await answerCb();
      } else if (data === 'basic_subscribe_daily') {
        await answerCb();
        if (await addSubscriber(cbChatId)) {
          await sendMessage(
            token,
            cbChatId,
            '✅ Подписка оформлена! Каждый день вы будете получать простые слова.\n\nОтписаться: /unsubscribe',
          );
        } else {
          await sendMessage(token, cbChatId, '⚠️ Подписка временно недоступна. Попробуйте /subscribe позже.');
        }
      } else if (data === 'basic_unsubscribe_daily') {
        await answerCb();
        if (await removeSubscriber(cbChatId)) {
          await sendMessage(token, cbChatId, 'Вы отписаны. Подписаться снова: /subscribe');
        } else {
          await sendMessage(token, cbChatId, 'Подписка не была активна.');
        }
      } else {
        await answerCb();
      }
    }
  } catch (e) {
    console.error('Webhook-basic error:', e);
  }

  res.status(200).json({ ok: true });
}

