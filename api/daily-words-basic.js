/**
 * Рассылка «Слова дня» подписчикам BASIC ENGLISH бота.
 * Вызывается Vercel Cron раз в день.
 * Отправляет 5 простых 🇬🇧 English слов.
 * Требует: BASIC_BOT_TOKEN (или BOT_TOKEN), CRON_SECRET (опционально), Vercel KV (подписчики в ключе basic_daily_subscribers).
 */

import { BASIC_WORDS } from './basicWordsData.js';
import {
  getSubscribers,
  getUserProfile,
  getUserSeenIds,
} from './storage-basic.js';

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatWordsBlock(words) {
  const lines = words.map((w, i) => {
    const num = i + 1;
    let ex = '';
    if (w.example) ex = `\n   <i>${escapeHtml(w.example)}</i>`;
    return `${num}. <b>${escapeHtml(w.term)}</b> — ${escapeHtml(w.translation)}${ex}`;
  });
  return `${lines.join('\n\n')}`;
}

// FNV-1a inspired hash (same idea as in wordsData)
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function normalizeLevel(level) {
  const s = String(level || '').trim().toUpperCase();
  return s === 'A2' || s === 'B1' ? s : 'A1';
}

function normalizeTopic(topic) {
  const t = String(topic || '').trim();
  return t ? t : 'ALL';
}

function filterByLevel(words, level) {
  const l = normalizeLevel(level);
  return words.filter((w) => normalizeLevel(w?.level) === l);
}

function filterByTopic(words, topic) {
  const t = normalizeTopic(topic);
  if (t === 'ALL') return words;
  return words.filter((w) => String(w?.moduleRu || '').trim() === t);
}

function pickWordsOfDayFromPool(pool, count, dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const seed = hashStr(date);
  const shuffled = [...pool].sort((a, b) => {
    const ha = (seed ^ hashStr(String(a.id))) >>> 0;
    const hb = (seed ^ hashStr(String(b.id))) >>> 0;
    return ha - hb;
  });
  return shuffled.slice(0, count);
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
  if (!data.ok) console.error('Telegram send error for (basic)', chatId, data);
  return data;
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${cronSecret}`) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
  }

  const token = process.env.BASIC_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    res.status(500).json({ ok: false, error: 'BASIC_BOT_TOKEN/BOT_TOKEN not set' });
    return;
  }

  try {
    const chatIds = await getSubscribers();
    if (chatIds.length === 0) {
      res.status(200).json({ ok: true, sent: 0 });
      return;
    }

    let sent = 0;
    for (const chatId of chatIds) {
      try {
        const profile = await getUserProfile(chatId);
        const level = normalizeLevel(profile.level);
        const topic = normalizeTopic(profile.topic);

        const levelPool = filterByLevel(BASIC_WORDS, level);
        const topicPool = filterByTopic(levelPool, topic);
        const pool = topicPool.length >= 5 ? topicPool : levelPool;

        // исключаем уже "выученные" слова пользователя
        const seen = await getUserSeenIds(chatId);
        const seenSet = new Set((seen || []).map(String));
        const newPool = pool.filter((w) => !seenSet.has(String(w.id)));
        const finalPool = newPool.length >= 5 ? newPool : pool; // fallback, если новых мало

        const words = pickWordsOfDayFromPool(finalPool, 5, null);
        const block = formatWordsBlock(words);

        const title = `📚 🇬🇧 <b>Слова дня</b>\n🎚️ ${escapeHtml(level)} • 📂 ${escapeHtml(topic === 'ALL' ? 'Все темы' : topic)}`;
        const noteNew = newPool.length >= 5 ? '✨ Сегодня — новые слова из вашей подборки.\n\n' : '';

        const message =
          `${title}\n\n${block}\n\n` +
          noteNew +
          '🎯 Цель дня: выучите 5 слов (нажмите «Показать перевод» в режиме «📖 Учить слова»).\n\n' +
          '💡 Повторяйте вслух и придумайте своё предложение с каждым словом.';

        const keyboard = {
          inline_keyboard: [
            [{ text: '📖 Учить слова', callback_data: 'basic_learn_next' }],
            [{ text: '🏠 Меню', callback_data: 'basic_menu' }],
          ],
        };

        const result = await sendMessage(token, String(chatId), message, keyboard);
        if (result.ok) sent++;
        else if (result.error_code === 403 || result.description?.includes('blocked')) {
          // если пользователь заблокировал бота, хранилище само может решить, удалять ли подписку
          // здесь просто продолжаем
        }
      } catch (e) {
        console.error('Send to (basic)', chatId, e);
      }
    }

    res.status(200).json({ ok: true, sent, total: chatIds.length });
  } catch (e) {
    console.error('daily-words-basic error:', e);
    res.status(500).json({ ok: false, error: String(e.message) });
  }
}

