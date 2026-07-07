import { useMemo, useState } from "react";

// 협찬 조건 점검 — AI 없이 클라이언트에서 즉시 계산.
export default function SponsorCheck() {
  const [text, setText] = useState("");
  const [minChars, setMinChars] = useState(1000);
  const [minImages, setMinImages] = useState(10);
  const [required, setRequired] = useState(""); // 쉼표로 구분한 필수 키워드

  const charCount = useMemo(
    () => text.replace(/\s/g, "").length,
    [text]
  );

  const keywords = required
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const checks = [
    {
      label: `글자수 ${minChars}자 이상`,
      ok: charCount >= minChars,
      detail: `현재 ${charCount}자 (공백 제외)`,
    },
    ...keywords.map((k) => ({
      label: `필수 키워드 "${k}" 포함`,
      ok: text.includes(k),
      detail: text.includes(k) ? "포함됨" : "누락",
    })),
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">협찬 조건 점검</h1>
      <p className="mb-6 text-sm text-gray-500">
        발행 전 필수 키워드·글자수 조건을 즉시 확인하세요. (이미지·지도 항목은
        확장 예정)
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <textarea
            placeholder="완성한 원고를 붙여넣으세요."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-3">
            <label className="flex-1 text-sm">
              최소 글자수
              <input
                type="number"
                value={minChars}
                onChange={(e) => setMinChars(Number(e.target.value))}
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
            <label className="flex-1 text-sm">
              최소 이미지 수
              <input
                type="number"
                value={minImages}
                onChange={(e) => setMinImages(Number(e.target.value))}
                className="mt-1 w-full rounded border px-2 py-1"
              />
            </label>
          </div>
          <input
            placeholder="필수 키워드 (쉼표로 구분)"
            value={required}
            onChange={(e) => setRequired(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="space-y-2">
          {checks.map((c, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                c.ok
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <span>{c.ok ? "✅" : "❌"} {c.label}</span>
              <span className="text-gray-500">{c.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
