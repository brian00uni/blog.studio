import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const nav = [
  { to: "/", label: "홈", end: true },
  { to: "/keyword", label: "키워드 레이더" },
  { to: "/write", label: "사진 글쓰기" },
  { to: "/check", label: "협찬 조건 점검" },
];

export default function Layout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-bold text-brand">블로그 스튜디오</span>
          <nav className="flex flex-1 gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded px-3 py-1.5 text-sm ${
                    isActive
                      ? "bg-brand/10 font-medium text-brand"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                profile?.tier === "pro"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {profile?.tier === "pro" ? "PRO" : "무료"}
            </span>
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
