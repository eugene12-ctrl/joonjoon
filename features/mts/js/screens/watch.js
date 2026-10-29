/* ---------- 관심종목 ----------
   탭: 관심종목(보유/최근/관심1) · 종목상위 · 유진조회상위 · 쏙쏙섹터 */
const WATCH_TABS = ["관심종목", "종목상위", "유진조회상위", "쏙쏙섹터"];
const TOP_KINDS = ["등락률상위", "거래대금상위", "거래량상위", "시총상위", "회전율상위"];
const VIEW_KINDS = ["국내조회상위", "국내조회급등", "국내관심종목등록상위", "해외조회상위"];

// 최근 영업일 n개 (MM/DD)
function recentDays(n) {
  const out = [], d = new Date();
  while (out.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`);
    d.setDate(d.getDate() - 1);
  }
  return out;
}
// 작은 밑줄 탭 (가로 스크롤, 끝에 ▷)
function kindTabs(list, on) {
  return `<div class="kind-tabs"><div class="kind-in">${list.map(k => `<button type="button" data-kind="${k}" class="${k === on ? "on" : ""}">${k}</button>`).join("")}</div><i class="kind-more">▷</i></div>`;
}
const marketSeg = () => `<div class="seg3 market">${["전체", "코스피", "코스닥"].map((t, i) => `<button type="button" class="${i === 0 ? "on" : ""}">${t}</button>`).join("")}</div>`;
const loadingMark = () => `<div class="loading" aria-label="불러오는 중"><i></i><i></i><i></i><i></i></div>`;

const WATCH_VIEWS = {
  "관심종목": {
    head: () => `${dropPill("통합")}${dropPill("현재가")}${pill("편집")}${iconBtn("list", "보기 방식")}`,
    body(w) {
      const rows = (WATCH_GROUPS[w.group] || []).map(stockBy).map(s => `
        <button type="button" class="watch-row" data-code="${s.code}">
          <i class="dir-bar ${s.dir}"></i>
          <span class="w-name"><b>${esc(s.name)}</b><small>${s.margin.split(" ")[1]}</small></span>
          <span class="w-price ${s.dir}">${num(s.price)} <em>${arrow(s.dir)}</em></span>
          <span class="w-chg ${s.dir}"><b>${num(s.change, "00")}</b><small>${rate(s.rate)}</small></span>
          <span class="w-vol"><b>${num(s.volume, "000,000")}</b><small>${rate(s.volRate)}</small></span>
        </button>`).join("");
      return `
        <div class="watch-groups">
          ${Object.keys(WATCH_GROUPS).map(g => `<button type="button" data-group="${g}" class="${g === w.group ? "on" : ""}">${g}</button>`).join("")}
          <span class="grow"></span>${iconBtn("down", "관심그룹 내려받기")}
        </div>
        <div class="watch-head"><span>종목명</span><span>현재가 <i class="aft">AFT</i></span><span>대비<br>등락률</span><span>거래량<br>전일대비</span></div>
        <div class="mts-body">${rows || `<p class="empty">종목이 없어요</p>`}</div>`;
    },
  },
  "종목상위": {
    head: () => `${dropPill("통합")}${pill("관심추가")}${iconBtn("refresh", "새로고침")}`,
    body(w) {
      const money = w.top === "거래대금상위";
      return `${kindTabs(TOP_KINDS, w.top)}
        <div class="bal-filter">${marketSeg()}${select(w.loading ? "" : "상승률상위", "wide-sel")}</div>
        <div class="rank-head four"><span>종목명</span><span>현재가</span><span class="sort">등락률</span><span>${money ? "거래대금" : "거래량"}${money ? '<i class="more-dot">›</i>' : ""}</span></div>
        <div class="mts-body">${w.loading ? loadingMark() : RANK_ROWS.map(r => `
          <div class="rank-row four"><span class="r-name">${esc(r.name)}</span><span class="${r.dir}">${num(r.price)}</span><span class="${r.dir}">${rate(r.rate)}</span><span>${num(r.volume, "0,000,000")}</span></div>`).join("")}</div>`;
    },
  },
  "유진조회상위": {
    head: () => `${dropPill("통합")}${pill("관심추가")}${iconBtn("refresh", "새로고침")}`,
    body(w) {
      const now = new Date();
      const stamp = `${TODAY} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      return `${kindTabs(VIEW_KINDS, w.view)}
        <div class="bal-filter">${marketSeg()}${dateBox()}</div>
        <div class="bal-filter"><span class="stamp">${w.loading ? "" : `기준일시 ${stamp}`}</span><span class="grow"></span>${select("당일누적")}${iconBtn("refresh", "다시 조회")}</div>
        <div class="rank-head five"><span>순위</span><span>종목명</span><span>현재가</span><span class="sort">등락률</span><span>조회수<i class="more-dot">›</i></span></div>
        <div class="mts-body">${w.loading ? loadingMark() : RANK_ROWS.slice(0, 10).map((r, i) => `
          <div class="rank-row five"><span>${i + 1}</span><span class="r-name">${esc(r.name)}</span><b class="${r.dir}">${num(r.price)}</b><span class="${r.dir}">${rate(r.rate)}</span><span>${num(r.views, "00,000")}</span></div>`).join("")}</div>`;
    },
  },
  "쏙쏙섹터": {
    head: () => iconBtn("refresh", "새로고침"),
    body(w) {
      if (w.loading) return `<div class="mts-body">${loadingMark()}</div>`;
      const days = recentDays(4);
      return `
        <div class="sector-filter">
          <span>섹터</span>${select("상승률순")}${select("KRX")}<span>종목</span>${select("상승률순")}<span class="grow"></span>${iconBtn("info", "쏙쏙섹터 안내")}
        </div>
        <div class="bal-filter">
          <div class="day-chips">${days.map((d, i) => `<button type="button" class="${i === 0 ? "on" : ""}">${d}</button>`).join("")}</div>
          ${check("", true)}${dateBox(TODAY, true)}
        </div>
        <div class="mts-body sector-body">
          <div class="rank-head four sector"><span>종목명</span><span>현재가</span><span class="sort">등락률</span><span>거래량/전일비<i class="more-dot">›</i></span></div>
          ${SECTORS.map(g => `<p class="sector-name">${esc(g.name)}</p>${g.rows.map(n => `
            <div class="rank-row four sector"><span class="r-name"><i class="dir-bar up"></i>${esc(n)}</span><b class="up">${num(null)}</b><b class="up">${rate(null)}</b>
              <span class="two"><span>000,000</span><small>00.00</small></span></div>`).join("")}`).join("")}
          <div class="sector-lock">
            <h3>쏙쏙섹터</h3>
            <p>오늘의 주요 섹터와 종목을 <b>한 번에 확인</b>하세요<br><b>주요 종목 1~2개와 다른 종목의 시세 변화</b>를<br>함께 관찰해 보세요</p>
          </div>
        </div>
        <div class="sector-cta"><button type="button" class="btn teal wide" data-act="join">쏙쏙클럽 서비스 신청</button></div>`;
    },
  },
};

