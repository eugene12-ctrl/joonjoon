/* ---------- 달이 뉴스 탭 다시 그리기 (dali.js 위에 얹음) ----------
   오늘 탭과 같은 틀: 흰 바탕, 맨 위 짙은 띠 하나, 아래 목록 줄.
   맨 위 띠는 옆으로 넘기는 이야기. 한 장에 지금가와 등락, 한 줄(AI 요약), 버튼 하나.
   소식을 누르면 열리는 읽기 화면은 시트 머리와 탭 아래에 열려서, 위쪽 머리가 사라지지 않음.
   아래 목록은 느낌표 소식, 보유 종목, 관심 종목 순서이고 줄마다 지금가와 등락.
   dali.js가 그린 뉴스 목록에서 소식 id와 순서(느낌표 먼저)만 읽고 본문을 바꿔 그린다. 뉴스 읽기 화면은 dali.openNews 그대로.
   되돌리려면 각 페이지에서 이 파일과 dali-news2.css를 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  if (!sheet || !window.dali) return;

  const tabs = sheet.querySelector(".dali-tabs");
  const body = sheet.querySelector(".dali-body");
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const FACE_S = `${BASE}dali-face.png`;
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

  // 그 소식에 걸린 내 자산: 국내주식 보유는 수량 × 지금가 × 등락(오늘 탭과 같은 계산), 선물 보유는 매매일지 평가손익
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
  // 지금가: 국내주식은 원, 선물은 종목 소수 자리
  const price = sym => { const s = DALI_SYMS[sym], p = nowP(sym); return s.app === "stock" ? `${Math.round(p).toLocaleString("ko-KR")}원` : p.toLocaleString("en-US", { minimumFractionDigits: s.dec || 2, maximumFractionDigits: s.dec || 2 }); };
  function logo(sym) {
    const s = DALI_SYMS[sym];
    const src = s.code ? `${BASE}img/logo-${s.code}.png` : s.icon ? `${BASE}../futures/img/${s.icon}.png` : "";
    return `<i class="dali-pro-logo${s.icon ? " icon" : ""}">${sym[0]}${src ? `<img src="${src}" alt="" onerror="this.remove()">` : ""}</i>`;
  }
  // 한 장: 오늘 탭 히어로와 같은 틀. 달이 얼굴과 라벨, 지금가와 등락, 한 줄, 버튼 하나, 오른쪽에 종목 로고 스티커
  function art(sym) {
    const s = DALI_SYMS[sym];
    const src = s.code ? `${BASE}img/logo-${s.code}.png` : s.icon ? `${BASE}../futures/img/${s.icon}.png` : "";
    return src ? `<figure class="dali-pro-act-art ${s.code ? "logo" : "pic"}"><img src="${src}" alt="" onerror="this.parentNode.remove()"></figure>` : "";
  }
  function slide(n, i) {
    const me = mine(n.sym), c = chg(n.sym);
    const big = `${price(n.sym)}<small class="${tone(c)}">${pct(c)}</small>`;
    const top = me.held ? `${DALI_NAME(n.sym)} 소식, 보유 중` : `${DALI_NAME(n.sym)} 소식`;
    return `<article class="dali-n2-slide" data-i="${i}">
      ${art(n.sym)}
      <p class="dali-pro-act-top"><img src="${FACE_S}" alt="달이">${top}<span>${n.time}</span></p>
      <p class="dali-pro-act-big">${big}</p>
      <h2>${n.why}</h2>
      <div class="dali-pro-act-btns"><button type="button" data-n2-news="${n.id}">기사 보기</button></div>
    </article>`;
  }
  function row(n) {
    const s = DALI_SYMS[n.sym], me = mine(n.sym);
    const c = chg(n.sym), val = `<b>${price(n.sym)}</b><small class="${tone(c)}">${pct(c)}</small>`;
    return `<li><button type="button" class="dali-pro-row" data-n2-news="${n.id}">
      ${logo(n.sym)}
      <span class="dali-pro-name"><b>${DALI_NAME(n.sym)}<em>${n.time}</em></b><small>${n.why}</small></span>
      <span class="dali-pro-val">${val}</span>
    </button></li>`;
  }

  function html(ids) {
    const byId = Object.fromEntries(allNews().map(n => [n.id, n]));
    const list = ids.map(x => byId[x.id] && { ...byId[x.id], flag: x.flag }).filter(Boolean);
    // 느낌표 소식 먼저, 그다음 보유 종목, 관심 종목. 같은 묶음 안에서는 등락이 큰 순서
    const score = n => (n.flag ? 1e6 : 0) + (mine(n.sym).held ? 1e3 : 0) + Math.abs(chg(n.sym));
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
    const track = body.querySelector(".dali-n2-track"), dots = [...body.querySelectorAll(".dali-n2-dots i")], n = dots.length;
    const at = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = (i, smooth = true) => track.scrollTo({ left: ((i % n) + n) % n * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
    track.addEventListener("scroll", () => { const i = at(); dots.forEach((d, k) => d.classList.toggle("on", k === i)); }, { passive: true });
    // 손가락 스와이프 말고도 넘어가게: 4초마다 자동, 점 누르기, 마우스로 끌기. 손을 대면 자동은 잠시 멈춤
    let timer = null, hold = 0;
    const play = () => { clearInterval(timer); timer = setInterval(() => { if (!track.isConnected) return clearInterval(timer); if (Date.now() > hold) go(at() + 1); }, 4000); };
    const pause = ms => { hold = Date.now() + ms; };
    dots.forEach((d, k) => d.addEventListener("click", () => { pause(8000); go(k); }));
    let drag = null;
    track.addEventListener("pointerdown", e => { if (e.pointerType === "touch") { pause(8000); return; } drag = { x: e.clientX, left: track.scrollLeft, moved: false }; pause(8000); });
    track.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; track.scrollLeft = drag.left - dx; });
    const end = e => { if (!drag) return; const dx = e.clientX - drag.x; const i = at(); drag = null; if (Math.abs(dx) > track.clientWidth / 5) go(dx < 0 ? Math.floor(track.scrollLeft / track.clientWidth) + 1 : Math.ceil(track.scrollLeft / track.clientWidth) - 1); else go(i); };
    track.addEventListener("pointerup", end); track.addEventListener("pointercancel", end); track.addEventListener("pointerleave", end);
    // 끌다가 놓은 게 버튼 위면 누른 걸로 치지 않음
    track.addEventListener("click", e => { if (e.target.closest("button") && track.dataset.dragged) { e.stopPropagation(); e.preventDefault(); } delete track.dataset.dragged; }, true);
    track.addEventListener("pointerup", e => { if (drag === null && Math.abs(e.clientX - (track._x0 || e.clientX)) > 4) track.dataset.dragged = "1"; }, true);
    track.addEventListener("pointerdown", e => { track._x0 = e.clientX; }, true);
    play();
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
