/* ---------- 주간 돌아보기 (헤엄치는 달이의 선물) ----------
   관리 탭 > 달이 키우기 > "주간 돌아보기 카드" 줄의 "열기"를 누르면 dali.js가 이 화면을 .dali-page에 그린다.
   한 달 습관 리포트(dali-report.js)와 같은 옷을 입는다. 그래서 .dr 스타일을 그대로 쓰고 dali-week.css는 주간용 몇 줄만 덧댄다.
   매매는 dali-customer.js의 이번 주(10월 26일~30일) 매매에서 가져오고, 읽은 날은 리포트와 같은 가상 숫자다.
   평가하지 않고 본 것만 적는다. 지난주와 비교는 숫자만 두고 좋다 나쁘다를 말하지 않는다.
   되돌리려면 각 페이지에서 이 파일과 dali-week.css를 불러오는 줄을 지우면 된다. */
(function () {
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const IMG = n => `${BASE}img/${n}.png`;
  const C = typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null;

  /* --- 이번 주 (가상). 2026-10-26 월요일 ~ 10-30 금요일, 오늘은 29일 목요일 --- */
  const WEEK = { label: "이번 주", from: 26, to: 30, today: 29, sun: 25, text: "10월 26일 ~ 30일" };
  const LAST = { from: 19, to: 25 };                 // 지난주 (토요일 24일 매매가 있어 일요일까지)
  const READ_DAYS = [27, 28];                        // 리포트 읽은 날 (dali-report.js의 READ_DAYS와 같은 날)
  // 어제 저녁에 걸어 둔 현대차 매수가 오늘 장중에 체결됨 (dali-customer.js pending, 마감 장면과 같은 숫자)
  const FILLED = { day: 29, sym: "현대차", qty: 10, readDay: 28 };

  const day = s => (s && s.startsWith("10/") ? +s.slice(3) : null); // 10월 날짜만, 다른 달은 제외
  const inWeek = (d, w) => d !== null && d >= w.from && d <= w.to;
  const T = () => (C && C.trades) || [];

  // 이번 주에 한 일: 산 것, 판 것 (날짜 순)
  function events() {
    const out = [];
    T().forEach(t => {
      if (inWeek(day(t.buy), WEEK)) out.push({ day: day(t.buy), kind: "buy", sym: t.sym, qty: t.qty, spike: t.buyChg >= 5, waited: !!t.waited });
      if (inWeek(day(t.sell), WEEK)) out.push({ day: day(t.sell), kind: "sell", sym: t.sym, qty: t.qty, days: t.days, pct: t.pct });
    });
    out.push({ day: FILLED.day, kind: "buy", sym: FILLED.sym, qty: FILLED.qty, spike: false, waited: false, filled: true });
    return out.sort((a, b) => a.day - b.day);
  }
  function lastWeek() {
    const list = T();
    const n = list.filter(t => inWeek(day(t.buy), LAST)).length + list.filter(t => inWeek(day(t.sell), LAST)).length;
    const sold = list.filter(t => inWeek(day(t.sell), LAST));
    const spike = list.filter(t => inWeek(day(t.buy), LAST) && t.buyChg >= 5);
    return { n, avgDays: sold.length ? sold.reduce((a, t) => a + t.days, 0) / sold.length : 0, spike };
  }

  /* --- 제목: 숫자에서 바로 나오는 문장 하나 --- */
  function title(E) {
    const buys = E.filter(e => e.kind === "buy");
    const read = buys.filter(e => READ_DAYS.includes(e.day) || READ_DAYS.includes(e.day - 1));
    if (!E.length) return "이번 주는<br>사고판 게 없어요";
    if (buys.length && read.length === buys.length) return buys.length > 1 ? "이번 주엔 산 날마다<br>읽고 샀어요" : "이번 주엔 읽은 다음 날<br>샀어요";
    if (!buys.some(e => e.spike)) return "이번 주엔 급하게<br>산 날이 없어요";
    return "이번 주는<br>이렇게 지나갔어요";
  }

  /* --- 한 주 달력: 리포트 달력(.dr-cal)과 같은 칸, 한 줄만. 판 날은 테두리 --- */
  function week(E) {
    const byDay = {};
    E.forEach(e => { (byDay[e.day] = byDay[e.day] || []).push(e); });
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = WEEK.sun + i, ev = byDay[d] || [], read = READ_DAYS.includes(d);
      const cls = ["dr-cell", ev.some(e => e.kind === "buy") ? "buy" : "", ev.some(e => e.kind === "sell") ? "sell" : "",
        ev.some(e => e.spike) ? "spike" : "", read ? "read" : "", i === 0 ? "sun" : "", d === WEEK.today ? "today" : "", d > WEEK.today ? "future" : ""].filter(Boolean).join(" ");
      const title = [...ev.map(e => `${e.sym} ${e.kind === "buy" ? "삼" : "팜"}`), read ? "리포트 읽음" : ""].filter(Boolean).join(" · ");
      cells.push(`<i class="${cls}" title="${title}"><b>${d}</b></i>`);
    }
    return `
      <div class="dr-cal" role="img" aria-label="${WEEK.text} 달력. 사고판 날 ${Object.keys(byDay).length}일, 리포트 읽은 날 ${READ_DAYS.length}일">
        <div class="dr-cal-head">${["일", "월", "화", "수", "목", "금", "토"].map(d => `<span>${d}</span>`).join("")}</div>
        <div class="dr-cal-grid">${cells.join("")}</div>
      </div>
      <ul class="dr-legend">
        <li><i class="k-buy"></i>산 날</li><li><i class="k-sell"></i>판 날</li><li><i class="k-spike"></i>급등한 날 산 날</li><li><i class="k-read"></i>리포트 읽은 날</li>
      </ul>`;
  }

  /* --- 이번 주 한 일: 한 줄씩 --- */
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function did(E) {
    return E.map(e => {
      const dow = DOW[(e.day - WEEK.sun) % 7];
      const head = e.kind === "buy" ? `${e.sym} ${e.qty}주 샀어요` : `${e.sym} ${e.qty}주 팔았어요`;
      const why = e.kind === "buy"
        ? (e.filled ? `전날 걸어 둔 주문이 장중에 체결됐어요. ${e.filled && READ_DAYS.includes(FILLED.readDay) ? `${FILLED.readDay}일에 리포트를 읽고 걸어 둔 주문이에요` : ""}`
          : e.waited ? "급등 다음 날, 하루 기다렸다 샀어요" : e.spike ? "급등한 날 바로 샀어요" : READ_DAYS.includes(e.day) ? "사기 전에 리포트를 읽었어요" : "")
        : `${e.days}일 들고 갔어요. 그때 상황은 매매일지에 적어 뒀어요`;
      return `<li><span class="dw-day"><b>${e.day}</b><small>${dow}</small></span><div><b>${head}</b><span>${why}</span></div></li>`;
    }).join("");
  }

  function page() {
    const E = events(), L = lastWeek();
    const days = new Set(E.map(e => e.day)).size;
    const buys = E.filter(e => e.kind === "buy"), sells = E.filter(e => e.kind === "sell");
    const spike = buys.filter(e => e.spike).length;
    const avgDays = sells.length ? sells.reduce((a, e) => a + e.days, 0) / sells.length : 0;
    const tiles = [
      { n: days, u: "일", k: "사고판 날" },
      { n: READ_DAYS.length, u: "일", k: "리포트 읽음" },
      { n: spike, u: "번", k: "급등일 매수" },
    ];
    const cmp = [
      { k: "사고판 횟수", v: `${E.length}번`, l: `지난주 ${L.n}번` },
      { k: "급등한 날 바로 산 것", v: `${spike}번`, l: `지난주 ${L.spike.length}번` },
      { k: "팔 때까지 들고 있던 날", v: `${Math.round(avgDays)}일`, l: `지난주 ${Math.round(L.avgDays)}일` },
    ];
    return `
      <header class="dali-page-head dr-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button><strong>${WEEK.label} 돌아보기</strong></header>
      <div class="dali-page-body dr dw">
        <section class="dr-hero">
          <div class="dw-swim"><img class="dw-otter" src="${BASE}dali-body.png" alt=""><img class="dw-bub b1" src="${IMG("bubbles")}" alt=""><img class="dw-bub b2" src="${IMG("bubbles")}" alt=""></div>
          <p class="dr-eyebrow">달이가 이번 주에 본 것</p>
          <h2>${title(E)}</h2>
          <p class="dr-sub">${WEEK.text}. 사고판 날은 ${days}일, 읽은 날은 ${READ_DAYS.length}일이에요</p>
        </section>

        <section class="dr-tiles">
          ${tiles.map(t => `<div class="dr-tile"><b>${t.n}<small>${t.u}</small></b><span>${t.k}</span></div>`).join("")}
        </section>

        <section class="dr-sec">
          <h3>읽은 날과 사고판 날</h3>
          <p class="dr-desc">이번 주 한 줄이에요</p>
          ${week(E)}
        </section>

        <section class="dr-sec">
          <h3>이번 주 한 일</h3>
          <p class="dr-desc">언제, 뭘, 어떻게 했는지만 적어요</p>
          <ul class="dw-did">${did(E)}</ul>
        </section>

        <section class="dr-sec">
          <h3>지난주랑 나란히</h3>
          <p class="dr-desc">숫자만 둘게요. 좋다 나쁘다는 안 해요</p>
          <ul class="dw-cmp">${cmp.map(c => `<li><span>${c.k}</span><b>${c.v}</b><small>${c.l}</small></li>`).join("")}</ul>
          <p class="dr-note">달이는 지켰는지 따지지 않아요. 이번 주에 본 것만 적어 둘게요.</p>
        </section>

        <div class="dr-foot"><button type="button" class="dr-btn" data-act="back">다음 주에도 받을게요</button></div>
      </div>`;
  }

  window.DaliWeek = { page };
})();
