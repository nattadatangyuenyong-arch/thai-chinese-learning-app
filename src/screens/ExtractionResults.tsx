import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { VocabEditableList, EditableRow } from "../components/VocabEditableList";
import { DetectedWord, VocabularyItem } from "../types";
import { generatePinyin } from "../services/pinyinService";
import { translateToThai } from "../services/translationService";
import { filterHighlighted, isUncertain } from "../services/highlightDetectionService";
import { useDecksContext } from "../context/DecksContext";
import { useToast } from "../context/ToastContext";
import { itemsToTxt, itemsToCsv, itemsToJson, downloadTextFile } from "../services/importExportService";
import { CopyIcon, DownloadIcon } from "../components/Icons";

interface RowState extends EditableRow {
  confidence: number;
  selected: boolean;
  boundingBox?: DetectedWord["boundingBox"];
  highlightConfidence: number;
  highlightedPixelRatio: number;
  highlightColor?: string;
}

export default function ExtractionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { decks, createDeck, addItemsToDeck } = useDecksContext();
  const { showToast } = useToast();

  const routeState = location.state as { words?: DetectedWord[]; imageDataUrl?: string } | null;
  const stateWords = routeState?.words;
  const imageDataUrl = routeState?.imageDataUrl;
  const [rows, setRows] = useState<RowState[]>([]);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);
  const [deckChoice, setDeckChoice] = useState<"new" | string>("new");
  const [newDeckName, setNewDeckName] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (!stateWords) {
      navigate("/upload", { replace: true });
      return;
    }
    const deduped = filterHighlighted(stateWords);
    const initial: RowState[] = deduped.map((w) => ({
      id: w.id,
      chinese: w.chinese,
      pinyin: "",
      thaiTranslation: "",
      confidence: w.confidence,
      selected: w.selected,
      boundingBox: w.boundingBox,
      highlightConfidence: w.highlightConfidence,
      highlightedPixelRatio: w.highlightedPixelRatio,
      highlightColor: w.highlightColor,
    }));
    setRows(initial);

    (async () => {
      const filled = await Promise.all(
        initial.map(async (row) => {
          const [pinyin, thai] = await Promise.all([generatePinyin(row.chinese), translateToThai(row.chinese)]);
          return { ...row, pinyin, thaiTranslation: thai };
        })
      );
      setRows(filled);
      setIsLoadingTranslations(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(id: string, field: "chinese" | "pinyin" | "thaiTranslation", value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleSelected(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: uuid(), chinese: "", pinyin: "", thaiTranslation: "", confidence: 1, selected: true, highlightConfidence: 1, highlightedPixelRatio: 1 },
    ]);
  }

  const selectedRows = rows.filter((r) => r.selected);
  const uncertainRows = rows.filter((r) =>
    r.boundingBox
      ? isUncertain({
          id: r.id, chinese: r.chinese, confidence: r.confidence, selected: r.selected,
          boundingBox: r.boundingBox, isHighlighted: r.selected, highlightConfidence: r.highlightConfidence,
          highlightedPixelRatio: r.highlightedPixelRatio, highlightColor: r.highlightColor,
        })
      : false
  );

  function toVocabItems(): VocabularyItem[] {
    const now = new Date().toISOString();
    return selectedRows
      .filter((r) => r.chinese.trim() !== "")
      .map((r) => ({
        id: r.id,
        chinese: r.chinese.trim(),
        pinyin: r.pinyin.trim(),
        thaiTranslation: r.thaiTranslation.trim(),
        learningStatus: "new" as const,
        createdAt: now,
        updatedAt: now,
      }));
  }

  function handleSave() {
    const items = toVocabItems();
    if (items.length === 0) {
      showToast("กรุณาเลือกอย่างน้อยหนึ่งคำก่อนบันทึก", "error");
      return;
    }
    if (deckChoice === "new") {
      const name = newDeckName.trim() || `ชุดคำศัพท์ ${new Date().toLocaleDateString("th-TH")}`;
      createDeck(name, items);
      showToast(`บันทึก ${items.length} คำลงชุดใหม่ "${name}" แล้ว`);
    } else {
      addItemsToDeck(deckChoice, items);
      const deck = decks.find((d) => d.id === deckChoice);
      showToast(`เพิ่ม ${items.length} คำลงชุด "${deck?.name}" แล้ว`);
    }
    navigate("/decks");
  }

  function handleCopy() {
    const items = toVocabItems();
    navigator.clipboard.writeText(itemsToTxt(items));
    showToast("คัดลอกรายการคำศัพท์แล้ว");
  }

  function handleExport(format: "txt" | "csv" | "json") {
    const items = toVocabItems();
    if (items.length === 0) {
      showToast("ไม่มีคำศัพท์ให้ส่งออก", "error");
      return;
    }
    if (format === "txt") downloadTextFile("vocabulary.txt", itemsToTxt(items));
    if (format === "csv") downloadTextFile("vocabulary.csv", itemsToCsv(items), "text/csv");
    if (format === "json") downloadTextFile("vocabulary.json", itemsToJson(items), "application/json");
    showToast(`ส่งออกไฟล์ .${format} แล้ว`);
  }

  const editableRows: (EditableRow & { meta?: string })[] = rows
    .filter((r) => r.selected)
    .map((r) => ({
      id: r.id,
      chinese: r.chinese,
      pinyin: r.pinyin,
      thaiTranslation: r.thaiTranslation,
      meta: r.confidence < 0.6 ? "ไม่แน่ใจ" : undefined,
    }));

  const unselectedRows = rows.filter((r) => !r.selected);

  return (
    <div className="min-h-screen">
      <Navbar title="ผลการสกัดคำศัพท์" showBack />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-6">
        <p className="text-ink/60 dark:text-ink-light/60 mb-4">
          ตรวจสอบคำที่ตรวจพบ แก้ไขพินอินหรือคำแปลได้ตามต้องการ ก่อนบันทึกเป็นชุดคำศัพท์
        </p>

        {imageDataUrl && rows.some((row) => row.boundingBox) && (
          <div className="mb-5 rounded-2xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
            <p className="text-sm text-ink/60 dark:text-ink-light/60 mb-2">แตะกรอบบนรูปเพื่อเลือกหรือยกเลิกคำศัพท์</p>
            <div className="relative inline-block w-full">
              <img src={imageDataUrl} alt="OCR preview" className="block w-full h-auto rounded-xl" onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
              {rows.filter((row) => row.boundingBox).map((row) => {
                const box = row.boundingBox!;
                return (
                  <button
                    key={row.id}
                    type="button"
                    title={`${row.chinese} · OCR ${Math.round(row.confidence * 100)}% · highlight ${Math.round(row.highlightConfidence * 100)}%`}
                    onClick={() => toggleSelected(row.id)}
                    className={`absolute border-2 rounded-sm transition-colors ${row.selected ? "border-seal-500 bg-seal-500/20" : "border-ink/40 bg-white/10"}`}
                    style={{ left: `${(box.x0 / imageSize.width) * 100}%`, top: `${(box.y0 / imageSize.height) * 100}%`, width: `${((box.x1 - box.x0) / imageSize.width) * 100}%`, height: `${((box.y1 - box.y0) / imageSize.height) * 100}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {isLoadingTranslations && (
          <div className="flex items-center gap-3 text-ink/60 dark:text-ink-light/60 text-sm mb-4 bg-white/60 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-xl px-4 py-3">
            <span className="w-4 h-4 rounded-full border-2 border-seal-500 border-t-transparent animate-spin shrink-0" />
            กำลังสร้างพินอินและแปลภาษาไทยให้อัตโนมัติ...
          </div>
        )}

        {uncertainRows.length > 0 && (
          <div className="mb-4 text-sm bg-gold-500/10 border border-gold-500/30 text-gold-600 dark:text-gold-300 rounded-xl px-4 py-3">
            มี {uncertainRows.length} คำที่ระบบไม่แน่ใจว่าเป็นคำไฮไลต์หรือไม่ กรุณาตรวจสอบก่อนบันทึก
          </div>
        )}

        <VocabEditableList
          rows={editableRows}
          onChange={updateField}
          onDelete={deleteRow}
          onAdd={addRow}
          addLabel="เพิ่มคำด้วยตนเอง"
        />

        {unselectedRows.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink/60 dark:text-ink-light/60 mb-2">
              ข้อความอื่นที่ตรวจพบ (ไม่ได้ไฮไลต์) — แตะเพื่อรวมเข้าไว้ในรายการ
            </h3>
            <div className="flex flex-wrap gap-2">
              {unselectedRows.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleSelected(r.id)}
                  className="chinese-text px-3 py-1.5 rounded-full border border-ink/15 dark:border-white/15 text-ink/60 dark:text-ink-light/60 hover:border-seal-500 hover:text-seal-500 transition-colors"
                >
                  {r.chinese}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-2xl p-5">
          <h3 className="font-display font-bold text-ink dark:text-ink-light mb-3">บันทึกเป็นชุดคำศัพท์</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={deckChoice === "new"}
                onChange={() => setDeckChoice("new")}
                className="accent-seal-500 w-4 h-4"
              />
              <input
                type="text"
                value={newDeckName}
                onFocus={() => setDeckChoice("new")}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="ตั้งชื่อชุดคำศัพท์ใหม่"
                className="flex-1 rounded-lg border border-ink/15 dark:border-white/15 bg-transparent px-3 py-2 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
              />
            </label>
            {decks.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={deckChoice !== "new"}
                  onChange={() => setDeckChoice(decks[0].id)}
                  className="accent-seal-500 w-4 h-4"
                />
                <select
                  value={deckChoice !== "new" ? deckChoice : ""}
                  onChange={(e) => setDeckChoice(e.target.value)}
                  onFocus={() => deckChoice === "new" && setDeckChoice(decks[0].id)}
                  className="flex-1 rounded-lg border border-ink/15 dark:border-white/15 bg-transparent px-3 py-2 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
                >
                  <option value="" disabled>
                    เพิ่มเข้าชุดที่มีอยู่แล้ว...
                  </option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id} className="text-ink">
                      {d.name} ({d.items.length} คำ)
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <Button fullWidth onClick={handleSave}>
              บันทึกชุดคำศัพท์ ({selectedRows.length} คำ)
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="ghost" icon={<CopyIcon width={16} height={16} />} onClick={handleCopy}>
              คัดลอก
            </Button>
            <Button size="sm" variant="ghost" icon={<DownloadIcon width={16} height={16} />} onClick={() => handleExport("txt")}>
              TXT
            </Button>
            <Button size="sm" variant="ghost" icon={<DownloadIcon width={16} height={16} />} onClick={() => handleExport("csv")}>
              CSV
            </Button>
            <Button size="sm" variant="ghost" icon={<DownloadIcon width={16} height={16} />} onClick={() => handleExport("json")}>
              JSON
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
