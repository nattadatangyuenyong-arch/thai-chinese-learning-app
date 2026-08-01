/**
 * Text-to-speech service.
 *
 * Uses the browser's built-in SpeechSynthesis API with a Chinese (zh-CN) voice
 * when available. This works fully offline with no API key. For higher-quality
 * or more consistent pronunciation across devices, swap `speakChinese` for a
 * call to a backend endpoint wrapping a TTS API (e.g. Google Cloud TTS, Azure
 * Speech) that returns an audio file to play.
 */
let cachedVoice: SpeechSynthesisVoice | null | undefined;

function getChineseVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  cachedVoice =
    voices.find((v) => v.lang === "zh-CN") ??
    voices.find((v) => v.lang.startsWith("zh")) ??
    null;
  return cachedVoice;
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakChinese(text: string): void {
  if (!isTtsSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  const voice = getChineseVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Some browsers load voices asynchronously; prime the cache once they arrive.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined;
  };
}
