import { v4 as uuid } from "uuid";
import { BoundingBox, DetectedWord } from "../types";
import { analyzeHighlight } from "./highlightDetectionService";

export interface OcrProgress {
  status: string;
  progress: number;
}

export type ChineseOcrLanguage = "chi_sim" | "chi_tra";

export async function runOcr(
  imageDataUrl: string,
  language: ChineseOcrLanguage = "chi_sim",
  onProgress?: (progress: OcrProgress) => void
): Promise<DetectedWord[]> {
  if (!window.Tesseract) {
    throw new Error("OCR library could not be loaded. Check your internet connection and refresh the page.");
  }

  // Use one script model at a time. Combining chi_sim and chi_tra can cause
  // Simplified input to be normalized into Traditional characters.
  const worker = await window.Tesseract.createWorker(language, 1, {
    logger: (message) => {
      onProgress?.({
        status: translateStatus(message.status),
        progress: Math.max(0, Math.min(1, message.progress ?? 0)),
      });
    },
  });

  try {
    onProgress?.({ status: "กำลังอ่านข้อความจีน", progress: 0.05 });
    const result = await worker.recognize(imageDataUrl);
    const rawWords = result.data.words ?? [];

    const chineseWords = rawWords
      .map((word) => ({ ...word, text: cleanChineseText(word.text) }))
      .filter((word) => word.text.length > 0 && word.bbox)
      .filter((word) => word.confidence >= 15);

    const detected: DetectedWord[] = [];
    for (let index = 0; index < chineseWords.length; index += 1) {
      const word = chineseWords[index];
      onProgress?.({
        status: "กำลังตรวจสอบสีไฮไลต์",
        progress: 0.75 + (index / Math.max(1, chineseWords.length)) * 0.22,
      });
      const highlight = await analyzeHighlight(imageDataUrl, word.bbox);
      detected.push({
        id: uuid(),
        chinese: word.text,
        confidence: Math.max(0, Math.min(1, word.confidence / 100)),
        boundingBox: word.bbox,
        isHighlighted: highlight.isHighlighted,
        highlightConfidence: highlight.confidence,
        highlightedPixelRatio: highlight.highlightedPixelRatio,
        highlightColor: highlight.dominantColor,
        selected: highlight.isHighlighted,
      });
    }

    onProgress?.({ status: "กำลังรวมตัวอักษรที่ไฮไลต์เป็นวลี", progress: 0.98 });
    const merged = mergeAdjacentHighlightedWords(detected);

    if (merged.length > 0 && !merged.some((word) => word.isHighlighted)) {
      return merged.map((word) => ({ ...word, selected: false }));
    }
    return merged;
  } finally {
    await worker.terminate();
  }
}

function mergeAdjacentHighlightedWords(words: DetectedWord[]): DetectedWord[] {
  if (words.length < 2) return words;

  const sorted = [...words].sort((a, b) => {
    const lineTolerance = Math.max(boxHeight(a.boundingBox), boxHeight(b.boundingBox)) * 0.55;
    if (Math.abs(a.boundingBox.y0 - b.boundingBox.y0) <= lineTolerance) {
      return a.boundingBox.x0 - b.boundingBox.x0;
    }
    return a.boundingBox.y0 - b.boundingBox.y0;
  });

  const output: DetectedWord[] = [];
  for (const current of sorted) {
    const previous = output[output.length - 1];
    if (previous && shouldMerge(previous, current)) {
      const totalChars = previous.chinese.length + current.chinese.length;
      previous.chinese += current.chinese;
      previous.confidence = weighted(previous.confidence, current.confidence, previous.chinese.length - current.chinese.length, current.chinese.length);
      previous.highlightConfidence = weighted(previous.highlightConfidence, current.highlightConfidence, totalChars - current.chinese.length, current.chinese.length);
      previous.highlightedPixelRatio = weighted(previous.highlightedPixelRatio, current.highlightedPixelRatio, totalChars - current.chinese.length, current.chinese.length);
      previous.boundingBox = unionBox(previous.boundingBox, current.boundingBox);
      previous.selected = true;
      previous.isHighlighted = true;
      if (!previous.highlightColor) previous.highlightColor = current.highlightColor;
    } else {
      output.push({ ...current, boundingBox: { ...current.boundingBox } });
    }
  }
  return output;
}

function shouldMerge(a: DetectedWord, b: DetectedWord): boolean {
  // Merge only text that both belongs to a highlighted region. This prevents
  // unrelated body text from becoming one very long sentence.
  if (!a.isHighlighted || !b.isHighlighted) return false;

  const overlap = verticalOverlapRatio(a.boundingBox, b.boundingBox);
  if (overlap < 0.45) return false;

  const averageHeight = (boxHeight(a.boundingBox) + boxHeight(b.boundingBox)) / 2;
  const gap = b.boundingBox.x0 - a.boundingBox.x1;
  return gap >= -averageHeight * 0.25 && gap <= Math.max(18, averageHeight * 1.15);
}

function verticalOverlapRatio(a: BoundingBox, b: BoundingBox): number {
  const overlap = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  return overlap / Math.max(1, Math.min(boxHeight(a), boxHeight(b)));
}

function boxHeight(box: BoundingBox): number {
  return Math.max(1, box.y1 - box.y0);
}

function unionBox(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  };
}

function weighted(a: number, b: number, aWeight: number, bWeight: number): number {
  return (a * aWeight + b * bWeight) / Math.max(1, aWeight + bWeight);
}

function cleanChineseText(text: string): string {
  return (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g) ?? []).join("");
}

function translateStatus(status: string): string {
  if (status.includes("loading")) return "กำลังโหลดโมเดล OCR ภาษาจีน";
  if (status.includes("initializing")) return "กำลังเตรียมระบบ OCR";
  if (status.includes("recognizing")) return "กำลังอ่านข้อความจีน";
  return "กำลังประมวลผลรูปภาพ";
}
