/* ---------- 달이: 화면 우측 하단에 늘 떠 있는 AI 비서 ----------
   관심종목과 보유 종목을 자동으로 추적해 뉴스와 등락을 보여 주고,
   매매일지를 알아서 쓰고, 미션으로 해달을 키운다. 앱마다 그 앱의 종목만 다룬다.
   index.html에서 main.js 다음에 불러옵니다. */
(function () {
  const phone = document.querySelector(".phone");
  if (!phone) return;

  const FACE = "features/dali/dali-otter.png";
  const state = {
    app: "stock",
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
    scarf: false,
    editing: null,
    order: null, // { sym, side, qty } MTS 주문 화면
  };

  const isFlag = n => DALI_FLAG_TYPES.includes(n.type);
  const appOf = sym => DALI_SYMS[sym].app;
  const mine = list => list.filter(x => appOf(x.sym) === state.app);
  const josa = (w, a, b) => {
    const c = w.charCodeAt(w.length - 1) - 0xac00;
    return w + (c >= 0 && c <= 11171 && c % 28 ? a : b);
  };
  const won = n => `${n > 0 ? "+" : ""}${Math.round(n).toLocaleString("ko-KR")}원`;
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const priceText = sym => {
    const s = DALI_SYMS[sym];
    return s.app === "fut" ? s.price.toLocaleString("en-US") : `${s.price.toLocaleString("ko-KR")}원`;
  };
  const quote = sym => `<span class="dali-quote ${tone(DALI_SYMS[sym].chg)}">${priceText(sym)} <b>${pct(DALI_SYMS[sym].chg)}</b></span>`;
  const stage = () => [...DALI_STAGES].reverse().find(s => state.pebbles >= s.min);
  const nextStage = () => DALI_STAGES.find(s => s.min > state.pebbles);
  const kindLabel = sym => (DALI_SYMS[sym].kind === "hold" ? "보유" : "관심");

  /* --- 화면 요소 --- */
  const fut = document.createElement("section");
  fut.className = "dali-fut";
  fut.setAttribute("aria-label", "유진투자선물 시연 화면");
  fut.innerHTML = `
    <div class="demo-band">시연용 가상 화면</div>
    <header class="dali-fut-head"><strong>유진투자선물</strong><span>홍길동님</span></header>
    <nav class="dali-fut-tabs"><button class="on" type="button">해외선물</button><button type="button">국내선물</button><button type="button">야간</button><button type="button">옵션</button></nav>
    <ul class="dali-fut-list">
      ${Object.keys(DALI_SYMS).filter(s => appOf(s) === "fut").map(s => `
        <li><button type="button" data-sym="${s}"><span><b>${s}</b><small>${kindLabel(s)}</small></span>${quote(s)}</button></li>`).join("")}
    </ul>
    <p class="dali-fut-note">시세는 시연용 가상 숫자입니다.</p>`;

  const dim = document.createElement("div");
  dim.className = "dali-dim";

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "dali-fab";
  fab.setAttribute("aria-label", "달이 열기");
  fab.innerHTML = `<img src="${FACE}" alt=""><span class="dali-alert" aria-hidden="true">!</span>`;

  const bubble = document.createElement("div");
  bubble.className = "dali-bubble";
  bubble.setAttribute("role", "status");

  const sheet = document.createElement("section");
  sheet.className = "dali-sheet";
  sheet.setAttribute("aria-label", "달이");
  sheet.inert = true;
  sheet.innerHTML = `
    <header class="dali-sheet-head">
      <img src="${FACE}" alt="">
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
  function complete(id) {
    if (state.done[id]) return;
    const m = DALI_MISSIONS.find(x => x.id === id);
    state.done[id] = true;
    state.pebbles += m.reward;
    state.forest = Math.min(100, state.forest + m.reward * 2);
    say(`조약돌 ${m.reward}개! ${m.title.replace(" (안 해도 괜찮아요)", "")}`);
  }

  /* --- 열고 닫기 --- */
  function open(tab) {
    if (tab) state.tab = tab;
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

  /* --- 뉴스 탭: 종목, 등락, 왜? --- */
  function newsRow(n) {
    const flag = isFlag(n);
    return `
      <button type="button" class="dali-news${flag && !n.seen ? " unseen" : ""}" data-news="${n.id}">
        <span class="dali-news-top">${flag ? `<span class="dali-bang">!</span>` : ""}<b>${n.sym}</b>${quote(n.sym)}<span class="dali-time">${n.time}</span></span>
        <span class="dali-why"><em>왜?</em> ${n.why}</span>
      </button>`;
  }
  function newsHTML() {
    const list = mine(state.news);
    const sorted = [...list.filter(isFlag), ...list.filter(n => !isFlag(n))];
    const tracked = Object.keys(DALI_SYMS).filter(s => appOf(s) === state.app);
    return `
      <div class="dali-track"><span>자동 추적 중</span>${tracked.map(s => `<i class="${DALI_SYMS[s].kind}">${s}</i>`).join("")}</div>` +
      sorted.map(newsRow).join("") +
      `<p class="dali-hint center">관심종목에 넣으면 달이가 알아서 따라가요. 느낌표는 공시, 실적, 큰 변동일 때만.</p>`;
  }

  /* --- 매매일지 탭: 얼마 벌었나, 살 때, 팔 때, 메모 --- */
  function tradeCard(t) {
    const closed = !!t.sell;
    const editing = state.editing === t.id;
    const side = (label, x) => `
      <div class="dali-side-box"><p class="dali-side-label">${label} <span>${x ? x.date : ""}</span></p>
        ${x ? `<p>${x.news}</p><p class="dali-mood">${x.mood}</p>` : `<p class="dali-mood">아직 보유 중</p>`}</div>`;
    const memo = editing
      ? `<textarea class="dali-input" rows="2" placeholder="그때 왜 그랬는지, 지금 생각은 어떤지 (안 써도 돼요)">${t.memo}</textarea>
         <div class="dali-row"><button type="button" class="dali-btn small" data-act="save" data-id="${t.id}">저장</button><button type="button" class="dali-btn small ghost" data-act="cancel">닫기</button></div>`
      : t.memo
        ? `<p class="dali-mine">메모: ${t.memo} <button type="button" class="dali-link" data-act="edit" data-id="${t.id}">고치기</button></p>`
        : `<button type="button" class="dali-link" data-act="edit" data-id="${t.id}">메모 남기기 (선택)</button>`;
    return `
      <article class="dali-trade${t.live ? " new" : ""}">
        <header><b>${t.sym}</b><span>${t.qty}</span><span class="dali-state ${closed ? "done" : "hold"}">${closed ? "매매 완료" : "보유 중"}</span></header>
        <p class="dali-pnl ${tone(t.pnl)}">${closed ? "" : "<small>지금 평가</small> "}${won(t.pnl)} <span>${pct(t.pct)}</span></p>
        <div class="dali-sides">${side("살 때", t.buy)}${side("팔 때", t.sell)}</div>
        ${memo}
        <button type="button" class="dali-link pb" data-act="pb" data-id="${t.id}">${t.pb ? "담당 PB와 공유 중" : "담당 PB에게 보여 주기 (동의 시)"}</button>
      </article>`;
  }
  function journalHTML() {
    const list = mine(state.trades);
    const closed = list.filter(t => t.sell);
    const total = closed.reduce((a, t) => a + t.pnl, 0);
    return `
      <div class="dali-sum"><span>이번 달 실현 손익</span><b class="${tone(total)}">${won(total)}</b><small>매매 완료 ${closed.length}건, 보유 ${list.length - closed.length}건</small></div>
      <p class="dali-hint">살 때와 팔 때의 뉴스, 분위기는 달이가 알아서 적어요. 메모는 쓰고 싶을 때만.</p>` +
      list.map(tradeCard).join("");
  }

  /* --- 관리 탭 --- */
  function missionRow(m) {
    const done = state.done[m.id];
    let action = "";
    if (m.quiz && !done) {
      action = `<p class="dali-q">${m.quiz.q}</p>` + m.quiz.options.map((o, i) =>
        `<button type="button" class="dali-opt${state.quiz[m.id] === i ? " wrong" : ""}" data-act="quiz" data-id="${m.id}" data-i="${i}">${o}</button>`).join("");
    } else if (m.quiz && done) action = `<p class="dali-say">${m.quiz.after}</p>`;
    else if (!m.auto && !done) action = `<button type="button" class="dali-btn small" data-act="mission" data-id="${m.id}">하기</button>`;
    return `
      <div class="dali-mission${done ? " done" : ""}">
        <div class="dali-mission-top"><span>${done ? "✓ " : ""}${m.title}</span><span class="dali-reward">조약돌 ${m.reward}</span></div>
        ${m.note ? `<p class="dali-hint">${m.note}</p>` : ""}
        ${action}
      </div>`;
  }
  function manageHTML() {
    const s = stage(), n = nextStage();
    const p = n ? Math.round((state.pebbles - s.min) / (n.min - s.min) * 100) : 100;
    const groups = [...new Set(DALI_MISSIONS.map(m => m.group))];
    return `
      <article class="dali-card grow">
        <div class="dali-otter${state.scarf ? " scarf" : ""}"><img src="${FACE}" alt="달이"></div>
        <h3>${s.name}</h3><p>${s.note}</p>
        <div class="dali-bar"><span style="width:${p}%"></span></div>
        <p class="dali-hint">${n ? `조약돌 ${n.min - state.pebbles}개 더 모으면 ${n.name}` : "다 자랐어요"}</p>
        <button type="button" class="dali-btn small ghost" data-act="scarf">${state.scarf ? "목도리 벗기" : "빨간 목도리 입히기"}</button>
      </article>
      <article class="dali-card forest">
        <h3>유진의 숲</h3>
        <p>모두의 조약돌이 다 차면 노을공원에 진짜 나무 한 그루를 심어요.</p>
        <div class="dali-bar green"><span style="width:${state.forest}%"></span></div>
        <p class="dali-hint">이번 달 ${state.forest}% 찼어요</p>
      </article>
      ${groups.map(g => `<article class="dali-card"><h3>${g}</h3>${DALI_MISSIONS.filter(m => m.group === g).map(missionRow).join("")}</article>`).join("")}
      <p class="dali-hint center">조약돌은 읽고, 돌아보고, 배울 때만 받아요. 거래로는 받지 않아요.</p>`;
  }

  /* --- 뉴스 읽기 화면 (헤더의 종목 이름을 누르면 주문창) --- */
  function newsPage(id) {
    const n = state.news.find(x => x.id === id), txt = DALI_NEWS_TEXT[id];
    return `
      <header class="dali-page-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button>
        <button type="button" class="dali-symlink" data-act="order" data-sym="${n.sym}">${n.sym} ${quote(n.sym)}<span class="dali-go">주문 ›</span></button></header>
      <div class="dali-page-body">
        <div class="dali-ctx"><p><em>왜?</em> ${n.why}</p></div>
        <article class="dali-article"><h3>${txt.title}</h3><p class="dali-hint">가상 뉴스, ${n.time}</p><p>${txt.body}</p></article>
      </div>`;
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
    return p >= 200000 ? 500 : 100;
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
      <div class="demo-band">시연용 가상 화면</div>
      <header class="dali-mts-head"><button type="button" class="dali-back" data-mts="back" aria-label="뒤로">‹</button>
        <div><strong>${o.sym}</strong><small>${DALI_APPS[s.app].name} 주문</small></div></header>
      <div class="dali-mts-price">${quote(o.sym)}</div>
      <nav class="dali-mts-tabs">${["매수", "매도", "정정/취소", "체결"].map(x => `<button type="button" data-mts="side" data-v="${x}" class="${o.side === x ? "on " + (x === "매수" ? "buy" : "sell") : ""}">${x}</button>`).join("")}</nav>
      <div class="dali-mts-body">
        <table class="dali-hoga" aria-label="호가 (가상)"><tbody>${rows}</tbody></table>
        <div class="dali-mts-form">
          <label>주문 유형<span class="dali-field">시장가</span></label>
          <label>수량<span class="dali-field qty"><button type="button" data-mts="qty" data-v="-1" aria-label="수량 줄이기">−</button><b>${o.qty}</b><button type="button" data-mts="qty" data-v="1" aria-label="수량 늘리기">+</button></span></label>
          <label>주문 가격<span class="dali-field">${priceText(o.sym)}</span></label>
          <p class="dali-hint">${o.qty}${unit}, 시세와 호가는 가상</p>
        </div>
      </div>
      <div class="dali-mts-foot"><button type="button" class="dali-btn wide ${o.side === "매도" ? "sell" : "buy"}" data-mts="fill">${o.side === "매도" ? "매도" : "매수"}</button></div>`;
  }
  function renderMts() {
    if (!state.order) { mts.classList.remove("open"); mts.inert = true; phone.classList.remove("dali-ordering"); return; }
    mts.innerHTML = mtsHTML(state.order);
    mts.classList.add("open");
    mts.inert = false;
    phone.classList.add("dali-ordering");
  }
  function openNews(id) {
    const n = state.news.find(x => x.id === id);
    if (isFlag(n) && !n.seen) { n.seen = true; complete("m-alert"); paintAlert(); }
    state.page = { type: "news", id };
    render();
  }
  function openOrder(sym) {
    if (state.open) close();
    bubble.classList.remove("show");
    state.order = { sym, side: "매수", qty: 1 };
    renderMts();
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
    say(`${o.sym} ${o.qty}${unit} ${o.side} 주문이 접수됐어요 (가상). 그때 상황을 일지에 적어 뒀어요.`);
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
    sheet.querySelector(".dali-where").textContent = `${DALI_APPS[state.app].name} 앱에서`;
    sheet.querySelector(".dali-pebbles").textContent = `조약돌 ${state.pebbles}`;
    sheet.querySelectorAll(".dali-tabs button").forEach(b => {
      const on = b.dataset.tab === state.tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    const views = { news: newsHTML, journal: journalHTML, manage: manageHTML };
    body.innerHTML = views[state.tab]();
    if (state.page) {
      pageEl.innerHTML = newsPage(state.page.id);
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
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const act = b.dataset.act, id = b.dataset.id;
    const t = id && state.trades.find(x => x.id === id);
    if (act === "back") { state.page = null; render(); }
    else if (act === "order") openOrder(b.dataset.sym);
    else if (act === "edit") { state.editing = id; render(); sheet.querySelector(".dali-input")?.focus(); }
    else if (act === "cancel") { state.editing = null; render(); }
    else if (act === "save") {
      t.memo = sheet.querySelector(".dali-input").value.trim();
      state.editing = null;
      if (t.memo) complete("m-comment");
      render();
    }
    else if (act === "pb") { t.pb = !t.pb; say(t.pb ? "담당 PB가 이 매매를 볼 수 있어요. 언제든 끌 수 있어요." : "공유를 껐어요."); render(); }
    else if (act === "scarf") { state.scarf = !state.scarf; render(); }
    else if (act === "mission") { complete(id); render(); }
    else if (act === "quiz") {
      const m = DALI_MISSIONS.find(x => x.id === id);
      if (+b.dataset.i === m.quiz.answer) complete(id);
      else { state.quiz[id] = +b.dataset.i; say("괜찮아요, 다른 걸 골라 보세요."); }
      render();
    }
  });
  fut.addEventListener("click", e => {
    const b = e.target.closest("[data-sym]");
    if (b) openOrder(b.dataset.sym);
  });

  /* --- 발표자용 시연 버튼 (휴대폰 화면 밖) --- */
  const demo = document.createElement("aside");
  demo.className = "dali-demo";
  demo.innerHTML = `
    <p class="dali-demo-title">발표자용 시연 버튼</p>
    <div class="dali-demo-apps"><button type="button" data-app="stock" class="on">유진투자증권</button><button type="button" data-app="fut">유진투자선물</button></div>
    <button type="button" data-demo="alert">의미 있는 뉴스 도착</button>
    <button type="button" data-demo="reset" class="ghost">처음으로</button>`;
  document.body.appendChild(demo);

  function setApp(app) {
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
    else if (b.dataset.demo === "reset") location.reload();
  });

  window.dali = { open, close, openNews, openOrder, setApp, alertNews };

  render();
  setTimeout(() => sayOnce("좋은 아침이에요! 따라가는 종목에 확인할 소식이 있어요."), 800);
})();
