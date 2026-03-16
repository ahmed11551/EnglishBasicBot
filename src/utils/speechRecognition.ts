/**
 * Распознавание речи (Web Speech API) для проверки произношения.
 */

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/** Сравнение произнесённого с эталоном (допуск по похожести) */
export function isMatch(spoken: string, expected: string): boolean {
  const a = normalizeForCompare(spoken);
  const b = normalizeForCompare(expected);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  if (aWords.length !== bWords.length) return false;
  return aWords.every((w, i) => w === bWords[i] || w.includes(bWords[i]) || bWords[i].includes(w));
}

export function recognizeSpeech(lang = 'en-GB'): Promise<string> {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return Promise.reject(new Error('Speech recognition not supported'));

  return new Promise((resolve, reject) => {
    const rec = new Recognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang;
    let settled = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      settled = true;
      const result = e.results[e.results.length - 1];
      const transcript = result[0]?.transcript ?? '';
      resolve(transcript);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      settled = true;
      if (e.error === 'no-speech') resolve('');
      else reject(new Error(e.error));
    };
    rec.onend = () => {
      if (!settled) resolve('');
    };
    rec.start();
  });
}
