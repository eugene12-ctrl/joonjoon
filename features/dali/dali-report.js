/* ---------- 한 달 습관 리포트 (조개 여는 달이의 선물) ----------
   관리 탭 > 달이 키우기 > "리포트 열기"를 누르면 dali.js가 이 화면을 .dali-page에 그린다.
   매매 날짜는 dali-customer.js의 10월 매매에서 가져오고, 읽은 날과 비중은 가상 숫자다.
   되돌리려면 각 페이지에서 이 파일과 dali-report.css를 불러오는 줄을 지우면 된다. */
(function () {
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const IMG = n => `${BASE}img/${n}.png`;
  // dali-customer.js의 const는 window에 붙지 않으므로 typeof로 확인
  const C = typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null;

  /* --- 10월 숫자 (가상) --- */
  const MONTH = { label: "10월", year: 2026, m: 9, days: 31, startDay: 4 }; // 2026-10-01은 목요일
  const READ_DAYS = [1, 5, 6, 7, 8, 12, 14, 15, 19, 21, 27, 28]; // 리포트 읽은 날 12일 (8일, 21일은 산 날과 겹침)
  const WAITED = { day: 21, sym: "삼성전자", from: 20 };          // 20일 급등을 보고 하루 기다렸다 21일에 삼 (dali-customer 19번 매매)
  const SHARE = [                                                // 한 종목 비중, 가장 컸던 날 기준
    { sym: "삼성전자", pct: 38 }, { sym: "현대차", pct: 22 }, { sym: "SK하이닉스", pct: 15 }, { sym: "NAVER", pct: 10 }, { sym: "현금", pct: 15, cash: true },
  ];

  function buys() {
    const T = (C && C.trades) || [];
    return T.filter(t => t.buy && t.buy.startsWith("10/")).map(t => ({ day: +t.buy.slice(3), sym: t.sym, spike: t.buyChg >= 5, pct: t.pct }));
  }

  /* --- 달력: 일~토, 산 날은 점, 급등한 날 산 날은 테두리, 읽은 날은 밑줄 --- */
  function calendar() {
    const B = buys();
    const byDay = {};
    B.forEach(b => { (byDay[b.day] = byDay[b.day] || []).push(b); });
    const cells = [];
    for (let i = 0; i < MONTH.startDay; i++) cells.push(`<i class="dr-cell empty"></i>`);
    for (let d = 1; d <= MONTH.days; d++) {
      const b = byDay[d], read = READ_DAYS.includes(d), waited = WAITED.day === d;
      const cls = ["dr-cell", b ? "buy" : "", b && b.some(x => x.spike) ? "spike" : "", read ? "read" : "", waited ? "waited" : "", (MONTH.startDay + d - 1) % 7 === 0 ? "sun" : ""].filter(Boolean).join(" ");
      const title = [b ? `${b.map(x => x.sym).join(", ")} 삼` : "", read ? "리포트 읽음" : "", waited ? "하루 기다렸다 삼" : ""].filter(Boolean).join(" · ");
      cells.push(`<i class="${cls}" title="${title}"><b>${d}</b></i>`);
    }
    return `
      <div class="dr-cal" role="img" aria-label="${MONTH.label} 달력. 산 날 ${B.length}일, 리포트 읽은 날 ${READ_DAYS.length}일">
        <div class="dr-cal-head">${["일", "월", "화", "수", "목", "금", "토"].map(d => `<span>${d}</span>`).join("")}</div>
        <div class="dr-cal-grid">${cells.join("")}</div>
      </div>
      <ul class="dr-legend">
        <li><i class="k-buy"></i>산 날</li><li><i class="k-spike"></i>급등한 날 산 날</li><li><i class="k-wait"></i>하루 기다린 날</li><li><i class="k-read"></i>리포트 읽은 날</li>
      </ul>`;
  }

  /* --- 달이가 본 것: 평가하지 않고 관찰만 --- */
  function seen() {
    const B = buys();
    const spike = B.filter(b => b.spike), spikeRead = spike.filter(b => READ_DAYS.includes(b.day));
    const readBuy = B.filter(b => READ_DAYS.includes(b.day));
    return [
      { icon: "open_book", t: `리포트를 읽은 날에 산 건 ${readBuy.length}번`, s: readBuy.length ? `${readBuy.map(b => `${b.day}일 ${b.sym}`).join(", ")}. 급등한 날은 ${readBuy.filter(b => b.spike).length}번이었어요` : `산 날 ${B.length}번 중이에요` },
      { icon: "sparkles", t: `급등한 날 바로 산 ${spike.length}번은 모두 안 읽은 날`, s: spikeRead.length ? `${spikeRead.length}번은 읽은 날이었어요` : `${spike.map(b => `${b.day}일 ${b.sym}`).join(", ")}` },
      { icon: "footprints", t: `급등한 날 하루 기다린 적이 1번`, s: `${WAITED.from}일 오른 ${WAITED.sym}을 ${WAITED.day}일에 샀어요` },
    ];
  }

  function page() {
    const B = buys(), top = SHARE[0];
    const tiles = [
      { n: READ_DAYS.length, u: "번", k: "리포트 읽음" },
      { n: 1, u: "번", k: "하루 기다림" },
      { n: top.pct, u: "%", k: "한 종목 최대" },
    ];
    return `
      <header class="dali-page-head dr-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button><strong>${MONTH.label} 습관 리포트</strong></header>
      <div class="dali-page-body dr">
        <section class="dr-hero">
          <div class="dr-clam"><img class="dr-shell" src="${IMG("oyster")}" alt=""><img class="dr-pearl" src="${IMG("sparkles")}" alt=""></div>
          <p class="dr-eyebrow">달이가 한 달 동안 본 것</p>
          <h2>${MONTH.label}엔 리포트를<br>${READ_DAYS.length}번 읽었어요</h2>
          <p class="dr-sub">매매한 날은 ${B.length}일, 읽은 날은 ${READ_DAYS.length}일이에요</p>
        </section>

        <section class="dr-tiles">
          ${tiles.map(t => `<div class="dr-tile"><b>${t.n}<small>${t.u}</small></b><span>${t.k}</span></div>`).join("")}
        </section>

        <section class="dr-sec">
          <h3>읽은 날과 산 날</h3>
          <p class="dr-desc">같은 날에 겹치는지 한눈에 봐요</p>
          ${calendar()}
        </section>

        <section class="dr-sec">
          <h3>한 종목에 얼마나 몰렸나</h3>
          <p class="dr-desc">가장 컸던 날 기준이에요</p>
          <div class="dr-share"><div class="dr-share-bar">${SHARE.map((s, i) => `<i class="${s.cash ? "cash" : `c${i}`}" style="width:${s.pct}%"></i>`).join("")}</div>
            <ul class="dr-share-list">${SHARE.map((s, i) => `<li><i class="${s.cash ? "cash" : `c${i}`}"></i><span>${s.sym}</span><b>${s.pct}%</b></li>`).join("")}</ul></div>
        </section>

        <section class="dr-sec">
          <h3>달이가 본 것</h3>
          <ul class="dr-seen">${seen().map(x => `<li><img src="${IMG(x.icon)}" alt=""><div><b>${x.t}</b><span>${x.s}</span></div></li>`).join("")}</ul>
          <p class="dr-note">달이는 지켰는지 따지지 않아요. 본 것만 적어 둘게요.</p>
        </section>

        <div class="dr-foot"><button type="button" class="dr-btn" data-act="back">다음 달에도 받을게요</button></div>
      </div>`;
  }

  window.DaliReport = { page };
})();
