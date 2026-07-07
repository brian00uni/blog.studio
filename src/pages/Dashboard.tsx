import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

const tools = [
  {
    to: "/keyword",
    title: "키워드 레이더",
    desc: "지역·업종·카테고리로 글감과 제목 후보를 찾습니다.",
    badge: "PRO",
  },
  {
    to: "/write",
    title: "사진 글쓰기",
    desc: "사진과 키워드로 원고 초안을 잡습니다.",
    badge: "무료",
  },
  {
    to: "/check",
    title: "협찬 조건 점검",
    desc: "필수 키워드·글자수·이미지·지도 조건을 확인합니다.",
    badge: "무료",
  },
];

export default function Dashboard() {
  const { session, profile } = useAuth();
  const isPro = profile?.tier === "pro";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          안녕하세요, {session?.user.email?.split("@")[0]}님 👋
        </h1>
        <p className="mt-1 text-gray-500">
          오늘도 좋은 글 하나 만들어 볼까요?
          {!isPro && (
            <>
              {" "}
              무료 등급은 하루 AI 생성{" "}
              <b>3회</b> ({profile?.daily_ai_used ?? 0}/3 사용).
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const locked = t.badge === "PRO" && !isPro;
          return (
            <Link
              key={t.to}
              to={locked ? "#" : t.to}
              className={`rounded-xl border bg-white p-5 transition ${
                locked
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-brand hover:shadow-sm"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{t.title}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    t.badge === "PRO"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {t.badge}
                </span>
              </div>
              <p className="text-sm text-gray-500">{t.desc}</p>
              {locked && (
                <p className="mt-3 text-xs font-medium text-amber-600">
                  🔒 PRO 등급에서 이용 가능
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
