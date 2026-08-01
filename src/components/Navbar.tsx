import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useDecksContext } from "../context/DecksContext";
import { SunIcon, MoonIcon, ChevronLeftIcon, HomeIcon } from "./Icons";

interface NavbarProps { title: string; showBack?: boolean; }

export function Navbar({ title, showBack }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { syncing } = useDecksContext();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-30 bg-paper/90 dark:bg-paper-dark/90 backdrop-blur border-b border-ink/10 dark:border-white/10">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && !isHome ? (
            <button onClick={() => navigate(-1)} aria-label="ย้อนกลับ" className="p-2 -ml-2 rounded-full hover:bg-ink/5 dark:hover:bg-white/10 text-ink dark:text-ink-light">
              <ChevronLeftIcon width={20} height={20} />
            </button>
          ) : (
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-seal-500 text-paper font-display text-lg shrink-0">词</span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-ink-light truncate">{title}</h1>
            {user && <p className="text-[11px] text-jade-600 dark:text-jade-400 truncate">{syncing ? "กำลังซิงก์..." : "ซิงก์กับคลาวด์แล้ว"}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isHome && (
            <button onClick={() => navigate("/")} aria-label="หน้าแรก" className="p-2 rounded-full hover:bg-ink/5 dark:hover:bg-white/10 text-ink dark:text-ink-light">
              <HomeIcon width={20} height={20} />
            </button>
          )}
          {user ? (
            <button onClick={() => void signOut()} className="px-2 py-1.5 rounded-lg text-xs font-semibold text-seal-500 hover:bg-seal-50 dark:hover:bg-seal-500/10" title={user.email}>ออกจากระบบ</button>
          ) : (
            <button onClick={() => navigate("/auth")} className="px-2 py-1.5 rounded-lg text-xs font-semibold text-seal-500 hover:bg-seal-50 dark:hover:bg-seal-500/10">เข้าสู่ระบบ</button>
          )}
          <button onClick={toggleTheme} aria-label="สลับโหมดมืด/สว่าง" className="p-2 rounded-full hover:bg-ink/5 dark:hover:bg-white/10 text-ink dark:text-ink-light">
            {theme === "light" ? <MoonIcon width={20} height={20} /> : <SunIcon width={20} height={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
