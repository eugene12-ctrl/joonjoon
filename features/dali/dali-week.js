/* ---------- 주간 돌아보기 (헤엄치는 달이의 선물) ----------
   관리 탭 > 달이 키우기 > "주간 돌아보기 카드" 줄의 "열기"를 누르면 dali.js가 이 화면을 .dali-page에 그린다.
   한 달 습관 리포트(dali-report.js)와 같은 옷을 입는다. 그래서 .dr 스타일을 그대로 쓰고 dali-week.css는 주간용 몇 줄만 덧댄다.
   매매는 증권 앱이면 dali-customer.js, 선물 앱이면 dali-customer-fut.js의 이번 주(10월 26일~30일) 매매에서 가져오고, 읽은 날은 리포트와 같은 가상 숫자다.
   앱에 따라 다른 건 숫자 출처와 말(주/계약, 급등/밤 급변)뿐이고 화면 틀은 같다.
   평가하지 않고 본 것만 적는다. 지난주와 비교는 숫자만 두고 좋다 나쁘다를 말하지 않는다.
   되돌리려면 각 페이지에서 이 파일과 dali-week.css를 불러오는 줄을 지우면 된다. */
(function () {
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const IMG = n => `${BASE}img/${n}.png`;
  const FUT = window.DALI_PAGE_APP === "fut";
  const C = FUT ? (typeof DALI_CUSTOMER_FUT !== "undefined" ? DALI_CUSTOMER_FUT : null) : (typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null);
  if (!C) return;

  /* --- 앱마다 다른 말과 기준 --- */
  const L = FUT
    ? { buy: "들어간 날", sell: "정리한 날", spike: "밤 급변한 날 들어간 날", spikeShort: "급변한 날", v: "들어간", vd: "들어갔어요", sd: "정리했어요", tile: "급변일 진입", cmpSpike: "급변한 날 바로 들어간 것", cmpHold: "정리할 때까지 들고 있던 날",
        qty: t => `${C.code[t.sym]} ${t.qty}계약`, isSpike: t => !!t.night || Math.abs(t.buyChg) >= 1.5 }
    : { buy: "산 날", sell: "판 날", spike: "급등한 날 산 날", spikeShort: "급등한 날", v: "산", vd: "샀어요", sd: "팔았어요", tile: "급등일 매수", cmpSpike: "급등한 날 바로 산 것", cmpHold: "팔 때까지 들고 있던 날",
        qty: t => `${t.qty}주`, isSpike: t => t.buyChg >= 5 };

  /* --- 이번 주 (가상). 2026-10-26 월요일 ~ 10-30 금요일, 오늘은 29일 목요일 --- */
  const WEEK = { label: "이번 주", from: 26, to: 30, today: 29, sun: 25, text: "10월 26일 ~ 30일" };
  const LAST = { from: 19, to: 25 };                 // 지난주 (토요일 24일 매매가 있어 일요일까지)
  const READ_DAYS = [27, 28];                        // 리포트 읽은 날 (dali-report.js의 READ_DAYS와 같은 날)
  // 증권: 어제 저녁에 걸어 둔 현대차 매수가 오늘 장중에 체결됨 (dali-customer.js pending, 마감 장면과 같은 숫자)
  // 선물: 걸어 둔 S&P 500 주문은 다음 날 아침(30일)에 체결되니 이번 주 화면(29일 기준)엔 아직 없음
  const FILLED = FUT ? null : { day: 29, sym: "현대차", qty: 10, readDay: 28 };

  const day = s => (s && s.startsWith("10/") ? +s.slice(3) : null); // 10월 날짜만, 다른 달은 제외
  const inWeek = (d, w) => d !== null && d >= w.from && d <= w.to;
  const T = () => C.trades || [];

  // 이번 주에 한 일: 들어간 것, 정리한 것 (날짜 순)
  function events() {
    const out = [];
    T().forEach(t => {
      if (inWeek(day(t.buy), WEEK)) out.push({ day: day(t.buy), kind: "buy", sym: t.sym, qty: L.qty(t), spike: L.isSpike(t), waited: !!t.waited });
      if (inWeek(day(t.sell), WEEK)) out.push({ day: day(t.sell), kind: "sell", sym: t.sym, qty: L.qty(t), days: t.days, pct: t.pct });
    });
    if (FILLED) out.push({ day: FILLED.day, kind: "buy", sym: FILLED.sym, qty: `${FILLED.qty}주`, spike: false, waited: false, filled: true });
    return out.sort((a, b) => a.day - b.day);
  }
  function lastWeek() {
    const list = T();
    const n = list.filter(t => inWeek(day(t.buy), LAST)).length + list.filter(t => inWeek(day(t.sell), LAST)).length;
    const sold = list.filter(t => inWeek(day(t.sell), LAST));
    const spike = list.filter(t => inWeek(day(t.buy), LAST) && L.isSpike(t));
    return { n, avgDays: sold.length ? sold.reduce((a, t) => a + t.days, 0) / sold.length : 0, spike };
  }

  /* --- 제목: 숫자에서 바로 나오는 문장 하나 --- */
  function title(E) {
    const buys = E.filter(e => e.kind === "buy");
    const read = buys.filter(e => READ_DAYS.includes(e.day) || READ_DAYS.includes(e.day - 1));
    if (!E.length) return "이번 주는<br>사고판 게 없어요";
    if (buys.length && read.length === buys.length) return buys.length > 1 ? `이번 주엔 ${L.v} 날마다<br>읽고 ${L.vd}` : `이번 주엔 읽은 날<br>${L.vd}`;
    if (!buys.some(e => e.spike)) return `이번 주엔 급하게<br>${L.v} 날이 없어요`;
    return "이번 주는<br>이렇게 지나갔어요";
  }

  /* --- 한 주 달력: 리포트 달력(.dr-cal)과 같은 칸, 한 줄만. 정리한 날은 테두리 --- */
  function week(E) {
    const byDay = {};
    E.forEach(e => { (byDay[e.day] = byDay[e.day] || []).push(e); });
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = WEEK.sun + i, ev = byDay[d] || [], read = READ_DAYS.includes(d);
      const cls = ["dr-cell", ev.some(e => e.kind === "buy") ? "buy" : "", ev.some(e => e.kind === "sell") ? "sell" : "",
        ev.some(e => e.spike) ? "spike" : "", read ? "read" : "", i === 0 ? "sun" : "", d === WEEK.today ? "today" : "", d > WEEK.today ? "future" : ""].filter(Boolean).join(" ");
      const title = [...ev.map(e => `${e.sym} ${e.kind === "buy" ? L.v : L.sell.replace(" 날", "")}`), read ? "리포트 읽음" : ""].filter(Boolean).join(" · ");
      cells.push(`<i class="${cls}" title="${title}"><b>${d}</b></i>`);
    }
    return `
      <div class="dr-cal" role="img" aria-label="${WEEK.text} 달력. 사고판 날 ${Object.keys(byDay).length}일, 리포트 읽은 날 ${READ_DAYS.length}일">
        <div class="dr-cal-head">${["일", "월", "화", "수", "목", "금", "토"].map(d => `<span>${d}</span>`).join("")}</div>
        <div class="dr-cal-grid">${cells.join("")}</div>
      </div>
      <ul class="dr-legend">
        <li><i class="k-buy"></i>${L.buy}</li><li><i class="k-sell"></i>${L.sell}</li><li><i class="k-spike"></i>${L.spike}</li><li><i class="k-read"></i>리포트 읽은 날</li>
      </ul>`;
  }

  /* --- 이번 주 한 일: 한 줄씩 --- */
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function did(E) {
    return E.map(e => {
      const dow = DOW[(e.day - WEEK.sun) % 7];
      const head = e.kind === "buy" ? `${e.sym} ${e.qty} ${L.vd}` : `${e.sym} ${e.qty} ${L.sd}`;
      const why = e.kind === "buy"
        ? (e.filled ? `전날 걸어 둔 주문이 장중에 체결됐어요. ${READ_DAYS.includes(FILLED.readDay) ? `${FILLED.readDay}일에 리포트를 읽고 걸어 둔 주문이에요` : ""}`
          : e.waited ? `${L.spikeShort} 다음 날, 하루 기다렸다 ${L.vd}` : e.spike ? `${L.spikeShort} 바로 ${L.vd}` : READ_DAYS.includes(e.day) ? "들어가기 전에 리포트를 읽었어요" : "")
        : `${e.days}일 들고 갔어요. 그때 상황은 매매일지에 적어 뒀어요`;
      return `<li><span class="dw-day"><b>${e.day}</b><small>${dow}</small></span><div><b>${head}</b><span>${why}</span></div></li>`;
    }).join("");
  }

  function page() {
    const E = events(), Lw = lastWeek();
    const days = new Set(E.map(e => e.day)).size;
    const buys = E.filter(e => e.kind === "buy"), sells = E.filter(e => e.kind === "sell");
    const spike = buys.filter(e => e.spike).length;
    const avgDays = sells.length ? sells.reduce((a, e) => a + e.days, 0) / sells.length : 0;
    const tiles = [
      { n: days, u: "일", k: "사고판 날" },
      { n: READ_DAYS.length, u: "일", k: "리포트 읽음" },
      { n: spike, u: "번", k: L.tile },
    ];
    const cmp = [
      { k: "사고판 횟수", v: `${E.length}번`, l: `지난주 ${Lw.n}번` },
      { k: L.cmpSpike, v: `${spike}번`, l: `지난주 ${Lw.spike.length}번` },
      { k: L.cmpHold, v: `${Math.round(avgDays)}일`, l: `지난주 ${Math.round(Lw.avgDays)}일` },
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
