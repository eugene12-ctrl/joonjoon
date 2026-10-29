/* ---------- 달이: 화면 우측 하단에 늘 떠 있는 AI 비서 ----------
   관심종목과 보유 종목을 자동으로 추적해 뉴스와 등락을 보여 주고,
   매매일지를 알아서 쓰고, 미션으로 해달을 키운다. 앱마다 그 앱의 종목만 다룬다.
   index.html에서 main.js 다음에 불러옵니다. */
(function () {
  const phone = document.querySelector(".phone");
  if (!phone) return;

  // 이미지 경로는 이 파일 위치 기준 (index.html, features/mts/index.html 어디서 불러도 맞도록)
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const FACE = `${BASE}dali-face.png`; // 버튼, 시트 머리: 얼굴만
  const BODY = `${BASE}dali-body.png`; // 관리 탭 바다: 전신
  const IMG = n => `${BASE}img/${n}.png`;
  const state = {
    app: window.DALI_PAGE_APP || "stock",
    pebbles: 7,
    tab: "news",
    page: null, // { type: "news", id } | { type: "order", sym, side, qty }
    news: DALI_NEWS.slice(),
    trades: DALI_TRADES.map(t => ({ ...t })),
    open: false,
    spoke: false, // 먼저 말 거는 건 하루 한 번
    done: {},
    quiz: {},
    forest: 72,
    wear: "ribbon",
    gift: null, // 관리 탭에서 펼쳐 본 단계 선물
    fx: null, // 관리 탭을 다시 그린 뒤 보여 줄 연출 { gain, grew }
    editing: null,
    order: null, // { sym, side, qty } MTS 주문 화면
  };

  const SHARED = ["pebbles", "done", "forest", "wear"];
  try {
    const saved = JSON.parse(localStorage.getItem("dali-shared") || "{}");
    SHARED.forEach(k => { if (k in saved) state[k] = saved[k]; });
  } catch (e) { /* 저장소를 못 쓰면 처음 상태로 */ }
  function saveShared() {
    try { localStorage.setItem("dali-shared", JSON.stringify(Object.fromEntries(SHARED.map(k => [k, state[k]])))); } catch (e) { /* 무시 */ }
  }

  const isFlag = n => DALI_FLAG_TYPES.includes(n.type);
  // 아직 달이가 안 보는 종목(DALI_CATALOG, 관심에 넣기 전)의 소식은 app이 없어 걸러진다
  const appOf = sym => DALI_SYMS[sym]?.app;
  const mine = list => list.filter(x => appOf(x.sym) === state.app);
  const josa = (w, a, b) => {
    const c = w.charCodeAt(w.length - 1) - 0xac00;
    return w + (c >= 0 && c <= 11171 && c % 28 ? a : b);
  };
  const won = (n, app = state.app) => app === "fut"
    ? `${n > 0 ? "+" : n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : `${n > 0 ? "+" : ""}${Math.round(n).toLocaleString("ko-KR")}원`;
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const priceText = sym => {
    const s = DALI_SYMS[sym];
    // 선물 시세는 호가 단위 그대로 (지수 포인트, 배럴당 달러 등). 손익만 달러로 씀
    return s.app === "fut" ? s.price.toLocaleString("en-US", { minimumFractionDigits: s.dec ?? 2, maximumFractionDigits: s.dec ?? 2 }) : `${s.price.toLocaleString("ko-KR")}원`;
  };
  const quote = sym => `<span class="dali-quote ${tone(DALI_SYMS[sym].chg)}">${priceText(sym)} <b>${pct(DALI_SYMS[sym].chg)}</b></span>`;
  const stageAt = p => DALI_STAGES.findLastIndex(s => p >= s.min);
  const stage = () => DALI_STAGES[stageAt(state.pebbles)];
  const nextStage = () => DALI_STAGES.find(s => s.min > state.pebbles);
  const kindLabel = sym => (DALI_SYMS[sym].kind === "hold" ? "보유" : "관심");

  /* --- 화면 요소 --- */
  const fut = document.createElement("section");
  fut.className = "dali-fut";
  fut.setAttribute("aria-label", "유진투자선물 시연 화면");
  fut.innerHTML = `
    <header class="dali-fut-head"><strong>유진투자선물</strong><span>홍길동님</span></header>
    <nav class="dali-fut-tabs"><button class="on" type="button">해외선물</button><button type="button">국내선물</button><button type="button">야간</button><button type="button">옵션</button></nav>
    <ul class="dali-fut-list">
      ${Object.keys(DALI_SYMS).filter(s => appOf(s) === "fut").map(s => `
        <li><button type="button" data-sym="${s}"><span><b>${DALI_NAME(s)}</b><small>${kindLabel(s)}</small></span>${quote(s)}</button></li>`).join("")}
    </ul>
    <p class="dali-fut-note">시세는 10월 28일 수준을 참고한 시연용 숫자입니다.</p>`;

  const dim = document.createElement("div");
  dim.className = "dali-dim";

  // 옷장에서 고른 장식. 얼굴만 나오는 자리(버튼, 시트 머리)는 w-face, 전신은 w-body로 위치를 다르게 잡음 (dali-wear.css)
  // 클래스에 w- 접두어를 붙이는 건 앱 CSS(src/css/main.css)의 .body 같은 이름과 겹치지 않게 하려는 것
  const wearImg = where => state.wear ? `<img class="dali-wear w-${where} ${state.wear}" src="${IMG(state.wear)}" alt="">` : "";

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "dali-fab";
  fab.setAttribute("aria-label", "달이 열기");
  fab.innerHTML = `<img src="${FACE}" alt="">${wearImg("face")}<span class="dali-alert" aria-hidden="true">!</span>`;

  const bubble = document.createElement("div");
  bubble.className = "dali-bubble";
  bubble.setAttribute("role", "status");

  const sheet = document.createElement("section");
  sheet.className = "dali-sheet";
  sheet.setAttribute("aria-label", "달이");
  sheet.inert = true;
  sheet.innerHTML = `
    <header class="dali-sheet-head">
      <span class="dali-face"><img src="${FACE}" alt="">${wearImg("face")}</span>
      <div><strong>달이</strong><span class="dali-where"></span></div>
      <span class="dali-pebbles"></span>
      <button type="button" class="dali-close" aria-label="닫기">✕</button>
    </header>
    <nav class="dali-tabs" role="tablist">
      ${[["news", "뉴스"], ["journal", "매매일지"], ["manage", "관리"]]
        .map(([k, l]) => `<button type="button" role="tab" data-tab="${k}">${l}</button>`).join("")}
    </nav>
    <div class="dali-body"></div>
    <div class="dali-page" hidden></div>`;

  phone.append(fut, dim, fab, bubble, sheet);
  const body = sheet.querySelector(".dali-body");
  const pageEl = sheet.querySelector(".dali-page");
  // 옷을 바꾸면 다시 그려지지 않는 두 자리(플로팅 버튼, 시트 머리)의 장식을 맞춤. 바다는 render()가 새로 그림
  function syncWear() {
    [fab, sheet.querySelector(".dali-sheet-head .dali-face")].forEach(el => {
      el.querySelector(".dali-wear")?.remove();
      const alert = el.querySelector(".dali-alert");
      if (alert) alert.insertAdjacentHTML("beforebegin", wearImg("face"));
      else el.insertAdjacentHTML("beforeend", wearImg("face"));
    });
  }

  /* --- 말풍선, 느낌표, 조약돌 --- */
  let bubbleTimer = null;
  function say(text) {
    bubble.textContent = text;
    bubble.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("show"), 4500);
  }
  function sayOnce(text) { if (!state.spoke) { state.spoke = true; say(text); } }
  const unseenFlags = () => mine(state.news).filter(n => isFlag(n) && !n.seen).length;
  const paintAlert = () => fab.classList.toggle("has-alert", unseenFlags() > 0);
  function gain(n) {
    const before = stageAt(state.pebbles);
    state.pebbles += n;
    state.fx = { gain: n, grew: stageAt(state.pebbles) > before };
  }
  function complete(id) {
    if (state.done[id]) return;
    const m = DALI_MISSIONS.find(x => x.id === id);
    state.done[id] = true;
    state.justDone = id;
    gain(m.reward);
    state.forest = Math.min(100, state.forest + (m.forest || m.reward * 2));
    say(m.doneSay || `조약돌 ${m.reward}개! ${m.title.replace(" (안 해도 괜찮아요)", "")}`);
  }

  /* --- 열고 닫기 --- */
  function open(tab) {
    if (tab) state.tab = tab;
    state.lastQuiz = null; // 다시 열면 다음 문제, 접힌 채로
    state.quizOpen = false;
    state.open = true;
    sheet.classList.add("open");
    dim.classList.add("show");
    sheet.inert = false;
    bubble.classList.remove("show");
    render();
  }
  function close() {
    state.open = false;
    state.page = null;
    sheet.classList.remove("open");
    dim.classList.remove("show");
    sheet.inert = true;
  }

  /* --- 뉴스 탭: 종목, 등락, AI 요약 --- */
  function newsRow(n) {
    const flag = isFlag(n);
    return `
      <button type="button" class="dali-news${flag && !n.seen ? " unseen" : ""}" data-news="${n.id}"><span class="dali-news-main">
        <span class="dali-news-top">${flag ? `<span class="dali-bang">!</span>` : ""}<b>${DALI_NAME(n.sym)}</b>${quote(n.sym)}<span class="dali-time">${n.time}</span></span>
        <span class="dali-why"><em>AI 요약</em> ${n.why}</span></span>${DaliChart.spark(n.sym)}
      </button>`;
  }
  function newsHTML() {
    const list = mine(state.news);
    const sorted = [...list.filter(isFlag), ...list.filter(n => !isFlag(n))];
    const tracked = Object.keys(DALI_SYMS).filter(s => appOf(s) === state.app);
    return `
      <div class="dali-track"><span>자동 추적 중</span>${tracked.map(s => `<i class="${DALI_SYMS[s].kind}">${DALI_NAME(s)}</i>`).join("")}</div>` +
      sorted.map(newsRow).join("") +
      `<p class="dali-hint center">${state.app === "fut" ? "관심과 보유 계약을 달이가 알아서 따라가요. 느낌표는 큰 변동, 만기, 증거금일 때만." : "관심종목에 넣으면 달이가 알아서 따라가요. 느낌표는 공시, 실적, 큰 변동일 때만."}</p>`;
  }

  /* --- 매매일지 탭: 거래내역처럼 한 줄씩. 줄을 누르면 그 아래에 차트 하나와 살 때, 팔 때 두 줄만 --- */
  // 나눠 산 기록: 평단보다 낮게 더 사면 물타기, 높게 더 사면 불타기. 좋다 나쁘다는 말하지 않고 사실만
  // 살 때와 팔 때: 그때 가격과 주수, 그리고 그날 특징뉴스 한 줄. 시황 숫자는 늘어놓지 않는다
  // 특징뉴스는 그날 그 종목 실제 뉴스가 있으면(최근 2주) 그 제목을, 없으면 그날의 가상 뉴스 한 줄
  const C_TR = typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER.trades : [];
  const tradeOf = t => t.app !== "stock" ? null : C_TR.find(x => x.id === t.tid) || C_TR.find(x => x.sym === t.sym && !x.sell && x.buySnap);
  const dayKo = d => { const [m, dd] = (d === "오늘" ? "10/29" : d).split("/").map(Number); return `${m}월 ${dd}일`; };
  const krw = n => `${Math.round(n).toLocaleString("ko-KR")}원`;
  function realNews(sym, label) {
    const code = DALI_SYMS[sym] && DALI_SYMS[sym].code;
    if (!code || typeof DaliFeed === "undefined") return null;
    const c = DaliFeed.getNews(code, () => { if (state.open && state.tab === "journal" && !state.page) render(); });
    return (c.list || []).find(a => a.time.startsWith(label)) || null;
  }
  function hot(kind, sym, date) {
    const real = realNews(sym, dayKo(date));
    if (real) return `<button type="button" class="dali-mn-hot" data-article="${real.id}" data-sym="${sym}"><i>특징뉴스</i><b>${real.title}</b></button>`;
    const t = typeof DALI_MOMENT_NEWS !== "undefined" && DALI_MOMENT_NEWS[kind][`${sym} ${date === "오늘" ? "10/29" : date}`];
    return t ? `<p class="dali-mn-hot"><i>특징뉴스</i><b>${t}</b></p>` : "";
  }
  // 한 번의 매매: 날짜, 가격에 주수, 특징뉴스
  const deal = (kind, sym, date, price, qty) => `<div class="dali-mn-deal"><small>${dayKo(date)}</small><p class="dali-mn-px"><b>${krw(price)}</b>에 ${qty}주</p>${hot(kind, sym, date)}</div>`;
  function market(t) {
    const ct = tradeOf(t);
    if (!ct || !ct.buySnap) return "";
    // 나눠 산 보유 종목은 회차마다, 끝에 평단 변화
    const buys = t.buys && t.buys.length > 1 ? t.buys : [{ date: t.buy.date, qty: ct.qty, price: ct.price || ct.buySnap.price }];
    let q = 0, cost = 0;
    const avgs = buys.map(b => { q += b.qty; cost += b.qty * b.price; return cost / q; });
    const avgLine = buys.length > 1 ? `<p class="dali-mn-avg">평단 ${krw(buys[0].price)} → <b>${krw(avgs[avgs.length - 1])}</b></p>` : "";
    const buy = `<div class="dali-mn"><p class="dali-mn-head">살 때</p>${buys.map(b => deal("buy", t.sym, b.date, b.price, b.qty)).join("")}${avgLine}</div>`;
    const sell = t.sell && ct.sellSnap
      ? `<div class="dali-mn"><p class="dali-mn-head">팔 때</p>${deal("sell", t.sym, t.sell.date, ct.sellSnap.price, ct.qty)}</div>`
      : `<div class="dali-mn"><p class="dali-mn-head">팔 때</p><p class="dali-mn-hold">아직 들고 있어요</p></div>`;
    return `<div class="dali-mns">${buy}${sell}</div>`;
  }
  function addInfo(t) {
    if (!t.buys || t.buys.length < 2) return { kind: "", text: "" };
    let qty = 0, cost = 0, water = 0, fire = 0;
    t.buys.forEach((b, i) => {
      if (i) (b.price < cost / qty ? water++ : fire++);
      qty += b.qty; cost += b.qty * b.price;
    });
    const last = t.buys[t.buys.length - 1];
    return {
      kind: water && fire ? "물타기, 불타기" : water ? "물타기" : "불타기",
      text: `${last.date} ${last.qty}주 더 사서 평단 ${t.buys[0].price.toLocaleString("ko-KR")} → ${Math.round(cost / qty).toLocaleString("ko-KR")}원`,
    };
  }
  // 종목 그림: 국내주식은 로고 파일, 선물은 해외선물 화면과 같은 그림. 없으면 글자 동그라미
  function symImg(sym) {
    const s = DALI_SYMS[sym], src = s.code ? IMG(`logo-${s.code}`) : s.icon ? `${BASE}../futures/img/${s.icon}.png` : "";
    return src ? `<img src="${src}" alt="" onerror="this.remove()">` : "";
  }
  // mode "day": 일간 화면의 보유 줄은 산 뒤 전체 손익 대신 그날 하루 움직인 금액과 등락
  function tradeRow(t, mode) {
    const open = state.openTrade === t.id, add = addInfo(t), day = mode === "day" && !t.sell;
    const val = day ? heldToday(t) : t.pnl, valPct = day ? (DALI_SYMS[t.sym].chg || 0) : t.pct;
    const sub = t.sell ? `${t.sell.date} 팜, ${t.qty}` : t.qty;
    return `
      <li class="dali-jrow${open ? " open" : ""}${t.live ? " new" : ""}">
        <button type="button" class="dali-jline" data-act="trade" data-id="${t.id}" aria-expanded="${open}">
          <i class="dali-jlogo${DALI_SYMS[t.sym].icon ? " icon" : ""}">${t.sym[0]}${symImg(t.sym)}</i>
          <span class="dali-jname"><b>${DALI_NAME(t.sym)}${add.kind ? `<em>${add.kind}</em>` : ""}</b><small>${sub}</small></span>
          <span class="dali-jval ${tone(val)}"><b>${won(val)}</b><small>${pct(valPct)}</small></span>
        </button>
        ${open ? (() => { const mk = market(t);
          return mk ? `<div class="dali-jmore">${DaliChart.trade(t)}${mk}</div>`
            : `<div class="dali-jmore">${DaliChart.trade(t)}
          <p><b>살 때</b><span>${t.buy.news}${add.text ? `. ${add.text}` : ""}</span></p>
          <p><b>팔 때</b><span>${t.sell ? t.sell.news : "아직 들고 있어요"}</span></p></div>`; })() : ""}
      </li>`;
  }
  // 10월 수익 달력: 판 날마다 그날 실현 손익을 만 원 단위로. 누르면 그날 판 줄이 펼쳐짐
  // 매매일지 일간, 주간, 월간. 오늘은 10월 29일(목), 이번 주는 10/26(월)부터 10/30(금)
  const J_TODAY = 29, J_WEEK = [26, 27, 28, 29, 30];
  const jday = t => { const [m, d] = (t.sell.date === "오늘" ? "10/29" : t.sell.date).split("/").map(Number); return m === 10 ? d : 0; };
  const jshort = n => { if (state.app === "fut") return `${n > 0 ? "+" : n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`; const v = n / 10000; return `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(v) >= 10 ? Math.round(Math.abs(v)) : Math.abs(v).toFixed(1).replace(".0", "")}만`; };
  function jcell(d, l, label) {
    const sum = l ? l.reduce((a, t) => a + t.pnl, 0) : 0, today = d === J_TODAY ? " today" : "";
    return l
      ? `<button type="button" class="dali-jday ${tone(sum)}${today}" data-act="jday" data-id="${l[0].id}"><i>${label || d}</i><b>${jshort(sum)}</b></button>`
      : `<span class="dali-jday${today}"><i>${label || d}</i></span>`;
  }
  function byDayOf(closed) { const m = {}; closed.forEach(t => { const d = jday(t); if (d) (m[d] = m[d] || []).push(t); }); return m; }
  // 월간: 10월 달력
  function jcalHTML(closed) {
    const byDay = byDayOf(closed), first = new Date(2026, 9, 1).getDay(), cells = [];
    for (let i = 0; i < first; i++) cells.push("<span></span>");
    for (let d = 1; d <= 31; d++) cells.push(jcell(d, byDay[d]));
    return `<div class="dali-jcal"><div class="dali-jweek">${"일월화수목금토".split("").map(w => `<i>${w}</i>`).join("")}</div><div class="dali-jgrid">${cells.join("")}</div></div>`;
  }
  // 주간: 이번 주 다섯 날
  function jweekHTML(closed) {
    const byDay = byDayOf(closed);
    return `<div class="dali-jcal"><div class="dali-jgrid w5">${J_WEEK.map((d, i) => jcell(d, byDay[d], `${"월화수목금"[i]} ${d}`)).join("")}</div></div>`;
  }
  // 보유 종목의 오늘 평가 변동: 수량 × 지금가 × 등락 (오늘 탭 내 자산과 같은 계산). 원, 달러 모두 정수로
  const heldToday = t => { const q = DALI_SYMS[t.sym] || {}, n = parseFloat(t.qty) || 0, v = q.app === "stock" ? n * q.price : (t.pnl / ((t.pct || 1) / 100)) + t.pnl; return Math.round(v * (q.chg || 0) / (100 + (q.chg || 0))); };
  // 일간: 그날 내 종목(보유와 그날 판 것) 실제 뉴스. 종목마다 최근 2건, 누르면 달이 안에서 기사가 열림
  function jnewsHTML(syms, dayLabel) {
    const rows = [];
    let loading = false;
    syms.forEach(sym => {
      const code = DALI_SYMS[sym] && DALI_SYMS[sym].code;
      if (!code || typeof DaliFeed === "undefined") return;
      const c = DaliFeed.getNews(code, () => { if (state.open && state.tab === "journal" && !state.page) render(); });
      if (!c.list) { loading = loading || c.loading; return; }
      c.list.filter(a => a.time.startsWith(dayLabel)).slice(0, 2).forEach(a => rows.push({ sym, a }));
    });
    if (!rows.length) return `<p class="dali-pro-sec dali-jsec">그날 내 종목 뉴스</p><p class="dali-jnews-empty">${loading ? "뉴스를 불러오는 중이에요" : "그날 올라온 뉴스가 없어요"}</p>`;
    return `<p class="dali-pro-sec dali-jsec">그날 내 종목 뉴스</p><ul class="dali-jnews">${rows.map(({ sym, a }) => `
      <li><button type="button" data-article="${a.id}" data-sym="${sym}">
        <i class="dali-jlogo">${sym[0]}${symImg(sym)}</i>
        <span><b>${a.title}</b><small>${sym}, ${a.time.replace(dayLabel + " ", "")}</small></span></button></li>`).join("")}</ul>`;
  }
  function journalHTML() {
    const list = mine(state.trades), held = list.filter(t => !t.sell);
    // 판 날짜가 최근인 것부터 (방금 판 "오늘"은 맨 위)
    const key = t => (t.sell.date === "오늘" ? "99/99" : t.sell.date), closed = list.filter(t => t.sell).sort((a, b) => key(b).localeCompare(key(a)));
    const view = state.jview || "month";
    const inView = view === "day" ? closed.filter(t => jday(t) === J_TODAY) : view === "week" ? closed.filter(t => J_WEEK.includes(jday(t))) : closed;
    const total = inView.reduce((a, t) => a + t.pnl, 0), wins = inView.filter(t => t.pnl > 0).length;
    const group = (title, l, mode) => l.length ? `<p class="dali-pro-sec dali-jsec">${title}</p><ul class="dali-jlist">${l.map(t => tradeRow(t, mode)).join("")}</ul>` : "";
    const tabs = [["day", "일간"], ["week", "주간"], ["month", "월간"]]
      .map(([k, l]) => `<button type="button" class="${view === k ? "on" : ""}" data-act="jview" data-v="${k}">${l}</button>`).join("");
    let head, body, closedTitle, newsBlock = "";
    if (view === "day") {
      const today = held.reduce((a, t) => a + heldToday(t), 0);
      // 시세는 10월 28일 마감 기준이라, 하루 변동은 "어제"로 적음 (오늘 탭 아침과 같은 말)
      head = ["어제 보유 종목 변동", won(today), inView.length ? `오늘 판 ${inView.length}건 ${won(total)}` : "오늘은 아직 판 게 없어요"];
      body = ""; closedTitle = "오늘 판 것";
      newsBlock = jnewsHTML([...new Set([...held, ...inView].map(t => t.sym))], "10월 28일");
    } else if (view === "week") {
      head = ["이번 주 실현 손익", won(total), inView.length ? `판 ${inView.length}번 중 ${wins}번 수익` : "이번 주엔 판 게 없어요"];
      body = jweekHTML(closed); closedTitle = "이번 주에 판 것";
    } else {
      head = ["10월 실현 손익", won(total), `판 ${inView.length}번 중 ${wins}번 수익`];
      body = jcalHTML(closed); closedTitle = "10월에 판 것";
    }
    return `
      <section class="dali-pro-act dali-jhero">
        <p class="dali-pro-act-top"><img src="${FACE}" alt="달이">${head[0]}</p>
        <p class="dali-pro-act-big">${head[1]}</p>
        <h2>${head[2]}</h2>
        <div class="dali-pro-act-btns dali-jseg">${tabs}</div>
      </section>
      ${body}
      ${group("보유 중", held, view)}${group(closedTitle, inView)}${newsBlock}`;
  }

  /* --- 관리 탭 --- */
  // 오늘 할 일: 한 줄짜리. 자동으로 채워지는 건 버튼 없이 조약돌만
  function missionRow(m) {
    const done = state.done[m.id];
    const right = done ? `<span class="dali-check${state.justDone === m.id ? " pop" : ""}">✓</span>`
      : m.auto ? `<span class="dali-reward">+${m.reward}</span>`
      : `<button type="button" class="dali-btn small" data-act="mission" data-id="${m.id}">${m.btn || "하기"}</button>`;
    const tag = m.tag ? `<i class="dali-tag" data-tag="${m.tag}">${m.tag}</i>` : m.auto ? `<i class="dali-tag" data-tag="자동">자동</i>` : "";
    // 아직 안 한 손 미션엔 왜 하는지 보이게 조약돌 보상을 작게 (자동 미션은 오른쪽 알약이 이미 말해 줌)
    const reward = !done && !m.auto ? `<i class="dali-reward-s"><img src="${IMG("rock")}" alt="">+${m.reward}</i>` : "";
    return `
      <div class="dali-row-m${done ? " done" : ""}">
        <img src="${IMG(m.icon)}" alt=""><span>${m.title}${tag || reward ? `<span class="dali-meta">${tag}${reward}</span>` : ""}</span>${right}
      </div>`;
  }
  // 오늘 날짜 짧게: "10월 30일 금"
  function todayLabel() {
    const d = new Date();
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${"일월화수목금토"[d.getDay()]}`;
  }
  // (3) 진행 막대 대신 조약돌 점: 다음 단계까지 필요한 개수만큼 놓고 모은 만큼 채움. 바로 다음 빈 칸만 숨 쉼
  function dotsHTML(s, n) {
    if (!n) return "";
    const total = n.min - s.min, have = state.pebbles - s.min;
    const dots = Array.from({ length: total }, (_, i) => `<i class="${i < have ? "" : i === have ? "empty next" : "empty"}"></i>`).join("");
    return `<span class="dali-dots" aria-label="조약돌 ${have}/${total}">${dots}<small>${have} / ${total}</small></span>`;
  }
  // 달이네 바다: 단계마다 크기와 주변 소품이 바뀜. 해달과 소품은 모두 Fluent 3D 이미지
  function seaHTML() {
    const si = stageAt(state.pebbles), s = DALI_STAGES[si];
    const prop = (n, cls) => `<img class="dali-prop ${cls}" src="${IMG(n)}" alt="">`;
    return `
      <div class="dali-sea st${si}">
        ${prop("sun", "sun")}
        <span class="dali-sea-chip stage"><img src="${IMG(s.icon)}" alt="">${s.name}</span>
        <span class="dali-sea-chip pebble dali-sea-pebbles"><img src="${IMG("rock")}" alt="">조약돌 <b>${state.pebbles}</b></span>
        ${si >= 1 ? prop("coral", "coral") : ""}
        ${si >= 3 ? prop("lotus", "lotus") : ""}
        <div class="dali-wave far"></div>
        <button type="button" class="dali-float" data-act="pet" aria-label="달이 쓰다듬기" style="--s:${s.scale}">
          <span class="dali-ripple"></span>
          <span class="dali-otterbox">
            <img class="dali-body3d" src="${BODY}" alt="">
            ${wearImg("body")}
          </span>
        </button>
        ${si === 0 ? prop("baby_bottle", "bottle") : ""}
        ${si >= 2 ? `<span class="dali-clam">${prop("oyster", "oyster")}${prop("sparkles", "glint")}</span>` : ""}
        ${si >= 3 ? prop("glowing_star", "star") : ""}
        <div class="dali-wave near"></div>
        ${si >= 1 ? `${prop("bubbles", "bub b1")}${prop("bubbles", "bub b2")}` : ""}
        <span class="dali-fx" aria-live="polite"></span>
      </div>`;
  }
  // 다시 그린 뒤 연출: 조약돌이 날아와 안기고, 단계가 오르면 축하
  function playFx() {
    const fx = state.fx, layer = body.querySelector(".dali-fx");
    state.fx = null;
    if (!fx || !layer) return;
    layer.innerHTML = `<img class="dali-fly" src="${IMG("rock")}" alt=""><b class="dali-plus">+${fx.gain}</b>`;
    if (fx.grew) {
      setTimeout(() => {
        layer.insertAdjacentHTML("beforeend", `
          <div class="dali-grew"><img src="${IMG("party_popper")}" alt=""><b>달이가 자랐어요!</b><span>이제 ${stage().gift}</span></div>`);
        body.querySelector(".dali-otterbox")?.classList.add("grow-pop");
      }, 700);
    }
  }
  function pet(btn) {
    const box = btn.querySelector(".dali-otterbox");
    box.classList.remove("squish", "grow-pop"); void box.offsetWidth; box.classList.add("squish");
    const layer = body.querySelector(".dali-fx");
    const h = document.createElement("img");
    h.className = "dali-heart"; h.src = IMG("red_heart"); h.alt = "";
    h.style.left = `${42 + Math.random() * 16}%`;
    layer.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }
  // 관리 탭 첫 화면: 한 화면 안에 다 보이게. 바다, 다음 선물(왜 키우나), 오늘 할 일 3줄(어떻게), 한 문제 한 줄
  function manageHTML() {
    const s = stage(), n = nextStage();
    const todo = DALI_MISSIONS.filter(m => !m.quiz && !m.hidden);
    const doneN = todo.filter(m => state.done[m.id]).length;
    const html = `
      <article class="dali-card grow compact">
        ${seaHTML()}
        <button type="button" class="dali-next" data-act="grow-page">
          <img src="${IMG((n || s).icon)}" alt="">
          <span><small>${n ? `조약돌 ${n.min - state.pebbles}개 더 모으면 달이가 주는 선물` : "다 자란 달이가 주는 선물"}</small><b>${n ? n.gift : s.gift}</b>
            ${dotsHTML(s, n)}</span>
          <em>›</em>
        </button>
      </article>
      <article class="dali-card todo">
        <h3>오늘 달이랑 <span class="dali-todo-cnt">${doneN}/${todo.length} 완료</span><span class="dali-todo-date">${todayLabel()}</span></h3>
        ${todo.map(missionRow).join("")}
      </article>`;
    state.justDone = null; // 체크 톡 연출은 한 번만
    return html;
  }
  // 달이 키우기 자세히 (관리 탭의 다음 선물 줄을 누르면): 단계별 선물, 숲, 옷장
  function growPage() {
    const s = stage(), n = nextStage(), si = stageAt(state.pebbles);
    const p = n ? Math.round((state.pebbles - s.min) / (n.min - s.min) * 100) : 100;
    return `
      <header class="dali-page-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button><strong>달이 키우기</strong></header>
      <div class="dali-page-body">
      <article class="dali-card grow">
        <div class="dali-ghero">
          <span class="dali-gotter"><img src="${BODY}" alt="">${wearImg("body")}</span>
          <div><small>지금 달이</small><b>${s.name}</b>
            <span>${n ? `조약돌 ${n.min - state.pebbles}개 더 모으면 ${n.name}` : "다 자랐어요. 해 줄 수 있는 걸 다 열었어요"}</span>
            ${n ? `<i class="dali-bar"><i style="width:${p}%"></i></i>` : ""}</div>
        </div>
        <p class="dali-gsec">자랄수록 달이가 해 주는 일</p>
        <ol class="dali-ladder">${DALI_STAGES.map((x, i) => {
          const cls = i < si ? "past" : i === si ? "now" : i === si + 1 ? "next" : "lock";
          // 한 달 습관 리포트 단계에 닿았으면 미리보기 대신 리포트 화면(dali-report.js)으로
          const report = i <= si && x.gift === "한 달 습관 리포트" && window.DaliReport;
          // 주간 돌아보기 카드 단계에 닿았으면 미리보기 대신 이번 주 화면(dali-week.js)으로
          const week = i <= si && x.gift === "주간 돌아보기 카드" && window.DaliWeek;
          const right = report ? `<button type="button" class="dali-link" data-act="report">열기</button>`
            : week ? `<button type="button" class="dali-link" data-act="week">열기</button>`
            : i <= si ? `<button type="button" class="dali-link" data-act="gift" data-i="${i}">${state.gift === i ? "접기" : "열기"}</button>`
            : `<span class="dali-left">${i === si + 1 ? `${x.min - state.pebbles}개 더` : `조약돌 ${x.min}`}</span>`;
          return `
          <li class="${cls}">
            <img src="${IMG(x.icon)}" alt="">
            <div><small>${x.name}</small><b>${x.gift}</b></div>
            ${right}
            ${state.gift === i ? `<p class="dali-say">${x.preview}</p>` : ""}
          </li>`;
        }).join("")}</ol>
        <p class="dali-gsec">옷장</p>
        <div class="dali-closet">${DALI_WEARS.map(w => {
          const open = si >= w.stage;
          return `<button type="button" class="${state.wear === w.id ? "on" : ""}" data-act="wear" data-id="${w.id}" ${open ? "" : "disabled"}>
            <img src="${IMG(w.id)}" alt=""><small>${open ? w.name : DALI_STAGES[w.stage].name.replace(" 달이", "") + "에 열려요"}</small></button>`;
        }).join("")}</div>
      </article>
      <article class="dali-card forest">
        <h3>달이네 숲 <small class="dali-left">${state.forest}%</small></h3>
        <div class="dali-trees" aria-label="달이네 숲 ${state.forest}% 찼어요">${Array.from({ length: 10 }, (_, i) => `<span class="${i < Math.floor(state.forest / 10) ? "on" : ""}"><img src="${IMG("tree")}" alt=""></span>`).join("")}</div>
        <p class="dali-hint">${state.forest >= 100 ? "다 찼어요. 노을공원에 홍길동님 이름으로 나무 한 그루를 심어요" : "다 차면 노을공원에 진짜 나무 한 그루를 심어요"}</p>
      </article>
      </div>`;
  }

  /* --- 읽기 화면 맨 위 띠: 오늘 탭 히어로와 같은 틀. 숫자 하나(그 소식에 걸린 내 자산, 관심 종목은 등락), AI 요약 한 줄.
     가격은 오늘 탭과 같은 장면 시각(daliPro.sc)으로 읽어서 두 탭의 숫자가 어긋나지 않게 --- */
  function readBand(sym, time, why) {
    const s = DALI_SYMS[sym], R = typeof DaliRules !== "undefined" ? DaliRules : null, sc = window.daliPro ? window.daliPro.sc : "morning";
    const stock = s.app === "stock" && R, now = stock ? R.nowPrice(sym, sc) : s.price, chg = stock ? R.todayPct(sym, sc) : s.chg;
    let top = `${DALI_NAME(sym)} 관심`, big = pct(chg);
    const p = s.app === "stock" && typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER.positions.find(x => x.sym === sym) : null;
    const t = s.app === "fut" && typeof DALI_TRADES !== "undefined" ? DALI_TRADES.find(x => x.sym === sym && !x.sell) : null;
    if (p) { top = `${sym} ${p.qty}주`; big = won(p.qty * now * chg / (100 + chg), "stock"); }
    else if (t) { top = `${DALI_NAME(sym)} ${t.qty.replace(/^\S+\s/, "")}`; big = won(t.pnl, "fut"); }
    return `<div class="dali-pro dali-read"><section class="dali-pro-act dali-read-act">
        <p class="dali-pro-act-top"><i class="dali-pro-logo">${sym[0]}${symImg(sym)}</i>${top}<span>${time}</span></p>
        <p class="dali-pro-act-big">${big}</p>
        ${why ? `<h2>${why}</h2>` : ""}
      </section></div>`;
  }
  const readHead = sym => `<header class="dali-page-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button>
        <button type="button" class="dali-symlink" data-act="order" data-sym="${sym}">${DALI_NAME(sym)} 주문<span class="dali-go">›</span></button></header>`;

  /* --- 뉴스 읽기 화면 (오른쪽 위 "주문"을 누르면 주문창) --- */
  function newsPage(id) {
    const n = state.news.find(x => x.id === id), txt = DALI_NEWS_TEXT[id];
    return `
      ${readHead(n.sym)}
      <div class="dali-page-body">
        ${readBand(n.sym, n.time, n.why)}
        <article class="dali-article"><h3>${txt.title}</h3><p class="dali-hint">${n.time}</p><p>${txt.body}</p></article>
        ${feedHTML(n.sym, n.id)}
      </div>`;
  }

  /* --- 실제 기사 읽기 화면 (종목 화면 뉴스 탭에서 누른 기사. 달이 안에서 본문을 보여 주고 밖으로 내보내지 않음) --- */
  function articlePage(p) {
    const a = DaliFeed.article(DALI_SYMS[p.sym].code, p.id);
    // 목록을 다시 받는 사이 기사가 빠졌으면(2주 지나 정리됨) 안내만 두고 목록은 그대로 보여 줌
    const article = a ? `
        <article class="dali-article"><h3>${a.title}</h3><p class="dali-hint">${a.author ? `${a.author} · ` : ""}${a.time}</p>
          ${a.body.map(t => `<p>${t}</p>`).join("")}
          ${a.full ? "" : `<p class="dali-hint">본문은 아직 받지 못해 앞부분만 보여 줘요.</p>`}</article>`
      : `<p class="dali-hint center dali-feed-empty">이 기사는 더 이상 볼 수 없어요. 아래에서 다른 기사를 골라 보세요.</p>`;
    const latest = state.news.find(x => x.sym === p.sym);
    return `
      ${readHead(p.sym)}
      <div class="dali-page-body">
        ${readBand(p.sym, a ? a.time : "", latest ? latest.why : "")}
        ${article}
        ${feedHTML(p.sym, p.id)}
      </div>`;
  }

  /* --- 종목 화면 아래 뉴스, 공시 탭 (날짜 | 제목과 한 줄) ---
     종목코드가 있는 주식은 뉴스와 공시 모두 실제 데이터(dali-feed.js). 코드가 없는 선물은 달이 가상 뉴스만 */
  function feedHTML(sym, currentId) {
    const code = DALI_SYMS[sym].code;
    const sub = code && state.page.sub === "disc" ? "disc" : "news";
    const tabs = code ? [["news", "뉴스"], ["disc", "공시"]] : [["news", "뉴스"]];
    return `
      <nav class="dali-subtabs">${tabs.map(([k, l]) => `<button type="button" data-act="sub" data-v="${k}" class="${sub === k ? "on" : ""}">${l}</button>`).join("")}</nav>
      ${sub === "disc" ? discList(code) : code ? newsList(sym, code, currentId) : symNewsList(sym, currentId)}`;
  }
  function symNewsList(sym, currentId) {
    return `<div class="dali-feed">${state.news.filter(x => x.sym === sym).map(x => `
      <button type="button" class="dali-feed-row${x.id === currentId ? " on" : ""}" data-news="${x.id}"><span class="dali-feed-date">${x.time}</span>
        <span><b>${DALI_NEWS_TEXT[x.id].title}</b><small>${x.why}</small></span></button>`).join("")}</div>`;
  }
  function newsList(sym, code, currentId) {
    const c = DaliFeed.getNews(code, () => { if (state.page) render(); });
    if (!c.list) return `<p class="dali-hint center dali-feed-empty">${c.loading ? "뉴스를 불러오는 중이에요." : "지금은 뉴스를 불러오지 못했어요."}</p>`;
    if (!c.list.length) return `<p class="dali-hint center dali-feed-empty">최근 2주 동안 올라온 뉴스가 없어요.</p>`;
    return `<div class="dali-feed">${c.list.map(a => `
      <button type="button" class="dali-feed-row${a.id === currentId ? " on" : ""}" data-article="${a.id}" data-sym="${sym}"><span class="dali-feed-date">${a.date}</span>
        <span><b>${a.title}</b><small>${a.author ? `${a.author} · ` : ""}${a.sub}</small></span></button>`).join("")}</div>`;
  }
  function discList(code) {
    const c = DaliFeed.get(code, () => { if (state.page) render(); });
    if (!c.list) return `<p class="dali-hint center dali-feed-empty">${c.loading ? "공시를 불러오는 중이에요." : "지금은 공시를 불러오지 못했어요."}</p>`;
    if (!c.list.length) return `<p class="dali-hint center dali-feed-empty">최근 1년 동안 올라온 공시가 없어요.</p>`;
    return `<div class="dali-feed">${c.list.map(d => `
      <a class="dali-feed-row" href="${d.url}" target="_blank" rel="noopener"><span class="dali-feed-date">${d.date}</span>
        <span><b>${d.title}</b><small>${d.sub}</small></span></a>`).join("")}</div>
      <p class="dali-hint">출처: 금융감독원 전자공시(DART). 누르면 원문이 열려요.</p>`;
  }

  /* --- MTS 종목 주문 화면 (달이 밖, 앱의 주문 화면으로 이동) --- */
  const mts = document.createElement("section");
  mts.className = "dali-mts";
  mts.setAttribute("aria-label", "종목 주문 화면");
  mts.inert = true;
  phone.appendChild(mts);
  const tick = sym => {
    const p = DALI_SYMS[sym].price;
    if (DALI_SYMS[sym].app === "fut") return p > 10000 ? 0.25 : p > 1000 ? 0.1 : 0.01;
    // 한국거래소 호가 단위
    return p >= 500000 ? 1000 : p >= 200000 ? 500 : p >= 50000 ? 100 : p >= 20000 ? 50 : 10;
  };
  const fmt = (sym, v) => {
    if (DALI_SYMS[sym].app !== "fut") return Math.round(v).toLocaleString("ko-KR");
    const d = String(tick(sym)).split(".")[1]?.length || 0;
    return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  function mtsHTML(o) {
    const s = DALI_SYMS[o.sym], t = tick(o.sym);
    const vols = [312, 845, 1204, 530, 978, 1460, 702, 1133, 655, 420];
    const rows = [5, 4, 3, 2, 1, 0, -1, -2, -3, -4].map((k, i) =>
      `<tr class="${k > 0 ? "ask" : "bid"}${k === 0 ? " now" : ""}"><td>${k > 0 ? vols[i].toLocaleString() : ""}</td><td>${fmt(o.sym, s.price + k * t)}</td><td>${k <= 0 ? vols[i].toLocaleString() : ""}</td></tr>`).join("");
    const unit = s.app === "fut" ? "계약" : "주";
    return `
      <header class="dali-mts-head"><button type="button" class="dali-back" data-mts="back" aria-label="뒤로">‹</button>
        <div><strong>${o.sym}</strong><small>${DALI_APPS[s.app].name} 주문</small></div></header>
      <div class="dali-mts-price">${quote(o.sym)}</div>
      <nav class="dali-mts-tabs">${["매수", "매도", "정정/취소", "체결"].map(x => `<button type="button" data-mts="side" data-v="${x}" class="${o.side === x ? "on " + (x === "매수" ? "buy" : "sell") : ""}">${x}</button>`).join("")}</nav>
      <div class="dali-mts-body">
        <table class="dali-hoga" aria-label="호가"><tbody>${rows}</tbody></table>
        <div class="dali-mts-form">
          <label>주문 유형<span class="dali-field">시장가</span></label>
          <label>수량<span class="dali-field qty"><button type="button" data-mts="qty" data-v="-1" aria-label="수량 줄이기">−</button><b>${o.qty}</b><button type="button" data-mts="qty" data-v="1" aria-label="수량 늘리기">+</button></span></label>
          <label>주문 가격<span class="dali-field">${priceText(o.sym)}</span></label>
          <p class="dali-hint">${o.qty}${unit}</p>
        </div>
      </div>
      <div class="dali-mts-foot"><button type="button" class="dali-btn wide ${o.side === "매도" ? "sell" : "buy"}" data-mts="fill">${o.side === "매도" ? "매도" : "매수"}</button></div>`;
  }
  function renderMts() {
    if (!state.order) { mts.classList.remove("open"); mts.inert = true; syncOrdering(); return; }
    mts.innerHTML = mtsHTML(state.order);
    mts.classList.add("open");
    mts.inert = false;
    syncOrdering();
  }
  // 주문 화면(달이 주문 화면이나 MTS의 #order)에서는 달이를 숨김
  function syncOrdering() {
    phone.classList.toggle("dali-ordering", !!state.order || /^#order/.test(location.hash));
  }
  window.addEventListener("hashchange", syncOrdering);
  function openNews(id) {
    const n = state.news.find(x => x.id === id);
    if (isFlag(n) && !n.seen) { n.seen = true; complete("m-alert"); paintAlert(); }
    state.page = { type: "news", id };
    render();
  }
  function openOrder(sym) {
    if (window.DALI_ORDER && appOf(sym) === state.app) { if (state.open) close(); bubble.classList.remove("show"); window.DALI_ORDER(sym); return; }
    if (state.open) close();
    bubble.classList.remove("show");
    state.order = { sym, side: "매수", qty: 1 };
    renderMts();
  }
  function record(sym, qtyText, side) {
    const s = DALI_SYMS[sym];
    const latest = state.news.find(n => n.sym === sym);
    const ctx = {
      date: "오늘",
      news: latest ? latest.why : "특별한 소식 없음",
      mood: latest && isFlag(latest) ? "큰 소식이 나온 직후" : "평소와 비슷한 날",
    };
    const openTrade = state.trades.find(t => t.sym === sym && !t.sell);
    if (side === "매도" && openTrade) { openTrade.sell = ctx; openTrade.live = true; }
    else state.trades.unshift({ id: "live" + Date.now(), app: s.app, sym, qty: qtyText, buy: ctx, sell: null, pnl: 0, pct: 0, memo: "", live: true });
    state.tab = "journal";
    fab.classList.add("pulse"); setTimeout(() => fab.classList.remove("pulse"), 1200);
    say(`${sym} ${qtyText} 체결됐어요. 그때 상황을 일지에 적어 뒀어요.`);
    render();
  }
  function fill() {
    const o = state.order, s = DALI_SYMS[o.sym];
    const latest = state.news.find(n => n.sym === o.sym);
    const ctx = {
      date: "오늘",
      news: latest ? latest.why : "특별한 소식 없음",
      mood: latest && isFlag(latest) ? "큰 소식이 나온 직후" : "평소와 비슷한 날",
    };
    const unit = s.app === "fut" ? "계약" : "주";
    const openTrade = state.trades.find(t => t.sym === o.sym && !t.sell);
    if (o.side === "매도" && openTrade) { openTrade.sell = ctx; openTrade.live = true; }
    else state.trades.unshift({ id: "live" + Date.now(), app: s.app, sym: o.sym, qty: o.qty + unit, buy: ctx, sell: null, pnl: 0, pct: 0, memo: "", live: true });
    state.order = null;
    state.tab = "journal";
    renderMts();
    fab.classList.add("pulse"); setTimeout(() => fab.classList.remove("pulse"), 1200);
    say(`${o.sym} ${o.qty}${unit} ${o.side} 주문이 체결됐어요. 그때 상황을 일지에 적어 뒀어요.`);
  }
  mts.addEventListener("click", e => {
    const b = e.target.closest("[data-mts]");
    if (!b) return;
    const k = b.dataset.mts;
    if (k === "back") { state.order = null; renderMts(); }
    else if (k === "side") { if (["매수", "매도"].includes(b.dataset.v)) { state.order.side = b.dataset.v; renderMts(); } }
    else if (k === "qty") { state.order.qty = Math.max(1, state.order.qty + +b.dataset.v); renderMts(); }
    else if (k === "fill") fill();
  });

  function render() {
    saveShared();
    sheet.querySelector(".dali-where").textContent = `${DALI_APPS[state.app].name} 앱에서`;
    sheet.querySelector(".dali-pebbles").textContent = `조약돌 ${state.pebbles}`;
    sheet.querySelectorAll(".dali-tabs button").forEach(b => {
      const on = b.dataset.tab === state.tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    const views = { news: newsHTML, journal: journalHTML, manage: manageHTML };
    body.innerHTML = views[state.tab]();
    if (state.tab === "manage") playFx();
    else if (state.fx && !state.fx.grew) state.fx = null;
    if (state.page) {
      // 같은 화면을 다시 그릴 때(뉴스, 공시 탭 전환, 공시 도착)는 스크롤 위치를 지킴
      const key = ["grow", "report", "week"].includes(state.page.type) ? state.page.type : state.page.id;
      const same = !pageEl.hidden && pageEl.dataset.id === key;
      const y = same ? pageEl.querySelector(".dali-page-body")?.scrollTop || 0 : 0;
      pageEl.innerHTML = state.page.type === "grow" ? growPage() : state.page.type === "report" ? DaliReport.page()
        : state.page.type === "week" ? DaliWeek.page() : state.page.type === "article" ? articlePage(state.page) : newsPage(state.page.id);
      pageEl.dataset.id = key;
      const pb = pageEl.querySelector(".dali-page-body");
      if (pb) pb.scrollTop = y;
      pageEl.hidden = false;
    } else pageEl.hidden = true;
    paintAlert();
  }

  /* --- 이벤트 --- */
  fab.addEventListener("click", () => (state.open ? close() : open(unseenFlags() ? "news" : null)));
  dim.addEventListener("click", close);
  sheet.querySelector(".dali-close").addEventListener("click", close);
  sheet.querySelector(".dali-tabs").addEventListener("click", e => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    state.tab = b.dataset.tab;
    state.page = null;
    if (state.tab === "journal" && mine(state.trades).length) complete("m-remind");
    render();
  });
  sheet.addEventListener("click", e => {
    const row = e.target.closest("[data-news]");
    if (row) { openNews(row.dataset.news); return; }
    const art = e.target.closest("[data-article]");
    if (art) {
      // 기사 화면에서 다른 기사를 누르면 같은 자리에서 바꾸고, 뒤로 가면 처음 들어온 화면으로
      const from = state.page?.type === "article" ? state.page.from : state.page;
      state.page = { type: "article", sym: art.dataset.sym, id: art.dataset.article, from };
      render();
      return;
    }
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const act = b.dataset.act, id = b.dataset.id;
    const t = id && state.trades.find(x => x.id === id);
    if (act === "back") { state.page = state.page?.from || null; render(); }
    else if (act === "sub") { state.page.sub = b.dataset.v; render(); }
    else if (act === "order") openOrder(b.dataset.sym);
    else if (act === "wear") { state.wear = state.wear === id ? null : id; syncWear(); render(); }
    else if (act === "trade") { state.openTrade = state.openTrade === id ? null : id; render(); }
    else if (act === "jview") { state.jview = b.dataset.v; state.openTrade = null; render(); }
    else if (act === "jday") { state.openTrade = id; render(); sheet.querySelector(".dali-jrow.open")?.scrollIntoView({ block: "center", behavior: "smooth" }); }
    else if (act === "grow-page") { state.page = { type: "grow" }; render(); }
    else if (act === "report") { state.page = { type: "report", from: state.page }; render(); }
    else if (act === "week") { state.page = { type: "week", from: state.page }; render(); }
    else if (act === "gift") { const i = +b.dataset.i; state.gift = state.gift === i ? null : i; render(); }
    else if (act === "pet") pet(b);
    else if (act === "mission") { complete(id); render(); }
  });
  sheet.addEventListener("pointermove", DaliChart.hover);
  sheet.addEventListener("pointerleave", () => DaliChart.unhover(sheet));
  fut.addEventListener("click", e => {
    const b = e.target.closest("[data-sym]");
    if (b) openOrder(b.dataset.sym);
  });

  /* --- 발표자용 시연 버튼 (휴대폰 화면 밖) --- */
  const demo = document.createElement("aside");
  demo.className = "dali-demo";
  demo.innerHTML = `
    <p class="dali-demo-title">발표자용 시연 버튼</p>
    <p class="dali-demo-note">시연용 가상 화면입니다</p>
    <div class="dali-demo-apps"><button type="button" data-app="stock" class="${state.app === "stock" ? "on" : ""}">유진투자증권</button><button type="button" data-app="fut" class="${state.app === "fut" ? "on" : ""}">유진투자선물</button></div>
    <button type="button" data-demo="alert">의미 있는 뉴스 도착</button>
    <button type="button" data-demo="pebble">조약돌 3개 주기</button>
    <button type="button" data-demo="reset" class="ghost">처음으로</button>`;
  document.body.appendChild(demo);

  function setApp(app) {
    // 두 앱 페이지는 저장소 맨 위에 있음. 어느 화면에서 눌러도 맞게 이 파일 위치 기준으로 찾음
    const onFut = location.pathname.endsWith("/futures.html");
    if ((app === "fut") !== onFut) { const url = new URL(app === "fut" ? "../../futures.html" : "../../index.html", BASE).href; window.goPage ? window.goPage(url) : (location.href = url); return; }
    state.app = app;
    state.page = null;
    state.order = null;
    renderMts();
    fut.classList.toggle("show", app === "fut");
    demo.querySelectorAll("[data-app]").forEach(b => b.classList.toggle("on", b.dataset.app === app));
    say(app === "fut" ? "선물 앱에서도 달이예요. 여기선 선물 종목만 따라가요." : "증권 앱으로 왔어요. 여기선 주식만 따라가요.");
    render();
  }
  function alertNews() {
    const n = { ...DALI_ALERT_NEWS[state.app] };
    if (state.news.some(x => x.id === n.id)) { say("이 소식은 이미 알려 줬어요."); return; }
    state.news.unshift(n);
    paintAlert();
    if (state.spoke) { fab.classList.add("pulse"); setTimeout(() => fab.classList.remove("pulse"), 1200); }
    else sayOnce(`${n.sym}에 큰 소식이 있어요. 궁금하면 눌러 보세요.`);
    if (state.open) render();
  }
  demo.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.app) setApp(b.dataset.app);
    else if (b.dataset.demo === "alert") alertNews();
    else if (b.dataset.demo === "pebble") { gain(3); open("manage"); }
    else if (b.dataset.demo === "reset") { try { localStorage.removeItem("dali-shared"); } catch (e) { /* 무시 */ } location.reload(); }
  });

  window.dali = { open, close, openNews, openOrder, setApp, alertNews, record };

  render();
  syncOrdering();
  setTimeout(() => sayOnce("좋은 아침이에요! 따라가는 종목에 확인할 소식이 있어요."), 800);
})();
