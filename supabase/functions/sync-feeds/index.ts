// 뉴스(네이버 검색)를 가져와 DB에 저장합니다.
// pg_cron이 주기적으로 호출합니다. 화면에서는 이 함수를 부르지 않고 테이블만 읽습니다.
// 공시(OpenDART)는 이 함수가 아니라 DB의 pg_net으로 가져옵니다.
// (migrations/20261029000200_dart_via_pg_net.sql 참고)
//
// 필요한 Secrets (supabase secrets set 으로 등록)
//   NAVER_CLIENT_ID      네이버 Client ID
//   NAVER_CLIENT_SECRET  네이버 Client Secret
//   CRON_SECRET          이 함수를 아무나 부르지 못하게 막는 임의 문자열
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 자동으로 넣어 줍니다.

import { createClient } from "npm:@supabase/supabase-js@2";

const NAVER_URL = "https://openapi.naver.com/v1/search/news.json";
const NEWS_PER_KEYWORD = 20;

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Secret ${name} 이(가) 없습니다`);
  return v;
};

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function stripTags(s: string) {
  return s
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

async function syncNews() {
  const headers = {
    "X-Naver-Client-Id": env("NAVER_CLIENT_ID"),
    "X-Naver-Client-Secret": env("NAVER_CLIENT_SECRET"),
  };
  const { data: keywords, error: kwError } = await db
    .from("news_keywords").select("keyword").eq("enabled", true);
  if (kwError) throw kwError;

  const rows = new Map<string, Record<string, string>>();
  for (const { keyword } of keywords ?? []) {
    const url = new URL(NAVER_URL);
    url.search = new URLSearchParams({ query: keyword, display: String(NEWS_PER_KEYWORD), sort: "date" }).toString();

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Naver ${res.status}: ${await res.text()}`);
    const body = await res.json();

    for (const it of body.items) {
      rows.set(it.link, {
        link: it.link,
        original_link: it.originallink,
        title: stripTags(it.title),
        description: stripTags(it.description),
        pub_date: new Date(it.pubDate).toISOString(),
        keyword,
      });
    }
  }

  if (rows.size) {
    const { error } = await db.from("news").upsert([...rows.values()], { onConflict: "link" });
    if (error) throw error;
  }
  return rows.size;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== env("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  const news = await syncNews().then((n) => n, (e) => `실패: ${e.message ?? e}`);
  await db.rpc("prune_feeds");

  const result = { news };
  console.log(result);
  return Response.json(result);
});
