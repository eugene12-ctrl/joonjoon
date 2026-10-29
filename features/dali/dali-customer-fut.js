/* ---------- 달이 2.0 가상 고객 (해외선물, 유진투자선물 앱) ----------
   증권 앱의 dali-customer.js와 같은 모양을 선물 숫자로. 고객은 같은 홍길동.
   보유 계약은 futures.html의 HOLD, 달이 매매일지(dali-data.js t6, t7)와 같은 숫자.
   돈은 달러. 숫자는 모두 시연용 가상. 종목명만 실제.
   dali-data.js 다음, dali-pro-fut.js 앞에 불러온다. futures.html에서만. */

const DALI_CUSTOMER_FUT = {
  name: "홍길동",
  cash: 24350,                       // 주문가능금액 (futures.html CASH와 같음)
  // 계약 승수: 1포인트 움직일 때 1계약 손익 (달러). 마이크로 금 MGC 10, 크루드 오일 CL 1,000, MES 5, MNQ 2
  mult: { "크루드 오일": 1000, "금": 10, "S&P 500": 5, "나스닥 100": 2 },
  code: { "크루드 오일": "CL", "금": "MGC", "S&P 500": "MES", "나스닥 100": "MNQ" },
  // 유지증거금 (1계약, 가상)
  margin: { "크루드 오일": 6200, "금": 1650, "S&P 500": 1400, "나스닥 100": 2100 },   // 선물 홈(futures.html HOLD)과 같은 숫자
  positions: [
    { sym: "크루드 오일", qty: 1, avg: 62.15, bought: "10월 27일", expiry: "11월 19일" },
    { sym: "금", qty: 2, avg: 4101.4, bought: "10월 23일", expiry: "12월 29일" },
  ],
  watch: ["S&P 500", "나스닥 100"],
  // 어젯밤 걸어 둔 주문
  pending: { sym: "S&P 500", qty: 1, price: 7742.5, side: "매수" },

  // 시연 시각마다 "마지막으로 닫은 시각"이 다름. 선물은 밤에 움직이니 장면도 밤 중심
  lastSeen: { morning: "어제 23:10", intraday: "오늘 18:40", close: "어제 23:50", month: "어제 23:10" },
  lastSeenHours: { morning: 8, intraday: 5, close: 7, month: 8 },

  // 3개월 매매 20건. 습관 거울이 여기서 숫자를 뽑음
  // buyChg: 들어간 날 그 종목 등락. waited: 급변 다음 날 들어간 것. pct: 결과. pnl: 달러 손익
  // soldIn24h: 손실 난 지 하루 안에 정리. later: 정리한 뒤 2주 지난 가격 변화. days: 보유일
  // night: 밤 급변 때 바로 정리한 것. rolled: 만기 전에 다음 월물로 옮긴 것
  trades: [
    { id: 1, sym: "나스닥 100", qty: 2, buy: "08/04", sell: "08/05", buyChg: -2.4, pct: -1.1, pnl: -1260, days: 1, soldIn24h: true, night: true, later: 2.8 },
    { id: 2, sym: "금", qty: 2, buy: "08/06", sell: "08/20", buyChg: 0.3, pct: 1.4, pnl: 1120, days: 14 },
    { id: 3, sym: "크루드 오일", qty: 1, buy: "08/11", sell: "08/12", buyChg: 3.8, pct: -1.9, pnl: -1180, days: 1, soldIn24h: true, later: 1.6 },
    { id: 4, sym: "S&P 500", qty: 1, buy: "08/13", sell: "08/27", buyChg: 0.5, waited: true, pct: 1.2, pnl: 450, days: 14 },
    { id: 5, sym: "나스닥 100", qty: 1, buy: "08/19", sell: "08/19", buyChg: 2.1, pct: -0.8, pnl: -460, days: 0.4, soldIn24h: true, night: true, later: -0.5 },
    { id: 6, sym: "금", qty: 2, buy: "08/21", sell: "09/02", buyChg: 0.2, pct: 0.9, pnl: 730, days: 12 },
    { id: 7, sym: "크루드 오일", qty: 1, buy: "08/25", sell: "09/16", buyChg: -0.6, pct: 2.3, pnl: 1420, days: 22, rolled: true },
    { id: 8, sym: "S&P 500", qty: 1, buy: "08/28", sell: "08/29", buyChg: -1.7, pct: -0.9, pnl: -340, days: 1, soldIn24h: true, night: true, later: 1.9 },
    { id: 9, sym: "나스닥 100", qty: 2, buy: "09/03", sell: "09/12", buyChg: 0.6, waited: true, pct: 1.1, pnl: 1290, days: 9 },
    { id: 10, sym: "금", qty: 1, buy: "09/08", sell: "09/09", buyChg: 1.9, pct: -0.6, pnl: -240, days: 1, soldIn24h: true, later: 1.2 },
    { id: 11, sym: "크루드 오일", qty: 1, buy: "09/17", sell: "09/18", buyChg: -3.1, pct: -1.5, pnl: -930, days: 1, soldIn24h: true, night: true, later: 2.2 },
    { id: 12, sym: "S&P 500", qty: 1, buy: "09/22", sell: "09/30", buyChg: 0.4, pct: 0.8, pnl: 300, days: 8 },
    { id: 13, sym: "나스닥 100", qty: 1, buy: "09/24", sell: "09/26", buyChg: 1.1, waited: true, pct: 0.5, pnl: 290, days: 2 },
    { id: 14, sym: "크루드 오일", qty: 1, price: 60.8, buy: "10/02", sell: "10/03", buyChg: -2.1, pct: -1.4, pnl: -860, days: 1, soldIn24h: true, night: true, later: 2.3,
      ctx: ["원유 재고 발표에 내린 밤", "밤사이 크게 흔들린 날", "같은 밤 더 내린 뒤", "급하게 정리한 날"] },
    { id: 15, sym: "금", qty: 2, price: 4020.5, buy: "10/07", sell: "10/10", buyChg: 0.4, waited: true, pct: 0.9, pnl: 720, days: 3,
      ctx: ["달러가 하루 쉬어 간 다음 날", "차분한 날", "달러 약세가 이어진 날", "거래가 적은 날"] },
    { id: 16, sym: "나스닥 100", qty: 2, price: 28620, buy: "10/14", sell: "10/22", buyChg: 0.9, pct: 1.0, pnl: 1180, days: 8,
      ctx: ["기술주 반등 기사가 나온 날", "차분한 날", "기술주 강세가 이어진 날", "거래가 많은 날"] },
    { id: 17, sym: "S&P 500", qty: 1, price: 7705, buy: "10/15", sell: "10/16", buyChg: -1.2, pct: -0.6, pnl: -240, days: 1, soldIn24h: true, night: true, later: 1.1,
      ctx: ["미국 지수 급락 속보가 나온 밤", "밤사이 크게 흔들린 날", "지수가 반등한 아침", "반등한 날"] },
    { id: 18, sym: "나스닥 100", qty: 1, price: 29380, buy: "10/20", sell: "10/21", buyChg: 1.8, pct: -0.7, pnl: -410, days: 1, soldIn24h: true, later: 0.9,
      ctx: ["기술주가 크게 오른 날", "급등한 날", "오른 폭을 되돌린 다음 날", "내린 날"] },
    { id: 19, sym: "S&P 500", qty: 1, price: 7730, buy: "10/24", sell: "10/27", buyChg: 0.3, pct: 0.5, pnl: 190, days: 3,
      ctx: ["지표 발표를 기다리던 날", "차분한 날", "지수가 조금 오른 날", "거래가 적은 날"] },
    { id: 20, sym: "크루드 오일", qty: 1, buy: "10/27", sell: null, buyChg: 0.2, pct: -0.5, pnl: -310, days: 2 },
  ],

  // 이번 달 비용 (해외선물은 거래세 없음, 수수료만). realized, trades는 맨 아래에서 10월 매매로 계산
  month: { fee: 186, tax: 0, realized: 0, trades: 0 },
  idleCashDays: 0,

  // 올해 달이가 지켜준 돈. 행동했을 때 아낀 금액만 더함
  saved: [
    { what: "밤 급변 때 바로 정리하려다 아침까지 기다림", won: 420, n: 2 },
    { what: "만기 전 롤오버 알림", won: 150, n: 1 },
    { what: "증거금 여유 알림", won: 95, n: 3 },
  ],
};

