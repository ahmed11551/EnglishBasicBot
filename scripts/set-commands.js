#!/usr/bin/env node
/**
 * Установка команд бота и кнопки меню (ссылка на приложение).
 * Требует BOT_TOKEN и APP_URL в .env.
 * Запуск: npm run set-commands
 * Подходит для текущего бота или нового — просто укажите нужный BOT_TOKEN в .env.
 */

const token = (process.env.BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
const appUrl = (process.env.APP_URL || 'https://english-mgimo.vercel.app').replace(/\/$/, '');

if (!token) {
  console.error('Ошибка: задайте BOT_TOKEN в .env');
  process.exit(1);
}

const base = `https://api.telegram.org/bot${token}`;

const commands = [
  { command: 'start', description: 'Начать' },
  { command: 'help', description: 'Помощь и команды' },
  { command: 'words', description: 'Слова дня (5 слов)' },
  { command: 'subscribe', description: 'Присылать слова каждый день' },
  { command: 'unsubscribe', description: 'Отписаться от рассылки' },
  { command: 'learn', description: 'Учить по одному слову' },
  { command: 'quiz', description: 'Квиз: угадай перевод' },
  { command: 'app', description: 'Открыть приложение' },
];

async function main() {
  const meRes = await fetch(`${base}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    console.error('Ошибка: неверный токен. Проверьте BOT_TOKEN в .env');
    process.exit(1);
  }
  console.log('Бот:', meData.result.username);

  const setCommandsRes = await fetch(`${base}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });
  const setCommandsData = await setCommandsRes.json();
  if (setCommandsData.ok) {
    console.log('Команды установлены.');
  } else {
    console.error('Ошибка setMyCommands:', setCommandsData);
  }

  const menuButton = {
    type: 'web_app',
    text: 'Открыть приложение',
    web_app: { url: appUrl },
  };
  const setMenuRes = await fetch(`${base}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menu_button: menuButton }),
  });
  const setMenuData = await setMenuRes.json();
  if (setMenuData.ok) {
    console.log('Кнопка меню установлена:', appUrl);
  } else {
    console.error('Ошибка setChatMenuButton:', setMenuData);
  }

  console.log('Готово. Напишите боту /start — должны отображаться команды и кнопка приложения.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
