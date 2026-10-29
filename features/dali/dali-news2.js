/* ---------- 달이 뉴스 탭 다시 그리기 (dali.js 위에 얹음) ----------
   오늘 탭과 같은 틀: 흰 바탕, 맨 위 짙은 띠 하나, 아래 목록 줄.
   맨 위 띠는 옆으로 넘기는 이야기. 한 장에 숫자 하나(그 소식에 걸린 내 돈), 한 줄(AI 요약), 버튼 하나.
   소식을 누르면 열리는 읽기 화면은 시트 머리와 탭 아래에 열려서, 위쪽 머리가 사라지지 않음.
   아래 목록은 내 돈에 준 영향이 큰 순서. 관심 종목은 등락으로.
   dali.js가 그린 뉴스 목록에서 소식 id와 순서(느낌표 먼저)만 읽고 본문을 바꿔 그린다. 뉴스 읽기 화면은 dali.openNews 그대로.
   되돌리려면 각 페이지에서 이 파일과 dali-news2.css를 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  if (!sheet || !window.dali) return;

  const tabs = sheet.querySelector(".dali-tabs");
  const body = sheet.querySelector(".dali-body");
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const C = typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null;
  const won = n => `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(Math.round(n)).toLocaleString("ko-KR")}원`;
  const usd = n => `${n > 0 ? "+" : n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(Math.abs(n) < 1 ? 2 : 1)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const allNews = () => [...DALI_NEWS, ...Object.values(typeof DALI_ALERT_NEWS !== "undefined" ? DALI_ALERT_NEWS : {})];

  // 등락과 지금가는 오늘 탭의 시연 장면(아침, 장중, 마감, 월말)과 같은 값. 선물과 장면 정보가 없으면 dali-data.js 값
  const R = typeof DaliRules !== "undefined" ? DaliRules : null;
  const scene = () => (window.daliPro && window.daliPro.sc) || "morning";
  const chg = sym => (R && DALI_SYMS[sym].app === "stock" ? R.todayPct(sym, scene()) : DALI_SYMS[sym].chg);
  const nowP = sym => (R && DALI_SYMS[sym].app === "stock" ? R.nowPrice(sym, scene()) : DALI_SYMS[sym].price);

  // 그 소식에 걸린 내 돈: 국내주식 보유는 수량 × 지금가 × 등락(오늘 탭과 같은 계산), 선물 보유는 매매일지 평가손익
  function mine(sym) {
    const s = DALI_SYMS[sym];
    if (s.app === "stock" && C) {
      const p = C.positions.find(x => x.sym === sym);
      if (p) return { held: true, qty: `${p.qty}주`, money: p.qty * nowP(sym) * chg(sym) / (100 + chg(sym)), fmt: won };
    }
    if (s.app === "fut") {
      const t = DALI_TRADES.find(x => x.sym === sym && !x.sell);
      if (t) return { held: true, qty: t.qty.replace(/^\S+\s/, ""), money: t.pnl, fmt: usd };
    }
    return { held: false };
  }
  function logo(sym) {
    const s = DALI_SYMS[sym];
    const src = s.code ? `${BASE}img/logo-${s.code}.png` : s.icon ? `${BASE}../futures/img/${s.icon}.png` : "";
    return `<i class="dali-pro-logo${s.icon ? " icon" : ""}">${sym[0]}${src ? `<img src="${src}" alt="" onerror="this.remove()">` : ""}</i>`;
  }
  // 한 장: 숫자 하나, 한 줄, 버튼 하나
  function slide(n, i) {
    const s = DALI_SYMS[n.sym], me = mine(n.sym);
    const big = me.held ? me.fmt(me.money) : pct(chg(n.sym));
    const top = me.held ? `${n.sym} ${me.qty}` : `${n.sym} 관심`;
    return `<article class="dali-n2-slide" data-i="${i}">
      <p class="dali-pro-act-top">${logo(n.sym)}${top}<span>${n.time}</span></p>
      <p class="dali-pro-act-big">${big}</p>
      <h2>${n.why}</h2>
      <div class="dali-pro-act-btns"><button type="button" data-n2-news="${n.id}">기사 보기</button></div>
    </article>`;
  }
  function row(n) {
    const s = DALI_SYMS[n.sym], me = mine(n.sym);
    const val = me.held ? `<b class="${tone(me.money)}">${me.fmt(me.money)}</b><small>내 ${me.qty}</small>` : `<b class="${tone(chg(n.sym))}">${pct(chg(n.sym))}</b><small>관심</small>`;
    return `<li><button type="button" class="dali-pro-row" data-n2-news="${n.id}">
      ${logo(n.sym)}
      <span class="dali-pro-name"><b>${n.sym}<em>${n.time}</em></b><small>${n.why}</small></span>
      <span class="dali-pro-val">${val}</span>
    </button></li>`;
  }

  function html(ids) {
    const byId = Object.fromEntries(allNews().map(n => [n.id, n]));
    const list = ids.map(x => byId[x.id] && { ...byId[x.id], flag: x.flag }).filter(Boolean);
    // 느낌표 소식 먼저, 그다음 내 돈에 걸린 금액이 큰 순서, 관심 종목은 등락이 큰 순서
    const score = n => { const me = mine(n.sym); return (n.flag ? 1e12 : 0) + (me.held ? 1e9 + Math.abs(me.money) : Math.abs(chg(n.sym))); };
    const sorted = list.slice().sort((a, b) => score(b) - score(a));
    // 넘기는 이야기는 종목마다 한 장, 최대 다섯 장
    const seen = new Set(), stories = sorted.filter(n => !seen.has(n.sym) && seen.add(n.sym)).slice(0, 5);
    return `<div class="dali-pro dali-pro-list2 ready dali-n2">
      <section class="dali-pro-act dali-n2-act">
        <div class="dali-n2-track">${stories.map(slide).join("")}</div>
        <div class="dali-n2-dots">${stories.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
      </section>
      <p class="dali-pro-sec">모든 소식</p>
      <ul class="dali-pro-rows">${sorted.map(row).join("")}</ul>
    </div>`;
  }

  // dali.js가 뉴스 탭을 그리면 곧바로 이 모양으로 바꿔 그림
  const onNews = () => !!tabs.querySelector('[data-tab="news"].on');
  function repaint() {
    if (!onNews() || body.querySelector(".dali-n2")) return;
    const ids = [...body.querySelectorAll("[data-news]")].map(b => ({ id: b.dataset.news, flag: !!b.querySelector(".dali-bang") }));
    if (!ids.length) return;
    body.innerHTML = html(ids);
    const track = body.querySelector(".dali-n2-track"), dots = body.querySelectorAll(".dali-n2-dots i");
    track.addEventListener("scroll", () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });
  }
  new MutationObserver(repaint).observe(body, { childList: true });
  // 발표자 상자에서 시연 장면을 바꾸면 뉴스 탭 숫자도 다시
  document.querySelector(".dali-demo")?.addEventListener("click", e => {
    if (!e.target.closest("[data-scene]") || !onNews()) return;
    setTimeout(() => tabs.querySelector('[data-tab="news"]').click(), 0);
  });

  // 읽기 화면(뉴스 상세, 달이 키우기)은 시트 머리와 탭 아래부터 덮음. 탭을 누르면 읽기 화면을 닫고 그 탭으로
  const page = sheet.querySelector(".dali-page");
  const placePage = () => sheet.style.setProperty("--dali-page-top", `${tabs.offsetTop + tabs.offsetHeight}px`);
  placePage();
  new ResizeObserver(placePage).observe(tabs);
  tabs.addEventListener("click", e => {
    if (!e.target.closest("[data-tab]") || !page || page.hidden) return;
    page.querySelector('[data-act="back"]')?.click();
  }, true);

  body.addEventListener("click", e => {
    const b = e.target.closest("[data-n2-news]");
    if (b) window.dali.openNews(b.dataset.n2News);
  });
})();
