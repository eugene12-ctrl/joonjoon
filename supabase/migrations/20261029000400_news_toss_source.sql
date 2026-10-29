-- 뉴스 출처를 토스증권으로 넓힙니다 (sync-feeds 함수가 채움).
-- 기존 줄은 모두 네이버 검색 결과라 source 기본값을 'naver'로 둡니다.
alter table public.news
  add column if not exists source     text not null default 'naver',  -- 'toss' | 'naver'
  add column if not exists stock_code text,                           -- 종목별 뉴스면 6자리 종목코드
  add column if not exists author     text;                           -- 언론사

create index if not exists news_stock_code_idx on public.news (stock_code, pub_date desc);
