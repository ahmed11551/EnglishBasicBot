#!/usr/bin/env node
/**
 * Проверка вебхука и токена бота.
 * Запуск: npm run check-webhook
 * Требует BOT_TOKEN в .env
 */

const token = (process.env.BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');

if (!token) {
  console.error('Ошибка: задайте BOT_TOKEN в .env');
  process.exit(1);
}

const base = `https://api.telegram.org/bot${token}`;

async function main() {
  const meRes = await fetch(`${base}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    console.error('Токен неверный или бот удалён:', meData.description || meData);
    process.exit(1);
  }
  console.log('Бот:', '@' + meData.result.username);

  const whRes = await fetch(`${base}/getWebhookInfo`);
  const whData = await whRes.json();
  if (!whData.ok) {
    console.error('Ошибка getWebhookInfo:', whData);
    process.exit(1);
  }
  const url = whData.result?.url || '';
  if (url) {
    console.log('Вебхук установлен:', url);
  } else {
    console.log('Вебхук НЕ установлен. Выполните: npm run set-webhook');
  }
  if (whData.result?.pending_update_count) {
    console.log('Ожидающих обновлений:', whData.result.pending_update_count);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
