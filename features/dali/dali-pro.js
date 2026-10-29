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

  // legacy: 달이 2.0 첫 화면(히어로, 내 돈, 관심 목록). false로 바꾸면 3.0 첫 화면(샀을 때랑 같아요)
  const pro = { on: false, sc: "morning", under: null, open: {}, legacy: true, why: false, rep: null };
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
      // 아침: 숫자 하나, 문장 하나, 버튼 하나. 밤사이 미국 반도체가 내 돈 몇 %에 걸리는지만
      const us = R.timeline("morning").end, ss = m.pos.find(p => p.sym === "삼성전자");
      return { top: "밤사이 미국 반도체 지수", big: pct(us), title: `내 돈의 ${Math.round(ss.value / m.total * 100)}%, 삼성전자가 같은 업종이에요`,
        btns: [["news", "삼성전자", "삼성전자 보기"]] };
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
      return { top: "결과", big: won(pend.price), title: `어제 걸어 둔 ${pend.sym} ${pend.qty}주, 체결됐어요`, sub: back, facts, btns: [["journal", "", "매매일지"], ["news", pend.sym, "현대차 보기"]] };
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
  // 밤사이 뉴스 목록: 시각, 한 줄, 관련된 내 종목 로고. 누르면 그 종목 화면
  const newsList = l => `<ul class="dali-pro-night-news">${l.map(n => { const nw = newsOf(n.sym);
    return `<li><button type="button" ${nw ? `data-pro-news="${nw.id}"` : ""}><span class="tm">${n.time}</span>
      <span class="tx"><b>${n.t}</b><small>${n.mine.length ? `내 ${n.mine.join(", ")}` : `관심 ${n.syms.join(", ")}`}</small></span>
      <span class="lg">${n.syms.map(sy => `<i class="dali-pro-logo">${sy[0]}${logo(sy)}</i>`).join("")}</span></button></li>`; }).join("")}</ul>`;
  // 밤사이 미국 지수 세 개와 내 돈 업종 막대(같은 업종 강조)
  const usBlock = a => `<div class="dali-pro-us"><div class="idx">${a.idx.map(([k, v]) => `<p><small>${k}</small><b>${pct(v)}</b></p>`).join("")}</div>
    <p class="mixl">내 돈</p><div class="mix">${a.mix.map(([k, sym, v, hot]) => `<span class="${hot ? "hot" : ""}" style="flex:${v}"><b>${k} ${v}%</b><small>${sym}</small></span>`).join("")}</div></div>`;
  /* 맨 위 한 장: 계좌 상태를 읽고 달이가 고른 것 하나 (DaliRules.state). 라벨, 큰 숫자, 한 줄, 버튼 하나뿐.
     크게 움직인 종목이면 특징뉴스 한 줄을 더한다. 히어로 아래 내 돈, 보유, 현금, 관심 목록은 그대로 둔다 */
  function hero() {
    const m = R.money(pro.sc), day = R.dayLabel(pro.sc), a = R.state(pro.sc).cards[0], [go] = a.btns;
    const held = m.pos.map(p => row(p.sym, `${p.qty}주`, p.value, p.pct, true));
    const watch = C.watch.map(s => row(s, "관심", R.nowPrice(s, pro.sc), R.todayPct(s, pro.sc), false));
    return `
      <section class="dali-pro-act sc-${pro.sc} st-${a.k}">
        <p class="dali-pro-act-top"><img src="${FACE_S}" alt="달이">${a.top}</p>
        <p class="dali-pro-act-big">${a.big}</p>
        <h2>${a.title}</h2>
        ${a.feat ? `<p class="dali-pro-act-feat"><span>특징뉴스</span>${a.feat}</p>` : ""}
        <div class="dali-pro-act-btns"><button type="button" data-go="${go[0]}" data-sym="${go[1]}">${go[2]}</button></div>
      </section>
      <section class="dali-pro-head">
        <p>내 돈</p>
        <b>${won(m.total)}</b>
        <small class="${tone(m.today)}">${day} ${signed(m.today)} (${pct(m.today / (m.total - m.today) * 100)})</small>
      </section>
      <ul class="dali-pro-rows">${held.join("")}
        <li><div class="dali-pro-row cash"><i class="dali-pro-logo">₩</i><span class="dali-pro-name"><b>현금</b><small>원화</small></span>
          <span class="dali-pro-val"><b>${won(m.cash)}</b></span></div></li>
      </ul>
      <p class="dali-pro-sec">관심</p>
      <ul class="dali-pro-rows">${watch.join("")}</ul>`;
  }

  const newsOf = sym => DALI_NEWS.find(n => n.sym === sym);

  /* ---------- 달이 3.0 첫 화면: 해달 얼굴과 한 문장 ----------
     "샀을 때랑 같아요." 또는 "현대차, 샀을 때랑 달라요." 그리고 언제부터 보고 있는지 한 줄. 숫자는 없다.
     문장을 누르면 종목마다 근거 3줄이 펼쳐지고, 다시 누르면 접힌다. 고객이 고르거나 치는 것은 없다 */
  const sentence = w => w.state === "same" ? "샀을 때랑 같아요."
    : w.syms.length === 1 ? `${w.syms[0]}, 샀을 때랑 달라요.` : `${w.syms.length}종목이 샀을 때랑 달라요.`;
  function snapFirst() {
    const w = R.word(pro.sc), off = memo().alertOff;
    const since = w.since.map(([sym, d]) => `${sym} ${d}`).join(", ");
    const why = pro.why ? `<div class="dali-snap-why">${C.positions.map(p => {
      const a = R.alive(p.sym, pro.sc);
      return `<section><h3>${p.sym}<small class="${a.same ? "" : "changed"}">${a.same ? "같아요" : "달라요"}</small></h3>
        <ul>${R.why(p.sym, pro.sc).map((l, i) => !a.same && i === 0 && window.DaliAI
          ? `<li class="diff dali-snap-ai" data-sym="${p.sym}"></li>`
          : `<li class="${!a.same && i < a.diff.length ? "diff" : ""}">${paintNums(l)}</li>`).join("")}</ul></section>`;
    }).join("")}</div>` : "";
    return `<section class="dali-snap-first ${w.state}">
        <img class="dali-snap-face" src="${FACE_S}" alt="달이">
        <button type="button" class="dali-snap-word" data-snap="why" aria-expanded="${pro.why}">${sentence(w)}</button>
        <p class="dali-snap-since">${since}부터 보고 있어요</p>
        ${why}
        <p class="dali-snap-alert">${off ? "달라져도 알리지 않아요" : `달라지면 알려 드려요<button type="button" data-snap="off">끄기</button>`}</p>
      </section>`;
  }
  // 월말: 10월 리포트로 바로. 판 매매 목록 하나, 줄을 누르면 산 순간과 판 순간 사진 두 칸
  function snapReport() {
    return `<section class="dali-snap-report"><h2>10월 리포트</h2>
      ${window.DaliSnap ? DaliSnap.report({ act: "rep", id: t => String(t.id), open: pro.rep }) : ""}</section>`;
  }
  // 달라요가 생긴 장면이면 달이 느낌표를 켠다 (끄기 했으면 안 켬)
  function paintBang() {
    const on = !pro.legacy && pro.sc !== "month" && R.word(pro.sc).state === "changed" && !memo().alertOff;
    fab.classList.toggle("has-snap", on);
  }

  function html() {
    if (!pro.legacy) return `<div class="dali-pro dali-pro-list2 ready">${pro.sc === "month" ? snapReport() : snapFirst()}</div>`;
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
    // 달이 3.0: "달라요"를 펼치면 달라진 축을 사람 말로 한 문장, 달이가 그 자리에서 쓴다 (DaliAI.write).
    // 구조는 facts(산 순간 사진, 지금 사진, 달라진 축) → 문장. 시연은 네트워크 없이 규칙 문장(R.why 첫 줄)을 쓴다.
    // 실서비스에서 AI가 더 맡는 것: 산 순간 그날 종목 뉴스 톤 분류(snap.newsTone). 다섯 축 자체는 규칙이다
    body.querySelectorAll(".dali-snap-ai").forEach(el => {
      const sym = el.dataset.sym, a = R.alive(sym, pro.sc);
      const facts = { sym, since: a.since, diff: a.diff.map(k => R.AX_LABEL[k]), buySnap: a.buySnap, nowSnap: a.nowSnap };
      window.DaliAI.write(el, {
        key: `snap-${pro.sc}-${sym}`,
        steps: [`${facts.since} 산 순간 사진 읽는 중`, `지금과 ${facts.diff.join(", ")} 비교하는 중`],
        text: R.why(sym, pro.sc)[0],
        basis: `${facts.since} 산 순간과 지금의 추세, 지지선, 거래량, 업종, 변동을 견줘 보고 썼어요.`,
      });
    });
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
    const sn = e.target.closest("[data-snap]");
    if (sn) {
      if (sn.dataset.snap === "why") pro.why = !pro.why;
      else if (sn.dataset.snap === "off") { remember("alertOff", true); paintBang(); }
      paint();
      return;
    }
    const rp = e.target.closest('[data-act="rep"]');
    if (rp && body.querySelector(".dali-snap-report")) {
      e.stopPropagation();
      pro.rep = pro.rep === rp.dataset.id ? null : rp.dataset.id;
      paint();
      return;
    }
    const n = e.target.closest("[data-pro-news]");
    if (n) { window.dali.openNews(n.dataset.proNews); return; }
    const g = e.target.closest("[data-go]");
    if (g) {
      const k = g.dataset.go, sym = g.dataset.sym;
      if (k === "keep" || k === "wait") { remember(k, true); paint(); if (k === "wait") toast("평단에 오면 알려 드릴게요"); return; }
      if (k === "order") { if (pro.sc === "intraday") remember("sold", true); window.dali.openOrder(sym); }
      else if (k === "news") { const n = newsOf(sym); if (n) window.dali.openNews(n.id); }
      else if (k === "journal") tabs.querySelector('[data-tab="journal"]').click();
      else if (k === "event") window.DaliEvent?.open(sym);
      else if (k === "tab-news") tabs.querySelector('[data-tab="news"]').click();
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
      pro.why = false;
      pro.rep = null;
      paintBang();
      pro.play = true;
      box.querySelectorAll("[data-scene]").forEach(x => x.classList.toggle("on", x === b));
      if (pro.on && sheet.classList.contains("open")) { body.scrollTop = 0; paint(); }
      else {
        fab.classList.add("pulse");
        setTimeout(() => fab.classList.remove("pulse"), 1200);
        if (pro.legacy) {
          const d = R.diff(pro.sc);
          toast(d.todo.length ? `지금 할 일이 ${d.todo.length}개 있어요` : `${d.hours}시간 동안 ${d.lines.length}가지가 바뀌었어요`);
        } else if (pro.sc !== "month" && R.word(pro.sc).state === "changed" && !memo().alertOff) toast(sentence(R.word(pro.sc)));
      }
    });
    demo.querySelector('[data-demo="reset"]')?.addEventListener("click", () => { try { sessionStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }, true);
    // 조약돌 주기는 관리 탭을 여니 "오늘"에서 손 뗌
    demo.querySelector('[data-demo="pebble"]')?.addEventListener("click", () => { pro.on = false; }, true);
  }

  // sc: 지금 장면 이름. 다른 탭(뉴스 등)이 오늘 탭과 같은 시각의 가격을 쓰려면 DaliRules.nowPrice(sym, daliPro.sc)로 읽는다
  window.daliPro = { show, scene: k => demo?.querySelector(`[data-scene="${k}"]`)?.click(), get sc() { return pro.sc; } };
})();
