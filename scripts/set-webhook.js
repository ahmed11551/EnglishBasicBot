#!/usr/bin/env node
/**
 * Однократная настройка вебхука для бота @EnglishMgimo_bot.
 * Требует BOT_TOKEN (и опционально APP_URL) в .env.
 * Запуск: npm run set-webhook  (dotenv подхватывает .env через -r dotenv/config)
 */

const token = (process.env.BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
const appUrl = process.env.APP_URL || 'https://english-mgimo.vercel.app';
const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/webhook`;

if (!token) {
  console.error('Ошибка: задайте BOT_TOKEN в .env (скопируйте .env.example в .env и вставьте токен).');
  process.exit(1);
}

const base = `https://api.telegram.org/bot${token}`;

// Сначала проверяем токен через getMe
const meRes = await fetch(`${base}/getMe`);
const meData = await meRes.json();
if (!meData.ok) {
  if (meData.error_code === 401 || meRes.status === 404) {
    console.error('Ошибка: неверный или отозванный токен бота.');
    console.error('Получите новый токен в @BotFather (команда /mybots → выберите бота → API Token).');
    console.error('Если токен меняли — в BotFather: /revoke, затем вставьте новый токен в .env и в Vercel.');
  } else {
    console.error('Ошибка Telegram:', meData);
  }
  process.exit(1);
}
console.log('Бот:', meData.result.username);

console.log('Настройка вебхука...');
console.log('URL:', webhookUrl);

const res = await fetch(`${base}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
const data = await res.json();

if (data.ok) {
  console.log('Вебхук успешно установлен.');
} else {
  console.error('Ошибка:', data);
  if (data.error_code === 404) {
    console.error('Токен не подходит или бот удалён. Проверьте BOT_TOKEN в .env и при необходимости получите новый в @BotFather.');
  }
  process.exit(1);
}
