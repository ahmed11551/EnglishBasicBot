/**
 * Воспроизведение термина: аудиофайл по audioUrl или TTS (Web Speech API).
 * На мобильных: разблокировка аудио по первому тапу, выбор голоса для iOS.
 */

const TTS_LANG = 'en-GB';

let audioInstance: HTMLAudioElement | null = null;
let audioUnlocked = false;

function getAudio(): HTMLAudioElement {
  if (!audioInstance) audioInstance = new Audio();
  return audioInstance;
}

/** Разблокировка аудио на iOS/Android (нужен вызов в контексте пользовательского жеста). Экспорт для вызова при «Начать» в Аудировании. */
export function unlockAudio(): void {
  if (audioUnlocked) return;
  try {
    const a = getAudio();
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    a.volume = 0;
    a.play().then(() => { audioUnlocked = true; }).catch(() => {});
  } catch {
    audioUnlocked = true;
  }
}

function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find((v) => v.lang.startsWith('en'));
  return en ?? voices[0] ?? null;
}

export function playFromUrl(url: string): Promise<void> {
  unlockAudio();
  const audio = getAudio();
  audio.src = url;
  audio.volume = 1;
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio failed'));
    audio.play().then(() => {}).catch(reject);
  });
}

export function speakWithTTS(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    return Promise.reject(new Error('Speech synthesis not supported'));
  }
  unlockAudio();
  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = TTS_LANG;
    u.rate = 0.9;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    const trySpeak = () => {
      const voice = getEnglishVoice();
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      setTimeout(trySpeak, 100);
    }
  });
}

/** Воспроизвести термин: сначала audioUrl, иначе TTS */
export function playTerm(term: string, audioUrl?: string): Promise<void> {
  if (audioUrl) return playFromUrl(audioUrl);
  return speakWithTTS(term);
}

export function stopPlayback(): void {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
    audioInstance.src = '';
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
