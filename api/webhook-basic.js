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
import { KV_KEYS } from './kvSchema-basic.js';

const LEVELS = ['A1', 'A2', 'B1'];
const TOPICS_PAGE_SIZE = 8;

async function getKV() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const kvModule = await import('@vercel/kv');
    return kvModule.kv ?? null;
  } catch (e) {
    console.error('KV import error (basic):', e?.message || e);
    return null;
  }
}

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

async function getUserProgress(kv, chatId) {
  if (!kv || chatId == null) return null;
  try {
    const [seenCount, quizTotal, quizCorrect] = await Promise.all([
      kv.scard(KV_KEYS.userSeen(chatId)),
      kv.get(KV_KEYS.userQuizTotal(chatId)),
      kv.get(KV_KEYS.userQuizCorrect(chatId)),
    ]);
    const total = Number.parseInt(String(quizTotal ?? '0'), 10) || 0;
    const correct = Number.parseInt(String(quizCorrect ?? '0'), 10) || 0;
    return {
      seenCount: Number(seenCount) || 0,
      quizTotal: total,
      quizCorrect: correct,
    };
  } catch (e) {
    return null;
  }
}

async function getUserSeenIds(kv, chatId) {
  if (!kv || chatId == null) return [];
  try {
    const ids = await kv.smembers(KV_KEYS.userSeen(chatId));
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch (e) {
    return [];
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyGoal(kv, chatId) {
  if (!kv || chatId == null) return 5;
  try {
    const v = await kv.get(KV_KEYS.userDailyGoal(chatId));
    const n = Number.parseInt(String(v ?? '5'), 10);
    return Number.isFinite(n) && n > 0 && n <= 50 ? n : 5;
  } catch (e) {
    return 5;
  }
}

async function getDailySeenCount(kv, chatId, dateStr = null) {
  if (!kv || chatId == null) return 0;
  const d = dateStr || todayKey();
  try {
    const c = await kv.scard(KV_KEYS.userSeenDaily(chatId, d));
    return Number(c) || 0;
  } catch (e) {
    return 0;
  }
}

async function getQuizProgressByLevel(kv, chatId) {
  if (!kv || chatId == null) return null;
  try {
    const keys = LEVELS.flatMap((l) => [
      kv.get(KV_KEYS.userQuizTotalByLevel(chatId, l)),
      kv.get(KV_KEYS.userQuizCorrectByLevel(chatId, l)),
    ]);
    const values = await Promise.all(keys);
    const out = {};
    for (let i = 0; i < LEVELS.length; i++) {
      const l = LEVELS[i];
      const totalRaw = values[i * 2];
      const correctRaw = values[i * 2 + 1];
      const total = Number.parseInt(String(totalRaw ?? '0'), 10) || 0;
      const correct = Number.parseInt(String(correctRaw ?? '0'), 10) || 0;
      out[l] = { total, correct };
    }
    return out;
  } catch (e) {
    return null;
  }
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

async function resetUserStats(kv, chatId) {
  if (!kv || chatId == null) return false;
  const cid = String(chatId);
  try {
    const keys = [
      KV_KEYS.userSeen(cid),
      // ежедневные ключи не трогаем (их может быть много), но сбрасываем текущий день
      KV_KEYS.userSeenDaily(cid, todayKey()),
      KV_KEYS.userDailyGoal(cid),
      KV_KEYS.userQuizTotal(cid),
      KV_KEYS.userQuizCorrect(cid),
      ...LEVELS.map((l) => KV_KEYS.userQuizTotalByLevel(cid, l)),
      ...LEVELS.map((l) => KV_KEYS.userQuizCorrectByLevel(cid, l)),
    ];
    await Promise.all(keys.map((k) => kv.del(k)));
    return true;
  } catch (e) {
    return false;
  }
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

    const kvForUser = await getKV();
    if (chatId != null && kvForUser) {
      try {
        await kvForUser.sadd(KV_KEYS.allUsers, String(chatId));
      } catch (e) {
        console.error('KV sadd all_users error (basic):', e?.message || e);
      }
    }

    if (chatId == null && !body?.callback_query) {
      res.status(200).json({ ok: true });
      return;
    }

    // выбранный уровень пользователя (KV) или дефолт A1
    let userLevel = 'A1';
    if (chatId != null && kvForUser) {
      try {
      const saved = await kvForUser.get(KV_KEYS.userLevel(chatId));
        userLevel = normalizeLevel(saved);
      } catch (e) {
        userLevel = 'A1';
      }
    }
    // выбранная тема пользователя (KV) или ALL
    let userTopic = 'ALL';
    if (chatId != null && kvForUser) {
      try {
      const savedTopic = await kvForUser.get(KV_KEYS.userTopic(chatId));
        userTopic = normalizeTopic(savedTopic);
      } catch (e) {
        userTopic = 'ALL';
      }
    }

    const isStart = text === '/start' || text === '/start start';
    const isHelp = /^\/help(@\w+)?$/i.test(text);
    const isWords = /^\/words(@\w+)?$/i.test(text) || /^(слова дня|новые слова|слова|ещё слова)$/i.test(text);
    const isLearn = /^\/learn(@\w+)?$/i.test(text) || /^(учить|учиться|обучение|слово)$/i.test(text);
    const isQuiz = /^\/quiz(@\w+)?$/i.test(text) || /^(квиз|тест|проверка)$/i.test(text);
    const isStats = /^\/stats(@\w+)?$/i.test(text) || /^(статистика|прогресс|stats)$/i.test(text);
    const isResetStats = /^\/reset_stats(@\w+)?$/i.test(text) || /^\/resetstats(@\w+)?$/i.test(text);
    const isGoal = /^\/goal(@\w+)?/i.test(text) || /^(цель|цель дня)$/i.test(text);
    const isMenu = /^\/menu(@\w+)?$/i.test(text);
    const isSubscribe = /^\/subscribe(@\w+)?$/i.test(text);
    const isUnsubscribe = /^\/unsubscribe(@\w+)?$/i.test(text);

    const showMainMenu = async (targetChatId, withIntro, currentLevel = 'A1', currentTopic = 'ALL') => {
      const current = normalizeLevel(currentLevel);
      const topic = normalizeTopic(currentTopic);
      const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, current), topic).length;
      const [progress, goal, dailySeen] = await Promise.all([
        getUserProgress(kvForUser, targetChatId),
        getDailyGoal(kvForUser, targetChatId),
        getDailySeenCount(kvForUser, targetChatId),
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
        (kvForUser ? `🎯 <b>Цель дня</b>: ${dailySeen}/${goal}\n\n` : '') +
        (progress
          ? `📈 <b>Прогресс</b>: выучено ${progress.seenCount} • квиз ${progress.quizCorrect}/${progress.quizTotal}\n\n`
          : '') +
        '📝 <b>Слова дня</b> — 5 слов на сегодня\n' +
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
          [{ text: '📊 Статистика', callback_data: 'basic_stats' }],
          [{ text: '🎯 Цель дня', callback_data: 'basic_goal' }],
        ],
      };

      const kvStart = await getKV();
      if (kvStart) {
        keyboard.inline_keyboard.push([
          { text: '📬 Подписаться', callback_data: 'basic_subscribe_daily' },
          { text: '❌ Отписаться', callback_data: 'basic_unsubscribe_daily' },
        ]);
      }

      await sendMessage(token, targetChatId, textMenu, keyboard);
    };

    if (isStart) {
      await showMainMenu(chatId, true, userLevel, userTopic);
    } else if (isHelp || isMenu) {
      await showMainMenu(chatId, false, userLevel, userTopic);
    } else if (isGoal) {
      if (!kvForUser) {
        await sendMessage(token, chatId, '⚠️ Цель дня доступна, если включён Vercel KV.', buildQuickNavKeyboard());
      } else {
        const goal = await getDailyGoal(kvForUser, chatId);
        const dailySeen = await getDailySeenCount(kvForUser, chatId);
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
      }
    } else if (isStats) {
      if (!kvForUser) {
        await sendMessage(token, chatId, '⚠️ Статистика доступна, если включён Vercel KV.', buildQuickNavKeyboard());
      } else {
        const [progress, seenIds, quizByLevel] = await Promise.all([
          getUserProgress(kvForUser, chatId),
          getUserSeenIds(kvForUser, chatId),
          getQuizProgressByLevel(kvForUser, chatId),
        ]);
        const seenBreakdown = computeSeenBreakdown(seenIds);
        const selection = computeCurrentSelectionProgress(seenIds, userLevel, userTopic);
        const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, userLevel), userTopic).length;
        const percent =
          progress && progress.quizTotal > 0 ? Math.round((progress.quizCorrect / progress.quizTotal) * 100) : 0;
        const percentA1 =
          quizByLevel && quizByLevel.A1.total > 0 ? Math.round((quizByLevel.A1.correct / quizByLevel.A1.total) * 100) : 0;
        const percentA2 =
          quizByLevel && quizByLevel.A2.total > 0 ? Math.round((quizByLevel.A2.correct / quizByLevel.A2.total) * 100) : 0;
        const percentB1 =
          quizByLevel && quizByLevel.B1.total > 0 ? Math.round((quizByLevel.B1.correct / quizByLevel.B1.total) * 100) : 0;
        const topTopicsText =
          seenBreakdown.topTopics.length > 0
            ? '\n' +
              seenBreakdown.topTopics
                .map(([m, c], idx) => `${idx + 1}. ${escapeHtml(m)} — <b>${c}</b>`)
                .join('\n')
            : '—';
        const msg =
          `📊 <b>Статистика</b>\n\n` +
          `🎚️ Уровень: <b>${escapeHtml(levelLabel(userLevel))}</b>\n` +
          `📂 Тема: <b>${escapeHtml(topicLabel(userTopic))}</b>\n` +
          `📌 В подборке: <b>${poolCount}</b> слов\n\n` +
          `📍 <b>Прогресс в текущей подборке</b>: <b>${selection.seenInPool}/${selection.total}</b> (${selection.percent}%)\n\n` +
          `✅ Выучено (показали перевод): <b>${progress?.seenCount ?? 0}</b>\n` +
          `🎯 Квиз: <b>${progress?.quizCorrect ?? 0}/${progress?.quizTotal ?? 0}</b> (${percent}%)\n\n` +
          `📚 <b>Выучено по уровням</b>\n` +
          `A1: <b>${seenBreakdown.byLevel.A1}</b> • A2: <b>${seenBreakdown.byLevel.A2}</b> • B1: <b>${seenBreakdown.byLevel.B1}</b>\n\n` +
          `🎯 <b>Квиз по уровням</b>\n` +
          `A1: <b>${quizByLevel?.A1.correct ?? 0}/${quizByLevel?.A1.total ?? 0}</b> (${percentA1}%)\n` +
          `A2: <b>${quizByLevel?.A2.correct ?? 0}/${quizByLevel?.A2.total ?? 0}</b> (${percentA2}%)\n` +
          `B1: <b>${quizByLevel?.B1.correct ?? 0}/${quizByLevel?.B1.total ?? 0}</b> (${percentB1}%)\n\n` +
          `🏷️ <b>Топ тем (выучено)</b>\n${topTopicsText}\n\n` +
          `💡 Совет: лучше 5–10 минут каждый день, чем редко и долго.`;
        await sendMessage(token, chatId, msg, {
          inline_keyboard: [
            buildLevelRow(userLevel),
            [
              { text: '🧹 Сбросить статистику', callback_data: 'basic_stats_reset_confirm' },
              { text: '🏠 Меню', callback_data: 'basic_menu' },
            ],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }],
          ],
        });
      }
    } else if (isResetStats) {
      if (!kvForUser) {
        await sendMessage(token, chatId, '⚠️ Сброс статистики доступен, если включён Vercel KV.', buildQuickNavKeyboard());
      } else {
        await sendMessage(
          token,
          chatId,
          '🧹 <b>Сбросить статистику?</b>\n\nЭто удалит:\n- выученные слова (по кнопке «Показать перевод»)\n- результаты квиза\n\nПродолжить?',
          {
            inline_keyboard: [
              [{ text: 'Да, сбросить', callback_data: 'basic_stats_reset_do' }],
              [{ text: 'Отмена', callback_data: 'basic_stats' }],
            ],
          },
        );
      }
    } else if (isSubscribe) {
      const kvSub = await getKV();
      if (kvSub) {
        try {
            await kvSub.sadd(KV_KEYS.subscribers, String(chatId));
          await sendMessage(
            token,
            chatId,
            '✅ Вы подписаны на ежедневные простые слова.\nКаждый день бот пришлёт набор базовых слов.\n\nОтписаться: /unsubscribe',
          );
        } catch (e) {
          console.error('KV sadd error (basic):', e?.message || e, e);
          await sendMessage(
            token,
            chatId,
            '⚠️ Подписка временно недоступна. Попробуйте позже. Команды /words, /learn и /quiz работают без подписки.',
          );
        }
      } else {
        await sendMessage(
          token,
          chatId,
          '📬 Подписка на рассылку пока не настроена (нужен Vercel KV). Пользуйтесь командами /words, /learn и /quiz.',
        );
      }
    } else if (isUnsubscribe) {
      const kvUn = await getKV();
      if (kvUn) {
        try {
          await kvUn.srem(KV_KEYS.subscribers, String(chatId));
          await sendMessage(token, chatId, 'Вы отписаны от рассылки. Подписаться снова: /subscribe');
        } catch (e) {
          console.error('KV srem error (basic):', e?.message || e, e);
          await sendMessage(token, chatId, 'Не удалось отписаться. Попробуйте позже.');
        }
      } else {
        await sendMessage(token, chatId, 'Подписка не была активна.');
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
      const words = filterByTopic(filterByLevel(getWordsOfDayBasic(5, null), userLevel), userTopic);
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

      const kvCb = await getKV();
      // уровень для callback (KV) или дефолт A1
      let cbUserLevel = 'A1';
      if (kvCb && cbChatId != null) {
        try {
          const saved = await kvCb.get(KV_KEYS.userLevel(cbChatId));
          cbUserLevel = normalizeLevel(saved);
        } catch (e) {
          cbUserLevel = 'A1';
        }
      }
      // тема для callback (KV) или ALL
      let cbUserTopic = 'ALL';
      if (kvCb && cbChatId != null) {
        try {
          const saved = await kvCb.get(KV_KEYS.userTopic(cbChatId));
          cbUserTopic = normalizeTopic(saved);
        } catch (e) {
          cbUserTopic = 'ALL';
        }
      }

      const answerCb = () =>
        fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: cb.id }),
        });

      if (data === 'basic_level_A1' || data === 'basic_level_A2' || data === 'basic_level_B1') {
        const nextLevel = data.replace('basic_level_', '');
        await answerCb();
        if (kvCb && cbChatId != null) {
          try {
            await kvCb.set(KV_KEYS.userLevel(cbChatId), normalizeLevel(nextLevel));
          } catch (e) {
            console.error('KV set user level error (basic):', e?.message || e);
          }
          // если текущей темы нет в новом уровне — сбрасываем на ALL
          try {
            const topics = getTopicsForLevel(nextLevel);
            if (normalizeTopic(cbUserTopic) !== 'ALL' && !topics.includes(cbUserTopic)) {
              cbUserTopic = 'ALL';
              await kvCb.set(KV_KEYS.userTopic(cbChatId), 'ALL');
            }
          } catch (e) {
            // ignore
          }
        }
        await showMainMenu(cbChatId, false, nextLevel, cbUserTopic);
      } else if (data === 'basic_menu') {
        await answerCb();
        await showMainMenu(cbChatId, false, cbUserLevel, cbUserTopic);
      } else if (data === 'basic_goal') {
        await answerCb();
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Цель дня доступна, если включён Vercel KV.', buildQuickNavKeyboard());
          return;
        }
        const goal = await getDailyGoal(kvCb, cbChatId);
        const dailySeen = await getDailySeenCount(kvCb, cbChatId);
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
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Цель дня доступна, если включён Vercel KV.', buildQuickNavKeyboard());
          return;
        }
        const n = parseInt(data.slice('basic_goal_set_'.length), 10);
        if (Number.isFinite(n) && n > 0 && n <= 50) {
          try {
            await kvCb.set(KV_KEYS.userDailyGoal(cbChatId), n);
          } catch (e) {
            // ignore
          }
        }
        await showMainMenu(cbChatId, false, cbUserLevel, cbUserTopic);
      } else if (data === 'basic_stats') {
        await answerCb();
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Статистика доступна, если включён Vercel KV.', buildQuickNavKeyboard());
          return;
        }
        const [progress, seenIds, quizByLevel] = await Promise.all([
          getUserProgress(kvCb, cbChatId),
          getUserSeenIds(kvCb, cbChatId),
          getQuizProgressByLevel(kvCb, cbChatId),
        ]);
        const seenBreakdown = computeSeenBreakdown(seenIds);
        const selection = computeCurrentSelectionProgress(seenIds, cbUserLevel, cbUserTopic);
        const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic).length;
        const percent =
          progress && progress.quizTotal > 0 ? Math.round((progress.quizCorrect / progress.quizTotal) * 100) : 0;
        const percentA1 =
          quizByLevel && quizByLevel.A1.total > 0 ? Math.round((quizByLevel.A1.correct / quizByLevel.A1.total) * 100) : 0;
        const percentA2 =
          quizByLevel && quizByLevel.A2.total > 0 ? Math.round((quizByLevel.A2.correct / quizByLevel.A2.total) * 100) : 0;
        const percentB1 =
          quizByLevel && quizByLevel.B1.total > 0 ? Math.round((quizByLevel.B1.correct / quizByLevel.B1.total) * 100) : 0;
        const topTopicsText =
          seenBreakdown.topTopics.length > 0
            ? '\n' +
              seenBreakdown.topTopics
                .map(([m, c], idx) => `${idx + 1}. ${escapeHtml(m)} — <b>${c}</b>`)
                .join('\n')
            : '—';
        const msg =
          `📊 <b>Статистика</b>\n\n` +
          `🎚️ Уровень: <b>${escapeHtml(levelLabel(cbUserLevel))}</b>\n` +
          `📂 Тема: <b>${escapeHtml(topicLabel(cbUserTopic))}</b>\n` +
          `📌 В подборке: <b>${poolCount}</b> слов\n\n` +
          `📍 <b>Прогресс в текущей подборке</b>: <b>${selection.seenInPool}/${selection.total}</b> (${selection.percent}%)\n\n` +
          `✅ Выучено (показали перевод): <b>${progress?.seenCount ?? 0}</b>\n` +
          `🎯 Квиз: <b>${progress?.quizCorrect ?? 0}/${progress?.quizTotal ?? 0}</b> (${percent}%)\n\n` +
          `📚 <b>Выучено по уровням</b>\n` +
          `A1: <b>${seenBreakdown.byLevel.A1}</b> • A2: <b>${seenBreakdown.byLevel.A2}</b> • B1: <b>${seenBreakdown.byLevel.B1}</b>\n\n` +
          `🎯 <b>Квиз по уровням</b>\n` +
          `A1: <b>${quizByLevel?.A1.correct ?? 0}/${quizByLevel?.A1.total ?? 0}</b> (${percentA1}%)\n` +
          `A2: <b>${quizByLevel?.A2.correct ?? 0}/${quizByLevel?.A2.total ?? 0}</b> (${percentA2}%)\n` +
          `B1: <b>${quizByLevel?.B1.correct ?? 0}/${quizByLevel?.B1.total ?? 0}</b> (${percentB1}%)\n\n` +
          `🏷️ <b>Топ тем (выучено)</b>\n${topTopicsText}`;
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [
              { text: '🧹 Сбросить', callback_data: 'basic_stats_reset_confirm' },
              { text: '🏠 Меню', callback_data: 'basic_menu' },
            ],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }],
          ],
        });
      } else if (data === 'basic_stats_reset_confirm') {
        await answerCb();
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Сброс статистики доступен, если включён Vercel KV.', buildQuickNavKeyboard());
          return;
        }
        await sendMessage(
          token,
          cbChatId,
          '🧹 <b>Сбросить статистику?</b>\n\nЭто удалит выученные слова и результаты квиза.\n\nПродолжить?',
          {
            inline_keyboard: [
              [{ text: 'Да, сбросить', callback_data: 'basic_stats_reset_do' }],
              [{ text: 'Отмена', callback_data: 'basic_stats' }],
            ],
          },
        );
      } else if (data === 'basic_stats_reset_do') {
        await answerCb();
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Сброс статистики доступен, если включён Vercel KV.', buildQuickNavKeyboard());
          return;
        }
        const ok = await resetUserStats(kvCb, cbChatId);
        await sendMessage(
          token,
          cbChatId,
          ok ? '✅ Статистика сброшена.' : '⚠️ Не удалось сбросить статистику. Попробуйте позже.',
          { inline_keyboard: [[{ text: '📊 Открыть статистику', callback_data: 'basic_stats' }], [{ text: '🏠 Меню', callback_data: 'basic_menu' }]] },
        );
      } else if (data === 'basic_topics_noop') {
        await answerCb();
      } else if (data.startsWith('basic_topics_page_')) {
        await answerCb();
        const page = parseInt(data.slice('basic_topics_page_'.length), 10);
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Темы доступны, если включён Vercel KV.');
          return;
        }
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
        if (!kvCb) {
          await sendMessage(token, cbChatId, '⚠️ Темы доступны, если включён Vercel KV.');
          return;
        }
        const idxRaw = data.slice('basic_topic_set_'.length);
        const idx = parseInt(idxRaw, 10);
        const topics = getTopicsForLevel(cbUserLevel);
        const nextTopic = idx === -1 ? 'ALL' : topics[idx] || 'ALL';
        try {
          await kvCb.set(KV_KEYS.userTopic(cbChatId), normalizeTopic(nextTopic));
          cbUserTopic = normalizeTopic(nextTopic);
        } catch (e) {
          console.error('KV set user topic error (basic):', e?.message || e);
        }
        await showMainMenu(cbChatId, false, cbUserLevel, cbUserTopic);
      } else if (data === 'basic_words_day') {
        const words = filterByTopic(filterByLevel(getWordsOfDayBasic(5, null), cbUserLevel), cbUserTopic);
        const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic).length;
        const msg =
          formatWordsMessage(words, `📚 🇬🇧 <b>Слова дня — ${escapeHtml(levelLabel(cbUserLevel))}</b>`) +
          `\n\n📌 В подборке: <b>${poolCount}</b> слов`;
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [{ text: '🔄 Ещё 5 слов', callback_data: 'basic_words_more' }],
            [{ text: '📂 Темы', callback_data: 'basic_topics_page_0' }, { text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        });
        await answerCb();
      } else if (data === 'basic_words_more') {
        const words = filterByTopic(filterByLevel(getRandomWordsBasic(5), cbUserLevel), cbUserTopic);
        const poolCount = filterByTopic(filterByLevel(BASIC_WORDS, cbUserLevel), cbUserTopic).length;
        const msg = formatWordsMessage(
          words,
          `📚 🇬🇧 <b>Ещё 5 слов — ${escapeHtml(levelLabel(cbUserLevel))}</b>\n${escapeHtml(topicLabel(cbUserTopic))}.`,
        ) + `\n\n📌 В подборке: <b>${poolCount}</b> слов`;
        await sendMessage(token, cbChatId, msg, {
          inline_keyboard: [
            buildLevelRow(cbUserLevel),
            [{ text: '🔄 Ещё 5 слов', callback_data: 'basic_words_more' }],
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
          if (kvCb && cbChatId != null) {
            try {
              await kvCb.sadd(KV_KEYS.userSeen(cbChatId), String(wordId));
              await kvCb.sadd(KV_KEYS.userSeenDaily(cbChatId, todayKey()), String(wordId));
            } catch (e) {
              // ignore
            }
          }
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
        if (kvCb && cbChatId != null) {
          try {
            await kvCb.incr(KV_KEYS.userQuizTotal(cbChatId));
            if (isCorrect) await kvCb.incr(KV_KEYS.userQuizCorrect(cbChatId));
            const lvl = normalizeLevel(word?.level);
            await kvCb.incr(KV_KEYS.userQuizTotalByLevel(cbChatId, lvl));
            if (isCorrect) await kvCb.incr(KV_KEYS.userQuizCorrectByLevel(cbChatId, lvl));
          } catch (e) {
            // ignore
          }
        }
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
        if (kvCb) {
          try {
            await kvCb.sadd(KV_KEYS.subscribers, String(cbChatId));
            await sendMessage(
              token,
              cbChatId,
              '✅ Подписка оформлена! Каждый день вы будете получать простые слова.\n\nОтписаться: /unsubscribe',
            );
          } catch (e) {
            console.error('KV sadd error (basic cb):', e?.message || e, e);
            await sendMessage(token, cbChatId, '⚠️ Подписка временно недоступна. Попробуйте /subscribe позже.');
          }
        } else {
          await sendMessage(
            token,
            cbChatId,
            '📬 Подписка пока не настроена на сервере (нужен Vercel KV). Пользуйтесь кнопками «Слова дня», «Учить» и «Квиз».',
          );
        }
      } else if (data === 'basic_unsubscribe_daily') {
        await answerCb();
        if (kvCb) {
          try {
            await kvCb.srem(KV_KEYS.subscribers, String(cbChatId));
            await sendMessage(token, cbChatId, 'Вы отписаны. Подписаться снова: /subscribe');
          } catch (e) {
            console.error('KV srem error (basic cb):', e?.message || e, e);
            await sendMessage(token, cbChatId, 'Не удалось отписаться. Попробуйте позже.');
          }
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

