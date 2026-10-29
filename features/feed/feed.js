/* ===================================================
   시장 소식: Supabase 테이블(disclosures, news)을 읽어 보여 줍니다.
   서버에서 외부 API를 부르는 일은 Edge Function(sync-feeds)이 하고,
   이 화면은 anon 키로 읽기만 합니다.
   =================================================== */
const FEED_LIMIT = 30;
const DART_VIEW_URL = "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=";
const CORP_CLS = { Y: "유가", K: "코스닥" };
const NEWS_SOURCES = { toss: "토스증권 뉴스", naver: "네이버 뉴스 검색" };

const feedState = { tab: "disclosures", disclosures: [], news: [], isMock: false };

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function timeLabel(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

async function readTable(table, order) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}&limit=${FEED_LIMIT}`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!res.ok) throw new Error(`${table} ${res.status}`);
  return res.json();
}

async function loadFeeds() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return useMock();
  try {
    const [disclosures, news] = await Promise.all([
      readTable("disclosures", "rcept_dt.desc,rcept_no.desc"),
      readTable("news", "pub_date.desc"),
    ]);
    Object.assign(feedState, { disclosures, news, isMock: false });
  } catch (err) {
    console.warn("Supabase 불러오기 실패, 가상 데이터로 대신합니다.", err);
    useMock();
  }
}

function useMock() {
  Object.assign(feedState, { disclosures: MOCK_DISCLOSURES, news: MOCK_NEWS, isMock: true });
}

function disclosureItemHTML(d) {
  const href = d.rcept_no.startsWith("mock") ? "#" : DART_VIEW_URL + encodeURIComponent(d.rcept_no);
  return `
    <a class="feed-item" href="${href}" target="_blank" rel="noopener">
      <div class="feed-meta">
        <span class="chip">${escapeHTML(CORP_CLS[d.corp_cls] || "기타")}</span>
        <strong>${escapeHTML(d.corp_name)}</strong>
        <span class="date">${escapeHTML(d.rcept_dt)}</span>
      </div>
      <p class="feed-title">${escapeHTML(d.report_nm)}</p>
      <p class="feed-sub">제출인 ${escapeHTML(d.flr_nm)}</p>
    </a>`;
}

function newsItemHTML(n) {
  return `
    <a class="feed-item" href="${escapeHTML(n.link)}" target="_blank" rel="noopener">
      <div class="feed-meta">
        <span class="chip">${escapeHTML(n.keyword)}</span>
        ${n.author ? `<strong>${escapeHTML(n.author)}</strong>` : ""}
        <span class="date">${timeLabel(n.pub_date)}</span>
      </div>
      <p class="feed-title">${escapeHTML(n.title)}</p>
      <p class="feed-sub">${escapeHTML(n.description)}</p>
    </a>`;
}

function renderFeed() {
  const list = feedState[feedState.tab];
  const count = feedState.disclosures.length + feedState.news.length;
  document.querySelector(".buddy-say").textContent = `새 소식 ${count}건을 물어 왔어요!`;
  const newsSources = [...new Set(feedState.news.map((n) => NEWS_SOURCES[n.source] || NEWS_SOURCES.naver))];
  document.querySelector(".source-note").textContent = feedState.isMock
    ? "지금은 가상 데이터를 보여 주고 있어요."
    : "출처: " + ["금융감독원 OpenDART", ...newsSources].join(", ");
  document.querySelectorAll(".feed-tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === feedState.tab));

  const item = feedState.tab === "disclosures" ? disclosureItemHTML : newsItemHTML;
  document.querySelector(".feed-list").innerHTML = list.length
    ? list.map(item).join("")
    : `<p class="feed-empty">아직 가져온 소식이 없어요.</p>`;
}

document.querySelectorAll(".feed-tab").forEach((b) =>
  b.addEventListener("click", () => { feedState.tab = b.dataset.tab; renderFeed(); })
);
document.querySelector(".feed-refresh").addEventListener("click", async () => { await loadFeeds(); renderFeed(); });

loadFeeds().then(renderFeed);
