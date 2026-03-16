// Базовый словарь для general English бота
// Формат записи:
// {
//   id: 'dl-1',
//   term: 'wake up',
//   translation: 'просыпаться',
//   example: 'I usually wake up at 7 a.m.',
//   moduleRu: 'Повседневная жизнь',
//   level: 'A1', // A1–B1
// }

import { BASIC_WORDS } from './basicWordsData.generated.js';

// Хэш для детерминированного выбора слов дня
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function getWordsOfDayBasic(count = 5, dateStr = null) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const seed = hashStr(date);
  const pool = BASIC_WORDS;
  const shuffled = [...pool].sort((a, b) => {
    const ha = (seed ^ hashStr(a.id)) >>> 0;
    const hb = (seed ^ hashStr(b.id)) >>> 0;
    return ha - hb;
  });
  return shuffled.slice(0, count);
}

function getRandomWordsBasic(count = 5) {
  const copy = [...BASIC_WORDS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function getRandomWordBasic() {
  const pool = BASIC_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getWordByIdBasic(id) {
  return BASIC_WORDS.find((w) => w.id === id) || null;
}

function getQuizQuestionBasic() {
  const word = getRandomWordBasic();
  const others = BASIC_WORDS.filter((w) => w.id !== word.id);
  const wrong = [];
  const usedTranslations = new Set([word.translation]);
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  for (const w of shuffledOthers) {
    if (wrong.length >= 3) break;
    if (!usedTranslations.has(w.translation)) {
      wrong.push(w.translation);
      usedTranslations.add(w.translation);
    }
  }
  const options = [{ text: word.translation, correct: true }, ...wrong.map((t) => ({ text: t, correct: false }))];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = options.findIndex((o) => o.correct);
  const optionsWithData = options.map((o, idx) => ({
    text: o.text,
    callbackData: `quiz_basic_${word.id}__${correctIndex}__${idx}`.slice(0, 64),
  }));
  return { word, options: optionsWithData, correctIndex };
}

export {
  BASIC_WORDS,
  getWordsOfDayBasic,
  getRandomWordsBasic,
  getRandomWordBasic,
  getWordByIdBasic,
  getQuizQuestionBasic,
};

