/* ---------- 달이 2.0 규칙 (국내주식) ----------
   숫자는 전부 여기서 나온다. AI는 문장만 다듬는다. 그래서 시연마다 같은 숫자가 나온다.
   dali-customer.js 다음, dali-pro.js 앞에 불러온다. */
const DaliRules = (function () {
  const C = DALI_CUSTOMER, M = DALI_MARKET;
  const price = sym => DALI_SYMS[sym].price;
  const prevClose = sym => Math.round(price(sym) / (1 + DALI_SYMS[sym].chg / 100));
  // 시연 시각의 현재가. 아침은 어제 종가, 장중은 가상 등락, 마감은 어제 종가 그대로(10월 28일 종가를 오늘로 씀)
  // 월말(10월 31일)은 10월 28일 종가에서 그날 등락만큼 움직인 값. 그래야 합계와 "오늘" 변화가 맞음
  const nowPrice = (sym, sc) => sc === "morning" ? price(sym)
    : sc === "month" ? Math.round(price(sym) * (1 + M.month.pct[sym] / 100))
    : Math.round(prevClose(sym) * (1 + M[sc].pct[sym] / 100));
  const todayPct = (sym, sc) => sc === "morning" ? DALI_SYMS[sym].chg : M[sc].pct[sym];

  const fmtWon = n => `${n < 0 ? "-" : "+"}${Math.abs(Math.round(n)).toLocaleString("ko-KR")}원`;

  /* --- 내 돈 한눈에 --- */
  function money(sc) {
    const pos = C.positions.map(p => {
      const now = nowPrice(p.sym, sc), pct = todayPct(p.sym, sc);
      return { ...p, now, value: p.qty * now, pnl: p.qty * (now - p.avg), pnlPct: (now / p.avg - 1) * 100, pct, today: p.qty * now * pct / (100 + pct) };
    }).sort((a, b) => b.value - a.value);
    const stockVal = pos.reduce((a, p) => a + p.value, 0);
    const total = stockVal + C.cash;
    const top = pos[0];
    return { pos, stockVal, total, top, topShare: top.value / total * 100, cashShare: C.cash / total * 100,
      today: pos.reduce((a, p) => a + p.today, 0), pnl: pos.reduce((a, p) => a + p.pnl, 0) };
  }

  /* --- 습관 거울 --- */
  const avg = l => l.length ? l.reduce((a, t) => a + t.pct, 0) / l.length : 0;
  function habits() {
    const T = C.trades, closed = T.filter(t => t.sell);
    const spike = T.filter(t => t.buyChg >= 5), waited = T.filter(t => t.waited);
    const quick = T.filter(t => t.soldIn24h), quickUp = quick.filter(t => t.sellSnap.later > 0);
    const kept = T.filter(t => t.days >= 7 && t.sell);
    const sym = {};
    T.forEach(t => { sym[t.sym] = (sym[t.sym] || 0) + 1; });
    return {
      count: T.length, thisMonth: C.month.trades,
      avgDays: closed.reduce((a, t) => a + t.days, 0) / closed.length,
      spike: { n: spike.length, avg: avg(spike) }, waited: { n: waited.length, avg: avg(waited) },
      kept: { n: kept.length, avg: avg(kept) },
      quick: { n: quick.length, up: quickUp.length, laterAvg: quickUp.length ? quickUp.reduce((a, t) => a + t.sellSnap.later, 0) / quickUp.length : 0 },
      most: Object.entries(sym).sort((a, b) => b[1] - a[1])[0],
      concentrated: money("morning").topShare >= 50,
    };
  }

  /* --- 비용과 지켜준 돈 --- */
  function costs() {
    const m = C.month;
    const saved = C.saved.reduce((a, s) => a + s.won, 0);
    return { fee: m.fee, tax: m.tax, cost: m.fee + m.tax, costShare: (m.fee + m.tax) / m.realized * 100, realized: m.realized,
      idle: Math.round(C.cash * C.rpRate / 12), saved, list: C.saved, perTrade: Math.round((m.fee + m.tax) / m.trades) };
  }

  /* --- 그동안 달라진 것 ---
     줄마다 끝맺음을 바꿔 쓴다 (라벨 없이 문장만). 비중은 어디서나 현금 포함 "내 돈" 기준 */
  const won = n => Math.round(n).toLocaleString("ko-KR") + "원";
  const sgn = n => (n > 0 ? "+" : "") + n.toFixed(1) + "%";
  const dayLabel = sc => (sc === "morning" ? "어제" : "오늘");
  // 맨 위 줄은 만 원 단위로 짧게 (카드 안 상세만 원 단위)
  const man = n => `${n < 0 ? "-" : n > 0 ? "+" : ""}${Math.round(Math.abs(n) / 10000).toLocaleString("ko-KR")}만 원`;
  function diff(sc) {
    const m = money(sc), h = habits(), ss = m.pos.find(p => p.sym === "삼성전자");
    const pend = C.pending, gap = nowPrice(pend.sym, sc) - pend.price;
    const L = (k, hd, t) => ({ k, h: hd, t });
    // 한 숫자는 한 곳에만: 줄 제목에 쓴 숫자는 본문에 다시 안 씀
    let lines = [], todo = [], noTodo = "";
    if (sc === "morning") {
      lines = [
        L("night", "밤사이 미국 반도체가 올랐어요", `어제 ${sgn(ss.pct)}로 끝난 삼성전자, 내 ${ss.qty}주는 ${man(ss.today)}`),
        L("order", `${pend.sym} ${pend.qty}주 매수는 대기 중`, `${won(pend.price)}에 걸어 둔 주문이라 오늘 시가에 다시 볼게요`),
        L("event", "내일 삼성전자 실적 발표", "지난 4번 실적일엔 평균 ±6% 움직였어요"),
      ];
      noTodo = "오늘 아침은 보기만 해도 괜찮아요";
    } else if (sc === "intraday") {
      lines = [
        L("shock", `삼성전자 ${sgn(ss.pct)}, 내 돈 ${man(ss.today)}`, `장 시작 뒤 4시간 동안 꾸준히 내렸고, 내 돈 전체로 보면 ${sgn(ss.today / m.total * 100)}`),
        L("habit", "급하게 판 날의 기록", `손실 난 날 바로 판 ${h.quick.n}번 중 ${h.quick.up}번은 2주 뒤 더 올라 있었어요`),
        L("watch", `SK하이닉스 ${sgn(todayPct("SK하이닉스", sc))}`, `관심종목이에요. 급등한 날 바로 산 지난 ${h.spike.n}번은 평균 ${sgn(h.spike.avg)}로 끝났고요`),
      ];
      noTodo = "팔거나 살 이유가 새로 생긴 건 아니라서, 지금은 지켜보기만 해도 돼요";
    } else if (sc === "close") {
      lines = [
        L("close", `삼성전자 ${sgn(ss.pct)} 마감`, `내 ${ss.qty}주가 오늘 ${man(ss.today)}, 내 돈 전체로 보면 ${sgn(ss.today / m.total * 100)}`),
        L("fill", `${pend.sym} ${pend.qty}주 체결`, `장중 ${won(pend.price)}에 체결됐고, 그때 상황은 매매일지에 적어 뒀어요`),
        L("event", "내일 삼성전자 실적 발표", "지난 4번 중 2번은 발표 전날 크게 올랐어요"),
      ];
      noTodo = "오늘 안에 할 건 없어요. 내일 아침에 다시 알려 드릴게요";
    } else {
      const cost = C.month.fee + C.month.tax;
      lines = [
        L("month", `10월 실현 ${man(C.month.realized)}`, `10월에 끝낸 매매 ${C.month.trades}건의 결과예요`),
        L("cost", `수수료와 세금 ${man(cost).replace("+", "")}`, `실현 수익의 ${Math.round(cost / C.month.realized * 100)}%가 비용으로 나갔어요`),
      ];
      noTodo = "월말 정리를 읽어 보기만 하면 돼요";
      // 네 장면 중 할 일이 있는 장면 하나: 쉬는 현금
      todo.push({ t: `현금 ${man(C.cash).replace("+", "")}이 ${C.idleCashDays}일째 이자 없이 그대로예요` });
    }
    return { lines, todo, noTodo, since: C.lastSeen[sc], hours: C.lastSeenHours[sc] };
  }

  /* --- 오늘 탭 맨 위 행동 카드 하나 ---
     { top, title, sub, sym, btns: [[kind, sym, label]] }. kind: "order"(주문), "news"(그 종목 뉴스), "journal"(매매일지 탭) */
  function action(sc) {
    const m = money(sc), ss = m.pos.find(p => p.sym === "삼성전자"), pend = C.pending;
    if (sc === "morning") return { sym: pend.sym, top: "걸어 둔 주문", title: `${pend.sym} ${pend.qty}주 ${won(pend.price)} 매수 대기`,
      sub: `지금 ${won(nowPrice(pend.sym, sc))}, 9시 시가에 다시 봐요`, btns: [["order", pend.sym, "주문 정정"], ["news", pend.sym, `${pend.sym} 보기`]] };
    if (sc === "intraday") return { sym: ss.sym, top: "지금 크게 움직여요", title: `${ss.sym} ${sgn(ss.pct)}, 내 ${ss.qty}주 ${fmtWon(ss.today)}`,
      sub: `장 시작 뒤 4시간 동안 내렸고, 내 돈 전체로 보면 ${sgn(ss.today / m.total * 100)}`, btns: [["order", ss.sym, `${ss.sym} 주문`], ["news", ss.sym, "차트 보기"]] };
    if (sc === "close") return { sym: pend.sym, top: "체결됐어요", title: `${pend.sym} ${pend.qty}주 ${won(pend.price)}에 체결`,
      sub: "살 때 상황은 매매일지에 적어 뒀어요", btns: [["journal", "", "매매일지"], ["news", pend.sym, `${pend.sym} 보기`]] };
    return { sym: "", top: "이번 달", title: `10월 실현 ${fmtWon(C.month.realized)}`,
      sub: `끝낸 매매 ${C.month.trades}건, 수수료와 세금 ${won(C.month.fee + C.month.tax)}`, btns: [["journal", "", "매매일지"]] };
  }

  /* --- 알림 → 행동 → 결과 흐름에 쓰는 숫자 ---
     intraday: 오늘 내린 금액과 평단 기준 평가손익(지금 팔면 확정될 손익)
     close: 장중 11:40 대비 마감까지 삼성전자가 되돌아온 폭
     month: 손실 난 날 바로 판 횟수, 달별 (판 날 기준) */
  function flow(sc) {
    const ss = sc === "month" ? null : money(sc).pos.find(p => p.sym === "삼성전자");
    const out = { sc };
    if (sc === "intraday") out.intraday = { sym: ss.sym, today: Math.round(ss.today), pnl: Math.round(ss.pnl), pnlPct: ss.pnlPct, pct: ss.pct };
    if (sc === "close") {
      const a = money("intraday").pos.find(p => p.sym === "삼성전자");
      out.recover = { sym: ss.sym, fromPct: a.pct, toPct: ss.pct, from: a.now, to: ss.now, won: (ss.now - a.now) * ss.qty, pnlFrom: Math.round(a.pnl), pnlTo: Math.round(ss.pnl) };
    }
    if (sc === "month") {
      const by = mo => C.trades.filter(t => t.soldIn24h && t.sell && t.sell.startsWith(mo + "/")).length;
      out.quickSell = { aug: by("08"), sep: by("09"), oct: by("10") };
    }
    return out;
  }

  /* --- 내 시간 띠: 마지막으로 닫은 때부터 지금까지, 나에게 영향 준 선 하나와 달이가 본 일 ---
     선은 끝값에 맞춘 시연용 경로 (같은 장면이면 늘 같은 모양) */
  const TL = {
    morning: { from: "어제 20:10", to: "지금 07:00", what: "미국 반도체, 삼성전자와 같은 업종", start: 0, end: 2.6,
      events: [[0.24, "미국 장 시작"], [0.7, "미국 마감"]] },
    intraday: { from: "07:40", to: "지금 11:40", what: "삼성전자", start: 0, end: -3.8,
      events: [[0.33, "장 시작"], [0.7, "-2% 아래로"]] },
    close: { from: "11:20", to: "지금 15:40", what: "삼성전자", start: -3.8, end: 9.0,
      events: [[0.41, "현대차 체결"], [0.72, "+5% 위로"]] },
  };
  function timeline(sc) {
    if (sc === "month") {
      // 월말: 3개월 매매 20건을 날짜 순서대로 점으로. 위는 이익, 아래는 손실
      const T = C.trades, n = T.length;
      return { from: "8월", to: "10월 말", what: "내 매매 20건", dots: T.map((t, i) => ({ x: (i + 0.5) / n, y: t.pct, spike: t.buyChg >= 5 })) };
    }
    const c = TL[sc], N = 60, pts = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N, ease = x * x * (3 - 2 * x);
      const wob = Math.sin(x * 17 + sc.length) * 0.5 + Math.sin(x * 41) * 0.25;
      pts.push({ x, y: c.start + (c.end - c.start) * ease + wob * (1 - Math.abs(2 * x - 1)) * Math.abs(c.end - c.start) * 0.12 });
    }
    return { ...c, series: pts, events: c.events.map(([x, label]) => ({ x, label, y: pts[Math.round(x * N)].y })) };
  }

  /* --- 같은 뉴스, 내 맥락으로: 지금이 언제인지, 뭘 들고 있는지, 어떻게 매매해 왔는지 --- */
  function forMe(sym, sc) {
    const m = money(sc), p = m.pos.find(x => x.sym === sym), pc = todayPct(sym, sc), day = dayLabel(sc);
    const mine = C.trades.filter(t => t.sym === sym), h = habits();
    const out = [];
    if (p) {
      const share = Math.round(p.value / m.total * 100);
      out.push(`${day} ${sgn(pc)}로 내 ${p.qty}주가 ${fmtWon(p.today)}. 내 돈의 ${share}%라 전체로는 ${sgn(pc * share / 100)}`);
      if (sc === "morning") out.push("장이 열리기 전이라 지금 움직일 건 없어요");
      else if (sc === "intraday" && pc < 0) out.push(`손실 난 날 바로 판 ${h.quick.n}번 중 ${h.quick.up}번은 2주 뒤 더 올라 있었어요`);
      else if (sc === "month") out.push(`이번 달 이 종목 매매는 ${mine.filter(t => t.buy.startsWith("10/")).length}번`);
    } else {
      out.push("관심종목이라 내 돈엔 영향이 없어요");
      if (pc >= 5) out.push(`급등한 날 바로 산 지난 ${h.spike.n}번은 평균 ${sgn(h.spike.avg)}였어요`);
      else if (mine.length) out.push(`지난 3개월 이 종목 매매 ${mine.length}번, 평균 ${sgn(avg(mine))}`);
    }
    return out.join(". ");
  }

  /* --- 카드 순서: 내 돈 영향 금액 × 시급성 × 행동 관련 --- */
  function priority(sc) {
    const m = money(sc);
    const s = {
      stock: Math.abs(m.today) * (sc === "intraday" ? 3 : 1) + 1,
      money: 600000,
      news: sc === "intraday" ? 900000 : 400000,
      calendar: sc === "morning" || sc === "close" ? 800000 : 300000,
      costs: sc === "month" ? 5e9 : 350000,
      habits: sc === "month" ? 6e9 : sc === "intraday" ? 700000 : 200000,
      review: sc === "month" ? 7e9 : 0,
    };
    return Object.keys(s).sort((a, b) => s[b] - s[a]);
  }

  /* --- 달이 3.0: 산 순간의 사진과 지금을 비교 ---
     비교 축은 다섯 개뿐. 가격은 비교하지 않는다 (-3.8%여도 사진이 그대로면 같음).
     이유는 추정하지 않고, 사라 팔아라도 말하지 않는다. "달라요"는 사실 통보 */
  const AXES = ["trend", "support", "volume", "sector", "vol"];
  const AX_LABEL = { trend: "추세", support: "지지선", volume: "거래량", sector: "업종", vol: "변동" };
  const AX_WORD = {
    trend: { up: "↑", flat: "→", down: "↓" }, sector: { up: "↑", flat: "→", down: "↓" },
    support: { true: "위", false: "아래" }, volume: { high: "많음", normal: "보통", low: "적음" }, vol: { calm: "차분", wild: "큼" },
  };
  // 사진 한 장을 다섯 칸 단어로: [{ k, label, word }]
  const axes = snap => AXES.map(k => ({ k, label: AX_LABEL[k], word: AX_WORD[k][String(snap[k])] }));
  function same(a, b) {
    const diff = AXES.filter(k => a[k] !== b[k]);
    return { same: !diff.length, diff };
  }
  // 보유 종목 하나: 들고 있는 매매(아직 안 판 것)의 산 순간 사진 전부와 지금 사진을 비교. 하나라도 다르면 다름
  function alive(sym, sc) {
    const held = C.trades.filter(t => t.sym === sym && !t.sell);
    const nowSnap = { ...M[sc].nowSnap[sym], price: nowPrice(sym, sc) };
    const diff = [...new Set(held.flatMap(t => same(t.buySnap, nowSnap).diff))].sort((a, b) => AXES.indexOf(a) - AXES.indexOf(b));
    const pos = C.positions.find(p => p.sym === sym);
    return { sym, same: !diff.length, diff, since: pos ? pos.bought : held[0].buy, buySnap: held[0].buySnap, nowSnap };
  }
  // 첫 화면 한 단어. 보유 종목 전부가 같으면 same, 하나라도 다르면 changed와 그 종목
  function word(sc) {
    const syms = C.positions.map(p => alive(p.sym, sc)).filter(a => !a.same).map(a => a.sym);
    return { state: syms.length ? "changed" : "same", syms, since: C.positions.map(p => [p.sym, p.bought]) };
  }
  // 근거 문장: 같은 축은 지금 상태 한 줄, 달라진 축은 지금과 산 순간을 같이
  const DIR_NOW = { up: "올라요", flat: "옆으로 가요", down: "내려요" }, DIR_THEN = { up: "올랐어요", flat: "옆으로 갔어요", down: "내렸어요" };
  const TREND_NOW = { up: "올라가요", flat: "평평해요", down: "내려가요" }, TREND_THEN = { up: "올라갔어요", flat: "평평했어요", down: "내려갔어요" };
  const VOL_NOW = { high: "평소보다 많아요", normal: "평소만큼이에요", low: "평소보다 적어요" }, VOL_THEN = { high: "많았어요", normal: "평소만큼이었어요", low: "적었어요" };
  const WILD_NOW = { calm: "차분해요", wild: "커요" }, WILD_THEN = { calm: "차분했어요", wild: "컸어요" };
  function sameLine(k, sym, n) {
    const sec = DALI_SECTOR[sym];
    if (k === "trend") return n.trend === "up" ? "추세 위" : n.trend === "flat" ? "추세 옆으로" : "추세 아래";
    if (k === "support") return n.support ? `지지선 ${won(n.lo20)} 위예요` : `지지선 ${won(n.lo20)} 아래예요`;
    if (k === "volume") return `거래량 ${VOL_NOW[n.volume]}`;
    if (k === "sector") return n.sector === "up" ? `${sec} 업종 같이 올라요` : `${sec} 업종은 ${DIR_NOW[n.sector]}`;
    return `하루 변동이 ${WILD_NOW[n.vol]}`;
  }
  function diffLine(k, sym, n, b) {
    const sec = DALI_SECTOR[sym];
    if (k === "sector") return `${sec} 업종이 ${n.sectorRun ? `${n.sectorRun}일째 ` : ""}${DIR_NOW[n.sector]} (샀을 땐 ${DIR_THEN[b.sector]})`;
    if (k === "trend") return `20일선이 ${TREND_NOW[n.trend]} (샀을 땐 ${TREND_THEN[b.trend]})`;
    if (k === "support") return n.support ? "지지선 위로 올라왔어요 (샀을 땐 아래였어요)" : `지지선 ${won(n.lo20)} 아래로 내려왔어요 (샀을 땐 위였어요)`;
    if (k === "volume") return `거래량이 ${VOL_NOW[n.volume]} (샀을 땐 ${VOL_THEN[b.volume]})`;
    return `하루 변동이 ${WILD_NOW[n.vol]} (샀을 땐 ${WILD_THEN[b.vol]})`;
  }
  // 펼쳤을 때 근거 최대 3줄. 달라진 축이 먼저, 그다음 같은 축 (추세와 지지선은 한 줄로 묶음)
  function why(sym, sc) {
    const a = alive(sym, sc), n = a.nowSnap, b = a.buySnap, pc = todayPct(sym, sc);
    const lines = a.diff.map(k => diffLine(k, sym, n, b));
    const keep = AXES.filter(k => !a.diff.includes(k));
    const same3 = [];
    if (keep.includes("trend") && keep.includes("support"))
      same3.push(pc < 0 ? `오늘 ${sgn(pc)}지만 지지선 ${won(n.lo20)} 위예요` : `${sameLine("trend", sym, n)}, ${sameLine("support", sym, n)}`);
    else keep.filter(k => k === "trend" || k === "support").forEach(k => same3.push(sameLine(k, sym, n)));
    if (keep.includes("volume")) same3.push(sameLine("volume", sym, n) + (keep.includes("vol") && n.vol === "calm" ? ", 하루 변동도 차분해요" : ""));
    if (keep.includes("sector")) same3.push(sameLine("sector", sym, n));
    return lines.concat(same3).slice(0, 3);
  }
  // 10월 리포트: 그 달에 판 매매 목록과 두 사진, 다른 축만. 요약, 해석, 통계는 없다
  const pnlOf = t => Math.round(t.qty * (t.price || t.buySnap.price) * t.pct / 100 / 100) * 100;
  function report(month = "10") {
    const list = C.trades.filter(t => t.sell && t.sell.startsWith(month + "/"))
      .sort((a, b) => b.sell.localeCompare(a.sell) || b.id - a.id)
      .map(t => ({ id: t.id, sym: t.sym, qty: t.qty, buy: t.buy, sell: t.sell, pnl: pnlOf(t), pct: t.pct,
        buySnap: t.buySnap, sellSnap: t.sellSnap, diff: same(t.buySnap, t.sellSnap).diff, later: t.sellSnap.later }));
    return { month, list };
  }
  // 매매일지 한 줄에 붙는 짧은 말: 살 때 축 두 개(나중에 달라진 축 먼저), 팔 때 같음 또는 달라짐. 보유 중이면 지금과 비교
  function brief(id, sc) {
    const t = C.trades.find(x => x.id === id);
    if (!t) return null;
    const other = t.sellSnap || { ...M[sc].nowSnap[t.sym] };
    const d = same(t.buySnap, other).diff;
    const pick = (d.length ? d : []).concat(["trend", "sector", "volume"]).filter((k, i, l) => l.indexOf(k) === i).slice(0, 2);
    return { buy: pick.map(k => `${AX_LABEL[k]} ${AX_WORD[k][String(t.buySnap[k])]}`), held: !t.sell, same: !d.length, diff: d };
  }

  return { same, alive, word, why, report, brief, axes, AX_LABEL, money, habits, costs, diff, action, flow, forMe, dayLabel, timeline, priority, fmtWon, nowPrice, todayPct };
})();
