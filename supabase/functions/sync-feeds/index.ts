// 뉴스를 가져와 DB(news 테이블)에 저장합니다.
// pg_cron이 주기적으로 호출합니다. 화면에서는 이 함수를 부르지 않고 테이블만 읽습니다.
// 공시(OpenDART)는 이 함수가 아니라 DB의 pg_net으로 가져옵니다.
// (migrations/20261029000200_dart_via_pg_net.sql 참고)
//
// 뉴스 출처는 두 가지입니다.
//   1. 토스증권 뉴스 (키 없음) — 공시를 받는 회사(dart_corps)별 뉴스 + 시장 주요 뉴스
//      파이썬 라이브러리 krx-news-client(scrapers/toss.py)의 요청 방식을 그대로 옮겼습니다.
//      비공식 내부 API라 예고 없이 막히거나 형식이 바뀔 수 있습니다.
//   2. 네이버 검색 (키 필요) — NAVER 키가 Secrets에 없으면 건너뜁니다
//
// 필요한 Secrets (supabase secrets set 으로 등록)
//   CRON_SECRET          이 함수를 아무나 부르지 못하게 막는 임의 문자열
//   NAVER_CLIENT_ID      네이버 Client ID     (선택)
//   NAVER_CLIENT_SECRET  네이버 Client Secret (선택)
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 자동으로 넣어 줍니다.

import { createClient } from "npm:@supabase/supabase-js@2";

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Secret ${name} 이(가) 없습니다`);
  return v;
};

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

// news 테이블 한 줄. link가 기본키라 같은 기사는 덮어씁니다.
type NewsRow = {
  link: string;
  original_link: string | null;
  title: string;
  description: string;
  pub_date: string;
  keyword: string;
  source: "toss" | "naver";
  stock_code: string | null;
  author: string | null;
  content: string | null;  // 본문 전체. 화면에서 밖으로 나가지 않고 보여 줍니다
};

const DESCRIPTION_MAX = 160;

// 본문·요약을 목록용 한 문단으로 줄입니다. 태그를 걷고 줄바꿈을 공백으로 바꿉니다.
function shorten(s: string | null | undefined) {
  const text = (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return text.length > DESCRIPTION_MAX ? text.slice(0, DESCRIPTION_MAX) + "…" : text;
}

/* -------------------------------------------------------
   토스증권 (krx-news-client scrapers/toss.py + base.py 이식)
   ------------------------------------------------------- */

const TOSS_API = "https://wts-info-api.tossinvest.com";
const TOSS_DASHBOARD_URL = `${TOSS_API}/api/v1/dashboard/wts/news`;
// 종목별 뉴스. 코드는 6자리만 받습니다 (A005930 같은 7자리는 오류 없이 0건이 옴).
// 페이지 번호는 1부터, 크기는 1~100 (101 이상은 조용히 빈 결과).
const TOSS_COMPANY_URL = (code: string) => `${TOSS_API}/api/v2/news/companies/${code}`;
// 기사 상세. 본문이 블록(summary / sub_headline / text / image)으로 옵니다. 없는 기사는 200 {"result": null}.
const TOSS_DETAIL_URL = (newsId: string) => `${TOSS_API}/api/v2/news/${newsId}`;
const TOSS_BODY_BLOCKS = ["summary", "sub_headline", "text"];
const TOSS_PAGE_SIZE = 20;
const TOSS_MARKET_KEYWORD = "시장";

// 브라우저처럼 보이게 하는 헤더. 라이브러리와 같은 목록에서 하나를 고릅니다.
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
];
const tossHeaders = {
  "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
  Referer: "https://tossinvest.com/",
};

// 요청 사이에 0.5~1.5초 무작위로 쉽니다. 비공식 API라 차단을 피하려는 것입니다.
// (pg_cron 호출 제한이 30초라 재시도 대기는 라이브러리보다 짧게 둡니다)
const MIN_DELAY = 500, MAX_DELAY = 1500, MAX_RETRIES = 3;
let lastTossRequest = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tossRequest(url: string, init: RequestInit = {}) {
  const wait = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  const elapsed = Date.now() - lastTossRequest;
  if (elapsed < wait) await sleep(wait - elapsed);
  lastTossRequest = Date.now();

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { ...init, headers: { ...tossHeaders, ...init.headers } });
    if (res.ok) return res.json();
    // 429·5xx만 다시 보냅니다. 400·404는 다시 보내도 같은 답입니다.
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_RETRIES) throw new Error(`Toss ${res.status}: ${await res.text()}`);
    await sleep(1000 * attempt);
  }
}

// 토스 기사 링크. 라이브러리 build_article_url 과 같은 모양입니다.
function tossArticleUrl(newsId: string) {
  const q = new URLSearchParams({ contentType: "news", contentParams: JSON.stringify({ id: newsId }) });
  return `https://tossinvest.com/news?${q}`;
}

