import { v4 as uuid } from "uuid";
import { DICTIONARY } from "./dictionary";
import { VocabularyDeck } from "../types";

export function buildDemoDeck(): VocabularyDeck {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    name: "คำศัพท์เริ่มต้น (Starter Words)",
    createdAt: now,
    updatedAt: now,
    items: DICTIONARY.slice(0, 10).map((entry) => ({
      id: uuid(),
      chinese: entry.chinese,
      pinyin: entry.pinyin,
      thaiTranslation: entry.thai,
      exampleSentence: entry.example,
      exampleSentencePinyin: entry.examplePinyin,
      exampleSentenceThai: entry.exampleThai,
      learningStatus: "new" as const,
      createdAt: now,
      updatedAt: now,
    })),
  };
}
