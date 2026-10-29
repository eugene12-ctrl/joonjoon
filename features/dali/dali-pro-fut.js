/* ---------- 달이 2.0 "오늘" 탭, 유진투자선물 앱 (dali.js 위에 얹음) ----------
   증권 앱의 dali-pro.js와 같은 모양(히어로 하나 + 내 계좌 + 보유, 관심 목록)을 선물 숫자로 그린다.
   선물은 밤에 움직이니 장면도 밤 중심: 07:00 아침(밤사이 바뀐 것과 만기), 23:40 밤 급변(증거금 여유, 지금 정리하면 확정되는 금액),
   다음 날 아침(걸어 둔 주문 체결과 밤에 안 정리한 결과), 월말(실현 손익과 수수료).
   숫자는 전부 dali-customer-fut.js에서 오고 여기선 계산과 그리기만. 사라고도 팔라고도 하지 않는다.
   futures.html에서만 불러온다. dali.js 다음, dali-plus.js 앞 (탭 표시 위치 계산 때문).
   되돌리려면 futures.html에서 이 파일을 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  const fab = phone && phone.querySelector(".dali-fab");
  if (!sheet || !window.dali || window.DALI_PAGE_APP !== "fut" || typeof DALI_CUSTOMER_FUT === "undefined") return;

  const C = DALI_CUSTOMER_FUT, M = DALI_MARKET_FUT;
  const tabs = sheet.querySelector(".dali-tabs");
  const body = sheet.querySelector(".dali-body");
  const bubble = phone.querySelector(".dali-bubble");
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const FACE_S = `${BASE}dali-face.png`;

  /* --- 숫자 --- */
  const usd = n => `${n < 0 ? "-" : "+"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
  const plainUsd = n => `$${Math.round(n).toLocaleString("en-US")}`;
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const dec = sym => DALI_SYMS[sym].dec ?? 2;
  const fmtP = (sym, v) => v.toLocaleString("en-US", { minimumFractionDigits: dec(sym), maximumFractionDigits: dec(sym) });
  const newsOf = sym => DALI_NEWS.find(n => n.sym === sym);
  // 어젯밤(10월 28일) 마감가와 그 전날 마감가. 장면마다 지금 가격은 전날 마감에서 그날 등락만큼
  const lastClose = sym => DALI_SYMS[sym].price;
  const prevClose = sym => lastClose(sym) / (1 + DALI_SYMS[sym].chg / 100);
  const nowPrice = (sym, sc) => sc === "morning" ? lastClose(sym) : sc === "month" ? lastClose(sym) * (1 + M.month.pct[sym] / 100) : prevClose(sym) * (1 + M[sc].pct[sym] / 100);
  const todayPct = (sym, sc) => sc === "morning" ? DALI_SYMS[sym].chg : M[sc].pct[sym];

  function money(sc) {
    const pos = C.positions.map(p => {
      const now = nowPrice(p.sym, sc), mult = C.mult[p.sym];
      const base = sc === "morning" ? prevClose(p.sym) : sc === "month" ? lastClose(p.sym) : prevClose(p.sym);
      return { ...p, now, mult, pnl: (now - p.avg) * mult * p.qty, pnlPct: (now / p.avg - 1) * 100, pct: todayPct(p.sym, sc), today: (now - base) * mult * p.qty, margin: C.margin[p.sym] * p.qty };
    });
    const evalSum = pos.reduce((a, p) => a + p.pnl, 0), marginSum = pos.reduce((a, p) => a + p.margin, 0);
    const total = C.cash + marginSum + evalSum;            // 예탁 자산: 주문가능 + 묶인 증거금 + 평가손익
    return { pos, total, evalSum, marginSum, room: C.cash + evalSum, today: pos.reduce((a, p) => a + p.today, 0) };
  }
  function habits() {
    const T = C.trades, night = T.filter(t => t.night), nightUp = night.filter(t => t.later > 0);
    const oct = n => T.filter(t => t.night && t.sell && t.sell.startsWith(n)).length;
    return { night: { n: night.length, up: nightUp.length, oct: oct("10/"), sep: oct("09/") }, count: T.length };
  }

  const pro = { on: false, sc: "morning", under: null, play: false };
  const SCENES = [["morning", "07:00 아침"], ["intraday", "23:40 밤 급변"], ["close", "다음 날 아침"], ["month", "월말"]];

  /* --- 탭 하나 더하기: 맨 앞 "오늘" --- */
  const tabBtn = document.createElement("button");
  tabBtn.type = "button";
  tabBtn.setAttribute("role", "tab");
  tabBtn.dataset.tab = "today";
  tabBtn.textContent = "오늘";
  tabs.prepend(tabBtn);

  /* --- 장면을 넘어 이어지는 흐름: 알림 걸기 -> 다음 장면에 결과. sessionStorage 하나에 --- */
  const KEY = "dali-story-fut";
  const memo = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const remember = (k, v) => { try { const m = memo(); m[k] = v; sessionStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { /* 무시 */ } };

  /* --- 히어로: 장면마다 숫자 하나, 문장 하나, 버튼 하나나 둘 --- */
  function action() {
    const sc = pro.sc, m = money(sc), h = habits(), did = memo(), pend = C.pending;
    const cl = m.pos.find(p => p.sym === "크루드 오일");
    if (sc === "morning") {
      return { top: "밤사이 내 계약", big: usd(m.today),
        title: `크루드 오일 ${pct(cl.pct)}, 금 ${pct(m.pos[1].pct)}. 12월물 최종거래일은 3주 뒤예요`,
        facts: [["11월 19일", "크루드 오일 12월물 최종거래일"], [plainUsd(m.marginSum), "묶인 유지증거금"]],
        btns: [["news", "크루드 오일", "크루드 오일 보기"], ["journal", "", "매매일지"]] };
    }
    if (sc === "intraday") {
      const alertAt = Math.round(cl.avg * 2) / 2;
      const gauge = { lo: Math.min(cl.now, cl.avg) * 0.995, hi: Math.max(cl.now, cl.avg) * 1.005, marks: [["지금", cl.now, "now"], ["내 진입가", cl.avg, "mine"]] };
      const facts = [[pct(cl.pnlPct), "진입가 대비"], [plainUsd(m.room), `여유 자금, 유지증거금 ${plainUsd(cl.margin)}`]];
      return did.wait
        ? { top: "결정 직전", big: pct(cl.pct), title: `크루드 오일, ${fmtP("크루드 오일", alertAt)}이 되면 알려 드릴게요`, sub: "아침에 결과도 같이 보여 드릴게요", gauge, facts, btns: [["order", "크루드 오일", "크루드 오일 주문"]] }
        : { top: "결정 직전", big: pct(cl.pct), title: `크루드 오일, 지금 정리하면 ${usd(cl.pnl)}이 확정돼요`,
            sub: `밤 급변 때 바로 정리한 ${h.night.n}번 중 ${h.night.up}번은 아침에 되돌아왔어요`, gauge, facts,
            btns: [["order", "크루드 오일", "크루드 오일 주문"], ["wait", "", `${fmtP("크루드 오일", alertAt)} 오면 알림`]] };
    }
    if (sc === "close") {
      const nightLow = prevClose("크루드 오일") * (1 + M.intraday.pct["크루드 오일"] / 100);
      const back = did.sold ? "" : `밤에 안 정리한 크루드 오일은 아침 ${fmtP("크루드 오일", cl.now)}, 그때보다 ${usd((cl.now - nightLow) * cl.mult * cl.qty)}`;
      const facts = [[`${C.code[pend.sym]} ${pend.qty}계약`, `${pend.sym} 새로 들어옴`], [plainUsd(m.marginSum + C.margin[pend.sym] * pend.qty), "묶인 유지증거금"]];
      return { top: "결과", big: fmtP(pend.sym, pend.price), title: `어젯밤 걸어 둔 ${pend.sym} ${C.code[pend.sym]} ${pend.qty}계약, 체결됐어요`, sub: back, facts,
        btns: [["journal", "", "매매일지"], ["news", pend.sym, `${pend.sym} 보기`]] };
    }
    const facts = [[plainUsd(C.month.fee), `수수료, 실현의 ${Math.round(C.month.fee / Math.abs(C.month.realized) * 100)}%`], [`${h.night.oct}번`, `밤 급변 때 바로 정리한 날 (9월 ${h.night.sep}번)`]];
    return { top: "한 달", big: usd(C.month.realized), title: `10월 실현 손익, ${C.month.trades}번 매매`, facts, btns: [["journal", "", "매매일지"]] };
  }
  function gaugeHTML(g, sym) {
    if (!g) return "";
    const pos = v => Math.max(3, Math.min(97, (v - g.lo) / (g.hi - g.lo) * 100));
    return `<div class="dali-pro-gauge"><div class="bar">${g.marks.map(([l, v, k]) => `<span class="mk ${k}" style="left:${pos(v)}%"><i></i><em>${l}<b>${fmtP(sym, v)}</b></em></span>`).join("")}</div></div>`;
  }
  const factsHTML = f => f ? `<div class="dali-pro-facts">${f.map(([v, l]) => `<p><b>${v}</b><small>${l}</small></p>`).join("")}</div>` : "";

  function row(sym, sub, val, chg) {
    const n = newsOf(sym);
    return `<li><button type="button" class="dali-pro-row" ${n ? `data-pro-news="${n.id}"` : ""}>
      <i class="dali-pro-logo icon">${sym[0]}${DALI_SYMS[sym].icon ? `<img src="${BASE}../futures/img/${DALI_SYMS[sym].icon}.png" alt="" onerror="this.remove()">` : ""}</i>
      <span class="dali-pro-name"><b>${sym}</b><small>${sub}</small></span>
      <span class="dali-pro-val"><b>${val}</b><small class="${tone(chg)}">${pct(chg)}</small></span>
    </button></li>`;
  }
  function hero() {
    const sc = pro.sc, m = money(sc), a = action(), day = sc === "morning" || sc === "close" ? "밤사이" : "오늘";
    const held = m.pos.map(p => row(p.sym, `${C.code[p.sym]} ${p.qty}계약 · 진입 ${fmtP(p.sym, p.avg)}`, usd(p.pnl), p.pct));
    const watch = C.watch.map(s => row(s, sc === "close" && s === C.pending.sym ? `${C.code[s]} ${C.pending.qty}계약 · 진입 ${fmtP(s, C.pending.price)}` : "관심", fmtP(s, nowPrice(s, sc)), todayPct(s, sc)));
    return `
      <section class="dali-pro-act sc-${sc}">
        <p class="dali-pro-act-top"><img src="${FACE_S}" alt="달이">${a.top}</p>
        <p class="dali-pro-act-big">${a.big}</p>
        <h2>${a.title}</h2>
        ${a.gauge ? gaugeHTML(a.gauge, "크루드 오일") : a.sub ? `<p class="dali-pro-act-sub">${a.sub}</p>` : ""}
        ${factsHTML(a.facts)}
        <div class="dali-pro-act-btns">${a.btns.map(([k, sym, label], i) => `<button type="button" class="${i ? "ghost" : ""}" data-go="${k}" data-sym="${sym}">${label}</button>`).join("")}</div>
      </section>
      <section class="dali-pro-head">
        <p>내 계좌</p>
        <b>${plainUsd(m.total)}</b>
        <small class="${tone(m.today)}">${day} ${usd(m.today)} · 평가 ${usd(m.evalSum)}</small>
      </section>
      <ul class="dali-pro-rows">${held.join("")}
        <li><div class="dali-pro-row cash"><i class="dali-pro-logo">$</i><span class="dali-pro-name"><b>주문가능</b><small>달러</small></span>
          <span class="dali-pro-val"><b>${plainUsd(C.cash)}</b></span></div></li>
      </ul>
      <p class="dali-pro-sec">관심</p>
      <ul class="dali-pro-rows">${watch.join("")}</ul>`;
  }
  function html() {
    return `<div class="dali-pro dali-pro-list2 ready">${hero()}
      <section class="dali-pro-card dali-pro-foot"><button type="button" data-pro="grow">달이 키우기<span>›</span></button></section>
    </div>`;
  }

  function paint() {
    const dTab = tabs.querySelector("[data-tab].on:not([data-tab=today])");
    pro.under = dTab ? dTab.dataset.tab : pro.under;
    tabs.querySelectorAll("[data-tab]").forEach(b => {
      const on = b === tabBtn;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    const y = body.querySelector(".dali-pro") ? body.scrollTop : 0;
    body.innerHTML = html();
    body.scrollTop = y;
  }
  function show() { pro.on = true; paint(); }

  // dali.js가 같은 탭을 다시 그리면 "오늘"을 다시 덮고, 다른 탭으로 갔으면 손 뗌 (dali-pro.js와 같은 방식)
  new MutationObserver(() => {
    if (!pro.on || body.querySelector(".dali-pro")) return;
    const dTab = tabs.querySelector("[data-tab].on:not([data-tab=today])");
    if (dTab && dTab.dataset.tab !== pro.under) { pro.on = false; tabBtn.classList.remove("on"); tabBtn.setAttribute("aria-selected", "false"); return; }
    paint();
  }).observe(body, { childList: true });

  /* --- 이벤트 --- */
  tabs.addEventListener("click", e => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    if (b === tabBtn) { e.stopImmediatePropagation(); show(); }
    else pro.on = false;
  }, true);
  fab.addEventListener("click", () => { if (sheet.classList.contains("open")) show(); });
  const openOrig = window.dali.open;
  window.dali.open = tab => { pro.on = !tab || tab === "today"; openOrig(pro.on ? null : tab); if (pro.on) paint(); };

  body.addEventListener("click", e => {
    const n = e.target.closest("[data-pro-news]");
    if (n) { window.dali.openNews(n.dataset.proNews); return; }
    const g = e.target.closest("[data-go]");
    if (g) {
      const k = g.dataset.go, sym = g.dataset.sym;
      if (k === "wait") { remember("wait", true); paint(); toast("진입가에 오면 알려 드릴게요"); return; }
      if (k === "order") { if (pro.sc === "intraday") remember("sold", true); window.dali.openOrder(sym); }
      else if (k === "news") { const x = newsOf(sym); if (x) window.dali.openNews(x.id); }
      else if (k === "journal") tabs.querySelector('[data-tab="journal"]').click();
      return;
    }
    if (e.target.closest('[data-pro="grow"]')) tabs.querySelector('[data-tab="manage"]').click();
  });

  function toast(t) {
    if (!bubble) return;
    bubble.textContent = t;
    bubble.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => bubble.classList.remove("show"), 4000);
  }

  /* --- 발표자 상자: 시연 시각 (증권 앱과 같은 자리, 같은 모양) --- */
  const demo = document.querySelector(".dali-demo");
  if (demo) {
    const box = document.createElement("div");
    box.className = "dali-demo-apps dali-pro-scenes";
    box.innerHTML = SCENES.map(([k, l]) => `<button type="button" data-scene="${k}" class="${k === pro.sc ? "on" : ""}">${l}</button>`).join("");
    const title = document.createElement("p");
    title.className = "dali-demo-note";
    title.textContent = "초개인화 맥락형 비서, 시연 시각 (선물은 밤에 움직여요)";
    demo.querySelector(".dali-demo-apps").after(title, box);
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-scene]");
      if (!b) return;
      pro.sc = b.dataset.scene;
      box.querySelectorAll("[data-scene]").forEach(x => x.classList.toggle("on", x === b));
      if (pro.on && sheet.classList.contains("open")) { body.scrollTop = 0; paint(); }
      else {
        fab.classList.add("pulse");
        setTimeout(() => fab.classList.remove("pulse"), 1200);
        const m = money(pro.sc);
        toast(pro.sc === "intraday" ? `크루드 오일이 크게 움직여요, 지금 ${usd(m.pos[0].pnl)}` : `${C.lastSeenHours[pro.sc]}시간 동안 내 계약이 ${usd(m.today)} 움직였어요`);
      }
    });
    demo.querySelector('[data-demo="reset"]')?.addEventListener("click", () => { try { sessionStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }, true);
    // 조약돌 주기는 관리 탭을 여니 "오늘"에서 손 뗌
    demo.querySelector('[data-demo="pebble"]')?.addEventListener("click", () => { pro.on = false; }, true);
  }

  window.daliPro = { show, scene: k => demo?.querySelector(`[data-scene="${k}"]`)?.click(), get sc() { return pro.sc; } };
})();
