-- Supabase SQL Editor 에 붙여넣고 실행하세요.
-- profiles: 사용자별 등급/일일 사용량. auth.users 와 1:1.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  daily_ai_used int not null default 0,
  updated_at timestamptz default now()
);

-- 회원가입 시 profiles 행 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: 본인 행만 조회 가능 (수정은 서버의 service_role 키로만)
alter table public.profiles enable row level security;

drop policy if exists "본인 프로필 조회" on public.profiles;
create policy "본인 프로필 조회"
  on public.profiles for select
  using (auth.uid() = id);

-- 매일 자정 daily_ai_used 초기화는 Supabase 스케줄(pg_cron)로:
--   select cron.schedule('reset-daily', '0 0 * * *',
--     $$update public.profiles set daily_ai_used = 0$$);


-- ─────────────────────────────────────────────
-- drafts: 사진 글쓰기로 생성한 초안 히스토리
-- 저장은 서버 함수(service_role)가 하고, 조회/삭제는 본인만 (RLS).
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text,
  content text not null,
  provider text,
  model text,
  created_at timestamptz default now()
);

alter table public.drafts enable row level security;

drop policy if exists "본인 초안 조회" on public.drafts;
create policy "본인 초안 조회"
  on public.drafts for select using (auth.uid() = user_id);

drop policy if exists "본인 초안 삭제" on public.drafts;
create policy "본인 초안 삭제"
  on public.drafts for delete using (auth.uid() = user_id);

create index if not exists drafts_user_created_idx
  on public.drafts (user_id, created_at desc);
