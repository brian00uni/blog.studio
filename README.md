# 블로그 스튜디오 (DAF 웹)

네이버 블로그용 **AI 작업대**. 설치형 DAF 런처를 React 웹앱 + 로그인 등급제로 옮긴 프로젝트.

> 키워드를 찾고 · 사진과 함께 글을 쓰고 · 발행 전 조건을 점검하는 3단계 흐름을 한 화면에서.

---

## ✨ 기능

| 도구 | 등급 | 설명 |
|------|------|------|
| **사진 글쓰기** | 무료 | 키워드·사진 설명 → AI 초안 생성 (복사해서 스마트에디터에 붙여넣기) |
| **협찬 조건 점검** | 무료 | 글자수·필수 키워드 즉시 검사 (AI 없이 클라이언트 계산) |
| **키워드 레이더** | PRO | 지역·업종 글감/제목 후보 *(구현 예정)* |

## 🧠 AI 엔진

글쓰기 화면에서 엔진을 고를 수 있어요. **기본은 Gemini**(무료 티어가 넉넉해 운영비 절감), 품질이 필요하면 Claude 선택.

| 선택 | 무료 등급 | PRO 등급 |
|------|-----------|----------|
| **Gemini** (기본) | `gemini-2.5-flash` | `gemini-2.5-pro` |
| **Claude** | `claude-haiku-4-5` | `claude-opus-4-8` |

AI 호출은 전부 서버 함수(`/api/generate`)를 경유합니다 — API 키가 브라우저에 노출되지 않아요.

## 🛠 스택

- **프론트**: Vite · React · TypeScript · **Chakra UI v3** · React Router · TanStack Query
- **인증 / DB / 등급**: Supabase (Auth + Postgres + RLS)
- **AI**: Gemini (`@google/genai`) · Claude (`@anthropic-ai/sdk`)
- **호스팅 / 서버 함수**: Vercel

---

## 🚀 로컬 실행

```bash
git clone https://github.com/brian00uni/blog.studio.git
cd blog.studio
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev                  # http://localhost:5173 — 프론트 + /api 함수 함께 실행
```

> 개발 중엔 Vite 미들웨어가 `api/*.ts` 를 직접 실행하므로 **`npm run dev` 하나면 충분**합니다 (Vercel CLI 불필요).

### 환경변수 (`.env.local`)

```bash
# 브라우저 노출 OK (anon 키는 공개돼도 안전)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# 서버 전용 — 절대 커밋/노출 금지
GEMINI_API_KEY=AQ...             # Google AI Studio
ANTHROPIC_API_KEY=sk-ant-...     # Claude 선택 시
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Supabase 준비

1. [supabase.com](https://supabase.com) 프로젝트 생성
2. **SQL Editor** 에서 [`supabase/schema.sql`](supabase/schema.sql) 실행 → `profiles` 테이블·트리거·RLS 생성
3. 등급 테스트: Table Editor → `profiles` → `tier` 를 `pro` 로 변경

---

## 📂 구조

```
blog.studio/
├─ api/
│  └─ generate.ts        # AI 호출 서버 함수 (Gemini/Claude 분기 + 등급 확인)
├─ src/
│  ├─ theme.ts           # Chakra 테마 (네이버 그린 brand 팔레트)
│  ├─ lib/               # supabase 클라이언트, 로그인/등급 상태(auth)
│  ├─ pages/             # 로그인, 대시보드
│  ├─ components/        # Layout, RequireAuth
│  └─ tools/             # PhotoWriter, SponsorCheck, KeywordRadar
├─ supabase/schema.sql   # DB 스키마
└─ vite.config.ts        # 개발용 /api 미들웨어 포함
```

---

## 🚢 배포 (Vercel)

1. GitHub 저장소를 Vercel 에 연결
2. Settings → Environment Variables 에 `.env.local` 값 등록
3. push 하면 자동 배포 (`api/` 폴더는 자동으로 서버리스 함수 처리)

---

## 🗺 다음 단계

- [x] 키워드 레이더: AI 제목·해시태그 후보 (검색량·트렌드 API 연동은 이후)
- [x] 생성 히스토리 (초안 자동 저장·조회·삭제)
- [x] 코드 스플리팅 · 반응형 헤더 · 벤더 청크 분리
- [ ] 결제 연동 (구독/쿠폰) → `tier` 자동 갱신 *(보류)*
- [ ] 무료 등급 일일 생성 제한 (현재 비활성 — `api/generate.ts` 에 주석 처리됨)
- [ ] 스트리밍 출력 (긴 글 실시간 표시)
- [ ] 이미지 업로드 + 비전 기반 사진 글쓰기
- [ ] 입력 도우미 B안: 브라우저 확장 (네이버 반자동 입력)

---

## ⚠️ 참고

- 네이버는 공식 발행 API가 없어, "완성한 글·태그를 **복사해 스마트에디터에 붙여넣는**" 흐름으로 설계되어 있습니다.
- `.env.local` 은 `.gitignore` 로 커밋에서 제외됩니다. 실제 키를 `.env.example` 에 넣지 마세요.
