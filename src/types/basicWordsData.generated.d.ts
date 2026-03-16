declare module '../../api/basicWordsData.generated' {
  // Минимальное описание структуры BASIC_WORDS для TypeScript
  export interface BasicWord {
    id: string;
    term: string;
    translation: string;
    example?: string;
    exampleRu?: string;
    moduleRu?: string;
    level?: string;
  }

  export const BASIC_WORDS: BasicWord[];
}

