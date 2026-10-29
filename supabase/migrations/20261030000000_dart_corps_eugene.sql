-- 유진투자증권을 공시·뉴스 추적 회사(dart_corps)에 추가
-- 증권 앱 종목(features/dali/dali-data.js)에는 있었지만 이 표에 빠져 있어 공시와 뉴스가 0건이었다.
-- DART 고유번호 00131054, 종목코드 001200. (DART에 등록된 회사명은 2026년 현재 '유진증권'. 화면 이름은 앱과 같게 둔다)
insert into public.dart_corps (corp_code, stock_code, name) values
  ('00131054', '001200', '유진투자증권')
on conflict (corp_code) do nothing;

-- 바로 한 번 요청해 둔다. 1분마다 도는 collect_dart가 응답을 저장한다.
-- 뉴스는 10분마다 도는 sync-feeds가 다음 회차부터 dart_corps를 읽어 가져온다.
select public.request_dart_corps();
