/**
 * Админская рассылка по всем пользователям basic-бота.
 * POST /api/admin-broadcast-basic
 * Заголовок: Authorization: Bearer <ADMIN_BROADCAST_SECRET>
 * Тело: { text: "Сообщение для рассылки" }
 */

import { KV_KEYS } from './kvSchema-basic.js';

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendMessage(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  if (!data.ok) console.error('Telegram admin-broadcast send error for', chatId, data);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const secret = process.env.ADMIN_BROADCAST_SECRET;
  if (!secret) {
    res.status(500).json({ ok: false, error: 'ADMIN_BROADCAST_SECRET not set' });
    return;
  }

  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  const token = process.env.BASIC_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    res.status(500).json({ ok: false, error: 'BASIC_BOT_TOKEN/BOT_TOKEN not set' });
    return;
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    res.status(500).json({ ok: false, error: 'Vercel KV not configured' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const rawText = body?.text;
  if (!rawText || typeof rawText !== 'string') {
    res.status(400).json({ ok: false, error: 'text is required' });
    return;
  }

  let kv;
  try {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Vercel KV not available' });
    return;
  }

  try {
    const chatIds = await kv.smembers(KV_KEYS.allUsers);
    if (!chatIds || chatIds.length === 0) {
      res.status(200).json({ ok: true, sent: 0, total: 0 });
      return;
    }

    const text = escapeHtml(rawText);
    let sent = 0;
    for (const chatId of chatIds) {
      try {
        const result = await sendMessage(token, String(chatId), text);
        if (result.ok) {
          sent++;
        } else if (result.error_code === 403 || result.description?.includes('blocked')) {
          await kv.srem(KV_KEYS.allUsers, chatId);
        }
      } catch (e) {
        console.error('Admin broadcast send to', chatId, e);
      }
    }

    res.status(200).json({ ok: true, sent, total: chatIds.length });
  } catch (e) {
    console.error('admin-broadcast-basic error:', e);
    res.status(500).json({ ok: false, error: String(e.message) });
  }
}

