export {};

declare global {
  interface Window {
    Tesseract?: {
      createWorker: (
        language?: string,
        oem?: number,
        options?: { logger?: (message: { status: string; progress?: number }) => void }
      ) => Promise<{
        recognize: (image: string) => Promise<{
          data: {
            text: string;
            words?: Array<{
              text: string;
              confidence: number;
              bbox: { x0: number; y0: number; x1: number; y1: number };
            }>;
          };
        }>;
        terminate: () => Promise<void>;
      }>;
    };
  }
}
