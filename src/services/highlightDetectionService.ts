import { BoundingBox, DetectedWord } from "../types";

const UNCERTAIN_CONFIDENCE_THRESHOLD = 0.6;
const HIGHLIGHT_PIXEL_THRESHOLD = 0.09;

export interface HighlightResult {
  isHighlighted: boolean;
  confidence: number;
  highlightedPixelRatio: number;
  dominantColor?: string;
}

export async function analyzeHighlight(
  imageDataUrl: string,
  box: BoundingBox
): Promise<HighlightResult> {
  const image = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { isHighlighted: false, confidence: 0, highlightedPixelRatio: 0 };

  context.drawImage(image, 0, 0);

  const marginX = Math.max(2, Math.round((box.x1 - box.x0) * 0.12));
  const marginY = Math.max(2, Math.round((box.y1 - box.y0) * 0.22));
  const x = clamp(Math.floor(box.x0 - marginX), 0, canvas.width - 1);
  const y = clamp(Math.floor(box.y0 - marginY), 0, canvas.height - 1);
  const width = clamp(Math.ceil(box.x1 - box.x0 + marginX * 2), 1, canvas.width - x);
  const height = clamp(Math.ceil(box.y1 - box.y0 + marginY * 2), 1, canvas.height - y);
  const pixels = context.getImageData(x, y, width, height).data;

  let colorful = 0;
  let usable = 0;
  const hueCounts = new Map<string, number>();

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 80) continue;
    const [h, s, v] = rgbToHsv(pixels[i], pixels[i + 1], pixels[i + 2]);

    // Ignore black text and near-white paper.
    if (v < 0.28 || (s < 0.12 && v > 0.82)) continue;
    usable += 1;

    const color = classifyHighlightHue(h, s, v);
    if (color) {
      colorful += 1;
      hueCounts.set(color, (hueCounts.get(color) ?? 0) + 1);
    }
  }

  const ratio = usable > 0 ? colorful / usable : 0;
  const dominantColor = [...hueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const confidence = Math.min(1, ratio / 0.28);
  return {
    isHighlighted: ratio >= HIGHLIGHT_PIXEL_THRESHOLD,
    confidence,
    highlightedPixelRatio: ratio,
    dominantColor,
  };
}

export function filterHighlighted(words: DetectedWord[]): DetectedWord[] {
  const seen = new Set<string>();
  return words.filter((word) => {
    const key = `${word.chinese}-${Math.round(word.boundingBox.x0)}-${Math.round(word.boundingBox.y0)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isUncertain(word: DetectedWord): boolean {
  return word.confidence < UNCERTAIN_CONFIDENCE_THRESHOLD || word.highlightConfidence < 0.35;
}

function classifyHighlightHue(h: number, s: number, v: number): string | undefined {
  if (s < 0.22 || v < 0.55) return undefined;
  if (h >= 35 && h <= 75) return "yellow";
  if (h > 75 && h <= 165) return "green";
  if (h > 165 && h <= 215) return "blue";
  if (h > 300 || h <= 15) return "pink";
  if (h > 15 && h < 35) return "orange";
  return undefined;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return [h, max === 0 ? 0 : delta / max, max];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read the selected image."));
    image.src = src;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
