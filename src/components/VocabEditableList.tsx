import React from "react";
import { TrashIcon, PlusIcon } from "./Icons";
import { Button } from "./Button";

export interface EditableRow {
  id: string;
  chinese: string;
  pinyin: string;
  thaiTranslation: string;
  meta?: string; // e.g. confidence badge text
}

interface VocabEditableListProps {
  rows: EditableRow[];
  onChange: (id: string, field: "chinese" | "pinyin" | "thaiTranslation", value: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  addLabel?: string;
}

export function VocabEditableList({ rows, onChange, onDelete, onAdd, addLabel = "เพิ่มคำศัพท์" }: VocabEditableListProps) {
  return (
    <div className="space-y-3">
      {/* Column headers, desktop only */}
      <div className="hidden sm:grid grid-cols-[1fr_1fr_1.4fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-ink-light/50">
        <span>Chinese</span>
        <span>Pinyin</span>
        <span>Thai Translation</span>
        <span></span>
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 sm:gap-3 items-center bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-xl p-3"
        >
          {row.meta && (
            <span className="sm:hidden inline-block w-fit text-[11px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-300 font-semibold mb-1">
              {row.meta}
            </span>
          )}
          <input
            value={row.chinese}
            onChange={(e) => onChange(row.id, "chinese", e.target.value)}
            placeholder="学习"
            className="chinese-text text-xl w-full rounded-lg border border-ink/15 dark:border-white/15 bg-transparent px-3 py-2.5 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
          />
          <input
            value={row.pinyin}
            onChange={(e) => onChange(row.id, "pinyin", e.target.value)}
            placeholder="xuéxí"
            className="w-full rounded-lg border border-ink/15 dark:border-white/15 bg-transparent px-3 py-2.5 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
          />
          <input
            value={row.thaiTranslation}
            onChange={(e) => onChange(row.id, "thaiTranslation", e.target.value)}
            placeholder="เรียน / ศึกษา"
            className="thai-text w-full rounded-lg border border-ink/15 dark:border-white/15 bg-transparent px-3 py-2.5 text-ink dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-seal-500"
          />
          <div className="flex justify-end sm:justify-center">
            {row.meta && (
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-300 font-semibold mr-2">
                {row.meta}
              </span>
            )}
            <button
              onClick={() => onDelete(row.id)}
              aria-label="ลบคำนี้"
              className="p-2 rounded-lg text-seal-500 hover:bg-seal-50 dark:hover:bg-seal-500/10"
            >
              <TrashIcon width={18} height={18} />
            </button>
          </div>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={onAdd} icon={<PlusIcon width={16} height={16} />}>
        {addLabel}
      </Button>
    </div>
  );
}
