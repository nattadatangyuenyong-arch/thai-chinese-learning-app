import React, { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AuthPage() {
  const { user, configured, signIn, signUp, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      showToast("กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร", "error");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        showToast("เข้าสู่ระบบแล้ว ข้อมูลจะซิงก์กับ Supabase");
        navigate("/");
      } else {
        const result = await signUp(email.trim(), password);
        if (result.confirmationRequired) {
          showToast("สร้างบัญชีแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี");
          setMode("login");
        } else {
          showToast("สร้างบัญชีและเข้าสู่ระบบแล้ว");
          navigate("/");
        }
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้", "error");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      showToast("กรุณากรอกอีเมลก่อน", "error");
      return;
    }
    try {
      await resetPassword(email.trim());
      showToast("ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ส่งอีเมลไม่ได้", "error");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar title={mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"} showBack />
      <main className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-seal-500 text-white flex items-center justify-center font-display text-2xl mx-auto mb-4">词</div>
          <h2 className="font-display text-2xl font-bold text-center text-ink dark:text-ink-light">
            {mode === "login" ? "ซิงก์คำศัพท์ข้ามอุปกรณ์" : "สร้างบัญชี CíZhī"}
          </h2>
          <p className="text-sm text-center text-ink/55 dark:text-ink-light/55 mt-2 mb-6">
            {configured ? "ข้อมูลของคุณจะถูกเก็บใน Supabase และเข้าถึงได้จากทุกอุปกรณ์" : "ยังไม่ได้ตั้งค่า Supabase environment variables"}
          </p>

          {!configured && (
            <div className="mb-5 rounded-xl bg-gold-500/15 p-3 text-sm text-ink dark:text-ink-light">
              เพิ่ม VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ในไฟล์ .env.local ก่อนใช้งาน
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold text-ink dark:text-ink-light">
              อีเมล
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-ink/15 dark:border-white/15 bg-transparent px-3 py-3 focus:outline-none focus:ring-2 focus:ring-seal-500" />
            </label>
            <label className="block text-sm font-semibold text-ink dark:text-ink-light">
              รหัสผ่าน
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-1.5 w-full rounded-xl border border-ink/15 dark:border-white/15 bg-transparent px-3 py-3 focus:outline-none focus:ring-2 focus:ring-seal-500" />
            </label>
            <Button type="submit" fullWidth disabled={busy || !configured}>{busy ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</Button>
          </form>

          {mode === "login" && (
            <button onClick={forgotPassword} className="w-full mt-3 text-sm text-seal-500 hover:underline">ลืมรหัสผ่าน?</button>
          )}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full mt-5 pt-5 border-t border-ink/10 dark:border-white/10 text-sm font-semibold text-ink/70 dark:text-ink-light/70 hover:text-seal-500">
            {mode === "login" ? "ยังไม่มีบัญชี? สร้างบัญชี" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
          </button>
        </div>
      </main>
    </div>
  );
}
