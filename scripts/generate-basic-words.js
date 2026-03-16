import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SOURCE_DIR = path.resolve(ROOT, '..', '16-03-2026_17-30-35');

const SOURCES = [
  { level: 'A1', file: 'КАТЕГОРИИ СЛОВ.txt' },
  { level: 'A2', file: 'Продолжающий.txt' },
  { level: 'B1', file: 'Продвинутый.txt' },
];

const OUT_FILE = path.resolve(ROOT, 'api', 'basicWordsData.generated.js');

const MODULE_PREFIX = {
  // A1
  'Семья': 'fm',
  'Профессии': 'job',
  'Город': 'ct',
  'Эмоции': 'em',
  'Страны': 'cn',
  'Еда и напитки': 'fd',
  'Самые важные глаголы. Часть 1': 'v1',
  'Самые важные глаголы. Часть 2': 'v2',
  'Самые важные глаголы. Часть 3': 'v3',
  'Погода': 'wt',
  'Путешествия': 'tr',
  'Дни недели и месяцы': 'tm',
  'Животные': 'an',
  'Магазин': 'sh',
  'Дом': 'hm',
  'Больница': 'hs',
  'Болезнь и симптомы': 'sx',
  'Отель': 'ht',
  'Ресторан': 'rs',
  'Хобби': 'hb',

  // A2 / B1 (основные)
  'Мир': 'wr',
  'Преступление и наказание': 'cr',
  'Социальные проблемы': 'sp',
  'Шопинг': 'sh2',
  'Собеседование': 'iv',
  'Искусство': 'art',
  'Инфраструктура': 'inf',
  'Описание людей': 'pd',
  'Соцсети': 'sm',
  'Деньги': 'mn',
  'Образование': 'ed',
  'Вкус Еды': 'ft',

  'Бизнес': 'bs',
  'Философия': 'ph',
  'Характер': 'ch',
  'Реклама': 'ad',
  'Сленг': 'sl',
  'Фильмы': 'mv',
  'Литература': 'lt',
  'Индустрия': 'ind',
  'Социальная жизнь': 'soc',
};

const IGNORED_LINE = new Set([
  'КАТЕГОРИИ СЛОВ',
  'Категории слов для уровня А2',
  'Слово',
  'Перевод',
  'Предложение',
  'Глагол',
  'Категория Продолжающий "Категории слов для уровня А2',
  'Категория Продвинутый "Бизнес',
]);

function normalizeLine(s) {
  return String(s || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u200B/g, '')
    .trim();
}

function isColumnHeader(line) {
  const l = normalizeLine(line).toLowerCase();
  return (
    l === 'слово' ||
    l === 'перевод' ||
    l === 'предложение' ||
    l === 'глагол' ||
    l.startsWith('слово') ||
    l.startsWith('перевод') ||
    l.startsWith('предложение')
  );
}

function looksLikeModuleTitle(line) {
  const l = normalizeLine(line);
  if (!l) return false;
  if (IGNORED_LINE.has(l)) return false;
  if (isColumnHeader(l)) return false;
  // если строка содержит точку и "Часть" — это модуль
  if (/Часть\s+\d+/i.test(l)) return true;
  // если нет пробелов/символов табличности, обычно заголовок модуля
  // (в txt из docx модули идут отдельной строкой, затем пусто/табличные заголовки)
  if (l.length <= 60 && !/[.?!]$/.test(l)) return true;
  return false;
}

function prefixForModule(moduleRu, usedPrefixes) {
  const known = MODULE_PREFIX[moduleRu];
  if (known) return known;
  // fallback: взять первые буквы слов в latin-подобный slug (просто цифры/латиница)
  const base = moduleRu
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('') || 'm';
  let p = base.replace(/[^a-z0-9]/gi, '') || 'm';
  if (p.length < 2) p = `${p}x`;
  let out = p.slice(0, 4);
  let i = 2;
  while (usedPrefixes.has(out)) {
    out = `${p.slice(0, 3)}${i}`;
    i++;
  }
  return out;
}

