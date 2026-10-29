/* ---------- 달이 공시·뉴스 피드 ----------
   종목 화면의 공시 탭이 Supabase disclosures 테이블을 읽는다 (정해 둔 4개 회사만 OpenDART에서 10분마다 수집, 최근 1년 중 최신 20건).
   뉴스 탭은 같은 4개 회사의 실제 뉴스(news 테이블, 토스증권에서 10분마다 수집)를 본문까지 읽는다. 기사는 달이 안에서 보여 주고 밖으로 내보내지 않는다.
   공시와 뉴스는 지어내지 않는다. 연결 정보가 비었거나 불러오지 못하면 탭에 안내만 띄운다.
   구축 방법: docs/supabase-setup.md (수집 설정은 supabase/)
   dali-data.js 다음, dali.js 앞에 불러옵니다. */
const DaliFeed = (function () {
  // Publishable 키는 공개돼도 되는 읽기 전용 키. service_role 키는 절대 넣지 않음
  const SUPABASE_URL = "https://mxtakgepbztawgwxdykl.supabase.co";
  const SUPABASE_KEY = "sb_publishable_pWDErK2mPaP-5RepzT5eVA_adrhJyxI";
  const FRESH = 5 * 60 * 1000; // 5분이 지나면 다시 불러옴
  const cache = {}; // "disclosures:코드" | "news:코드" -> { list, loading, error, at }
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 공시명을 쉬운 제목으로. 위에서부터 처음 맞는 것. 한 줄 요약(summary)이 생기면 아랫줄을 그걸로 바꿈
  const LABELS = [
    [/해명/, "해명공시 안내"],
    [/영업실적등에대한전망|장래사업/, "실적 전망·경영계획 안내"],
    [/영업\(잠정\)실적|영업실적|매출액또는손익구조/, "영업실적 안내"],
    [/배당/, "배당 안내"],
    [/자기주식/, "자기주식 안내"],
    [/주식소각/, "주식 소각 안내"],
    [/주식교환|주식이전|교환ㆍ이전/, "주식교환·이전 안내"],
    [/채무보증/, "채무보증 안내"],
    [/특수관계인|내부거래|계열회사|계열금융회사/, "계열사 거래 안내"],
    [/대규모기업집단/, "기업집단 현황 안내"],
    [/주주총회/, "주주총회 안내"],
    [/기업설명회/, "기업설명회(IR) 안내"],
    [/유상증자|무상증자/, "증자 안내"],
    [/사채/, "사채 안내"],
    [/공급계약|단일판매/, "공급계약 안내"],
    [/타법인주식/, "타법인 주식 안내"],
    [/임원|주요주주|최대주주|대량보유/, "지분 변동 안내"],
    [/사업보고서|반기보고서|분기보고서/, "정기보고서"],
    [/수시공시의무/, "수시공시의무 안내"],
    [/조회공시/, "조회공시 안내"],
  ];
  const label = nm => (LABELS.find(([re]) => re.test(nm)) || [null, "기타 공시"])[1];

  function toRow(d) {
    const nm = String(d.report_nm || "").replace(/\s+/g, "");
    const fix = nm.match(/^\[(.+?)\]/); // [기재정정], [첨부정정] 등
    const base = nm.replace(/^\[.+?\]/, "");
    const [y, m, day] = String(d.rcept_dt).split("-");
    return {
      id: d.rcept_no,
      // 올해가 아니면 연도를 붙임 (예전 공시는 1년 전까지 옴)
      date: (+y === new Date().getFullYear() ? "" : `${y}년 `) + `${+m}월 ${+day}일`,
      title: label(base) + (fix ? ` (${fix[1]})` : ""),
      sub: d.summary || base.replace(/ㆍ/g, " · "),
      url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rcept_no}`,
    };
  }

  // 뉴스 한 건. 본문은 문단별로 나눠 둠 (화면에서 <p>로 하나씩)
  function toNewsRow(n) {
    const d = new Date(n.pub_date);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return {
      id: n.link,
      date: sameDay ? hm : `${d.getMonth() + 1}월 ${d.getDate()}일`,
      time: (sameDay ? "오늘 " : `${d.getMonth() + 1}월 ${d.getDate()}일 `) + hm,
      title: esc(n.title),
      sub: esc(n.description),
      author: esc(n.author || ""),
      body: String(n.content || n.description || "").split(/\n+/).map(p => esc(p.trim())).filter(Boolean),
      full: !!n.content,
    };
  }

  // 지금 가진 상태를 바로 돌려주고, 처음이거나 오래됐으면 불러온 뒤 onLoad를 부름
  function load(table, code, query, map, onLoad) {
    const key = `${table}:${code}`;
    const c = cache[key] || (cache[key] = {});
    if (!SUPABASE_URL) { c.error = true; return c; }
    if (!c.loading && (!c.at || Date.now() - c.at > FRESH)) {
      c.loading = true;
      fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(rows => { c.list = rows.map(map); c.error = false; })
        .catch(() => { c.error = true; }) // 예전에 받은 목록이 있으면 그대로 둠
        .finally(() => { c.loading = false; c.at = Date.now(); onLoad(); });
    }
    return c;
  }
  const get = (code, onLoad) => load("disclosures", code, `select=*&stock_code=eq.${code}&order=rcept_no.desc&limit=20`, toRow, onLoad);
  const getNews = (code, onLoad) => load("news", code, `select=*&stock_code=eq.${code}&order=pub_date.desc&limit=20`, toNewsRow, onLoad);
  // 이미 받아 둔 뉴스 목록에서 한 건 (기사 화면용)
  const article = (code, id) => (cache[`news:${code}`]?.list || []).find(a => a.id === id) || null;

  return { get, getNews, article };
})();
