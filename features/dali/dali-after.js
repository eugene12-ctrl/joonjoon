/* ---------- 달이와 3개월 뒤 (발표자 버튼) ----------
   같은 고객 홍길동의 "달이 쓰기 전 3개월"과 "달이와 3개월"을 나란히 보여 준다.
   전 숫자는 DaliRules.habits()와 DALI_CUSTOMER에서 그대로 가져와 달이 2.0 화면과 어긋나지 않게 한다.
   투자 권유 문장은 쓰지 않는다.
   dali-ai.js 다음에 불러온다. */
(function () {
  const phone = document.querySelector(".phone");
  if (!phone) return;
  // const로 선언된 전역이라 window.으로는 안 잡힘
  const CUST = () => (typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null);
  const RULES = () => (typeof DaliRules !== "undefined" ? DaliRules : null);
  const won = n => `${Math.round(n).toLocaleString("ko-KR")}원`;
  const man = n => `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만 원`;

  function numbers() {
    const C = CUST(), H = RULES() && RULES().habits();
    const savedBefore = C ? C.saved.reduce((a, s) => a + s.won, 0) : 447000;
    const spike = H ? H.spike : { n: 6, avg: -2.1 };
    const quick = H ? H.quick : { n: 4, up: 3 };
    const waited = H ? H.waited : { n: 3, avg: 1.4 };
    // 3개월 뒤: 급등 당일 매수 1번, 손실 하루 안 매도 1번, 기다렸다 산 건 6번
    const spikeAfter = 1, quickAfter = 1;
    const cash = C ? C.cash : 4200000, rp = C ? C.rpRate : 0.03;
    const rpGain = cash * rp / 12 * 3;
    return {
      rows: [
        { k: "급등한 날 바로 산 횟수", before: spike.n, after: spikeAfter, avg: `${spike.avg.toFixed(1)}%`, unit: "번", note: `그날 산 건 평균 ${spike.avg.toFixed(1)}%로 끝났던 자리` },
        { k: "손실 난 날 바로 판 횟수", before: quick.n, after: quickAfter, unit: "번", note: `판 ${quick.n}번 중 ${quick.up}번은 2주 뒤 더 올라 있었음` },
        { k: "급등한 다음 날 기다렸다 산 횟수", before: waited.n, after: 6, unit: "번", note: `기다렸다 산 건 평균 ${waited.avg > 0 ? "+" : ""}${waited.avg.toFixed(1)}%로 끝남` },
        { k: "장 없는 날 달이를 연 날", before: 0, after: 9, unit: "일", note: "주말과 휴일 26일 중" },
      ],
      saved: [
        { k: "쉬던 현금 알림", v: rpGain, why: "" },
      ],
      savedBefore,
    };
  }

  // 회사 쪽: 금액은 덱에만 두고 화면엔 말로만 (덱 6장과 어긋나지 않게)
  const BIZ = [
    { k: "장 없는 날에도 앱을 열어요", why: "열 이유가 생기면 떠나는 고객이 줄어요" },
    { k: "유치 이벤트 대신 머물게 해요", why: "현금 이벤트가 막힌 뒤 남은 수단이에요" },
    { k: "덜 잃는 고객이 오래 거래해요", why: "거래를 늘리는 보상은 주지 않아요" },
  ];

  const page = document.createElement("section");
  page.className = "dali-after";
  page.setAttribute("aria-label", "달이와 3개월 뒤");
  page.hidden = true;
  phone.appendChild(page);

  function bar(r) {
    const max = Math.max(r.before, r.after, 1);
    const better = r.k.includes("기다렸다") || r.k.includes("연 날") ? r.after > r.before : r.after < r.before;
    return `
      <li>
        <div class="dali-after-row"><span>${r.k}</span><b>${r.before}${r.unit} <i>→</i> <em class="${better ? "good" : ""}">${r.after}${r.unit}</em></b></div>
        <div class="dali-after-bars"><span class="was" style="width:${r.before / max * 100}%"></span><span class="now" style="width:${r.after / max * 100}%"></span></div>
        <small>${r.note}</small>
      </li>`;
  }

  /* 3개월 띠: 매매 한 건이 점 하나. 위는 이익, 아래는 손실. 급등한 날 산 건 테두리 */
  // 달이와 3개월 (11월 1일부터 1월 29일): 급등한 날 산 건 1번뿐, 기다렸다 산 게 늘어남
  const AFTER_TRADES = [
    { d: 4, sym: "삼성전자", pct: 2.4, waited: true }, { d: 9, sym: "SK하이닉스", pct: 1.6, waited: true },
    { d: 15, sym: "현대차", pct: -1.2 }, { d: 22, sym: "삼성전자", pct: 3.1, waited: true },
    { d: 29, sym: "NAVER", pct: 1.9 }, { d: 36, sym: "SK하이닉스", pct: -2.3, spike: true },
    { d: 43, sym: "현대차", pct: 2.6, waited: true }, { d: 50, sym: "삼성전자", pct: -0.8 },
    { d: 58, sym: "NAVER", pct: 2.2, waited: true }, { d: 66, sym: "삼성전자", pct: 4.0 },
    { d: 74, sym: "SK하이닉스", pct: 1.4, waited: true }, { d: 83, sym: "현대차", pct: 1.1 },
  ];
  const dayOf = md => { const [m, d] = md.split("/").map(Number); return (m - 8) * 31 + d - 1; }; // 8월 1일이 0
  function strip(label, months, dots, spikeN, cls) {
    const W = 320, H = 96, L = 8, Rr = 8, mid = 56, days = 92;
    const X = d => L + d / days * (W - L - Rr);
    const Y = p => mid - Math.max(-7, Math.min(10, p)) * 3.2;
    return `
      <div class="dali-after-strip ${cls}">
        <p class="dali-after-strip-l"><b>${label}</b><span>급등한 날 산 매매 ${spikeN}번</span></p>
        <svg viewBox="0 0 ${W} ${H}" aria-label="${label}, 매매 ${dots.length}건, 급등한 날 산 매매 ${spikeN}번">
          <line class="dali-after-axis" x1="${L}" x2="${W - Rr}" y1="${mid}" y2="${mid}"/>
          ${months.map((m, i) => `<text class="dali-after-lab" x="${X(i * 31 + 1).toFixed(1)}" y="${H - 6}">${m}</text>`).join("")}
          ${dots.map(t => `<circle class="dali-after-dot ${t.pct > 0 ? "up" : "down"}${t.spike ? " spike" : ""}" cx="${X(t.d).toFixed(1)}" cy="${Y(t.pct).toFixed(1)}" r="5"><title>${t.sym} ${t.pct > 0 ? "+" : ""}${t.pct.toFixed(1)}%${t.spike ? ", 급등한 날 삼" : t.waited ? ", 하루 기다렸다 삼" : ""}</title></circle>`).join("")}
        </svg>
      </div>`;
  }
  function strips() {
    const C = CUST();
    const before = C ? C.trades.map(t => ({ d: dayOf(t.buy), sym: t.sym, pct: t.pct, spike: t.buyChg >= 5, waited: t.waited })) : [];
    return `
      <section class="dali-after-strips">
        ${strip("달이 쓰기 전 3개월", ["8월", "9월", "10월"], before, before.filter(t => t.spike).length, "before")}
        ${strip("달이와 3개월", ["11월", "12월", "1월"], AFTER_TRADES, AFTER_TRADES.filter(t => t.spike).length, "after")}
        <p class="dali-after-key"><i class="up"></i>이익으로 끝난 매매<i class="down"></i>손실로 끝난 매매<i class="spike"></i>급등한 날 산 매매</p>
      </section>`;
  }

  function render() {
    const N = numbers();
    const savedNow = N.saved.reduce((a, s) => a + s.v, 0);
    page.innerHTML = `
      <header class="dali-after-head">
        <button type="button" class="dali-back" data-after="close" aria-label="닫기">‹</button>
        <div><strong>달이와 3개월 뒤</strong><span>홍길동님, 10월 29일 → 1월 29일</span></div>
      </header>
      <div class="dali-after-body">
        <div class="dali-after-ai"></div>
        ${strips()}

        <section>
          <h3>습관이 이렇게 바뀌었어요</h3>
          <p class="dali-after-legend"><span class="was"></span>달이 쓰기 전 3개월<span class="now"></span>달이와 3개월</p>
          <ul class="dali-after-list">${N.rows.map(bar).join("")}</ul>
        </section>

        <section>
          <h3>달이가 지켜준 돈</h3>
          <p class="dali-after-big">+${man(N.savedBefore + savedNow)} <small>올해 누적</small></p>
          <ul class="dali-after-money">
            <li><span>지난 10월까지</span><b>${won(N.savedBefore)}</b></li>
            ${N.saved.map(s => `<li><span>${s.k}</span><b>+${won(s.v)}</b></li>`).join("")}
          </ul>
        </section>

        <section>
          <h3>유진이 얻는 것</h3>
          <ul class="dali-after-money biz">${BIZ.map(b => `<li><span>${b.k}<small>${b.why}</small></span></li>`).join("")}</ul>
        </section>
      </div>`;
    const sp = N.rows[0], qk = N.rows[1];
    window.DaliAI && DaliAI.write(page.querySelector(".dali-after-ai"), {
      key: "after-summary",
      steps: ["3개월 매매 기록 다시 읽는 중", "달이 쓰기 전 3개월과 비교하는 중", "홍길동님께 쓸 말 고르는 중"],
      text: `급등한 날 바로 사던 게 ${sp.before}번에서 ${sp.after}번으로 줄었고, 손실 난 날 바로 팔던 것도 ${qk.before}번에서 ${qk.after}번이 됐어요. 급등한 날 산 건 평균 ${sp.avg}로 끝났던 자리라, 그만큼 덜 잃었어요.`,
      basis: "매매 20건과 이후 3개월 기록, 같은 기간 시세를 보고 썼어요.",
    });
  }

  function open() { render(); page.hidden = false; requestAnimationFrame(() => page.classList.add("show")); }
  function close() { page.classList.remove("show"); setTimeout(() => { page.hidden = true; }, 260); }
  page.addEventListener("click", e => { if (e.target.closest("[data-after=close]")) close(); });

  // 발표자 상자에 버튼
  const demo = document.querySelector(".dali-demo");
  if (demo) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "달이와 3개월 뒤";
    b.addEventListener("click", () => { window.DaliAI && DaliAI.reset("after-summary"); open(); });
    const reset = demo.querySelector('[data-demo="reset"]');
    reset ? reset.before(b) : demo.appendChild(b);
  }

  window.DaliAfter = { open, close };
})();
