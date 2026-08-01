import { findDictionaryEntry } from "../data/dictionary";

type PinyinModule = {
  pinyin: (text: string, options?: Record<string, unknown>) => string;
};

let modulePromise: Promise<PinyinModule> | null = null;

/** Generate real Mandarin pinyin in the browser using pinyin-pro. */
export async function generatePinyin(chinese: string): Promise<string> {
  const text = chinese.trim();
  if (!text) return "";

  const entry = findDictionaryEntry(text);
  if (entry) return entry.pinyin;

  try {
    const library = await loadPinyinLibrary();
    return library.pinyin(text, {
      toneType: "symbol",
      type: "string",
      nonZh: "consecutive",
      v: true,
    }).trim();
  } catch (error) {
    console.warn("Pinyin generation failed", error);
    return "";
  }
}

async function loadPinyinLibrary(): Promise<PinyinModule> {
  if (!modulePromise) {
    modulePromise = import(/* @vite-ignore */ "https://esm.sh/pinyin-pro@3.27.0") as Promise<PinyinModule>;
  }
  return modulePromise;
}
