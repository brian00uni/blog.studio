import { useState } from "react";
import { supabase } from "../lib/supabase";

type Provider = "gemini" | "claude";

export default function PhotoWriter() {
  const [keyword, setKeyword] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [tone, setTone] = useState("친근하고 정보성 있게");
  const [provider, setProvider] = useState<Provider>("gemini"); // 기본 제미나이
  const [result, setResult] = useState("");
  const [resultMeta, setResultMeta] = useState<{ provider: string; model: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setResult("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ keyword, photoNotes, tone, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성에 실패했어요.");
      setResult(data.text);
      setResultMeta({ provider: data.provider, model: data.model });
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">사진 글쓰기</h1>
      <p className="mb-6 text-sm text-gray-500">
        키워드와 사진 설명을 넣으면 네이버 블로그 초안을 만들어 드려요.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {/* AI 제공자 선택 — 기본 Gemini */}
          <div>
            <span className="mb-1 block text-xs font-medium text-gray-500">
              AI 엔진
            </span>
            <div className="inline-flex rounded-lg border p-0.5">
              {(
                [
                  { id: "gemini", label: "Gemini", hint: "기본·빠름" },
                  { id: "claude", label: "Claude", hint: "고품질" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`rounded-md px-4 py-1.5 text-sm transition ${
                    provider === p.id
                      ? "bg-brand text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p.label}
                  <span
                    className={`ml-1.5 text-xs ${
                      provider === p.id ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {p.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <input
            placeholder="핵심 키워드 (예: 성수동 브런치 카페)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <textarea
            placeholder="사진 설명 — 각 사진에 뭐가 담겼는지 간단히 적어주세요."
            value={photoNotes}
            onChange={(e) => setPhotoNotes(e.target.value)}
            rows={6}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            placeholder="톤"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={generate}
            disabled={busy || !keyword}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "AI가 쓰는 중…" : "초안 생성"}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="rounded-lg border bg-white p-4">
          {result ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {resultMeta &&
                    `${resultMeta.provider === "claude" ? "Claude" : "Gemini"} · ${resultMeta.model}`}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  📋 복사
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {result}
              </pre>
            </>
          ) : (
            <p className="py-20 text-center text-sm text-gray-400">
              생성된 초안이 여기에 표시됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