// 토스 createdAt("2026-10-29T16:08:00")은 오프셋 없는 KST 벽시계입니다.
// 그대로 timestamptz에 넣으면 UTC로 읽혀 9시간 미래로 밀리므로 +09:00을 붙입니다.
function tossDate(text: string | null | undefined) {
  if (!text) return null;
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : text + "+09:00";
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// 토스 한국 종목코드 A005930 → 005930. 7자리이고 A로 시작할 때만 벗깁니다.
function normalizeStockCode(code: string) {
  code = String(code ?? "").trim();
  return code.length === 7 && code.startsWith("A") ? code.slice(1) : code;
}

// 기사 본문. 라이브러리 extract_body_text 와 같습니다: 본문 블록만 태그 없이 줄바꿈으로 잇습니다.
async function tossArticleBody(newsId: string) {
  const payload = await tossRequest(TOSS_DETAIL_URL(newsId));
  const blocks = payload?.result?.kr?.content;
  if (!Array.isArray(blocks)) return null;
  const parts = blocks
    .filter((b) => TOSS_BODY_BLOCKS.includes(b?.type))
    .map((b) => String(b.content ?? "").replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  return parts.length ? parts.join("\n") : null;
}

// 종목별 뉴스 1페이지. 응답: { result: { body: [{ id, title, summary, contentText, source: { name }, createdAt, ... }] } }
// summary 가 본문 전체이고 contentText 는 앞부분 100자쯤입니다 (2026-10-29 실측).
async function tossCompanyNews(stockCode: string, keyword: string): Promise<NewsRow[]> {
  const code = normalizeStockCode(stockCode);
  if (!/^[0-9A-Z]{6}$/.test(code)) throw new Error(`종목코드는 6자리여야 합니다: ${stockCode}`);

  const url = new URL(TOSS_COMPANY_URL(code));
  url.search = new URLSearchParams({ number: "1", size: String(TOSS_PAGE_SIZE) }).toString();
  const payload = await tossRequest(url.toString());
  const body = payload?.result?.body;
  // 형식이 바뀌면 빈 목록이 아니라 오류로 올립니다 (조용한 0건 방지).
  if (!Array.isArray(body)) throw new Error(`토스 종목 뉴스 응답 형식이 다릅니다: ${code}`);

  const rows: NewsRow[] = [];
  for (const it of body) {
    const pubDate = tossDate(it.createdAt);
    if (!it.id || !it.title || !pubDate) continue;
    rows.push({
      link: tossArticleUrl(it.id),
      original_link: null,
      title: it.title,
      description: shorten(it.contentText || it.summary),
      pub_date: pubDate,
      keyword,
      source: "toss",
      stock_code: code,
      author: typeof it.source === "object" ? it.source?.name ?? null : it.source ?? null,
      content: (it.summary ?? "").trim() || null,
    });
  }
  return rows;
}

// 대시보드 "모든 주요 뉴스" 스냅샷. 해외(nation=US) 기사가 절반쯤 섞여 있어 KR만 둡니다.
// 응답: { result: { news: [{ newsId, title, summary, createdAt, source: "언론사", nation, relatedStocks: [{ stockCode }] }] } }
async function tossMarketNews(): Promise<NewsRow[]> {
  const payload = await tossRequest(TOSS_DASHBOARD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "ALL_HIGHLIGHT" }),
  });
  const items = payload?.result?.news;
  if (!Array.isArray(items)) throw new Error("토스 대시보드 뉴스 응답 형식이 다릅니다");

  const rows: NewsRow[] = [];
  for (const it of items) {
    const pubDate = tossDate(it.createdAt);
    if (!it.newsId || !it.title || !pubDate || it.nation !== "KR") continue;
    const first = it.relatedStocks?.[0]?.stockCode;
    rows.push({
      link: tossArticleUrl(it.newsId),
      original_link: null,
      title: it.title,
      description: shorten(it.summary),
      pub_date: pubDate,
      keyword: TOSS_MARKET_KEYWORD,
      source: "toss",
      stock_code: first ? normalizeStockCode(first) : null,
      author: typeof it.source === "object" ? it.source?.name ?? null : it.source ?? null,
      content: null,  // 대시보드 summary 는 300자에서 잘립니다. 본문은 아래에서 상세로 채웁니다
    });
  }

  // 본문이 아직 없는 기사만 상세를 받습니다 (10분마다 같은 기사를 다시 받지 않도록).
  const { data: stored, error } = await db
    .from("news").select("link").in("link", rows.map((r) => r.link)).not("content", "is", null);
  if (error) throw error;
  const hasBody = new Set((stored ?? []).map((r) => r.link));
  for (const row of rows) {
    if (hasBody.has(row.link)) continue;
    const newsId = items.find((it) => tossArticleUrl(it.newsId) === row.link)?.newsId;
    row.content = (newsId && await tossArticleBody(newsId)) || row.description || null;
  }
  return rows;
}

