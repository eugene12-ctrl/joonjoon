-- OpenDART 공시를 DB(pg_net)에서 직접 가져옵니다.
-- OpenDART 서버는 RSA 키 교환 방식의 TLS 1.2만 받는데, Edge Function(Deno)은 이 방식을
-- 지원하지 않아 연결이 실패합니다(HandshakeFailure). pg_net은 연결할 수 있습니다.
--
-- pg_net은 비동기라 두 단계로 나눕니다.
--   request_dart() : 10분마다 요청을 보내고 요청 번호를 dart_requests에 적어 둠
--   collect_dart() : 1분마다 도착한 응답을 disclosures에 저장
-- 인증키는 Vault의 'dart_api_key'에서 읽습니다.

create table if not exists public.dart_requests (
  request_id   bigint primary key,
  requested_at timestamptz not null default now()
);
alter table public.dart_requests enable row level security;   -- 정책 없음: 화면에서 볼 수 없음

create or replace function public.request_dart() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  dart_key  text := (select decrypted_secret from vault.decrypted_secrets where name = 'dart_api_key');
  today     text := to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD');
  yesterday text := to_char((now() at time zone 'Asia/Seoul') - interval '1 day', 'YYYYMMDD');
  cls       text;
  page      int;
begin
  if dart_key is null then
    raise exception 'Vault에 dart_api_key가 없습니다';
  end if;

  -- 유가증권(Y), 코스닥(K) 각각 최근 200건까지
  foreach cls in array array['Y', 'K'] loop
    for page in 1..2 loop
      insert into public.dart_requests (request_id)
      values (net.http_get(
        url    := 'https://opendart.fss.or.kr/api/list.json',
        params := jsonb_build_object(
          'crtfc_key', dart_key, 'corp_cls', cls,
          'bgn_de', yesterday, 'end_de', today,
          'page_no', page::text, 'page_count', '100'),
        timeout_milliseconds := 20000
      ));
    end loop;
  end loop;
end $$;

create or replace function public.collect_dart() returns int
language plpgsql security definer set search_path = public as $$
declare
  saved int;
begin
  with done as (
    delete from public.dart_requests q
    using net._http_response r
    where r.id = q.request_id
    returning r.status_code, r.content
  ), items as (
    select distinct on (it->>'rcept_no') it
    from done, jsonb_array_elements(done.content::jsonb->'list') as it
    where done.status_code = 200 and done.content::jsonb->>'status' = '000'
  ), upserted as (
    insert into public.disclosures (rcept_no, corp_code, corp_name, stock_code, corp_cls, report_nm, flr_nm, rcept_dt, rm, fetched_at)
    select it->>'rcept_no', it->>'corp_code', it->>'corp_name', nullif(it->>'stock_code', ''), it->>'corp_cls',
           trim(it->>'report_nm'), it->>'flr_nm', to_date(it->>'rcept_dt', 'YYYYMMDD'), nullif(it->>'rm', ''), now()
    from items
    on conflict (rcept_no) do update
      set report_nm = excluded.report_nm, rm = excluded.rm, fetched_at = excluded.fetched_at
    returning 1
  )
  select count(*) into saved from upserted;

  -- 한 시간이 지나도 응답이 없는 요청은 버림
  delete from public.dart_requests where requested_at < now() - interval '1 hour';
  return saved;
end $$;

revoke execute on function public.request_dart() from public, anon, authenticated;
revoke execute on function public.collect_dart() from public, anon, authenticated;

select cron.unschedule(jobname) from cron.job where jobname in ('request-dart', 'collect-dart');
select cron.schedule('request-dart', '*/10 * * * *', 'select public.request_dart()');
select cron.schedule('collect-dart', '* * * * *',    'select public.collect_dart()');