Screens.watch = {
  tab: "관심종목", group: "최근", top: "등락률상위", view: "국내조회상위", loading: false,
  render() {
    const v = WATCH_VIEWS[this.tab];
    return header("관심종목", v.head()) + topTabs(WATCH_TABS, this.tab) + v.body(this);
  },
  mount(el) {
    // 탭을 바꾸면 영상처럼 잠깐 불러오는 표시를 보여 줌
    const load = fn => { fn(); this.loading = this.tab !== "관심종목"; App.render(); if (this.loading) setTimeout(() => { this.loading = false; App.render(); }, 450); };
    bindTabs(el, "data-tab", t => load(() => { this.tab = t; }));
    el.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => load(() => {
      if (this.tab === "종목상위") this.top = b.dataset.kind; else this.view = b.dataset.kind;
    }));
    revealInRow(el.querySelector(".kind-in .on"));
    el.querySelectorAll("[data-group]").forEach(b => b.onclick = () => { this.group = b.dataset.group; App.render(); });
    el.querySelectorAll(".watch-row").forEach(b => b.onclick = () => { App.code = b.dataset.code; App.go("chart"); });
    el.querySelectorAll(".seg3 button, .day-chips button").forEach(b => b.onclick = () => {
      b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    });
    el.querySelector("[data-act=join]")?.addEventListener("click", () => App.toast("쏙쏙클럽 서비스 신청은 시연에서 열리지 않아요"));
  },
};
