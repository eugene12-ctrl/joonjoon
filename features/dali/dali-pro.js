/* ---------- 달이 2.0 "오늘" 탭 (dali.js 위에 얹음) ----------
   달이를 열면 맨 앞에 "오늘" 탭. 마지막으로 닫은 뒤 달라진 것과 지금 할 일이 있는지를 먼저 답한다.
   그 아래 카드는 dali-rules.js의 우선순위 점수 순서. 숫자는 전부 DaliRules에서 오고 여기선 그리기만 한다.
   증권 앱(국내주식)에서만 켠다. dali.js 다음, dali-plus.js 앞에 불러온다 (탭 표시 위치 계산 때문).
   되돌리려면 각 페이지에서 이 파일과 dali-pro.css를 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  const fab = phone && phone.querySelector(".dali-fab");
  if (!sheet || !window.dali || typeof DaliRules === "undefined" || window.DALI_PAGE_APP === "fut") return;

  const R = DaliRules, C = DALI_CUSTOMER, M = DALI_MARKET;
  const tabs = sheet.querySelector(".dali-tabs");
  const body = sheet.querySelector(".dali-body");
  const bubble = phone.querySelector(".dali-bubble");
  const won = n => `${Math.round(n).toLocaleString("ko-KR")}원`;
  const signed = n => R.fmtWon(n);
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");

  const pro = { on: false, sc: "morning", under: null, open: {} };
  const SCENES = [["morning", "07:00 아침"], ["intraday", "장중 급변"], ["close", "15:40 마감"], ["month", "월말"]];

  /* --- 탭 하나 더하기: 맨 앞 "오늘" --- */
  const tabBtn = document.createElement("button");
  tabBtn.type = "button";
  tabBtn.setAttribute("role", "tab");
  tabBtn.dataset.tab = "today";
  tabBtn.textContent = "오늘";
  tabs.prepend(tabBtn);

  /* --- 그리기 --- */
  // 문장 속 금액과 등락에 시세 색 (+는 빨강, -는 파랑)
  const paintNums = t => t.replace(/([+-][\d,.]+(?:원|%))/g, m => `<b class="${m[0] === "+" ? "up" : "down"}">${m}</b>`);
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  /* ---------- 첫 화면: 토스증권 "내 종목"처럼 목록이 전부 ----------
     따로 요약 화면을 두지 않는다. 달이가 본 것은 그 종목 줄 안에 해달 얼굴과 한 줄로 붙는다.
     시각(아침, 장중, 마감, 월말)에 따라 가격과 한 줄이 바뀐다. 줄을 누르면 그 종목 화면(주문까지 한 번)으로 */
  const FACE_S = `${BASE}dali-face.png`;
  // 종목 로고: img/logo-<종목코드>.png. 못 불러오면 그림을 지워 글자 동그라미가 보이게
  const LOGO = code => `${BASE}img/logo-${code}.png`;
  const logo = sym => (DALI_SYMS[sym] && DALI_SYMS[sym].code ? `<img src="${LOGO(DALI_SYMS[sym].code)}" alt="" onerror="this.remove()">` : "");
  function row(sym, sub, value, p, held) {
    const n = newsOf(sym);
    return `<li><button type="button" class="dali-pro-row" ${n ? `data-pro-news="${n.id}"` : ""}>
      <i class="dali-pro-logo">${sym[0]}${logo(sym)}</i>
      <span class="dali-pro-name"><b>${sym}</b><small>${sub}</small></span>
      <span class="dali-pro-val"><b>${won(value)}</b><small class="${tone(p)}">${pct(p)}</small></span>
    </button></li>`;
  }

  // 지금 할 수 있는 행동 하나: 장면과 내 보유, 걸어 둔 주문으로 규칙이 고름 (DaliRules.action)
  // 장면을 넘어 이어지는 흐름: 알림 -> 고객이 누른 행동 -> 다음 장면에 결과가 돌아옴. 누른 것은 sessionStorage 하나에
  const KEY = "dali-story";
  const memo = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const remember = (k, v) => { try { const m = memo(); m[k] = v; sessionStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { /* 무시 */ } };
  // 숫자는 전부 규칙에서. 히어로 맨 위 라벨은 장면 이름이 아니라 상황
  // 거래에 도움되는 맥락: 가격 막대(주문가, 지금가, 평단, 어제 종가의 자리)와 짧은 사실 둘. 판단은 고객이 하고, 달이는 자리와 숫자만
  // 어제 장중 저가와 고가는 시연용 가상 값
  const DAY_RANGE = { 현대차: { low: 291500, high: 298000 } };
  const prevClose = sym => Math.round(DALI_SYMS[sym].price / (1 + DALI_SYMS[sym].chg / 100));
  function action() {
    const sc = pro.sc, m = R.money(sc), h = R.habits(), ss = m.pos.find(p => p.sym === "삼성전자"), pend = C.pending, did = memo();
    if (sc === "morning") {
      const now = R.nowPrice(pend.sym, sc), rg = DAY_RANGE[pend.sym], gap = (pend.price / now - 1) * 100;
      const gauge = { lo: rg.low, hi: rg.high, marks: [["내 주문", pend.price, "mine"], ["지금", now, "now"]], ends: ["어제 저가", "어제 고가"] };
      const hd = m.pos.find(p => p.sym === pend.sym), q2 = hd.qty + pend.qty, avg2 = Math.round((hd.avg * hd.qty + pend.price * pend.qty) / q2);
      const facts = [[`지금가보다 ${pct(gap)}`, "내 주문가"], [`${q2}주, 평단 ${won(avg2)}`, "체결되면 현대차"]];
      return did.keep
        ? { top: "잊고 있던 것", big: won(pend.price), title: `${pend.sym} ${pend.qty}주 매수, 그대로 두었어요`, sub: "체결되면 바로 알려 드릴게요", gauge, facts, btns: [["order", pend.sym, "주문 정정"]] }
        : { top: "잊고 있던 것", big: won(pend.price), title: `어제 걸어 둔 ${pend.sym} ${pend.qty}주, 아직 안 됐어요`, gauge, facts,
            btns: [["order", pend.sym, "주문 정정"], ["keep", "", "그대로 두기"]] };
    }
    if (sc === "intraday") {
      const now = ss.now, avg = ss.avg, pc = prevClose("삼성전자");
      const gauge = { lo: Math.min(now, avg, pc) * 0.995, hi: Math.max(now, avg, pc) * 1.005, marks: [["지금", now, "now"], ["내 평단", avg, "mine"]] };
      const facts = [[pct((now / avg - 1) * 100), "평단 대비"], [`내 돈의 ${Math.round(ss.value / m.total * 100)}%`, `${ss.qty}주`]];
      const alertAt = Math.round(avg / 1000) * 1000;
      return did.wait
        ? { top: "결정 직전", big: pct(ss.pct), title: `삼성전자, ${won(alertAt)}이 되면 알려 드릴게요`, sub: "마감 때 결과도 같이 보여 드릴게요", gauge, facts, btns: [["order", "삼성전자", "삼성전자 주문"]] }
        : { top: "결정 직전", big: pct(ss.pct), title: `삼성전자, 지금 팔면 ${signed(R.flow("intraday").intraday.pnl)}이 확정돼요`,
            sub: `손실 난 날 바로 판 ${h.quick.n}번 중 ${h.quick.up}번은 2주 뒤 더 올랐어요`, gauge, facts,
            btns: [["order", "삼성전자", "삼성전자 주문"], ["wait", "", `${won(alertAt)} 오면 알림`]] };
    }
    if (sc === "close") {
      // 장중에 팔지 않았다면 그 결과가 여기로 돌아옴
      const rc = R.flow("close").recover, hd = m.pos.find(p => p.sym === pend.sym);
      const back = did.sold ? "" : `장중에 안 판 삼성전자는 마감 ${pct(rc.toPct)}, 그때보다 ${signed(rc.won)}`;
      // 체결로 바뀐 것: 평단과 비중 (보유 ${hd.qty}주에 ${pend.qty}주가 더해짐)
      const q2 = hd.qty + pend.qty, avg2 = Math.round((hd.avg * hd.qty + pend.price * pend.qty) / q2), w2 = Math.round(q2 * hd.now / m.total * 100);
      const facts = [[`${hd.avg.toLocaleString("ko-KR")} → ${won(avg2)}`, "현대차 평단"], [`${Math.round(hd.value / m.total * 100)}% → ${w2}%`, "내 돈 중 현대차"]];
      return { top: "결과", big: won(pend.price), title: `아침에 걸어 둔 ${pend.sym} ${pend.qty}주, 체결됐어요`, sub: back, facts, btns: [["journal", "", "매매일지"], ["news", pend.sym, "현대차 보기"]] };
    }
    const q = R.flow("month").quickSell, c = R.costs();
    const facts = [[won(c.cost), `수수료와 세금, 실현의 ${Math.round(c.costShare)}%`], [`${q.oct}번`, `손실 난 날 바로 판 날 (9월 ${q.sep}번)`]];
    return { top: "한 달", big: signed(C.month.realized), title: "10월 실현 손익", facts, btns: [["journal", "", "매매일지"]] };
  }
  // 가격 막대: 범위 안에 두 점(내 주문 또는 평단, 지금)만 찍음. 양 끝 라벨은 그리지 않음
  function gaugeHTML(g) {
    if (!g) return "";
    const pos = v => Math.max(3, Math.min(97, (v - g.lo) / (g.hi - g.lo) * 100));
    return `<div class="dali-pro-gauge"><div class="bar">${g.marks.map(([l, v, k]) => `<span class="mk ${k}" style="left:${pos(v)}%"><i></i><em>${l}<b>${won(v)}</b></em></span>`).join("")}</div>
</div>`;
  }
  const factsHTML = f => f ? `<div class="dali-pro-facts">${f.map(([v, l]) => `<p><b>${v}</b><small>${l}</small></p>`).join("")}</div>` : "";
  function hero() {
    const m = R.money(pro.sc), day = R.dayLabel(pro.sc), a = action();
    const big = a.big, rest = a.title;
    const held = m.pos.map(p => row(p.sym, `${p.qty}주`, p.value, p.pct, true));
    const watch = C.watch.map(s => row(s, "관심", R.nowPrice(s, pro.sc), R.todayPct(s, pro.sc), false));
    return `
      <section class="dali-pro-act sc-${pro.sc}">
        <p class="dali-pro-act-top"><img src="${FACE_S}" alt="달이">${a.top}</p>
        <p class="dali-pro-act-big">${big}</p>
        <h2>${rest}</h2>
        ${a.gauge ? gaugeHTML(a.gauge) : a.sub ? `<p class="dali-pro-act-sub">${a.sub}</p>` : ""}
        <div class="dali-pro-act-btns">${a.btns.map(([k, sym, label], i) => `<button type="button" class="${i ? "ghost" : ""}" data-go="${k}" data-sym="${sym}">${label}</button>`).join("")}</div>
      </section>
      <section class="dali-pro-head">
        <p>내 돈</p>
        <b>${won(m.total)}</b>
        <small class="${tone(m.today)}">${day} ${signed(m.today)} (${pct(m.today / (m.total - m.today) * 100)})</small>
      </section>
      <ul class="dali-pro-rows">${held.join("")}
        <li><div class="dali-pro-row cash"><i class="dali-pro-logo">₩</i><span class="dali-pro-name"><b>현금</b><small>원화</small></span>
          <span class="dali-pro-val"><b>${won(C.cash)}</b></span></div></li>
      </ul>
      <p class="dali-pro-sec">관심</p>
      <ul class="dali-pro-rows">${watch.join("")}</ul>`;
  }

  const newsOf = sym => DALI_NEWS.find(n => n.sym === sym);

  function html() {
    return `<div class="dali-pro dali-pro-list2 ready">${hero()}
      <section class="dali-pro-card dali-pro-foot">
        <button type="button" data-pro="grow">달이 키우기<span>›</span></button>
      </section></div>`;
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
    const replay = pro.play;
    pro.play = false; // 띠 그리는 연출은 열 때와 장면 바꿀 때만
    body.scrollTop = y;
    // dali-ai.js가 있으면 맨 위 답을 달이가 그 자리에서 쓰는 것처럼
  }
  function show() { pro.on = true; pro.play = true; paint(); }

  // dali.js가 같은 탭을 다시 그리면(시세 도착 등) "오늘"을 다시 덮고, 다른 탭으로 갔으면 손 뗌
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
  // 달이를 누르면 언제나 "오늘"부터
  fab.addEventListener("click", () => { if (sheet.classList.contains("open")) show(); });
  const openOrig = window.dali.open;
  window.dali.open = tab => { pro.on = !tab || tab === "today"; openOrig(pro.on ? null : tab); if (pro.on) { pro.play = true; paint(); } };

  body.addEventListener("click", e => {
    const n = e.target.closest("[data-pro-news]");
    if (n) { window.dali.openNews(n.dataset.proNews); return; }
    const g = e.target.closest("[data-go]");
    if (g) {
      const k = g.dataset.go, sym = g.dataset.sym;
      if (k === "keep" || k === "wait") { remember(k, true); paint(); if (k === "wait") toast("평단에 오면 알려 드릴게요"); return; }
      if (k === "order") { if (pro.sc === "intraday") remember("sold", true); window.dali.openOrder(sym); }
      else if (k === "news") { const n = newsOf(sym); if (n) window.dali.openNews(n.id); }
      else if (k === "journal") tabs.querySelector('[data-tab="journal"]').click();
      return;
    }
    const b = e.target.closest("[data-pro]");
    if (!b) return;
    if (b.dataset.pro === "more") { pro.open[b.dataset.k] = true; paint(); }
    else if (b.dataset.pro === "unfold") { pro.more = true; paint(); }
    else if (b.dataset.pro === "grow") tabs.querySelector('[data-tab="manage"]').click();
  });

  function toast(t) {
    if (!bubble) return;
    bubble.textContent = t;
    bubble.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => bubble.classList.remove("show"), 4000);
  }

  /* --- 발표자 상자: 시연 시각 --- */
  const demo = document.querySelector(".dali-demo");
  if (demo) {
    const box = document.createElement("div");
    box.className = "dali-demo-apps dali-pro-scenes";
    box.innerHTML = SCENES.map(([k, l]) => `<button type="button" data-scene="${k}" class="${k === pro.sc ? "on" : ""}">${l}</button>`).join("");
    const title = document.createElement("p");
    title.className = "dali-demo-note";
    title.textContent = "초개인화 맥락형 비서, 시연 시각";
    demo.querySelector(".dali-demo-apps").after(title, box);
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-scene]");
      if (!b) return;
      pro.sc = b.dataset.scene;
      pro.open = {};
      pro.more = false;
      pro.play = true;
      box.querySelectorAll("[data-scene]").forEach(x => x.classList.toggle("on", x === b));
      if (pro.on && sheet.classList.contains("open")) { body.scrollTop = 0; paint(); }
      else {
        fab.classList.add("pulse");
        setTimeout(() => fab.classList.remove("pulse"), 1200);
        const d = R.diff(pro.sc);
        toast(d.todo.length ? `지금 할 일이 ${d.todo.length}개 있어요` : `${d.hours}시간 동안 ${d.lines.length}가지가 바뀌었어요`);
      }
    });
    demo.querySelector('[data-demo="reset"]')?.addEventListener("click", () => { try { sessionStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }, true);
    // 조약돌 주기는 관리 탭을 여니 "오늘"에서 손 뗌
    demo.querySelector('[data-demo="pebble"]')?.addEventListener("click", () => { pro.on = false; }, true);
  }

  window.daliPro = { show, scene: k => demo?.querySelector(`[data-scene="${k}"]`)?.click() };
})();
