/* ---------- 계좌/잔고 ----------
   가상 계좌라 금액은 0, 한도처럼 0이 아닌 값은 자리표시입니다. */
const BAL_TABS = ["주식잔고", "신용잔고", "SOR상세", "일별체결", "예수금", "실현손익", "기간손익", "거래내역", "일별예수금", "결제잔고", "신용주문 한도조회", "주식선물하기", "주식상품권"];

// 탭마다 헤더 오른쪽 버튼
const HEAD_BTNS = {
  combo: () => `${iconBtn("refresh", "새로고침")}${dropPill("통합")}${pill("일괄")}${pill("종합")}`,
  batch: () => `${iconBtn("refresh", "새로고침")}${pill("일괄")}${pill("종합")}`,
  info: () => `${iconBtn("refresh", "새로고침")}${iconBtn("info", "안내")}`,
  refresh: () => iconBtn("refresh", "새로고침"),
  transfer: () => `${pill("이체", 'class="pill teal-line"')}${iconBtn("refresh", "새로고침")}${iconBtn("info", "안내")}`,
  infoOnly: () => iconBtn("info", "안내"),
};

// 라벨·값 칸 (값이 "" 이면 빈칸)
const kv = (k, v, cls = "") => `<div class="kv ${cls}"><span>${k}</span><b>${v}</b></div>`;
const section = t => `<p class="section">${t}</p>`;

const BAL = {
  "주식잔고": {
    head: "combo",
    body: () => `
      <div class="bal-filter">${select("추정자산 ↻", "plain")}<span class="grow"></span>${select("매입단가")}${check("융자합산", true)}</div>
      <div class="kv-grid">${kv("평가총액", "0")}${kv("아침대비<br>손익 ↻", "", "sm")}${kv("평가손익", "0")}${kv("실현손익", "0")}${kv("평가수익률", "0.00%")}${kv("D+2<br>예수금 ↻", "", "sm")}</div>
      ${collapseBar()}${colHead([["종목명", "보유수량", "평가금액", "현재가"], ["구분 · 수익률", "가능수량", "평가손익", "매입단가"]])}`,
  },
  "신용잔고": {
    head: "info",
    body: () => `
      ${subTabs(["신용/대출담보비율", "신용/대출현황"], "신용/대출담보비율")}
      ${section("융자현황")}
      <div class="kv-list">${kv("신용계<br>(신용/대출)", "0")}${kv("담보대출금액", "0")}</div>
      <div class="kv-grid">${kv("신용융자금액", "0")}${kv("융자평가액", "0")}${kv("신용대주금액", "0")}${kv("대주평가액", "0")}</div>
      ${section("담보비율/반대매매")}
      <div class="kv-list">${kv("담보비율<br>(체결기준)", "0.00%")}${kv("적용담보비율", "0%")}${kv("담보부족액", "0")}${kv("담보부족횟수", "0")}${kv("반대매매예정일", "")}</div>`,
  },
  "SOR상세": {
    head: "refresh",
    body: () => `
      <div class="bal-filter">${seg3(["전체", "체결", "미체결"])}${iconBtn("info", "안내")}</div>
      <div class="bal-filter">${dateBox()}<span class="input">주문번호</span></div>
      <div class="bal-filter">${check("종목", true)}<span class="input search">${icon("search")}</span>${select("전체")}</div>
      ${colHead([["거래소", "(C)원주문번호", "종목코드"], ["(P)주문번호", "(C)주문번호", "종목명"]])}`,
  },
  "일별체결": {
    head: "batch",
    body: () => `
      <div class="bal-filter">${seg3(["전체", "체결"])}${select("전체")}${dateBox()}</div>
      <div class="bal-filter">${check("전체", true)}<span class="input search grow">${icon("search")}</span></div>
      ${collapseBar()}${colHead([["종목명", "주문단가", "체결가"], ["매매구분 · 종목코드", "주문수량", "체결량"]])}`,
  },
  "예수금": {
    head: "transfer",
    body: () => {
      const d1 = shiftDay(1), d2 = shiftDay(2, true);
      return `
      ${subTabs(["국내", "해외(외화)"], "국내")}
      <div class="dep-table">
        <span class="th">구분</span><span class="th">D+1 (${d1})</span><span class="th">D+2 (${d2})</span>
        ${["추정예수금", "매수정산금", "매도정산금", "연체변제소요금", "출금가능금액"].map(k => `<span class="td-k">${k}</span><span>0</span><span>0</span>`).join("")}
      </div>
      <div class="chips">${["예수금", "대용/신용", "주문가능", "미수"].map((c, i) => `<button type="button" class="${i === 0 ? "on" : ""}">${c}</button>`).join("")}</div>
      <div class="grid3">${["예수금", "신용주문평가금", "위탁증거금", "신용보증금", "신용+추가담보금", "미수확보금", "주문가능현금", "원화주문가능금", "최대주문가능금", "ETF기본예탁금", "수표입금액", "예탁총액"].map(k => `<div><span>${k}</span><b>0</b></div>`).join("")}</div>`;
    },
  },
  "실현손익": {
    head: "batch",
    body: () => `
      ${subTabs(["당일", "기간별", "종목별"], "당일")}
      <div class="bal-filter">${dateBox()}${check("당일매수매도", false)}${check("매매비용", true)}${iconBtn("info", "안내")}</div>
      <div class="kv-grid">${kv("매수금액", "0")}${kv("실현손익", "0")}${kv("매도금액", "0")}${kv("수익률", "0.00%")}</div>
      ${collapseBar()}${colHead([["종목명", "잔고수량", "실현손익", "매수금액"], ["구분", "잔고평균단가", "수익률", "매도금액"]])}`,
  },
  "기간손익": {
    head: "batch",
    body: () => `
      ${subTabs(["일별", "월별"], "일별")}
      <div class="bal-filter">${dateBox()}<span class="tilde">~</span>${dateBox()}${check("매매비용", true)}</div>
      ${collapseBar()}${colHead([["조회일", "예탁자산", "매수금", "입금"], ["", "주식평가금", "매도금", "입고"]])}`,
  },
  "거래내역": {
    head: "batch",
    body: () => `
      <div class="bal-filter">${select("전체")}${dateBox()}<span class="tilde">~</span>${dateBox()}</div>
      ${collapseBar()}${colHead([["거래일자", "종목명", "수량", "거래금액"], ["거래번호", "거래종류", "단가", "정산금액"]])}`,
  },
  "일별예수금": {
    head: "info",
    body: () => `
      <div class="bal-filter">${select("20일")}${check("", true)}${dateBox(shiftDay(-20, false, true), true)}<span class="tilde">~</span>${dateBox(TODAY, true)}</div>
      ${colHead([["일자", "예수금", "추정예탁자산"]], false)}`,
  },
  "결제잔고": {
    head: "combo",
    body: () => `
      <div class="kv-grid">${kv("평가금액", "0")}${kv("익일반대매매<br>예상금액 ↻", "", "sm")}${kv("예수금", "0")}${kv("융자금", "0")}${kv("미수금", "0")}${kv("대용금", "0")}${kv("대주금", "0")}<div class="kv note">※평가금액합에 대주평가금액은 포함되지 않습니다.</div></div>
      ${collapseBar()}${colHead([["종목명", "잔고수량", "매입평균가", "현재가"], ["신용구분", "선물수량", "매입금액", "현재금액"]], false)}`,
  },
  "신용주문 한도조회": {
    head: "info",
    body: () => `
      <div class="bal-filter"><span class="input search grow">${esc(stockBy(App.code).name)}${icon("search")}</span>${select("자기유통")}<span class="input off">희망가격</span></div>
      ${section("종목별 한도잔고")}
      <div class="kv-list">${kv("회사한도(수량)", "0,000,000")}${kv("회사한도(금액)", "00,000,000,000")}${kv("개인한도(수량)", "0,000,000")}${kv("개인한도(금액)", "0,000,000,000")}</div>
      ${section("주문가능")}
      <div class="kv-list">${kv("주문가능액(최대)", "0")}${kv("주문가능액(적정)", "0")}${kv("주문가능량(최대)", "0")}${kv("주문가능량(적정)", "0")}</div>
      ${section("신용융자 내역")}
      <div class="kv-list">${kv("융자한도금액", "0")}${kv("융자잔고금액", "0")}${kv("신규융자주문금액", "0")}${kv("융자상환금액", "0")}${kv("신용매매유형", "기본형")}</div>`,
  },
  "주식선물하기": {
    head: "infoOnly", noAccount: true,
    body: () => `
      ${subTabs(["선물하기", "선물함", "선물내역"], "선물하기")}
      ${accountRow()}
      <p class="gift-q">${icon("gift")} 어떤 종목을 선물할까요?</p>
      ${colHead([["종목명", "보유수량"], ["시장 · 전일종가", "선물가능수량"]], false)}
      <div class="gift-notes">
        <p>· 가능종목: 매수 결제 완료된 국내/미국 상장주식만 가능해요.</p>
        <p>· 입력하신 받는분의 성함과 휴대폰 번호가 받는분이 개설하신 계좌정보와 불일치 할 경우 선물을 받을 수 없어요.</p>
        <button type="button" class="link">자세히보기 ›</button>
      </div>`,
  },
  "주식상품권": {
    head: "infoOnly", noAccount: true,
    body: () => `<p class="empty">주식상품권 화면은 준비 중이에요</p>`,
  },
};

