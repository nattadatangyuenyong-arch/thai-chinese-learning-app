import { findDictionaryEntry } from "../data/dictionary";

/**
 * Chinese -> Thai translation.
 * Uses the local dictionary first, then the free MyMemory public endpoint.
 * No API key is embedded in the frontend. Network translation can be rate-limited,
 * so the review screen always remains editable.
 */
export async function translateToThai(chinese: string): Promise<string> {
  const text = chinese.trim();
  if (!text) return "";

  const entry = findDictionaryEntry(text);
  if (entry) return entry.thai;

  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", "zh-CN|th-TH");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Translation request failed (${response.status})`);

    const data = (await response.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const translated = decodeHtml(data.responseData?.translatedText ?? "").trim();
    if (!translated || translated.toLowerCase() === text.toLowerCase()) return "";
    return translated;
  } catch (error) {
    console.warn("Thai translation failed", error);
    return "";
  }
}

export async function fetchExampleSentence(
  chinese: string
): Promise<{ example: string; examplePinyin: string; exampleThai: string } | null> {
  const entry = findDictionaryEntry(chinese);
  if (entry?.example) {
    return {
      example: entry.example,
      examplePinyin: entry.examplePinyin ?? "",
      exampleThai: entry.exampleThai ?? "",
    };
  }
  return null;
}

function decodeHtml(value: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}
