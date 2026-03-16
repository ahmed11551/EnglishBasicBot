/** Проверка, что приложение запущено внутри Telegram Web App */
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe?: { user?: { id: number } };
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp);
}

export function getTelegramUserId(): string | undefined {
  const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return id != null ? String(id) : undefined;
}

export function initTelegramWebApp(): void {
  if (!isTelegramWebApp()) return;
  window.Telegram!.WebApp!.ready();
  window.Telegram!.WebApp!.expand();
}
