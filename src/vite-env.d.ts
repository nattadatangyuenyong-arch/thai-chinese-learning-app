/// <reference types="vite/client" />

declare module "https://esm.sh/pinyin-pro@3.27.0" {
  export function pinyin(text: string, options?: Record<string, unknown>): string;
}
