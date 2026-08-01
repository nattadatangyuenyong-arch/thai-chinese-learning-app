export type LearningStatus = "new" | "learning" | "known";

export interface VocabularyItem {
  id: string;
  chinese: string;
  pinyin: string;
  thaiTranslation: string;
  exampleSentence?: string;
  exampleSentencePinyin?: string;
  exampleSentenceThai?: string;
  learningStatus: LearningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyDeck {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: VocabularyItem[];
}

export interface StudyStats {
  deckId: string;
  cardsReviewedToday: number;
  lastStudiedAt: string | null;
  streakDays: number;
}

export interface AppSettings {
  theme: "light" | "dark";
  dailyGoal: number;
  pinyinVisible: boolean;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Result shape returned by the OCR + highlight-detection pipeline.
export interface DetectedWord {
  id: string;
  chinese: string;
  confidence: number;
  boundingBox: BoundingBox;
  isHighlighted: boolean;
  highlightConfidence: number;
  highlightedPixelRatio: number;
  highlightColor?: string;
  selected: boolean;
}

export interface ExtractedVocabularyItem extends VocabularyItem {
  confidence: number;
}
