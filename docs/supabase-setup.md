# Supabase 구축 안내 (시장 소식: 공시·뉴스)

## 구조

```
OpenDART (공시)                         네이버 뉴스 API
   ▲ 10분마다 (pg_net)                     ▲ 10분마다
DB 함수 request_dart / collect_dart      Edge Function sync-feeds
   │  키: Vault 'dart_api_key'              │  키: Supabase Secrets
   ▼                                        ▼
DB 테이블  disclosures · news · news_keywords      ◀── pg_cron이 모두 깨움
   ▲  읽기만 (Publishable 키)
features/feed/index.html
```

**공시를 Edge Function이 아니라 DB에서 가져오는 이유:** OpenDART 서버는 RSA 키 교환 방식의 TLS 1.2만 받습니다.
Edge Function(Deno)은 이 방식을 지원하지 않아 `HandshakeFailure`로 연결이 실패하고, DB의 pg_net은 연결됩니다.

| 파일 | 하는 일 |
|---|---|
| `supabase/migrations/20261029000000_create_feed_tables.sql` | 테이블, 읽기 권한, 14일 지난 데이터 정리 함수 |
| `supabase/migrations/20261029000100_schedule_sync_feeds.sql` | 10분마다 sync-feeds 호출 예약 |
| `supabase/migrations/20261029000200_dart_via_pg_net.sql` | 공시: 10분마다 OpenDART 요청, 1분마다 응답을 테이블에 저장 |
| `supabase/migrations/20261029000300_dart_tracked_corps.sql` | 공시를 정해 둔 회사(`dart_corps` 표: 삼성전자, SK하이닉스, 현대차, NAVER)만 받도록 바꿈. 10분마다 회사별 최근 1년 중 최신 20건 |
| `supabase/functions/sync-feeds/index.ts` | 뉴스: 네이버 검색 API를 불러 테이블에 저장 |
| `features/feed/` | 시장 소식 화면. 연결 정보가 비어 있으면 가상 데이터로 보여 줌 |

## 1. 계정과 키 준비 (한 번만)

1. **Supabase 프로젝트 만들기**
   - https://supabase.com 에 지급받은 계정으로 가입합니다.
   - New project → 이름 `joonjoon`, Region `Northeast Asia (Seoul)`, Plan `Free`.
   - Database Password는 따로 적어 둡니다 (3단계에서 씀).
   - 주소창의 `https://supabase.com/dashboard/project/<프로젝트 ref>` 에서 ref를 적어 둡니다.
2. **OpenDART 인증키**: https://opendart.fss.or.kr → 인증키 신청 → 메일로 받은 40자리 키.
3. **네이버 검색 API**: 개발자센터의 검색 API는 네이버 클라우드 플랫폼의 NAVER API HUB로 옮겨졌습니다.
   이관 후 인증 방식과 주소가 달라졌을 수 있어, 키를 받은 뒤 `sync-feeds` 코드를 확인해야 합니다. (아직 미연결)
4. **CRON_SECRET 만들기**: 아무 긴 문자열이면 됩니다. 아래로 만들 수 있습니다.
   ```
   node -e "console.log(crypto.randomUUID())"
   ```

## 2. CLI 로그인

설치 없이 `npx`로 씁니다 (Node.js 필요).

```
npx supabase login
```

브라우저가 열리면 승인합니다.

## 3. 프로젝트 연결

```
npx supabase link --project-ref <프로젝트 ref>
```

Database Password를 물으면 1단계에서 적어 둔 값을 넣습니다.

## 4. 인증키 등록 (Secrets)

키는 저장소나 화면 코드에 절대 넣지 않고 여기에만 둡니다.

```
npx supabase secrets set NAVER_CLIENT_ID=<Client ID> NAVER_CLIENT_SECRET=<Client Secret> CRON_SECRET=<만든 문자열>
```

## 5. 테이블 만들고 함수 올리기

```
npx supabase db push
npx supabase functions deploy sync-feeds --use-api
```

## 6. 주기 실행용 값 등록 (Vault)

대시보드 → SQL Editor에서 실행합니다. 이 값들은 저장소에 올리지 않습니다.

```sql
select vault.create_secret('<OpenDART 키>', 'dart_api_key');
select vault.create_secret('https://<프로젝트 ref>.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET과 같은 값>', 'cron_secret');
```

## 7. 동작 확인

**공시:** SQL Editor에서 바로 요청하고, 10초쯤 뒤 저장합니다.

```sql
select public.request_dart_corps();
-- 10초 뒤
select public.collect_dart();   -- 저장한 건수가 나오면 성공
```

**뉴스:** 함수를 한 번 직접 불러 봅니다. (PowerShell에서는 `curl.exe`)

```
curl.exe -X POST https://<프로젝트 ref>.supabase.co/functions/v1/sync-feeds -H "x-cron-secret: <CRON_SECRET>"
```

`{"news":숫자}`가 나오면 성공입니다. 대시보드 → Table Editor에서 데이터를 볼 수 있습니다.
10분 뒤 SQL Editor에서 예약 실행 결과도 확인합니다.

```sql
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
```

## 8. 화면 연결

대시보드 → Project Settings → API Keys에서 값을 복사해 `features/feed/supabase-config.js`에 넣습니다.

```js
const SUPABASE_URL = "https://<프로젝트 ref>.supabase.co";
const SUPABASE_ANON_KEY = "<Publishable key (sb_publishable_...)>";
```

- Publishable 키는 공개돼도 되는 읽기 전용 키입니다. 테이블에 읽기 권한만 열려 있습니다.
- Secret 키(`service_role`)는 모든 권한이 있으니 화면 코드에 절대 넣지 않습니다.

`features/feed/index.html`을 브라우저로 열면 하단 출처가 "OpenDART, 네이버 뉴스 검색"으로 바뀝니다.

## 운영 메모

- **무료 프로젝트는 7일 동안 활동이 없으면 일시 정지됩니다.** 시연 전날 대시보드에 들어가 확인합니다. (10분마다 도는 예약 실행이 활동으로 잡히는지는 보장되지 않습니다.)
- 뉴스 검색어는 `news_keywords` 테이블에서 바꿉니다. 시장 흐름 수준의 단어만 넣고, 특정 종목을 띄워 주는 검색어는 넣지 않습니다.
- 호출 한도: OpenDART 하루 약 2만 건. 지금 설정(4개 회사 × 10분마다)이면 하루 576번입니다. 회사를 바꾸려면 `dart_corps` 표만 고칩니다. 뉴스는 검색어 3개 × 10분마다 = 하루 432번입니다.
- 예약 실행 목록: `select jobname, schedule from cron.job;` (`request-dart-corps`, `collect-dart`, `sync-feeds`)
- 예약 실행 멈추기: SQL Editor에서 `select cron.unschedule('<jobname>');`
