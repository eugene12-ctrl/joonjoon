/* ---------- 달이 2.0 규칙 (국내주식) ----------
   숫자는 전부 여기서 나온다. AI는 문장만 다듬는다. 그래서 시연마다 같은 숫자가 나온다.
   dali-customer.js 다음, dali-pro.js 앞에 불러온다. */
const DaliRules = (function () {
  const C = DALI_CUSTOMER, M = DALI_MARKET;
  const price = sym => DALI_SYMS[sym].price;
  const prevClose = sym => Math.round(price(sym) / (1 + DALI_SYMS[sym].chg / 100));
  // 시연 시각의 현재가. 아침은 어제 종가, 장중은 가상 등락, 마감은 어제 종가 그대로(10월 28일 종가를 오늘로 씀)
  const nowPrice = (sym, sc) => sc === "morning" || sc === "month" ? price(sym) : Math.round(prevClose(sym) * (1 + M[sc].pct[sym] / 100));
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
    const quick = T.filter(t => t.soldIn24h), quickUp = quick.filter(t => t.later > 0);
    const kept = T.filter(t => t.days >= 7 && t.sell);
    const sym = {};
    T.forEach(t => { sym[t.sym] = (sym[t.sym] || 0) + 1; });
    return {
      count: T.length, thisMonth: C.month.trades,
      avgDays: closed.reduce((a, t) => a + t.days, 0) / closed.length,
      spike: { n: spike.length, avg: avg(spike) }, waited: { n: waited.length, avg: avg(waited) },
      kept: { n: kept.length, avg: avg(kept) },
      quick: { n: quick.length, up: quickUp.length, laterAvg: quickUp.length ? quickUp.reduce((a, t) => a + t.later, 0) / quickUp.length : 0 },
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
  function diff(sc) {
    const m = money(sc), h = habits(), ss = m.pos.find(p => p.sym === "삼성전자");
    const share = Math.round(m.topShare), pend = C.pending, gap = nowPrice(pend.sym, sc) - pend.price;
    const lines = [], todo = [];
    let noTodo = "";
    if (sc === "morning") {
      lines.push({ k: "night", t: `밤사이 미국 반도체 대형주가 올라 마감했고, 삼성전자는 어제 ${sgn(ss.pct)}로 끝나 내 ${ss.qty}주가 ${fmtWon(ss.today)} 늘었어요` });
      lines.push({ k: "order", t: `어제 저녁 걸어 둔 ${pend.sym} ${pend.qty}주 ${won(pend.price)} 매수는 아직 체결 전이라 오늘 시가에 다시 볼게요` });
      lines.push({ k: "event", t: `내일은 삼성전자 실적 발표 예정일. 지난 4번 실적일 평균 변동이 ±6%인데 이 종목이 내 돈의 ${share}%를 차지해요` });
      lines.push({ k: "cash", t: `현금 ${won(C.cash)}은 ${C.idleCashDays}일째 그대로고, 이번 달 배당금 ${won(C.dividend)}도 함께 쉬는 중` });
      noTodo = "현대차 주문은 걸려 있고 실적 발표는 내일이라, 오늘 아침은 보기만 해도 괜찮아요";
    } else if (sc === "intraday") {
      lines.push({ k: "shock", t: `장 시작 뒤 4시간 동안 꾸준히 내렸고, 내 돈 전체로 보면 ${sgn(ss.today / m.total * 100)}예요` });
      lines.push({ k: "habit", t: `지난 3개월 동안 손실 난 날 바로 판 ${h.quick.n}번 중 ${h.quick.up}번은 2주 뒤 더 올라 있었고, 평균으로는 ${sgn(h.quick.laterAvg)}` });
      lines.push({ k: "watch", t: `관심종목 SK하이닉스는 ${sgn(todayPct("SK하이닉스", sc))}. 급등한 날 바로 산 지난 ${h.spike.n}번은 평균 ${sgn(h.spike.avg)}로 끝난 자리예요` });
      lines.push({ k: "order", t: `${pend.sym} ${pend.qty}주 매수 주문은 ${won(pend.price)}에 걸려 있고, 지금 가격이 지정가보다 ${won(gap)} 위라 아직 체결 전` });
      noTodo = "팔거나 살 이유가 새로 생긴 건 아니라서, 지금은 지켜보기만 해도 돼요";
    } else if (sc === "close") {
      lines.push({ k: "close", t: `내 ${ss.qty}주가 오늘 ${fmtWon(ss.today)}, 내 돈 전체로 보면 ${sgn(ss.today / m.total * 100)}` });
      lines.push({ k: "fill", t: `${pend.sym} ${pend.qty}주는 장중에 ${won(pend.price)}에 체결됐고, 그때 상황은 매매일지에 적어 뒀어요` });
      lines.push({ k: "conc", t: `이제 삼성전자가 내 돈의 ${share}%. 이 종목이 5% 내리면 내 돈 전체가 ${(share * 0.05).toFixed(1)}% 줄어요` });
      lines.push({ k: "event", t: "내일 실적 발표를 앞둔 종목이고, 지난 4번 중 2번은 발표 전날 크게 올랐어요" });
      noTodo = "오늘 안에 할 건 없고, 내일 아침 실적 발표 전에 다시 알려 드릴게요";
    } else {
      lines.push({ k: "month", t: `10월에는 ${C.month.trades}번 매매해서 ${fmtWon(C.month.realized)}을 실현했어요` });
      lines.push({ k: "cost", t: `수수료와 세금으로 ${won(C.month.fee + C.month.tax)}이 나가, 실현 수익의 ${Math.round((C.month.fee + C.month.tax) / C.month.realized * 100)}%가 비용이었고요` });
      lines.push({ k: "habit", t: "이번 달 습관 거울과 달이가 지켜준 돈은 아래에 모아 뒀어요" });
      noTodo = "월말 정리를 읽어 보기만 하면 돼요";
      // 네 장면 중 할 일이 있는 장면 하나: 쉬는 현금 (한 번 누르면 끝나는 일만 할 일로 둠)
      todo.push({ t: `현금 ${won(C.cash)}이 ${C.idleCashDays}일째 이자 없이 그대로예요` });
    }
    // 줄마다 굵은 제목 하나 (첫 화면엔 제목만 크게, 문장은 그 아래 작게)
    const H = {
      night: "밤사이 미국 반도체가 올랐어요", order: `${pend.sym} 매수는 아직 대기 중`, event: "내일 삼성전자 실적 발표",
      cash: `현금 ${Math.round(C.cash / 10000)}만 원이 ${C.idleCashDays}일째 쉬는 중`,
      shock: `삼성전자 ${sgn(ss.pct)}, 내 돈 ${ss.today < 0 ? "-" : "+"}${Math.round(Math.abs(ss.today) / 10000)}만 원`, habit: "급하게 판 날의 기록", watch: `SK하이닉스 ${sgn(todayPct("SK하이닉스", sc))}`,
      close: `삼성전자 ${sgn(ss.pct)} 마감`, fill: `${pend.sym} ${pend.qty}주 체결`, conc: `삼성전자가 내 돈의 ${share}%`,
      month: `10월 실현 ${fmtWon(C.month.realized)}`, cost: `비용 ${won(C.month.fee + C.month.tax)}`,
    };
    if (sc === "month") H.habit = "이번 달 정리";
    lines.forEach(l => { l.h = H[l.k] || ""; });
    return { lines, todo, noTodo, since: C.lastSeen[sc], hours: C.lastSeenHours[sc] };
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
      else if (mine.length) out.push(`지난 3개월에 ${mine.length}번 사고팔아 평균 ${sgn(avg(mine))}`);
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

  return { money, habits, costs, diff, forMe, dayLabel, timeline, priority, fmtWon, nowPrice, todayPct };
})();
