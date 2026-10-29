-- 시장 소식(공시·뉴스) 저장 테이블
-- 쓰기는 Edge Function(sync-feeds)이 service_role 키로만 합니다.
-- 화면(anon 키)은 읽기만 할 수 있습니다.

-- OpenDART 공시 목록 (list.json 응답 형식을 그대로 따름)
create table if not exists public.disclosures (
  rcept_no    text primary key,          -- 접수번호 (원문 링크에 사용)
  corp_code   text not null,
  corp_name   text not null,
  stock_code  text,
  corp_cls    text,                      -- Y: 유가증권, K: 코스닥
  report_nm   text not null,
  flr_nm      text,                      -- 공시 제출인
  rcept_dt    date not null,
  rm          text,                      -- 비고
  fetched_at  timestamptz not null default now()
);

create index if not exists disclosures_rcept_dt_idx on public.disclosures (rcept_dt desc, rcept_no desc);

-- 네이버 뉴스 검색 결과
create table if not exists public.news (
  link          text primary key,        -- 네이버 뉴스 링크 (중복 방지 기준)
  original_link text,
  title         text not null,
  description   text,
  pub_date      timestamptz not null,
  keyword       text not null,           -- 어떤 검색어로 가져왔는지
  fetched_at    timestamptz not null default now()
);

create index if not exists news_pub_date_idx on public.news (pub_date desc);

-- 뉴스 검색어. 특정 종목이 아니라 시장 흐름 수준의 단어만 넣습니다.
create table if not exists public.news_keywords (
  keyword  text primary key,
  enabled  boolean not null default true
);

insert into public.news_keywords (keyword) values
  ('증시'), ('코스피'), ('코스닥')
on conflict (keyword) do nothing;

-- 읽기 권한: 누구나 읽기만 가능
alter table public.disclosures   enable row level security;
alter table public.news          enable row level security;
alter table public.news_keywords enable row level security;

create policy "disclosures 읽기 허용" on public.disclosures   for select to anon, authenticated using (true);
create policy "news 읽기 허용"        on public.news          for select to anon, authenticated using (true);
create policy "keywords 읽기 허용"    on public.news_keywords for select to anon, authenticated using (true);

-- 오래된 데이터 정리 (무료 플랜 용량 500MB 관리용)
create or replace function public.prune_feeds() returns void
language sql security definer set search_path = public as $$
  delete from public.disclosures where rcept_dt   < current_date - 14;
  delete from public.news        where pub_date   < now() - interval '14 days';
$$;

revoke execute on function public.prune_feeds() from public, anon, authenticated;
