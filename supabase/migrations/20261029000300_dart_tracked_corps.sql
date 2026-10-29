-- 공시는 시장 전체가 아니라 정해 둔 회사만 받습니다 (삼성전자, SK하이닉스, 현대차, NAVER).
-- 회사마다 최근 1년 중 최신 20건을 10분마다 요청하므로 오늘 공시와 예전 공시가 함께 쌓입니다.
-- 응답 저장은 collect_dart()가 그대로 합니다. (corp_code를 주면 OpenDART의 3개월 검색 제한이 없습니다)
-- 호출 한도: 4개 회사 × 10분마다 = 하루 576번 (한도 약 2만 번)

create table if not exists public.dart_corps (
  corp_code  text primary key,           -- OpenDART 고유번호
  stock_code text not null,
  name       text not null
);
alter table public.dart_corps enable row level security;
create policy "dart_corps 읽기 허용" on public.dart_corps for select to anon, authenticated using (true);

-- 달이 증권 앱 종목 (features/dali/dali-data.js의 code와 같게). 회사를 바꾸려면 이 표만 고칩니다
insert into public.dart_corps (corp_code, stock_code, name) values
  ('00126380', '005930', '삼성전자'),
  ('00164779', '000660', 'SK하이닉스'),
  ('00164742', '005380', '현대차'),
  ('00266961', '035420', 'NAVER')
on conflict (corp_code) do nothing;

create or replace function public.request_dart_corps() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  dart_key text := (select decrypted_secret from vault.decrypted_secrets where name = 'dart_api_key');
  today    text := to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD');
  year_ago text := to_char((now() at time zone 'Asia/Seoul') - interval '1 year', 'YYYYMMDD');
  corp     text;
begin
  if dart_key is null then
    raise exception 'Vault에 dart_api_key가 없습니다';
  end if;

  for corp in select corp_code from public.dart_corps loop
    insert into public.dart_requests (request_id)
    values (net.http_get(
      url    := 'https://opendart.fss.or.kr/api/list.json',
      params := jsonb_build_object(
        'crtfc_key', dart_key, 'corp_code', corp,
        'bgn_de', year_ago, 'end_de', today,
        'page_no', '1', 'page_count', '20'),
      timeout_milliseconds := 20000
    ));
  end loop;
end $$;

revoke execute on function public.request_dart_corps() from public, anon, authenticated;

-- 정리: 정해 둔 회사가 아닌 공시는 지우고, 정해 둔 회사 공시는 1년까지 남김
create or replace function public.prune_feeds() returns void
language sql security definer set search_path = public as $$
  delete from public.disclosures d
   where d.rcept_dt < current_date - 365
      or not exists (select 1 from public.dart_corps c where c.stock_code = d.stock_code);
  delete from public.news where pub_date < now() - interval '14 days';
$$;

revoke execute on function public.prune_feeds() from public, anon, authenticated;

-- 시장 전체 요청(request-dart)은 멈추고 회사별 요청으로 바꿈. collect-dart(1분마다 저장)는 그대로
select cron.unschedule(jobname) from cron.job where jobname in ('request-dart', 'request-dart-corps');
select cron.schedule('request-dart-corps', '*/10 * * * *', 'select public.request_dart_corps()');

-- 지금 한 번 받아 둠 (1분 안에 collect_dart가 저장)
select public.request_dart_corps();
