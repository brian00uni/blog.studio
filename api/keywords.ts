import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// 키워드 레이더 — 지역·업종·카테고리로 네이버 블로그 제목/태그 후보를 생성한다.
// PRO 전용 (개발 모드 DEV_UNLOCK_ALL 이면 등급 무관 허용).

type Provider = "gemini" | "claude";
type Tier = "free" | "pro";

const MODELS: Record<Provider, string> = {
  // PRO 기능이므로 각 제공자의 상위(무료 티어 한도 내) 모델 사용
  gemini: "gemini-2.5-flash",
  claude: "claude-opus-4-8",
};

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { runtime: "nodejs" };

export interface Candidate {
  title: string;
  tags: string[];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return json({ error: "로그인이 필요합니다." }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user)
    return json({ error: "세션이 만료되었습니다." }, 401);

  const { data: profile } = await admin
    .from("profiles")
    .select("tier")
    .eq("id", userData.user.id)
    .single();

  const devUnlock = process.env.DEV_UNLOCK_ALL === "true";
  const tier: Tier = devUnlock || profile?.tier === "pro" ? "pro" : "free";
  if (tier !== "pro")
    return json({ error: "키워드 레이더는 PRO 등급 전용이에요." }, 403);

  const body = (await req.json()) as {
    region?: string;
    industry?: string;
    category?: string;
    provider?: Provider;
  };
  const provider: Provider = body.provider === "claude" ? "claude" : "gemini";
  const model = MODELS[provider];

  const system =
    "당신은 네이버 블로그 SEO 전문가입니다. 검색 유입이 잘 되는 자연스러운 한국어 제목을 제안합니다.";
  const prompt = [
    `지역: ${body.region || "(무관)"}`,
    `업종: ${body.industry || "(무관)"}`,
    body.category ? `카테고리: ${body.category}` : "",
    "",
    "위 조건으로 네이버 블로그 글 제목 후보 8개와, 각 제목에 어울리는 해시태그 3~5개를 제안하세요.",
    '반드시 아래 JSON 형식으로만 응답하세요: {"candidates":[{"title":"...","tags":["...","..."]}]}',
  ]
    .filter(Boolean)
    .join("\n");

  let raw: string;
  try {
    raw =
      provider === "claude"
        ? await callClaude(model, system, prompt)
        : await callGemini(model, system, prompt);
  } catch (e) {
    return json(
      { error: `AI 호출 실패: ${e instanceof Error ? e.message : "알 수 없음"}` },
      502
    );
  }

  const candidates = parseCandidates(raw);
  if (!candidates.length)
    return json({ error: "후보 생성에 실패했어요. 다시 시도해 주세요." }, 502);

  return json({ candidates, model, provider });
}

async function callClaude(model: string, system: string, user: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function callGemini(model: string, system: string, user: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model,
    contents: user,
    config: { systemInstruction: system, responseMimeType: "application/json" },
  });
  return res.text ?? "";
}

// 모델 응답에서 JSON 을 관대하게 파싱 (코드펜스/잡텍스트가 섞여도 추출)
function parseCandidates(raw: string): Candidate[] {
  const tryParse = (s: string): Candidate[] => {
    const obj = JSON.parse(s);
    const arr = Array.isArray(obj) ? obj : obj.candidates;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((c: unknown) => {
        const o = c as { title?: unknown; tags?: unknown };
        return {
          title: String(o.title ?? "").trim(),
          tags: Array.isArray(o.tags) ? o.tags.map((t) => String(t)) : [],
        };
      })
      .filter((c: Candidate) => c.title);
  };
  try {
    return tryParse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return tryParse(raw.slice(start, end + 1));
      } catch {
        /* noop */
      }
    }
    return [];
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