function parseWordsFromTxt(txt, level) {
  const rawLines = txt.split(/\r?\n/).map((l) => String(l ?? '').replace(/\u00A0/g, ' ').replace(/\u200B/g, ''));
  const lines = rawLines.map((l) => l.trim());

  const out = [];
  const usedPrefixes = new Set(Object.values(MODULE_PREFIX));
  const moduleCounters = new Map(); // prefix -> next index

  const nextNonEmptyIndex = (from) => {
    for (let k = from; k < lines.length; k++) {
      if (normalizeLine(lines[k])) return k;
    }
    return -1;
  };

  const isModuleTitleAt = (idx) => {
    const title = normalizeLine(lines[idx]);
    if (!title) return false;
    if (IGNORED_LINE.has(title) || isColumnHeader(title)) return false;
    // модуль подтверждаем lookahead'ом: в ближайших строках должны встретиться заголовки "Слово/Перевод/Предложение"
    let seen = 0;
    for (let k = idx + 1; k < Math.min(lines.length, idx + 12); k++) {
      const l = normalizeLine(lines[k]);
      if (!l) continue;
      if (isColumnHeader(l)) seen++;
      if (seen >= 2) return true;
      // если уже пошли данные (англ слово + рус перевод) без заголовков — это не модуль
      if (/[A-Za-z]/.test(l) && !isColumnHeader(l)) break;
    }
    return false;
  };

  let i = 0;
  while (i < lines.length) {
    const maybeTitle = normalizeLine(lines[i]);
    if (!maybeTitle || IGNORED_LINE.has(maybeTitle)) {
      i++;
      continue;
    }

    if (!isModuleTitleAt(i)) {
      i++;
      continue;
    }

    const moduleRu = maybeTitle.replace(/\s+/g, ' ').trim();
    const prefix = prefixForModule(moduleRu, usedPrefixes);
    usedPrefixes.add(prefix);

    // перейти к началу таблицы (после заголовков)
    let j = i + 1;
    while (j < lines.length) {
      const l = normalizeLine(lines[j]);
      if (!l) {
        j++;
        continue;
      }
      if (isColumnHeader(l) || IGNORED_LINE.has(l)) {
        j++;
        continue;
      }
      break;
    }

    // читать тройки до следующего модуля или до конца
    while (j < lines.length) {
      if (isModuleTitleAt(j)) break;
      const termIdx = nextNonEmptyIndex(j);
      if (termIdx === -1 || isModuleTitleAt(termIdx)) break;

      const term = normalizeLine(lines[termIdx]);
      const trIdx = nextNonEmptyIndex(termIdx + 1);
      const exIdx = nextNonEmptyIndex(trIdx + 1);
      if (trIdx === -1 || exIdx === -1) break;

      const translation = normalizeLine(lines[trIdx]);
      const example = normalizeLine(lines[exIdx]);

      // минимальная валидация
      if (term && translation && example && /[A-Za-z]/.test(term) && /[A-Za-z]/.test(example)) {
        const next = (moduleCounters.get(prefix) || 0) + 1;
        moduleCounters.set(prefix, next);
        out.push({
          id: `${prefix}-${next}`,
          term,
          translation,
          example,
          moduleRu,
          level,
        });
      }

      j = exIdx + 1;
      // если после примера идёт много пустых строк — возможно конец модуля
      // но пусть цикл сам остановится по следующему module title
    }

    i = j;
  }

  return out;
}

function renderGeneratedFile(words) {
  const header =
    '// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n' +
    '// Run: node scripts/generate-basic-words.js\n\n';

  const body =
    `export const BASIC_WORDS = ${JSON.stringify(words, null, 2)};\n`;

  return header + body;
}

function main() {
  const all = [];
  for (const src of SOURCES) {
    const p = path.resolve(SOURCE_DIR, src.file);
    if (!fs.existsSync(p)) {
      console.warn(`[generate-basic-words] Missing source: ${p}`);
      continue;
    }
    const txt = fs.readFileSync(p, 'utf8');
    const words = parseWordsFromTxt(txt, src.level);
    all.push(...words);
  }

  fs.writeFileSync(OUT_FILE, renderGeneratedFile(all), 'utf8');
  console.log(`[generate-basic-words] Generated ${all.length} words → ${OUT_FILE}`);
}

main();

