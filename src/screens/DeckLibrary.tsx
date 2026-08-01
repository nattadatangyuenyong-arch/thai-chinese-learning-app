import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  DeckIcon,
  SearchIcon,
  FlashcardIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  DownloadIcon,
  UploadIcon,
} from "../components/Icons";
import { useDecksContext } from "../context/DecksContext";
import { useToast } from "../context/ToastContext";
import { deckToJson, downloadTextFile, parseDeckJson } from "../services/importExportService";
import { VocabularyDeck } from "../types";

export default function DeckLibrary() {
  const navigate = useNavigate();
  const { decks, createDeck, renameDeck, deleteDeck, importDeck } = useDecksContext();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingDeck, setDeletingDeck] = useState<VocabularyDeck | null>(null);

  const filtered = decks.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.items.some(
        (i) =>
          i.chinese.includes(query) ||
          i.pinyin.toLowerCase().includes(q) ||
          i.thaiTranslation.toLowerCase().includes(q)
      )
    );
  });

  function handleCreateEmptyDeck() {
    const name = window.prompt("ตั้งชื่อชุดคำศัพท์ใหม่", "ชุดคำศัพท์ใหม่");
    if (name === null) return;
    const deck = createDeck(name.trim() || "ชุดคำศัพท์ใหม่", []);
    navigate(`/decks/${deck.id}/edit`);
  }

  function startRename(deck: VocabularyDeck) {
    setRenamingId(deck.id);
    setRenameValue(deck.name);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      renameDeck(renamingId, renameValue.trim());
      showToast("เปลี่ยนชื่อชุดคำศัพท์แล้ว");
    }
    setRenamingId(null);
  }

  function handleExportDeck(deck: VocabularyDeck) {
    downloadTextFile(`${deck.name}.json`, deckToJson(deck), "application/json");
    showToast("ส่งออกชุดคำศัพท์เป็น JSON แล้ว");
  }

  function handleImportFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const deck = parseDeckJson(reader.result as string);
      if (!deck) {
        showToast("ไฟล์ JSON ไม่ถูกต้อง กรุณาตรวจสอบไฟล์อีกครั้ง", "error");
        return;
      }
      importDeck(deck);
      showToast(`นำเข้าชุด "${deck.name}" แล้ว`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen">
      <Navbar title="ชุดคำศัพท์ของฉัน" showBack />
      <main className="max-w-2xl mx-auto px-4 pb-16 pt-6">
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <SearchIcon
              width={18}
              height={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-ink-light/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชุดคำศัพท์หรือคำ..."
              className="w-full rounded-xl border border-ink/15 dark:border-white/15 bg-white/70 dark:bg-white/5 pl-10 pr-3 py-2.5 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button size="sm" icon={<PlusIcon width={16} height={16} />} onClick={handleCreateEmptyDeck}>
            สร้างชุดใหม่
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<UploadIcon width={16} height={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            นำเข้าไฟล์ JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<DeckIcon width={28} height={28} />}
            title={decks.length === 0 ? "ยังไม่มีชุดคำศัพท์" : "ไม่พบชุดคำศัพท์ที่ค้นหา"}
            message={
              decks.length === 0
                ? "เริ่มต้นด้วยการอัปโหลดรูปภาพหรือสร้างชุดคำศัพท์ใหม่"
                : "ลองค้นหาด้วยคำอื่น หรือสร้างชุดคำศัพท์ใหม่"
            }
            action={
              <Button icon={<PlusIcon width={16} height={16} />} onClick={handleCreateEmptyDeck}>
                สร้างชุดคำศัพท์
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((deck) => {
              const known = deck.items.filter((i) => i.learningStatus === "known").length;
              const progress = deck.items.length > 0 ? Math.round((known / deck.items.length) * 100) : 0;
              return (
                <div
                  key={deck.id}
                  className="bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {renamingId === deck.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => e.key === "Enter" && commitRename()}
                        className="flex-1 rounded-lg border border-seal-500 bg-transparent px-2 py-1 text-ink dark:text-ink-light font-display font-bold focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => navigate(`/decks/${deck.id}/study`)}
                        className="font-display font-bold text-lg text-ink dark:text-ink-light text-left hover:text-seal-500 transition-colors truncate"
                      >
                        {deck.name}
                      </button>
                    )}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startRename(deck)}
                        aria-label="เปลี่ยนชื่อ"
                        className="p-2 rounded-lg text-ink/50 dark:text-ink-light/50 hover:bg-ink/5 dark:hover:bg-white/10"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        onClick={() => handleExportDeck(deck)}
                        aria-label="ส่งออก"
                        className="p-2 rounded-lg text-ink/50 dark:text-ink-light/50 hover:bg-ink/5 dark:hover:bg-white/10"
                      >
                        <DownloadIcon width={16} height={16} />
                      </button>
                      <button
                        onClick={() => setDeletingDeck(deck)}
                        aria-label="ลบชุด"
                        className="p-2 rounded-lg text-seal-500 hover:bg-seal-50 dark:hover:bg-seal-500/10"
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-jade-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-ink/50 dark:text-ink-light/50 shrink-0">
                      {deck.items.length} คำ · {progress}%
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      icon={<FlashcardIcon width={16} height={16} />}
                      onClick={() => navigate(`/decks/${deck.id}/study`)}
                      disabled={deck.items.length === 0}
                    >
                      เริ่มเรียน
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/decks/${deck.id}/edit`)}>
                      แก้ไขคำศัพท์
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deletingDeck}
        title="ลบชุดคำศัพท์นี้?"
        message={`คุณกำลังจะลบชุด "${deletingDeck?.name}" พร้อมคำศัพท์ทั้งหมด ${deletingDeck?.items.length} คำ การลบนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบชุดนี้"
        danger
        onCancel={() => setDeletingDeck(null)}
        onConfirm={() => {
          if (deletingDeck) {
            deleteDeck(deletingDeck.id);
            showToast("ลบชุดคำศัพท์แล้ว");
          }
          setDeletingDeck(null);
        }}
      />
    </div>
  );
}
