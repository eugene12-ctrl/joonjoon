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
  // 긴 목록은 몇 줄만 보이고 "더 보기". 장면을 바꾸면 다시 접힘
  const fold = (key, items, n) => {
    if (items.length <= n || pro.open[key]) return items.join("");
    return items.slice(0, n).join("") + `<li class="dali-pro-more"><button type="button" data-pro="more" data-k="${key}">${items.length - n}개 더 보기</button></li>`;
  };

  // 장면마다 해달 얼굴. 그림이 없으면 기본 얼굴
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  // 그림이 들어온 장면만 여기에 적는다 (없는 파일을 부르면 콘솔에 404가 남아서)
  const FACES = [];
  const face = sc => (FACES.includes(sc) ? `${BASE}img/face-${sc}.png` : `${BASE}dali-face.png`);

  /* ---------- 첫 화면: 토스증권 "내 종목"처럼 목록이 전부 ----------
     따로 요약 화면을 두지 않는다. 달이가 본 것은 그 종목 줄 안에 해달 얼굴과 한 줄로 붙는다.
     시각(아침, 장중, 마감, 월말)에 따라 가격과 한 줄이 바뀐다. 줄을 누르면 그 종목 화면(주문까지 한 번)으로 */
  const FACE_S = `${BASE}dali-face.png`;
  const short = t => t.replace(/s*(.*?)/g, "");
  // 종목 하나에 달이가 붙일 한 줄. 같은 줄에 이미 보이는 가격과 등락은 다시 말하지 않고,
  // 이 장면에서 고객이 몰랐을 것만: 내 돈에서의 몫, 걸어 둔 주문, 다가오는 일정, 내 지난 기록
  const man = n => `${n < 0 ? "-" : "+"}${Math.round(Math.abs(n) / 10000).toLocaleString("ko-KR")}만 원`;
  function noteFor(sym) {
    const sc = pro.sc, m = R.money(sc), h = R.habits(), p = m.pos.find(x => x.sym === sym);
    const share = p ? Math.round(p.value / m.total * 100) : 0;
    const ev = M.calendar.find(e => e.sym === sym);
    const when = ev && (ev.date === "10월 30일" ? (sc === "month" ? "" : "내일") : ev.date.replace("월 ", "/").replace("일", ""));
    if (sym === C.pending.sym) {
      if (sc === "close") return `${C.pending.qty}주 더 체결됐어요. 매매일지에 적어 뒀어요`;
      if (sc !== "month") return `${C.pending.qty}주 ${won(C.pending.price)} 매수 걸어 둠, 아직 대기`;
    }
    if (p && sc === "intraday" && p.today < 0) return `내 돈 ${man(p.today)}, 내 돈의 ${share}%가 이 종목`;
    if (p && share >= 50 && ev && when) return `${when} 실적 발표. 내 돈의 ${share}%가 이 종목이에요`;
    if (!p && R.todayPct(sym, sc) >= 5) return `급등한 날 바로 산 지난 ${h.spike.n}번은 평균 ${pct(h.spike.avg)}였어요`;
    if (sc === "month") { const t = C.trades.filter(x => x.sym === sym && x.sell && x.sell.startsWith("10/")); if (t.length) return `10월에 ${t.length}번 사고팔아 ${pct(t.reduce((a, x) => a + x.pct, 0) / t.length)}`; }
    if (ev && when) return `${when} ${ev.what.replace(sym + " ", "").replace(/ 예정$/, "")}`;
    return "";
  }
  function cashNote() {
    if (pro.sc === "month") return `${C.idleCashDays}일째 이자 없이 그대로예요`;
    if (pro.sc === "morning") return `이번 달 배당금 ${won(C.dividend)}도 여기 들어와 있어요`;
    return "";
  }
  function row(sym, sub, value, p, held) {
    const n = newsOf(sym);
    return `<li><button type="button" class="dali-pro-row" ${n ? `data-pro-news="${n.id}"` : ""}>
      <i class="dali-pro-logo">${sym[0]}</i>
      <span class="dali-pro-name"><b>${sym}</b><small>${sub}</small></span>
      <span class="dali-pro-val"><b>${won(value)}</b><small class="${tone(p)}">${pct(p)}</small></span>
    </button></li>`;
  }

  // 달이가 먼저 하는 말: 지금 시각, 내 보유, 내 지난 기록을 엮어 두세 문장. 숫자는 전부 규칙에서
  function say() {
    const sc = pro.sc, m = R.money(sc), h = R.habits(), ss = m.pos.find(p => p.sym === "삼성전자");
    const share = Math.round(ss.value / m.total * 100);
    const T = {
      morning: `밤사이 미국 반도체가 올랐고, 삼성전자는 어제 ${pct(ss.pct)}로 끝나 내 ${ss.qty}주가 ${man(ss.today)}이에요. 내일 실적 발표가 있는데 이 종목이 내 돈의 ${share}%라, 오늘 아침은 지켜보기만 해도 괜찮아요.`,
      intraday: `삼성전자가 4시간 새 ${pct(ss.pct)}, 내 돈으로 ${man(ss.today)}이에요. 지난 석 달 손실 난 날 바로 판 ${h.quick.n}번 중 ${h.quick.up}번은 2주 뒤 더 올라 있었어요. 팔 이유가 새로 생긴 건 아니에요.`,
      close: `삼성전자가 ${pct(ss.pct)}로 마감해 내 ${ss.qty}주가 ${man(ss.today)}이에요. 현대차 ${C.pending.qty}주는 체결돼서 매매일지에 적어 뒀어요. 내일 실적 발표 전에 다시 알려 드릴게요.`,
      month: `10월엔 ${C.month.trades}번 매매해 ${man(C.month.realized)}을 실현했고, 수수료와 세금이 그중 ${Math.round((C.month.fee + C.month.tax) / C.month.realized * 100)}%였어요. 현금 ${man(C.cash).replace("+", "")}이 ${C.idleCashDays}일째 이자 없이 쉬고 있어요.`,
    };
    const read = {
      morning: [`어제 20:10 이후 밤사이 뉴스 읽는 중`, `내 종목 ${m.pos.length + C.watch.length}개와 걸어 둔 주문 확인하는 중`],
      intraday: ["오늘 07:40 이후 시세 읽는 중", `내 매매 ${h.count}건과 비교하는 중`],
      close: ["장 마감 시세와 체결 읽는 중", "내일 일정 확인하는 중"],
      month: [`10월 매매 ${C.month.trades}건과 비용 읽는 중`, "쉬고 있는 돈 찾는 중"],
    };
    return { key: `say-${sc}`, steps: read[sc], text: T[sc], basis: "내 보유와 걸어 둔 주문, 지난 3개월 매매 기록을 보고 썼어요." };
  }

  // 지금 할 수 있는 행동 하나. 장면(시각)과 내 보유, 걸어 둔 주문으로 고르고, 버튼은 그 일을 하는 화면으로 바로
  function action() {
    const sc = pro.sc, m = R.money(sc), ss = m.pos.find(p => p.sym === "삼성전자"), pend = C.pending;
    const why = sym => (newsOf(sym) || {}).why || "";
    if (sc === "morning") return { sym: pend.sym, top: "걸어 둔 주문", title: `${pend.sym} ${pend.qty}주 ${won(pend.price)} 매수 대기`,
      sub: `지금 ${won(R.nowPrice(pend.sym, sc))}, 9시 시가에 다시 봐요`, btns: [["order", pend.sym, "주문 정정"], ["news", pend.sym, "현대차 보기"]] };
    if (sc === "intraday") return { sym: "삼성전자", top: "지금 크게 움직여요", title: `삼성전자 ${pct(ss.pct)}, 내 ${ss.qty}주 ${signed(ss.today)}`,
      sub: why("삼성전자"), btns: [["order", "삼성전자", "삼성전자 주문"], ["news", "삼성전자", "차트 보기"]] };
    if (sc === "close") return { sym: pend.sym, top: "체결됐어요", title: `${pend.sym} ${pend.qty}주 ${won(pend.price)}에 체결`,
      sub: "살 때 상황은 매매일지에 적어 뒀어요", btns: [["journal", "", "매매일지"], ["news", pend.sym, "현대차 보기"]] };
    return { sym: "", top: "이번 달", title: `10월 실현 ${signed(C.month.realized)}`,
      sub: `${C.month.trades}번 매매, 수수료와 세금 ${won(C.month.fee + C.month.tax)}`, btns: [["journal", "", "매매일지"]] };
  }
  function hero() {
    const m = R.money(pro.sc), day = R.dayLabel(pro.sc), a = action();
    const held = m.pos.map(p => row(p.sym, `${p.qty}주`, p.value, p.pct, true));
    const watch = C.watch.map(s => row(s, "관심", R.nowPrice(s, pro.sc), R.todayPct(s, pro.sc), false));
    return `
      <section class="dali-pro-act">
        <p class="dali-pro-act-top"><img src="${FACE_S}" alt="달이">${a.top}</p>
        <h2>${paintNums(a.title)}</h2>
        ${a.sub ? `<p class="dali-pro-act-sub">${a.sub}</p>` : ""}
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

  // 장면의 등락에 맞춘 하루 흐름 선 (종목마다 같은 모양)
  function mini(sym, p) {
    const seed = [...sym].reduce((a, c) => a + c.charCodeAt(0), 0), N = 24, pts = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      pts.push(p * x * x + Math.sin(x * (5 + seed % 6) + seed) * Math.abs(p || 1) * (0.14 + seed % 3 * 0.06) * (1 - x * 0.5));
    }
    const lo = Math.min(0, ...pts), hi = Math.max(0, ...pts), span = hi - lo || 1;
    const Y = v => (4 + (hi - v) / span * 24).toFixed(1);
    const d = pts.map((v, i) => `${i ? "L" : "M"}${(i / N * 60).toFixed(1)} ${Y(v)}`).join(" ");
    return `<svg class="dali-pro-mini ${tone(p)}" viewBox="0 0 60 32" aria-hidden="true"><line x1="0" x2="60" y1="${Y(0)}" y2="${Y(0)}"/><path d="${d}"/></svg>`;
  }

  const CARDS = {
    money() {
      const m = R.money(pro.sc), parts = [...m.pos.map(p => ({ name: p.sym, v: p.value })), { name: "현금", v: C.cash }];
      return `
        <section class="dali-pro-card">
          <h3>내 돈 한눈에</h3>
          <p class="dali-pro-big">${won(m.total)}</p>
          <p class="dali-pro-sub">${R.dayLabel(pro.sc)} <b class="${tone(m.today)}">${signed(m.today)}</b><span>평가손익 <b class="${tone(m.pnl)}">${signed(m.pnl)}</b></span></p>
          <div class="dali-pro-stack" role="img" aria-label="자산 구성">
            ${parts.map((p, i) => `<i class="s${i}" style="width:${(p.v / m.total * 100).toFixed(1)}%"></i>`).join("")}
          </div>
          <ul class="dali-pro-legend">
            ${parts.map((p, i) => `<li><i class="s${i}"></i>${p.name}<b>${Math.round(p.v / m.total * 100)}%</b></li>`).join("")}
          </ul>
          <p class="dali-pro-note">${m.top.sym} 한 종목이 내 돈의 ${Math.round(m.topShare)}%예요. 이 종목이 5% 내리면 내 돈 전체가 ${(Math.round(m.topShare) * 0.05).toFixed(1)}% 줄어요</p>
        </section>`;
    },
    stock() {
      const m = R.money(pro.sc), day = R.dayLabel(pro.sc);
      const row = (sym, sub, price, p) => {
        const n = newsOf(sym);
        return `<li><button type="button" class="dali-pro-stk" ${n ? `data-pro-news="${n.id}"` : "disabled"}>
          <span class="dali-pro-stk-name"><b>${sym}</b><small>${sub}</small></span>
          <span class="dali-pro-stk-price">${won(price)}<b class="${tone(p)}">${day} ${pct(p)}</b></span>
          ${mini(sym, p)}</button></li>`;
      };
      const held = m.pos.map(p => row(p.sym, `${p.qty}주`, p.now, p.pct));
      const watch = C.watch.map(s => row(s, "관심", R.nowPrice(s, pro.sc), R.todayPct(s, pro.sc)));
      return `<section class="dali-pro-card"><h3>내 종목</h3><ul class="dali-pro-list">${held.join("")}${watch.join("")}</ul></section>`;
    },
    // 같은 뉴스라도 지금 시각, 내 보유, 내 매매 기록에 따라 아래 문장이 달라짐 (DaliRules.forMe)
    news() {
      const list = DALI_NEWS.filter(n => DALI_SYMS[n.sym] && DALI_SYMS[n.sym].app === "stock");
      return `<section class="dali-pro-card"><h3>내 종목 소식</h3><ul class="dali-pro-list">
        ${fold("news", list.map(n => `<li><button type="button" class="dali-pro-news" data-pro-news="${n.id}">
          <span class="dali-pro-news-top"><b>${n.sym}</b><small>${n.time}</small></span>
          <span class="dali-pro-news-why">${n.why}</span>
          <span class="dali-pro-news-me">${paintNums(R.forMe(n.sym, pro.sc))}</span></button></li>`), 2)}</ul></section>`;
    },
    calendar() {
      return `<section class="dali-pro-card"><h3>다음 2주</h3><ul class="dali-pro-cal">
        ${fold("cal", M.calendar.map(c => {
          const [mo, d] = c.date.match(/\d+/g);
          return `<li><span class="dali-pro-date"><small>${mo}월</small><b>${d}</b></span><p><b>${c.what.replace(/ 예정$/, "")}</b><small>${c.note}</small></p></li>`;
        }), 3)}
      </ul></section>`;
    },
    costs() {
      const c = R.costs(), max = Math.max(...c.list.map(s => s.won));
      return `<section class="dali-pro-card">
        <h3>달이가 지켜준 돈</h3>
        <p class="dali-pro-big brand">${won(c.saved)}</p>
        <p class="dali-pro-sub">올해, 달이 알림을 보고 행동했을 때 아낀 금액</p>
        <ul class="dali-pro-bars">
          ${c.list.map(s => `<li><span class="dali-pro-bars-k">${s.what}<small>${s.n}번</small></span><b>${won(s.won)}</b>
            <i style="width:${(s.won / max * 100).toFixed(1)}%"></i></li>`).join("")}
        </ul>
        <div class="dali-pro-fee">
          <span>이번 달 수수료와 세금<small>실현 수익 ${won(c.realized)}의 ${Math.round(c.costShare)}%</small></span>
          <b>${won(c.cost)}</b>
        </div>
      </section>`;
    },
    habits() {
      const h = R.habits(), t = R.timeline("month"), mx = Math.max(...t.dots.map(d => Math.abs(d.y)));
      const lim = Math.max(...[h.spike.avg, h.waited.avg, h.kept.avg, h.quick.laterAvg].map(Math.abs));
      const row = (what, n, v, note) => `<li><span class="dali-pro-hab-k">${what}<small>${note || `${n}번`}</small></span>
        <span class="dali-pro-hab-bar"><i class="${tone(v)}" style="width:${(Math.abs(v) / lim * 50).toFixed(1)}%;${v < 0 ? "right:50%" : "left:50%"}"></i></span>
        <b class="${tone(v)}">${pct(v)}</b></li>`;
      return `<section class="dali-pro-card">
        <h3>내 습관 거울</h3>
        <p class="dali-pro-sub">매매 ${h.count}건. 위는 이익, 아래는 손실, 테두리는 급등일 매수</p>
        <div class="dali-pro-dotband" aria-hidden="true"><i class="dali-pro-zero"></i>
          ${t.dots.map(d => `<i class="dali-pro-dot ${d.y >= 0 ? "gain" : "loss"} ${d.spike ? "spike" : ""}" style="left:${(4 + d.x * 92).toFixed(1)}%;top:${(50 - d.y / mx * 38).toFixed(1)}%"></i>`).join("")}
        </div>
        <ul class="dali-pro-hab">
          ${row("급등한 날 바로 산 것", h.spike.n, h.spike.avg)}
          ${row("하루 기다렸다 산 것", h.waited.n, h.waited.avg)}
          ${row("일주일 넘게 들고 간 것", h.kept.n, h.kept.avg)}
          ${row("손실 난 날 바로 판 뒤 2주", h.quick.n, h.quick.laterAvg, `${h.quick.n}번 중 ${h.quick.up}번 더 올랐어요`)}
        </ul>
      </section>`;
    },
    review() {
      const oct = C.trades.filter(t => t.sell && t.sell.startsWith("10/"));
      if (!oct.length) return "";
      const best = oct.reduce((a, t) => (t.pct > a.pct ? t : a)), worst = oct.reduce((a, t) => (t.pct < a.pct ? t : a));
      const line = (label, t) => `<li><span>${label}<small>${t.sym} ${t.qty}주, ${t.buy} 사서 ${t.sell} 팜${t.waited ? ", 하루 기다렸다 삼" : t.buyChg >= 5 ? ", 급등한 날 삼" : ""}</small></span><b class="${tone(t.pct)}">${pct(t.pct)}</b></li>`;
      return `<section class="dali-pro-card"><h3>10월 돌아보기</h3><ul class="dali-pro-ledger">
        ${line("가장 좋았던 결정", best)}${line("비용이 컸던 결정", worst)}</ul></section>`;
    },
  };

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
      if (k === "order") window.dali.openOrder(sym);
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
    // 조약돌 주기는 관리 탭을 여니 "오늘"에서 손 뗌
    demo.querySelector('[data-demo="pebble"]')?.addEventListener("click", () => { pro.on = false; }, true);
  }

  window.daliPro = { show, scene: k => demo?.querySelector(`[data-scene="${k}"]`)?.click() };
})();
