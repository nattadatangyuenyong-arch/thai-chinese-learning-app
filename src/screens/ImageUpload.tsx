import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { CameraIcon, UploadIcon } from "../components/Icons";
import { runOcr, OcrProgress, ChineseOcrLanguage } from "../services/ocrService";
import { useToast } from "../context/ToastContext";

export default function ImageUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<ChineseOcrLanguage>("chi_sim");

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleExtract() {
    if (!imageDataUrl) return;
    setIsProcessing(true);
    try {
      const words = await runOcr(imageDataUrl, ocrLanguage, setOcrProgress);
      if (words.length === 0) {
        showToast("ไม่พบข้อความภาษาจีนในรูป กรุณาใช้ภาพที่คมชัดและถ่ายให้ตรง", "error");
        return;
      }
      navigate("/extraction", { state: { words, imageDataUrl } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่";
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar title="อัปโหลดรูปภาพ" showBack />
      <main className="max-w-2xl mx-auto px-4 pb-16 pt-6">
        <p className="text-ink/60 dark:text-ink-light/60 mb-6">
          อัปโหลดหรือถ่ายภาพข้อความภาษาจีนที่มีคำไฮไลต์ไว้ ระบบจะตรวจจับเฉพาะคำที่ถูกไฮไลต์ให้อัตโนมัติ
        </p>

        {!imageDataUrl ? (
          <div className="border-2 border-dashed border-ink/20 dark:border-white/20 rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center bg-white/50 dark:bg-white/5">
            <div className="w-16 h-16 rounded-2xl bg-seal-50 dark:bg-white/10 text-seal-500 flex items-center justify-center mb-4">
              <UploadIcon width={28} height={28} />
            </div>
            <h2 className="font-display text-xl font-bold text-ink dark:text-ink-light mb-1">เลือกรูปภาพของคุณ</h2>
            <p className="text-ink/50 dark:text-ink-light/50 mb-6 max-w-xs">รองรับไฟล์ JPG, PNG หรือถ่ายภาพใหม่ด้วยกล้อง</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button size="lg" icon={<CameraIcon width={20} height={20} />} onClick={() => cameraInputRef.current?.click()}>
                ถ่ายภาพ
              </Button>
              <Button
                size="lg"
                variant="secondary"
                icon={<UploadIcon width={20} height={20} />}
                onClick={() => fileInputRef.current?.click()}
              >
                เลือกไฟล์
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
              <label className="block text-sm font-semibold text-ink dark:text-ink-light mb-2">
                รูปแบบตัวอักษรในภาพ
              </label>
              <select
                value={ocrLanguage}
                onChange={(event) => setOcrLanguage(event.target.value as ChineseOcrLanguage)}
                disabled={isProcessing}
                className="w-full rounded-xl border border-ink/15 dark:border-white/15 bg-transparent px-3 py-2.5 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
              >
                <option value="chi_sim" className="text-ink">จีนตัวย่อ — 简体中文</option>
                <option value="chi_tra" className="text-ink">จีนตัวเต็ม — 繁體中文</option>
              </select>
              <p className="mt-2 text-xs text-ink/55 dark:text-ink-light/55">
                เลือกให้ตรงกับภาพ เพื่อป้องกันไม่ให้ OCR เปลี่ยนตัวย่อเป็นตัวเต็มหรือกลับกัน
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden border border-ink/10 dark:border-white/10 bg-white/50 dark:bg-white/5">
              <img src={imageDataUrl} alt="ภาพที่อัปโหลด" className="w-full max-h-[420px] object-contain" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" fullWidth onClick={handleExtract} disabled={isProcessing}>
                {isProcessing ? `${ocrProgress?.status ?? "กำลังตรวจจับคำไฮไลต์..."} ${ocrProgress ? Math.round(ocrProgress.progress * 100) + "%" : ""}` : "สกัดคำที่ไฮไลต์"}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setImageDataUrl(null)} disabled={isProcessing}>
                เลือกรูปใหม่
              </Button>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-3 text-ink/60 dark:text-ink-light/60 text-sm">
                <span className="w-4 h-4 rounded-full border-2 border-seal-500 border-t-transparent animate-spin" />
                <div className="flex-1">
                  <div>{ocrProgress?.status ?? "กำลังใช้ OCR อ่านตัวอักษรจีนและระบุคำที่ถูกไฮไลต์"}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-seal-500 transition-all" style={{ width: `${Math.round((ocrProgress?.progress ?? 0.03) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
