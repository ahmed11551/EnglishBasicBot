# Где разместить приложение (хостинг)

Приложение — статический SPA (папка `dist/` после `npm run build`). Нужен хостинг с **HTTPS** (обязательно для Telegram Mini App и PWA).

## Рекомендуемые варианты

### 1. **Vercel** (удобно и бесплатно)
- **Сайт:** [vercel.com](https://vercel.com)
- **Плюсы:** бесплатный план, автосборка из Git, HTTPS из коробки, CDN, подходит для Telegram.
- В проекте есть **`vercel.json`** (сборка и SPA-маршруты) и пошаговая настройка бота: **[docs/VERCEL_AND_BOT.md](VERCEL_AND_BOT.md)**.
- Кратко: Import в Vercel из GitHub → **Build:** `npm run build`, **Output:** `dist` → Deploy. URL вида `https://ваш-проект.vercel.app` указать в [@BotFather](https://t.me/BotFather) → Menu Button / Web App URL.

### 2. **Netlify**
- **Сайт:** [netlify.com](https://netlify.com)
- **Плюсы:** бесплатный план, деплой из Git или загрузка папки `dist`, HTTPS, CDN.
- **Как развернуть:**
  1. Репозиторий на GitHub → Netlify → Add new site → Import from Git.
  2. Build command: `npm run build`, Publish directory: `dist`.
  3. Или вручную: Build locally (`npm run build`), затем в Netlify — Deploy → Drag and drop папку `dist`.
- Домен вида `https://имя-сайта.netlify.app` подставить в настройки бота.

### 3. **Cloudflare Pages**
- **Сайт:** [pages.cloudflare.com](https://pages.cloudflare.com)
- **Плюсы:** бесплатно, быстрый CDN, деплой из Git или загрузка `dist`.
- **Как развернуть:**
  1. Pages → Create project → Connect to Git (или Direct Upload).
  2. Build: `npm run build`, Output directory: `dist`.
  3. Домен: `https://ваш-проект.pages.dev`.

### 4. **GitHub Pages**
- **Плюсы:** бесплатно, тесно с GitHub.
- **Нюанс:** для проектов из репозитория часто используется URL вида `https://username.github.io/repo-name/`. Для SPA и Telegram нужно либо настроить base в Vite (`base: '/repo-name/'`), либо использовать отдельный домен.
- **Как:** Actions или ручная загрузка содержимого `dist/` в ветку `gh-pages` или в папку `docs/` (см. [GitHub Pages](https://docs.github.com/en/pages)).

### 5. **Свой сервер / VPS**
- Любой хостинг с Nginx или Apache: отдать каталог `dist/` как статику, включить HTTPS (Let's Encrypt).  
- Подходит, если уже есть домен и сервер.

---

## После деплоя

1. **Проверьте HTTPS:** приложение должно открываться по `https://...` (не `http://`).
2. **Telegram:** в [@BotFather](https://t.me/BotFather) укажите полный URL приложения (например `https://ваш-проект.vercel.app`) в настройках Web App / Menu Button.
3. **Иконки PWA:** при необходимости добавьте в `public/` файлы `icon-192.png` и `icon-512.png`, пересоберите и задеплойте заново.

---

## Краткое сравнение

| Хостинг          | Бесплатный план | Деплой из Git | Сложность |
|------------------|-----------------|---------------|-----------|
| Vercel           | Да              | Да            | Низкая    |
| Netlify          | Да              | Да            | Низкая    |
| Cloudflare Pages | Да              | Да            | Низкая    |
| GitHub Pages     | Да              | Да            | Средняя   |
| Свой VPS         | Нет             | По настройке  | Выше      |

Для быстрого старта удобнее всего **Vercel** или **Netlify**: привязали репозиторий, указали `npm run build` и `dist` — и получаете готовый HTTPS-URL для Telegram.