// 시연 시각마다 다른 시장 숫자. 아침은 dali-data.js의 DALI_SYMS(10월 28일 밤 마감)를 따르고 밤 급변과 다음 날 아침만 다르게 둔다
const DALI_MARKET_FUT = {
  morning: { label: "10월 29일 07:00", pct: { "크루드 오일": 0, "금": 0, "S&P 500": 0, "나스닥 100": 0 },
    night: "밤사이 원유는 재고 발표에 내리고 금은 달러 약세에 올랐어요" },
  intraday: { label: "10월 29일 23:40, 미국장 중", pct: { "크루드 오일": -5.3, "금": 0.3, "S&P 500": -0.9, "나스닥 100": -1.4 }, shock: "크루드 오일" },
  close: { label: "10월 30일 07:00, 다음 날 아침", pct: { "크루드 오일": -0.8, "금": 0.5, "S&P 500": 0.4, "나스닥 100": 0.3 }, filled: true },
  month: { label: "10월 31일 08:00, 월말", pct: { "크루드 오일": 0.4, "금": -0.2, "S&P 500": 0.2, "나스닥 100": 0.1 } },

  // 앞으로 2주. 내 계약에 걸린 것만. 날짜는 시연용 가상 일정
  calendar: [
    { date: "11월 5일", what: "미국 원유 재고 발표 (매주 수요일 밤)", sym: "크루드 오일", note: "지난 8번 중 5번 발표 뒤 1% 넘게 움직임" },
    { date: "11월 6일", what: "미국 금리 결정", sym: null, note: "금과 지수 선물이 같이 움직이는 날" },
    { date: "11월 13일", what: "미국 소비자물가 발표", sym: null, note: "나스닥 100 관심, 보유는 없음" },
    { date: "11월 19일", what: "크루드 오일 12월물 최종거래일", sym: "크루드 오일", note: "계속 가져가려면 그 전에 1월물로 롤오버" },
  ],

  // 뉴스를 내 포지션 뜻으로. 뉴스 자체는 dali-data.js
  forMe: {
    "크루드 오일": "내 1계약 기준 1포인트에 $1,000. 12월물 최종거래일 11월 19일",
    "금": "내 2계약 기준 1포인트에 $20",
    "S&P 500": "관심. 어젯밤 MES 1계약 매수 주문을 걸어 둠",
    "나스닥 100": "관심, 보유 없음. 밤 급변 때 바로 정리한 지난 3번 중 2번은 아침에 되돌아왔던 자리",
  },
};

