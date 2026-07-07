import { createClient } from "@supabase/supabase-js";

// .env.local 에 아래 두 값을 넣으세요 (Supabase 프로젝트 → Settings → API):
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // 개발 편의를 위해 콘솔 경고만 — 실제 인증 호출 시 실패한다.
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

/** 사용자 등급. Supabase profiles 테이블의 tier 컬럼과 매칭. */
export type Tier = "free" | "pro";

export interface Profile {
  id: string;
  email: string;
  tier: Tier;
  daily_ai_used: number; // 오늘 사용한 AI 생성 횟수
}
