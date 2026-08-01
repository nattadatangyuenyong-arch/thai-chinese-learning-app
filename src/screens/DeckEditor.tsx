import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { VocabEditableList } from "../components/VocabEditableList";
import { SearchIcon, EditIcon } from "../components/Icons";
import { useDecksContext } from "../context/DecksContext";
import { useToast } from "../context/ToastContext";

export default function DeckEditor() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { getDeck, renameDeck, addItemsToDeck, updateItem, deleteItem } = useDecksContext();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const deck = deckId ? getDeck(deckId) : undefined;

  if (!deck) {
    return (
      <div className="min-h-screen">
        <Navbar title="แก้ไขชุดคำศัพท์" showBack />
        <main className="max-w-2xl mx-auto px-4 pt-6">
          <EmptyState
            icon={<EditIcon width={26} height={26} />}
            title="ไม่พบชุดคำศัพท์นี้"
            message="ชุดคำศัพท์อาจถูกลบไปแล้ว"
            action={<Button onClick={() => navigate("/decks")}>กลับไปที่ชุดคำศัพท์</Button>}
          />
        </main>
      </div>
    );
  }

  const filteredItems = deck.items.filter((i) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return i.chinese.includes(query) || i.pinyin.toLowerCase().includes(q) || i.thaiTranslation.toLowerCase().includes(q);
  });

  function commitRename() {
    if (renameValue.trim() && deckId) {
      renameDeck(deckId, renameValue.trim());
      showToast("เปลี่ยนชื่อชุดคำศัพท์แล้ว");
    }
    setIsRenaming(false);
  }

  function updateField(id: string, field: "chinese" | "pinyin" | "thaiTranslation", value: string) {
    const item = deck!.items.find((i) => i.id === id);
    if (!item || !deckId) return;
    updateItem(deckId, { ...item, [field]: value });
  }

  function handleDelete(id: string) {
    if (deckId) deleteItem(deckId, id);
  }

  function handleAdd() {
    if (!deckId) return;
    const now = new Date().toISOString();
    addItemsToDeck(deckId, [
      { id: uuid(), chinese: "", pinyin: "", thaiTranslation: "", learningStatus: "new", createdAt: now, updatedAt: now },
    ]);
  }

  return (
    <div className="min-h-screen">
      <Navbar title="แก้ไขชุดคำศัพท์" showBack />
      <main className="max-w-2xl mx-auto px-4 pb-16 pt-6">
        <div className="flex items-center gap-2 mb-1">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === "Enter" && commitRename()}
              className="font-display text-2xl font-bold flex-1 rounded-lg border border-seal-500 bg-transparent px-2 py-1 text-ink dark:text-ink-light focus:outline-none"
            />
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-ink dark:text-ink-light truncate">{deck.name}</h2>
              <button
                onClick={() => {
                  setRenameValue(deck.name);
                  setIsRenaming(true);
                }}
                aria-label="เปลี่ยนชื่อชุด"
                className="p-1.5 rounded-lg text-ink/40 dark:text-ink-light/40 hover:bg-ink/5 dark:hover:bg-white/10"
              >
                <EditIcon width={16} height={16} />
              </button>
            </>
          )}
        </div>
        <p className="text-ink/50 dark:text-ink-light/50 mb-5">{deck.items.length} คำศัพท์ในชุดนี้</p>

        <div className="relative mb-5">
          <SearchIcon width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-ink-light/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาคำในชุดนี้..."
            className="w-full rounded-xl border border-ink/15 dark:border-white/15 bg-white/70 dark:bg-white/5 pl-10 pr-3 py-2.5 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
          />
        </div>

        {filteredItems.length === 0 && !query ? (
          <EmptyState
            icon={<EditIcon width={26} height={26} />}
            title="ชุดนี้ยังไม่มีคำศัพท์"
            message='กด "เพิ่มคำศัพท์" ด้านล่างเพื่อเริ่มเพิ่มคำแรกของคุณ'
          />
        ) : (
          <VocabEditableList
            rows={filteredItems.map((i) => ({ id: i.id, chinese: i.chinese, pinyin: i.pinyin, thaiTranslation: i.thaiTranslation }))}
            onChange={updateField}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </main>
    </div>
  );
}
