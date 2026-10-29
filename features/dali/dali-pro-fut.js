/* ---------- 달이 "오늘" 탭, 유진투자선물 앱 (07:00 아침 한 장면) ----------
   증권 앱의 dali-pro.js와 같은 모양(행동 카드 하나 + 내 계좌 + 보유, 관심 목록)을 선물 데이터로 그린다.
   선물은 밤에 움직이니, 아침에 열면 밤사이 바뀐 것과 잊으면 안 되는 만기를 먼저 말한다.
   보유와 계좌 숫자는 futures.html의 HOLD, CASH(잔고 화면과 같은 값), 시세와 뉴스는 dali-data.js.
   futures.html에서만 불러온다. dali.js 다음, dali-plus.js 앞 (탭 표시 위치 계산 때문).
   되돌리려면 futures.html에서 이 파일과 dali-pro.css를 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  const fab = phone && phone.querySelector(".dali-fab");
  if (!sheet || !window.dali || window.DALI_PAGE_APP !== "fut") return;

  const tabs = sheet.querySelector(".dali-tabs");
  const body = sheet.querySelector(".dali-body");
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const usd = n => `${n < 0 ? "-" : n > 0 ? "+" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
  const plainUsd = n => `$${Math.round(n).toLocaleString("en-US")}`;
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const price = sym => { const s = DALI_SYMS[sym]; return s.price.toLocaleString("en-US", { minimumFractionDigits: s.dec ?? 2, maximumFractionDigits: s.dec ?? 2 }); };
  const newsOf = sym => DALI_NEWS.find(n => n.sym === sym);

  // 선물 앱 잔고 화면과 같은 숫자 (futures.html 맨 위 스크립트의 전역). 없으면 매매일지 보유로
  const holds = () => {
    const trades = DALI_TRADES.filter(t => t.app === "fut" && !t.sell);
    return trades.map(t => ({ sym: t.sym, qty: t.qty.replace(/^\S+\s/, ""), pnl: t.pnl, chg: DALI_SYMS[t.sym].chg }));
  };
  const account = () => {
    if (typeof HOLD === "undefined" || typeof CASH === "undefined") return null;
    return { total: CASH + HOLD.reduce((a, h) => a + h.cost + h.eval, 0), eval: HOLD.reduce((a, h) => a + h.eval, 0) };
  };

  const state = { on: false, under: null };

  const tabBtn = document.createElement("button");
  tabBtn.type = "button";
  tabBtn.setAttribute("role", "tab");
  tabBtn.dataset.tab = "today";
  tabBtn.textContent = "오늘";
  tabs.prepend(tabBtn);

  // 아침에 할 이야기 하나: 갖고 있는 크루드 오일 12월물의 최종거래일 (뉴스 n5와 같은 말)
  function action() {
    const cl = holds().find(h => h.sym === "크루드 오일");
    return {
      top: "잊으면 안 되는 것", big: "3주",
      title: "크루드 오일 12월물, 최종거래일까지 3주 남았어요",
      sub: cl ? `밤사이 ${pct(cl.chg)}, 내 ${cl.qty} 평가 ${usd(cl.pnl)}` : "",
      btns: [["news", "크루드 오일", "크루드 오일 보기"], ["journal", "", "매매일지"]],
    };
  }
  function row(sym, sub, val, chg) {
    const n = newsOf(sym);
    return `<li><button type="button" class="dali-pro-row" ${n ? `data-pro-news="${n.id}"` : ""}>
      <i class="dali-pro-logo icon">${sym[0]}${DALI_SYMS[sym].icon ? `<img src="${BASE}../futures/img/${DALI_SYMS[sym].icon}.png" alt="" onerror="this.remove()">` : ""}</i>
      <span class="dali-pro-name"><b>${sym}</b><small>${sub}</small></span>
      <span class="dali-pro-val"><b>${val}</b><small class="${tone(chg)}">${pct(chg)}</small></span>
    </button></li>`;
  }
  function html() {
    const a = action(), acc = account(), H = holds();
    const watch = Object.keys(DALI_SYMS).filter(s => DALI_SYMS[s].app === "fut" && DALI_SYMS[s].kind === "watch");
    return `<div class="dali-pro dali-pro-list2 ready">
      <section class="dali-pro-act">
        <p class="dali-pro-act-top"><img src="${BASE}dali-face.png" alt="달이">${a.top}</p>
        <p class="dali-pro-act-big">${a.big}</p>
        <h2>${a.title}</h2>
        ${a.sub ? `<p class="dali-pro-act-sub">${a.sub}</p>` : ""}
        <div class="dali-pro-act-btns">${a.btns.map(([k, sym, label], i) => `<button type="button" class="${i ? "ghost" : ""}" data-go="${k}" data-sym="${sym}">${label}</button>`).join("")}</div>
      </section>
      ${acc ? `<section class="dali-pro-head"><p>내 계좌</p><b>${plainUsd(acc.total)}</b>
        <small class="${tone(acc.eval)}">평가손익 ${usd(acc.eval)}</small></section>` : ""}
      <ul class="dali-pro-rows">${H.map(h => row(h.sym, h.qty, usd(h.pnl), h.chg)).join("")}</ul>
      <p class="dali-pro-sec">관심</p>
      <ul class="dali-pro-rows">${watch.map(s => row(s, "관심", price(s), DALI_SYMS[s].chg)).join("")}</ul>
      <section class="dali-pro-card dali-pro-foot"><button type="button" data-pro="grow">달이 키우기<span>›</span></button></section>
    </div>`;
  }

  function paint() {
    const dTab = tabs.querySelector("[data-tab].on:not([data-tab=today])");
    state.under = dTab ? dTab.dataset.tab : state.under;
    tabs.querySelectorAll("[data-tab]").forEach(b => {
      const on = b === tabBtn;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    body.innerHTML = html();
  }
  function show() { state.on = true; paint(); }

  // dali.js가 같은 탭을 다시 그리면 "오늘"을 다시 덮고, 다른 탭으로 갔으면 손 뗌 (dali-pro.js와 같은 방식)
  new MutationObserver(() => {
    if (!state.on || body.querySelector(".dali-pro")) return;
    const dTab = tabs.querySelector("[data-tab].on:not([data-tab=today])");
    if (dTab && dTab.dataset.tab !== state.under) { state.on = false; tabBtn.classList.remove("on"); tabBtn.setAttribute("aria-selected", "false"); return; }
    paint();
  }).observe(body, { childList: true });

  tabs.addEventListener("click", e => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    if (b === tabBtn) { e.stopImmediatePropagation(); show(); }
    else state.on = false;
  }, true);
  fab.addEventListener("click", () => { if (sheet.classList.contains("open")) show(); });
  const openOrig = window.dali.open;
  window.dali.open = tab => { state.on = !tab || tab === "today"; openOrig(state.on ? null : tab); if (state.on) paint(); };

  body.addEventListener("click", e => {
    const n = e.target.closest("[data-pro-news]");
    if (n) { window.dali.openNews(n.dataset.proNews); return; }
    const g = e.target.closest("[data-go]");
    if (g) {
      const k = g.dataset.go;
      if (k === "news") { const x = newsOf(g.dataset.sym); if (x) window.dali.openNews(x.id); }
      else if (k === "journal") tabs.querySelector('[data-tab="journal"]').click();
      return;
    }
    if (e.target.closest('[data-pro="grow"]')) tabs.querySelector('[data-tab="manage"]').click();
  });
  // 조약돌 주기는 관리 탭을 여니 "오늘"에서 손 뗌
  document.querySelector('.dali-demo [data-demo="pebble"]')?.addEventListener("click", () => { state.on = false; }, true);
})();
