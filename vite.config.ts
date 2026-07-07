import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// 개발 전용: /api/* 요청을 Vercel 서버리스 함수(api/*.ts)로 직접 실행해주는 미들웨어.
// 덕분에 `npm run dev` 하나로 프론트 + API 가 함께 뜬다 (Vercel CLI 불필요).
// 배포 시엔 Vercel 이 api/ 폴더를 자동으로 함수로 처리하므로 이 플러그인은 개발에만 쓰인다.
function devApi(env: Record<string, string>): Plugin {
  const serverKeys = [
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      // 서버 함수가 읽는 process.env 에 .env.local 값을 주입
      for (const k of serverKeys) if (env[k]) process.env[k] = env[k];

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const path = req.url.split("?")[0]; // /api/generate
        try {
          const mod = await server.ssrLoadModule(`${path}.ts`);
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body:
              req.method === "GET" || req.method === "HEAD"
                ? undefined
                : Buffer.concat(chunks),
          });
          const response: Response = await mod.default(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(await response.text());
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // 모든 변수 로드 (VITE_ 접두사 없는 것 포함)
  return {
    plugins: [react(), devApi(env)],
    server: { port: 5173 },
  };
});