function seg3(list) {
  return `<div class="seg3">${list.map((t, i) => `<button type="button" class="${i === 0 ? "on" : ""}">${t}</button>`).join("")}</div>`;
}
// 오늘에서 며칠 뒤 날짜 (영업일 계산은 생략, 주말만 건너뜀)
function shiftDay(n, skipWeekend = true, full = false) {
  const d = new Date();
  let left = Math.abs(n);
  while (left > 0) {
    d.setDate(d.getDate() + Math.sign(n));
    if (!skipWeekend || (d.getDay() !== 0 && d.getDay() !== 6)) left--;
  }
  const mm = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return full ? `${d.getFullYear()}-${mm}-${dd}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

Screens.balance = {
  tab: "주식잔고",
  render(p) {
    if (p.sub && BAL[p.sub]) { this.tab = p.sub; p.sub = undefined; } // #balance/<탭>으로 들어온 경우 한 번만
    const t = BAL[this.tab];
    return header("계좌/잔고", HEAD_BTNS[t.head]())
      + topTabs(BAL_TABS, this.tab)
      + `<div class="mts-body bal-body">${t.noAccount ? "" : accountRow()}${t.body()}</div>`;
  },
  mount(el) {
    bindTabs(el, "data-tab", t => { this.tab = t; history.replaceState(null, "", `#balance/${encodeURIComponent(t)}`); App.render(); });
    el.querySelectorAll(".sub-tabs button, .seg3 button, .chips button").forEach(b => b.onclick = () => {
      b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    });
    el.querySelectorAll("[aria-label=새로고침]").forEach(b => b.onclick = () => App.toast("가상 계좌라 조회 결과가 없어요"));
  },
};
