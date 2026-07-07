import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// 키워드 레이더 — 지역·업종·카테고리로 네이버 블로그 키워드 후보를 스캔한다.
// 각 후보에 종합점수 / 4대 지표 / "왜 보이는가" / 추천 제목까지 담아 반환.
// PRO 전용 (개발 모드 DEV_UNLOCK_ALL 이면 등급 무관 허용).

type Provider = "gemini" | "claude";
type Tier = "free" | "pro";

const MODELS: Record<Provider, string> = {
  gemini: "gemini-2.5-flash",
  claude: "claude-opus-4-8",
};

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { runtime: "nodejs" };

export interface Metrics {
  attention: number; // 주목도
  momentum: number; // 상승세
  gap: number; // 빈틈(경쟁 낮음)
  videoFit: number; // 영상감
}
export interface Candidate {
  keyword: string;
  score: number; // 종합 판단 점수 0-100
  tags: string[];
  metrics: Metrics;
  reasons: string[]; // 왜 보이는가
  titles: string[]; // 추천 제목
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
    "당신은 네이버 블로그 SEO·트렌드 분석가입니다. 검색 유입이 잘 되는 키워드를 발굴하고 점수화합니다.";
  const prompt = [
    `지역: ${body.region || "(무관)"}`,
    `업종: ${body.industry || "(무관)"}`,
    body.category ? `카테고리: ${body.category}` : "",
    "",
    "위 조건으로 지금 시점 검색 유입이 잘 될 네이버 블로그 키워드 후보 12개를 발굴하세요.",
    "각 후보에 대해 다음을 산출합니다(모두 0~100 정수, 현실적으로 60~95 분포):",
    "- score: 지금 쓰기 좋은 정도(종합 판단 점수)",
    "- metrics.attention(주목도), metrics.momentum(상승세), metrics.gap(빈틈=경쟁 낮음), metrics.videoFit(영상감)",
    "- tags: 해시태그 3~5개",
    "- reasons: 이 키워드가 지금 보이는 이유 2~3개(한 문장씩)",
    "- titles: 이 키워드로 쓸 블로그 제목 후보 2~3개",
    "",
    '반드시 아래 JSON 형식으로만 응답: {"candidates":[{"keyword":"...","score":88,"tags":["..."],"metrics":{"attention":80,"momentum":75,"gap":66,"videoFit":70},"reasons":["..."],"titles":["..."]}]}',
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

  const candidates = parseCandidates(raw).sort((a, b) => b.score - a.score);
  if (!candidates.length)
    return json({ error: "스캔에 실패했어요. 다시 시도해 주세요." }, 502);

  return json({ candidates, model, provider });
}

async function callClaude(model: string, system: string, user: string) {
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

async function callGemini(model: string, system: string, user: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model,
    contents: user,
    config: { systemInstruction: system, responseMimeType: "application/json" },
  });
  return res.text ?? "";
}

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 70;
  return Math.max(0, Math.min(100, v));
}

function parseCandidates(raw: string): Candidate[] {
  const build = (s: string): Candidate[] => {
    const obj = JSON.parse(s);
    const arr = Array.isArray(obj) ? obj : obj.candidates;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((c: unknown) => {
        const o = c as Record<string, unknown>;
        const m = (o.metrics ?? {}) as Record<string, unknown>;
        return {
          keyword: String(o.keyword ?? "").trim(),
          score: clampScore(o.score),
          tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
          metrics: {
            attention: clampScore(m.attention),
            momentum: clampScore(m.momentum),
            gap: clampScore(m.gap),
            videoFit: clampScore(m.videoFit),
          },
          reasons: Array.isArray(o.reasons) ? o.reasons.map(String) : [],
          titles: Array.isArray(o.titles) ? o.titles.map(String) : [],
        } as Candidate;
      })
      .filter((c: Candidate) => c.keyword);
  };
  try {
    return build(raw);
  } catch {
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return build(raw.slice(s, e + 1));
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
