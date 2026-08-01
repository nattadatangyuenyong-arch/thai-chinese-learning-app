import { v4 as uuid } from "uuid";
import { VocabularyDeck, VocabularyItem } from "../types";

export interface ParsedLine {
  chinese: string;
  pinyin: string;
  thaiTranslation: string;
}

export interface ParseError {
  entryIndex: number;
  message: string;
  raw: string[];
}

export interface ParseResult {
  entries: ParsedLine[];
  errors: ParseError[];
}

/**
 * Parses pasted vocabulary text where every group of 3 non-blank lines is:
 *   Chinese word
 *   Pinyin
 *   Thai translation
 * Blank lines separate entries.
 */
export function parseVocabularyText(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/);
  const groups: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
      continue;
    }
    current.push(trimmed);
    if (current.length === 3) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);

  const entries: ParsedLine[] = [];
  const errors: ParseError[] = [];

  groups.forEach((group, i) => {
    if (group.length < 3) {
      const missing = ["Chinese word", "Pinyin", "Thai translation"].slice(group.length);
      errors.push({
        entryIndex: i + 1,
        message: `Entry ${i + 1} is missing: ${missing.join(", ")}.`,
        raw: group,
      });
      return;
    }
    const [chinese, pinyin, thaiTranslation] = group;
    if (!chinese) {
      errors.push({ entryIndex: i + 1, message: `Entry ${i + 1} is missing the Chinese word.`, raw: group });
      return;
    }
    entries.push({ chinese, pinyin, thaiTranslation });
  });

  return { entries, errors };
}

export function parsedLinesToItems(entries: ParsedLine[]): VocabularyItem[] {
  const now = new Date().toISOString();
  return entries.map((e) => ({
    id: uuid(),
    chinese: e.chinese,
    pinyin: e.pinyin,
    thaiTranslation: e.thaiTranslation,
    learningStatus: "new" as const,
    createdAt: now,
    updatedAt: now,
  }));
}

export function itemsToTxt(items: VocabularyItem[]): string {
  return items.map((i) => `${i.chinese}\n${i.pinyin}\n${i.thaiTranslation}`).join("\n\n");
}

export function itemsToCsv(items: VocabularyItem[]): string {
  const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const header = "Chinese,Pinyin,Thai Translation,Learning Status";
  const rows = items.map(
    (i) => `${escape(i.chinese)},${escape(i.pinyin)},${escape(i.thaiTranslation)},${escape(i.learningStatus)}`
  );
  return [header, ...rows].join("\n");
}

export function itemsToJson(items: VocabularyItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function deckToJson(deck: VocabularyDeck): string {
  return JSON.stringify(deck, null, 2);
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseDeckJson(raw: string): VocabularyDeck | null {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.items)) return null;
    const now = new Date().toISOString();
    return {
      id: typeof data.id === "string" ? data.id : uuid(),
      name: typeof data.name === "string" ? data.name : "Imported deck",
      createdAt: data.createdAt ?? now,
      updatedAt: now,
      items: data.items.map((item: Partial<VocabularyItem>) => ({
        id: item.id ?? uuid(),
        chinese: item.chinese ?? "",
        pinyin: item.pinyin ?? "",
        thaiTranslation: item.thaiTranslation ?? "",
        exampleSentence: item.exampleSentence,
        exampleSentencePinyin: item.exampleSentencePinyin,
        exampleSentenceThai: item.exampleSentenceThai,
        learningStatus: item.learningStatus ?? "new",
        createdAt: item.createdAt ?? now,
        updatedAt: now,
      })),
    };
  } catch {
    return null;
  }
}
