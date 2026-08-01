import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useDecksContext } from "../context/DecksContext";
import { CameraIcon, ImportIcon, DeckIcon, FlashcardIcon, StarIcon, ChevronRightIcon } from "../components/Icons";

export default function Home() {
  const navigate = useNavigate();
  const { decks, syncing, syncError, storageMode, retrySync } = useDecksContext();

  const totalCards = decks.reduce((sum, d) => sum + d.items.length, 0);
  const knownCards = decks.reduce(
    (sum, d) => sum + d.items.filter((i) => i.learningStatus === "known").length,
    0
  );
  const recentDecks = [...decks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar title="词枝 CíZhī" />
      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-4">
          <div className={`rounded-xl px-3 py-2 text-sm flex items-center justify-between gap-3 ${syncError ? "bg-seal-50 dark:bg-seal-500/10 text-seal-700 dark:text-seal-300" : "bg-jade-500/10 text-jade-700 dark:text-jade-400"}`}>
            <span>{syncError ? `ซิงก์ไม่สำเร็จ: ${syncError}` : storageMode === "cloud" ? (syncing ? "กำลังซิงก์ข้อมูลกับ Supabase..." : "ข้อมูลบันทึกบน Supabase และซิงก์ข้ามอุปกรณ์") : "โหมดผู้เยี่ยมชม: ข้อมูลบันทึกเฉพาะเบราว์เซอร์นี้"}</span>
            {syncError && <button onClick={() => void retrySync()} className="font-semibold underline shrink-0">ลองใหม่</button>}
          </div>
        </section>
        {/* Hero */}
        <section className="pt-8 pb-6">
          <div className="relative overflow-hidden rounded-3xl bg-seal-500 text-paper px-6 py-8 sm:px-10 sm:py-12">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-4 border-paper/20 rotate-12" />
            <div className="absolute right-6 bottom-4 w-16 h-16 rounded-xl border-2 border-paper/25 rotate-6 flex items-center justify-center font-display text-3xl text-paper/25">
              词
            </div>
            <p className="thai-text text-sm sm:text-base font-medium text-paper/80 mb-2">
              เก็บคำศัพท์จีนจากรูปภาพที่คุณไฮไลต์ไว้
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-4">
              ถ่ายรูป แปลคำ<br />สร้างแฟลชการ์ดของคุณเอง
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-paper/15 rounded-full px-3 py-1">{totalCards} คำศัพท์ทั้งหมด</span>
              <span className="bg-paper/15 rounded-full px-3 py-1">{knownCards} คำที่จำได้แล้ว</span>
              <span className="bg-paper/15 rounded-full px-3 py-1">{decks.length} ชุดคำศัพท์</span>
            </div>
          </div>
        </section>

        {/* Primary actions */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <ActionCard
            icon={<CameraIcon width={26} height={26} />}
            title="อัปโหลดรูปภาพ"
            subtitle="สแกนคำไฮไลต์จากรูป"
            onClick={() => navigate("/upload")}
            accent="seal"
          />
          <ActionCard
            icon={<ImportIcon width={26} height={26} />}
            title="นำเข้ารายการคำศัพท์"
            subtitle="วางข้อความคำศัพท์"
            onClick={() => navigate("/import")}
            accent="gold"
          />
          <ActionCard
            icon={<DeckIcon width={26} height={26} />}
            title="ชุดคำศัพท์ของฉัน"
            subtitle={`${decks.length} ชุดที่บันทึกไว้`}
            onClick={() => navigate("/decks")}
            accent="jade"
          />
        </section>

        {/* Recent decks */}
        {recentDecks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold text-ink dark:text-ink-light">ชุดคำศัพท์ล่าสุด</h3>
              <button
                onClick={() => navigate("/decks")}
                className="text-sm font-semibold text-seal-500 flex items-center gap-0.5 hover:underline"
              >
                ดูทั้งหมด <ChevronRightIcon width={16} height={16} />
              </button>
            </div>
            <div className="space-y-3">
              {recentDecks.map((deck) => {
                const known = deck.items.filter((i) => i.learningStatus === "known").length;
                const progress = deck.items.length > 0 ? Math.round((known / deck.items.length) * 100) : 0;
                return (
                  <button
                    key={deck.id}
                    onClick={() => navigate(`/decks/${deck.id}/study`)}
                    className="w-full flex items-center gap-4 bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-2xl px-4 py-4 text-left hover:border-seal-500/40 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-seal-50 dark:bg-white/10 text-seal-500 flex items-center justify-center shrink-0">
                      <FlashcardIcon width={22} height={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink dark:text-ink-light truncate">{deck.name}</p>
                      <p className="text-sm text-ink/50 dark:text-ink-light/50">{deck.items.length} คำ · จำได้ {progress}%</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold-500/15 text-gold-600 dark:text-gold-300 flex items-center justify-center shrink-0">
                      <StarIcon width={16} height={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent: "seal" | "gold" | "jade";
}) {
  const accentClasses = {
    seal: "bg-seal-50 text-seal-500 dark:bg-seal-500/15",
    gold: "bg-gold-500/15 text-gold-600 dark:text-gold-300",
    jade: "bg-jade-500/15 text-jade-600 dark:text-jade-400",
  }[accent];

  return (
    <button
      onClick={onClick}
      className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 text-left bg-white/70 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-2xl p-5 hover:border-seal-500/40 hover:-translate-y-0.5 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accentClasses}`}>{icon}</div>
      <div>
        <p className="font-display font-bold text-ink dark:text-ink-light">{title}</p>
        <p className="text-sm text-ink/55 dark:text-ink-light/55">{subtitle}</p>
      </div>
    </button>
  );
}