// 매매일지와 오늘 탭이 같은 거래 목록을 보도록: 10월에 정리한 매매에서 실현 손익과 건수를 계산하고,
// 매매일지의 완료 카드도 이 목록으로 만든다 (보유 중 카드 t6, t7은 dali-data.js 그대로)
(function () {
  const C = DALI_CUSTOMER_FUT;
  const oct = C.trades.filter(t => t.sell && t.sell.startsWith("10/"));
  C.month.realized = oct.reduce((a, t) => a + t.pnl, 0);
  C.month.trades = oct.length;
  if (typeof DALI_TRADES === "undefined") return;
  for (let i = DALI_TRADES.length - 1; i >= 0; i--) if (DALI_TRADES[i].app === "fut" && DALI_TRADES[i].sell) DALI_TRADES.splice(i, 1);
  const cards = oct.slice().reverse().map(t => ({
    id: `f${t.id}`, app: "fut", sym: t.sym, qty: `${C.code[t.sym]} ${t.qty}계약 매수`,
    buy: { date: t.buy, news: t.ctx[0], mood: t.ctx[1] }, sell: { date: t.sell, news: t.ctx[2], mood: t.ctx[3] },
    pnl: t.pnl, pct: t.pct, memo: "",
  }));
  DALI_TRADES.push(...cards);
})();