async function syncToss() {
  const { data: corps, error } = await db.from("dart_corps").select("stock_code, name");
  if (error) throw error;

  const rows = new Map<string, NewsRow>();
  for (const { stock_code, name } of corps ?? []) {
    for (const row of await tossCompanyNews(stock_code, name)) rows.set(row.link, row);
  }
  // 종목 뉴스가 시장 뉴스보다 종목 정보가 많으므로, 같은 기사면 종목 쪽을 남깁니다.
  for (const row of await tossMarketNews()) if (!rows.has(row.link)) rows.set(row.link, row);

  return upsert([...rows.values()]);
}

/* -------------------------------------------------------
   네이버 검색 (키가 있을 때만)
   ------------------------------------------------------- */

const NAVER_URL = "https://openapi.naver.com/v1/search/news.json";
const NEWS_PER_KEYWORD = 20;

function stripTags(s: string) {
  return s
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

async function syncNaver() {
  const id = Deno.env.get("NAVER_CLIENT_ID"), secret = Deno.env.get("NAVER_CLIENT_SECRET");
  if (!id || !secret) return "건너뜀 (NAVER 키 없음)";
  const headers = { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret };

  const { data: keywords, error: kwError } = await db
    .from("news_keywords").select("keyword").eq("enabled", true);
  if (kwError) throw kwError;

  const rows = new Map<string, NewsRow>();
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
        source: "naver",
        stock_code: null,
        author: null,
        content: null,
      });
    }
  }
  return upsert([...rows.values()]);
}

/* ------------------------------------------------------- */

async function upsert(rows: NewsRow[]) {
  if (rows.length) {
    const { error } = await db.from("news").upsert(rows, { onConflict: "link" });
    if (error) throw error;
  }
  return rows.length;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== env("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  const fail = (e: Error) => `실패: ${e.message ?? e}`;
  const toss = await syncToss().then((n) => n, fail);
  const naver = await syncNaver().then((n) => n, fail);
  await db.rpc("prune_feeds");

  const result = { toss, naver };
  console.log(result);
  return Response.json(result);
});
