import { useAuth } from "../lib/auth";

// 키워드 레이더 — PRO 전용. (다음 단계에서 검색량/트렌드 API + AI 제목 후보 구현)
export default function KeywordRadar() {
  const { profile } = useAuth();
  const isPro = profile?.tier === "pro";

  if (!isPro) {
    return (
      <div className="rounded-xl border bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-700">
          🔒 키워드 레이더는 PRO 등급 전용이에요
        </p>
        <p className="mt-2 text-sm text-amber-600">
          월 구독으로 지역·업종별 글감과 제목 후보를 받아보세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">키워드 레이더</h1>
      <p className="mb-6 text-sm text-gray-500">
        지역·업종·카테고리로 글감과 제목 후보를 찾습니다. (구현 예정)
      </p>
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-400">
        다음 단계에서 검색량·트렌드 분석과 AI 제목 후보 생성을 붙일 자리예요.
      </div>
    </div>
  );
}
