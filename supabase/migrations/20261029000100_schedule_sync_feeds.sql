-- 10분마다 sync-feeds 함수를 호출합니다.
-- 함수 주소와 비밀 문자열은 Vault에서 읽습니다. 값은 저장소에 올리지 않고
-- docs/supabase-setup.md 의 "Vault 등록" 단계에서 SQL Editor로 따로 넣습니다.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('sync-feeds')
where exists (select 1 from cron.job where jobname = 'sync-feeds');

select cron.schedule(
  'sync-feeds',
  '*/10 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-feeds',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
