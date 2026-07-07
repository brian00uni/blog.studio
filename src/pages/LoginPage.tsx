import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) nav("/", { replace: true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) setError(error.message);
    else nav("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-brand">블로그 스튜디오</h1>
        <p className="mb-6 text-sm text-gray-500">
          {mode === "login" ? "로그인" : "회원가입"} 후 시작하세요
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            type="password"
            required
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-900"
        >
          {mode === "login"
            ? "계정이 없으신가요? 회원가입"
            : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </div>
  );
}
