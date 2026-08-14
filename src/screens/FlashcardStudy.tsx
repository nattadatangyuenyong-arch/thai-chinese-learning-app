import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShuffleIcon,
  RefreshIcon,
  VolumeIcon,
  CheckIcon,
  XIcon,
  FlashcardIcon,
} from "../components/Icons";
import { useDecksContext } from "../context/DecksContext";
import { useToast } from "../context/ToastContext";
import { speakChinese, isTtsSupported } from "../services/ttsService";
import { VocabularyItem } from "../types";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlashcardStudy() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { getDeck, setItemStatus, resetKnownItems } = useDecksContext();
  const { showToast } = useToast();

  const deck = deckId ? getDeck(deckId) : undefined;

  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [pinyinVisible, setPinyinVisible] = useState(true);
  const [onlyStillLearning, setOnlyStillLearning] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Swipe tracking. A swipe changes card; a normal tap still flips the card.
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const allItems = deck?.items ?? [];

  // Normal study mode excludes cards already marked as "known".
  // "Still learning" mode is stricter and shows only learning cards.
  const poolItems = useMemo(
    () => onlyStillLearning
      ? allItems.filter((i) => i.learningStatus === "learning")
      : allItems.filter((i) => i.learningStatus !== "known"),
    [allItems, onlyStillLearning]
  );

  useEffect(() => {
    setOrder(poolItems.map((i) => i.id));
    setIndex(0);
    setFlipped(false);
    // Rebuild the round when entering a deck, switching study mode, or changing card count.
    // Status changes are handled directly so remembering a card does not jump back to card 1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, onlyStillLearning, allItems.length]);

  if (!deck) {
    return (
      <div className="min-h-screen">
        <Navbar title="เรียนแฟลชการ์ด" showBack />
        <main className="max-w-2xl mx-auto px-4 pt-6">
          <EmptyState
            icon={<FlashcardIcon width={26} height={26} />}
            title="ไม่พบชุดคำศัพท์นี้"
            message="ชุดคำศัพท์อาจถูกลบไปแล้ว"
            action={<Button onClick={() => navigate("/decks")}>กลับไปที่ชุดคำศัพท์</Button>}
          />
        </main>
      </div>
    );
  }

  const safeIndex = order.length === 0 ? 0 : Math.min(index, order.length - 1);
  const currentItem: VocabularyItem | undefined = order.length > 0 ? allItems.find((i) => i.id === order[safeIndex]) : undefined;

  const known = allItems.filter((i) => i.learningStatus === "known").length;
  const learning = allItems.filter((i) => i.learningStatus === "learning").length;

  function goNext() {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (order.length === 0 ? 0 : (i + 1) % order.length)), flipped ? 150 : 0);
  }

  function goPrev() {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (order.length === 0 ? 0 : (i - 1 + order.length) % order.length)), flipped ? 150 : 0);
  }

  function handleShuffle() {
    setOrder((prev) => shuffleArray(prev));
    setIndex(0);
    setFlipped(false);
    showToast("สลับลำดับการ์ดแล้ว");
  }

  function handleRestart() {
    setOrder(poolItems.map((i) => i.id));
    setIndex(0);
    setFlipped(false);
    setReviewedCount(0);
    showToast("เริ่มรอบใหม่ โดยไม่รวมคำที่จำได้แล้ว");
  }

  function handleResetKnown() {
    if (!deckId || known === 0) return;
    resetKnownItems(deckId);
    setOnlyStillLearning(false);
    setOrder(allItems.map((i) => i.id));
    setIndex(0);
    setFlipped(false);
    setReviewedCount(0);
    showToast(`นำคำที่จำได้แล้ว ${known} คำกลับมาทบทวน`);
  }

  function markStatus(status: "known" | "learning") {
    if (!currentItem || !deckId) return;
    setItemStatus(deckId, currentItem.id, status);
    setReviewedCount((c) => c + 1);

    if (status === "known") {
      // Remove the remembered card immediately from the current round.
      setOrder((prev) => prev.filter((id) => id !== currentItem.id));
      setIndex((i) => {
        const nextLength = Math.max(0, order.length - 1);
        if (nextLength === 0) return 0;
        return Math.min(i, nextLength - 1);
      });
      setFlipped(false);
      return;
    }

    goNext();
  }

  function handleSpeak() {
    if (currentItem) speakChinese(currentItem.chinese);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    suppressClickRef.current = false;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Require a clear horizontal swipe so normal taps and vertical scrolling still work.
    if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy)) return;

    suppressClickRef.current = true;
    if (dx < 0) goNext(); // swipe left -> next
    else goPrev(); // swipe right -> previous
  }

  function handleCardClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setFlipped((f) => !f);
  }

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar title={deck.name} showBack />
        <main className="max-w-2xl mx-auto px-4 pt-6">
          <EmptyState
            icon={<FlashcardIcon width={26} height={26} />}
            title="ชุดนี้ยังไม่มีคำศัพท์"
            message="เพิ่มคำศัพท์ก่อนเริ่มเรียนแฟลชการ์ด"
            action={<Button onClick={() => navigate(`/decks/${deckId}/edit`)}>เพิ่มคำศัพท์</Button>}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title={deck.name} showBack />
      <main className="max-w-xl mx-auto px-4 pb-16 pt-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-ink/60 dark:text-ink-light/60 mb-2">
          <span>
            การ์ดที่ {order.length === 0 ? 0 : safeIndex + 1} / {order.length}
          </span>
          <span>ทบทวนแล้ว {reviewedCount} ครั้ง</span>
        </div>
        <div className="h-2 rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden mb-4">
          <div
            className="h-full bg-seal-500 rounded-full transition-all"
            style={{ width: `${order.length === 0 ? 0 : ((safeIndex + 1) / order.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold mb-5">
          <span className="px-2.5 py-1 rounded-full bg-jade-500/15 text-jade-600 dark:text-jade-400">จำได้แล้ว {known}</span>
          <span className="px-2.5 py-1 rounded-full bg-gold-500/15 text-gold-600 dark:text-gold-300">กำลังเรียนรู้ {learning}</span>
          <span className="px-2.5 py-1 rounded-full bg-ink/10 dark:bg-white/10 text-ink/60 dark:text-ink-light/60">
            ทั้งหมด {allItems.length}
          </span>
        </div>

        {/* Mode toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          <ToggleChip active={reverseMode} onClick={() => { setReverseMode((v) => !v); setFlipped(false); }} label="โหมดกลับด้าน (ไทย → จีน)" />
          <ToggleChip active={pinyinVisible} onClick={() => setPinyinVisible((v) => !v)} label="แสดงพินอิน" />
          <ToggleChip
            active={onlyStillLearning}
            onClick={() => setOnlyStillLearning((v) => !v)}
            label={`ทบทวนเฉพาะ \"กำลังเรียนรู้\" (${learning})`}
            disabled={learning === 0 && !onlyStillLearning}
          />
        </div>

        {known > 0 && (
          <div className="mb-6">
            <Button variant="secondary" size="sm" icon={<RefreshIcon width={16} height={16} />} onClick={handleResetKnown}>
              รีเซ็ตคำที่จำได้ ({known})
            </Button>
          </div>
        )}

        {order.length === 0 ? (
          <EmptyState
            icon={<CheckIcon width={26} height={26} />}
            title={known === allItems.length ? "จำได้ครบทุกคำแล้ว 🎉" : "ไม่มีการ์ดให้ทบทวนในโหมดนี้"}
            message={known === allItems.length
              ? "กดรีเซ็ตด้านบนเมื่อต้องการนำทุกคำกลับมาทบทวนอีกครั้ง"
              : 'ยังไม่มีคำที่อยู่ในสถานะ "กำลังเรียนรู้" ลองปิดตัวกรองนี้'}
            action={known === allItems.length
              ? <Button onClick={handleResetKnown}>รีเซ็ตและทบทวนใหม่</Button>
              : <Button onClick={() => setOnlyStillLearning(false)}>แสดงการ์ดที่ยังไม่จำ</Button>}
          />
        ) : (
          currentItem && (
            <>
              {/* Flashcard */}
              <div className="flip-scene mb-3">
                <button
                  onClick={handleCardClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  aria-label="พลิกการ์ด ปัดซ้ายหรือขวาเพื่อเปลี่ยนคำ"
                  className={`flip-card relative w-full aspect-[4/3] sm:aspect-[16/10] touch-pan-y select-none ${flipped ? "flipped" : ""}`}
                >
                  {/* Front */}
                  <div className="flip-face absolute inset-0 rounded-3xl bg-white dark:bg-[#211C18] border border-ink/10 dark:border-white/10 shadow-xl flex flex-col items-center justify-center p-8">
                    <span className="text-xs font-semibold uppercase tracking-widest text-ink/40 dark:text-ink-light/40 mb-4">
                      {reverseMode ? "Thai" : "Chinese"}
                    </span>
                    {reverseMode ? (
                      <p className="thai-text text-3xl sm:text-4xl font-bold text-ink dark:text-ink-light text-center">
                        {currentItem.thaiTranslation}
                      </p>
                    ) : (
                      <p className="chinese-text text-6xl sm:text-7xl font-bold text-ink dark:text-ink-light text-center">
                        {currentItem.chinese}
                      </p>
                    )}
                    <span className="mt-6 text-xs text-ink/40 dark:text-ink-light/40">แตะเพื่อดูคำตอบ</span>
                  </div>

                  {/* Back */}
                  <div className="flip-face flip-face-back absolute inset-0 rounded-3xl bg-seal-500 text-paper shadow-xl flex flex-col items-center justify-center p-8">
                    <span className="text-xs font-semibold uppercase tracking-widest text-paper/60 mb-4">
                      {reverseMode ? "Chinese" : "Pinyin + Thai"}
                    </span>
                    {reverseMode ? (
                      <>
                        <p className="chinese-text text-5xl sm:text-6xl font-bold mb-2 text-center">{currentItem.chinese}</p>
                        {pinyinVisible && <p className="text-lg text-paper/85 mb-1">{currentItem.pinyin}</p>}
                      </>
                    ) : (
                      <>
                        {pinyinVisible && <p className="text-2xl font-semibold mb-2">{currentItem.pinyin}</p>}
                        <p className="thai-text text-2xl text-center">{currentItem.thaiTranslation}</p>
                      </>
                    )}
                    {currentItem.exampleSentence && (
                      <div className="mt-4 text-sm text-paper/80 text-center max-w-sm">
                        <p className="chinese-text">{currentItem.exampleSentence}</p>
                        {pinyinVisible && <p className="italic">{currentItem.exampleSentencePinyin}</p>}
                        <p className="thai-text">{currentItem.exampleSentenceThai}</p>
                      </div>
                    )}
                    {isTtsSupported() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak();
                        }}
                        aria-label="ฟังเสียงอ่านภาษาจีน"
                        className="mt-5 p-3 rounded-full bg-paper/15 hover:bg-paper/25 transition-colors"
                      >
                        <VolumeIcon width={20} height={20} />
                      </button>
                    )}
                  </div>
                </button>
              </div>
              <p className="text-center text-xs text-ink/40 dark:text-ink-light/40 mb-5">ปัดซ้ายเพื่อไปคำถัดไป · ปัดขวาเพื่อย้อนกลับ</p>

              {/* Nav controls */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <IconButton onClick={goPrev} label="การ์ดก่อนหน้า"><ChevronLeftIcon /></IconButton>
                <IconButton onClick={handleShuffle} label="สลับการ์ด"><ShuffleIcon /></IconButton>
                <IconButton onClick={handleRestart} label="เริ่มรอบใหม่"><RefreshIcon /></IconButton>
                <IconButton onClick={goNext} label="การ์ดถัดไป"><ChevronRightIcon /></IconButton>
              </div>

              {/* Mark status */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" icon={<XIcon width={18} height={18} />} onClick={() => markStatus("learning")}>
                  ยังไม่จำ
                </Button>
                <Button
                  size="lg"
                  className="!bg-jade-500 hover:!bg-jade-600"
                  icon={<CheckIcon width={18} height={18} />}
                  onClick={() => markStatus("known")}
                >
                  จำได้แล้ว
                </Button>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${
        active
          ? "bg-seal-500 border-seal-500 text-paper"
          : "bg-transparent border-ink/20 dark:border-white/20 text-ink/60 dark:text-ink-light/60 hover:border-seal-500"
      }`}
    >
      {label}
    </button>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-12 h-12 rounded-full bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 flex items-center justify-center text-ink dark:text-ink-light hover:border-seal-500 hover:text-seal-500 transition-colors"
    >
      {children}
    </button>
  );
}
