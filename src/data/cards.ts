import type { Card } from '../types';
import type { BasicWord } from '../../api/basicWordsData.generated';
import { BASIC_WORDS } from '../../api/basicWordsData.generated';

/** Все английские карточки строим из BASIC_WORDS (general English) */
export const CARDS: Card[] = BASIC_WORDS.map((w: BasicWord): Card => ({
  id: String(w.id),
  term: String(w.term),
  translation: String(w.translation),
  transcription: '',
  examples: w.example ? [String(w.example)] : [],
}));

/** Группировка id по русскому названию модуля (moduleRu) */
function assignCardIdsToModules() {
  const byModuleRu = new Map<string, string[]>();
  for (const w of BASIC_WORDS) {
    const key = String(w.moduleRu);
    if (!key) continue;
    const arr = byModuleRu.get(key) ?? [];
    arr.push(String(w.id));
    byModuleRu.set(key, arr);
  }
  const obj: Record<string, string[]> = {};
  for (const [moduleRu, ids] of byModuleRu.entries()) {
    obj[moduleRu] = ids;
  }
  return obj;
}

export const CARD_IDS_BY_MODULE = assignCardIdsToModules();

const ALL_CARDS = [...CARDS];

export function getCardsByIds(ids: string[]): Card[] {
  const set = new Set(ids);
  return ALL_CARDS.filter((c) => set.has(c.id));
}

export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

/** Поиск по term и translation (без учёта регистра) */
export function searchCards(query: string): Card[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_CARDS.filter(
    (c) =>
      c.term.toLowerCase().includes(q) || c.translation.toLowerCase().includes(q)
  );
}
