import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { VocabEditableList, EditableRow } from "../components/VocabEditableList";
import { parseVocabularyText, ParseError } from "../services/importExportService";
import { useDecksContext } from "../context/DecksContext";
import { useToast } from "../context/ToastContext";
import { v4 as uuid } from "uuid";

const PLACEHOLDER = `学习
xuéxí
เรียน / ศึกษา

工作
gōngzuò
ทำงาน / งาน

朋友
péngyou
เพื่อน`;

export default function ImportList() {
  const navigate = useNavigate();
  const { decks, createDeck, addItemsToDeck } = useDecksContext();
  const { showToast } = useToast();

  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [deckChoice, setDeckChoice] = useState<"new" | string>("new");
  const [newDeckName, setNewDeckName] = useState("");

  function handleValidate() {
    const result = parseVocabularyText(raw);
    setRows(result.entries.map((e) => ({ id: uuid(), ...e })));
    setErrors(result.errors);
    setHasParsed(true);
    if (result.entries.length === 0 && result.errors.length === 0) {
      showToast("ไม่พบข้อความคำศัพท์ กรุณาวางรายการก่อน", "error");
    }
  }

  function updateField(id: string, field: "chinese" | "pinyin" | "thaiTranslation", value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: uuid(), chinese: "", pinyin: "", thaiTranslation: "" }]);
  }

  function handleCreate() {
    const validItems = rows.filter((r) => r.chinese.trim() !== "");
    if (validItems.length === 0) {
      showToast("ไม่มีคำศัพท์ที่ถูกต้องให้นำเข้า", "error");
      return;
    }
    const now = new Date().toISOString();
    const items = validItems.map((r) => ({
      id: r.id,
      chinese: r.chinese.trim(),
      pinyin: r.pinyin.trim(),
      thaiTranslation: r.thaiTranslation.trim(),
      learningStatus: "new" as const,
      createdAt: now,
      updatedAt: now,
    }));

    if (deckChoice === "new") {
      const name = newDeckName.trim() || `ชุดคำศัพท์นำเข้า ${new Date().toLocaleDateString("th-TH")}`;
      createDeck(name, items);
      showToast(`สร้างชุด "${name}" พร้อม ${items.length} คำแล้ว`);
    } else {
      addItemsToDeck(deckChoice, items);
      const deck = decks.find((d) => d.id === deckChoice);
      showToast(`เพิ่ม ${items.length} คำลงชุด "${deck?.name}" แล้ว`);
    }
    navigate("/decks");
  }

  return (
    <div className="min-h-screen">
      <Navbar title="นำเข้ารายการคำศัพท์" showBack />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-6">
        <p className="text-ink/60 dark:text-ink-light/60 mb-4">
          วางรายการคำศัพท์ โดยแต่ละคำใช้ 3 บรรทัด: คำจีน, พินอิน, คำแปลภาษาไทย และเว้นบรรทัดว่างระหว่างคำ
        </p>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={10}
          className="chinese-text w-full rounded-2xl border border-ink/15 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 py-3 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500 mb-4"
        />

        <Button onClick={handleValidate} fullWidth size="lg">
          ตรวจสอบและแสดงตัวอย่าง
        </Button>

        {hasParsed && errors.length > 0 && (
          <div className="mt-4 bg-seal-50 dark:bg-seal-500/10 border border-seal-500/30 rounded-xl p-4 space-y-1">
            <p className="font-semibold text-seal-600 dark:text-seal-300 text-sm">พบข้อผิดพลาดในการนำเข้า:</p>
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-seal-600 dark:text-seal-300">
                {err.message}
              </p>
            ))}
          </div>
        )}

        {hasParsed && rows.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display font-bold text-ink dark:text-ink-light mb-3">
              ตัวอย่างก่อนนำเข้า ({rows.length} คำ)
            </h3>
            <VocabEditableList rows={rows} onChange={updateField} onDelete={deleteRow} onAdd={addRow} />

            <div className="mt-8 bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-2xl p-5">
              <h3 className="font-display font-bold text-ink dark:text-ink-light mb-3">สร้างเป็นชุดคำศัพท์</h3>
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
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.items.length} คำ)
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <Button fullWidth className="mt-5" onClick={handleCreate}>
                นำเข้าคำศัพท์ ({rows.filter((r) => r.chinese.trim()).length} คำ)
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
