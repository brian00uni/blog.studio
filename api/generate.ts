import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Vercel 서버리스 함수. 브라우저에 API 키를 노출하지 않기 위해
// 모든 AI 호출은 반드시 이 서버 함수를 경유한다.
//
// 필요한 환경변수 (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY          — Anthropic 콘솔 키 (Claude 선택 시)
//   GEMINI_API_KEY             — Google AI Studio 키 (기본 제공자)
//   SUPABASE_URL               — Supabase 프로젝트 URL
//   SUPABASE_SERVICE_ROLE_KEY  — 서버 전용 service_role 키 (절대 클라이언트 노출 금지)

type Provider = "gemini" | "claude";
type Tier = "free" | "pro";

// 제공자 × 등급별 모델 매트릭스
// ⚠️ gemini-2.5-pro 는 무료 티어 미지원(할당량 0) → 결제 등록된 프로젝트에서만 사용 가능.
//    Google Cloud 결제 활성화 후 pro 를 "gemini-2.5-pro" 로 바꾸면 됩니다.
const MODELS: Record<Provider, Record<Tier, string>> = {
  gemini: { free: "gemini-2.5-flash-lite", pro: "gemini-2.5-flash" },
  claude: { free: "claude-haiku-4-5", pro: "claude-opus-4-8" },
};

// const FREE_DAILY_LIMIT = 3; // [추후 활성화] 무료 등급 일일 생성 제한

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // 1) 사용자 인증 — Authorization: Bearer <supabase access token>
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return json({ error: "로그인이 필요합니다." }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user)
    return json({ error: "세션이 만료되었습니다." }, 401);
  const userId = userData.user.id;

  // 2) 등급 및 일일 사용량 확인
  const { data: profile } = await admin
    .from("profiles")
    .select("tier, daily_ai_used")
    .eq("id", userId)
    .single();

  // [개발 편의] DEV_UNLOCK_ALL=true 면 등급 무관하게 PRO 로 취급 (상위 모델 확인용).
  // 배포 시엔 이 변수를 설정하지 않으면 원래 등급 로직대로 동작.
  const devUnlock = process.env.DEV_UNLOCK_ALL === "true";
  const tier: Tier = devUnlock || profile?.tier === "pro" ? "pro" : "free";
  const used = profile?.daily_ai_used ?? 0;
  // [일일 사용 제한 — 추후 활성화] 지금은 제한 없이 사용 가능.
  // if (tier === "free" && used >= FREE_DAILY_LIMIT)
  //   return json(
  //     { error: `무료 등급 하루 ${FREE_DAILY_LIMIT}회 한도를 모두 사용했어요.` },
  //     429
  //   );

  // 3) 요청 파싱 — provider 기본값은 gemini
  const body = (await req.json()) as {
    keyword?: string;
    photoNotes?: string;
    tone?: string;
    provider?: Provider;
  };
  const provider: Provider = body.provider === "claude" ? "claude" : "gemini";
  const model = MODELS[provider][tier];

  const system =
    "당신은 네이버 블로그 전문 작가입니다. 정보성과 친근함을 갖춘 자연스러운 한국어 글을 씁니다. " +
    "제목, 소제목, 본문 문단, 해시태그를 포함해 바로 스마트에디터에 붙여넣을 수 있는 형태로 작성하세요.";

  const userPrompt = [
    `키워드: ${body.keyword ?? "(없음)"}`,
    body.photoNotes ? `사진 설명: ${body.photoNotes}` : "",
    body.tone ? `톤: ${body.tone}` : "",
    "",
    "위 정보로 네이버 블로그 글 초안을 작성해 주세요.",
  ]
    .filter(Boolean)
    .join("\n");

  // 4) 제공자별 호출
  let text: string;
  try {
    text =
      provider === "claude"
        ? await callClaude(model, system, userPrompt)
        : await callGemini(model, system, userPrompt);
  } catch (e) {
    return json(
      { error: `AI 호출 실패: ${e instanceof Error ? e.message : "알 수 없음"}` },
      502
    );
  }

  // 5) 사용량 +1 (무료 등급만 카운트)
  if (tier === "free") {
    await admin
      .from("profiles")
      .update({ daily_ai_used: used + 1 })
      .eq("id", userId);
  }

  return json({ text, model, provider, tier });
}

async function callClaude(
  model: string,
  system: string,
  user: string
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function callGemini(
  model: string,
  system: string,
  user: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model,
    contents: user,
    config: { systemInstruction: system, maxOutputTokens: 4000 },
  });
  return res.text ?? "";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
