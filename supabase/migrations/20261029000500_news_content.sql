-- 뉴스 본문을 저장합니다. 화면에서 기사를 누르면 밖으로 나가지 않고 본문을 보여 주기 위한 열입니다.
-- 종목별 뉴스는 목록 응답에 본문이 있고, 시장 뉴스는 상세 응답을 따로 받아 채웁니다 (sync-feeds).
alter table public.news
  add column if not exists content text;
