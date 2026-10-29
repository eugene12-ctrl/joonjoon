/* ---------- 달이 2.0 가상 고객 (국내주식) ----------
   고객 홍길동 한 명. 보유, 3개월 매매, 비용, 마지막 접속 시각.
   숫자는 모두 시연용 가상. 종목명만 실제. 회사 사건은 지어내지 않고 일정 수준만 둔다.
   dali-data.js 다음, dali-rules.js 앞에 불러온다. */

const DALI_CUSTOMER = {
  name: "홍길동",
  cash: 4200000,
  positions: [
    { sym: "삼성전자", qty: 80, avg: 221000, bought: "9월 22일" },
    { sym: "현대차", qty: 20, avg: 291000, bought: "10월 8일" },
  ],
  watch: ["SK하이닉스", "NAVER"],
  // 어제 저녁에 걸어 둔 주문
  pending: { sym: "현대차", qty: 10, price: 293000 },

  // 시연 시각마다 "마지막으로 닫은 시각"이 다름
  lastSeen: { morning: "어제 20:10", intraday: "오늘 07:40", close: "오늘 11:20", month: "어제 20:10" },
  lastSeenHours: { morning: 11, intraday: 4, close: 4, month: 11 },

  // 3개월 매매 20건. 습관 거울이 여기서 숫자를 뽑음
  // buyChg: 산 날 그 종목 등락. waited: 급등 다음 날 산 것. pct: 결과(들고 있으면 지금 평가)
  // soldIn24h: 손실 난 지 하루 안에 팜. later: 판 뒤 2주 지난 가격 변화. days: 보유일
  trades: [
    { id: 1, sym: "SK하이닉스", qty: 5, buy: "08/04", sell: "08/05", buyChg: 6.1, pct: -3.1, days: 1, soldIn24h: true, later: 7.1 },
    { id: 2, sym: "삼성전자", qty: 30, buy: "08/07", sell: "08/26", buyChg: 0.3, pct: 4.2, days: 19 },
    { id: 3, sym: "현대차", qty: 10, buy: "08/11", sell: "08/19", buyChg: 0.4, pct: -1.8, days: 8 },
    { id: 4, sym: "NAVER", qty: 15, buy: "08/13", sell: "08/14", buyChg: 5.4, pct: -2.6, days: 1, soldIn24h: true, later: 3.9 },
    { id: 5, sym: "삼성전자", qty: 20, buy: "08/18", sell: "09/02", buyChg: 0.8, waited: true, pct: 2.2, days: 15 },
    { id: 6, sym: "SK하이닉스", qty: 3, buy: "08/21", sell: "08/29", buyChg: 7.2, pct: -1.4, days: 8 },
    { id: 7, sym: "현대차", qty: 10, buy: "09/01", sell: "09/12", buyChg: 0.4, pct: 3.9, days: 11 },
    { id: 8, sym: "NAVER", qty: 10, buy: "09/03", sell: "09/04", buyChg: -2.1, pct: -4.0, days: 1, soldIn24h: true, later: -1.2 },
    { id: 9, sym: "삼성전자", qty: 20, buy: "09/08", sell: "09/19", buyChg: 1.2, waited: true, pct: 1.1, days: 11 },
    { id: 10, sym: "SK하이닉스", qty: 4, buy: "09/10", sell: "09/24", buyChg: 5.5, pct: -0.9, days: 14 },
    { id: 11, sym: "현대차", qty: 10, buy: "09/15", sell: "09/16", buyChg: -1.6, pct: -3.3, days: 1, soldIn24h: true, later: 5.6 },
    { id: 12, sym: "삼성전자", qty: 30, buy: "09/22", sell: null, buyChg: 0.6, pct: 9.5, days: 37 },
    { id: 13, sym: "NAVER", qty: 10, price: 236000, buy: "09/25", sell: "10/02", buyChg: 0.9, waited: true, pct: 0.9, days: 7,
      ctx: ["플랫폼주가 하루 쉬어 간 다음 날", "차분한 날", "코스피가 옆으로 간 날", "거래가 적은 날"] },
    { id: 14, sym: "삼성전자", qty: 50, buy: "09/30", sell: null, buyChg: 0.2, pct: 9.5, days: 29 },
    { id: 15, sym: "SK하이닉스", qty: 2, price: 1290000, buy: "10/02", sell: "10/06", buyChg: 6.3, pct: -2.5, days: 4,
      ctx: ["반도체 대형주가 크게 오른 날", "급등한 날", "미국 기술주가 흔들린 다음 날", "내린 날"] },
    { id: 16, sym: "현대차", qty: 20, buy: "10/08", sell: null, buyChg: 0.3, pct: 2.1, days: 21 },
    { id: 17, sym: "NAVER", qty: 10, price: 239000, buy: "10/13", sell: "10/21", buyChg: 1.0, pct: -6.3, days: 8,
      ctx: ["플랫폼 관련 논의가 나온 날", "차분한 날", "성장주가 약했던 날", "내린 날"] },
    { id: 18, sym: "SK하이닉스", qty: 15, price: 1350000, buy: "10/16", sell: "10/20", buyChg: -0.8, pct: 3.4, days: 4,
      ctx: ["반도체주가 조금 내린 날", "차분한 날", "반도체 대형주가 다시 오른 날", "거래가 많은 날"] },
    { id: 19, sym: "삼성전자", qty: 30, price: 224000, buy: "10/21", sell: "10/27", buyChg: 1.4, pct: 1.8, days: 6,
      ctx: ["메모리 업황 기사가 나온 날", "차분한 날", "실적 발표를 앞둔 주", "거래가 많은 날"] },
    { id: 20, sym: "NAVER", qty: 5, price: 228000, buy: "10/24", sell: "10/24", buyChg: 5.0, pct: -2.0, days: 0.3,
      ctx: ["플랫폼주가 크게 오른 날", "급등한 날", "같은 날 오후", "오른 폭을 되돌린 날"] },
  ],

  // 이번 달 비용
  month: { fee: 24000, tax: 158000, realized: 0, trades: 0 }, // realized, trades는 맨 아래에서 10월 매매로 계산
  idleCashDays: 11,
  dividend: 120000,     // 이번 달 들어온 배당금, 현금으로 그대로
  rpRate: 0.03,

  // 올해 달이가 지켜준 돈. 행동했을 때 아낀 금액만 더함
  saved: [
    { what: "급등 당일 사려다 하루 기다림", won: 84000, n: 3 },
    { what: "쉬던 현금 알림", won: 41000, n: 4 },
    { what: "손실 종목 연말 정리로 세금 공제", won: 310000, n: 1 },
    { what: "잊고 있던 배당금 재투자", won: 12000, n: 1 },
  ],
};

// 시연 시각마다 다른 시장 숫자. 오늘 등락은 dali-data.js의 DALI_SYMS(10월 28일 종가)를 따르고 여기선 장중만 다르게 둔다
const DALI_MARKET = {
  morning: { label: "10월 29일 07:00", pct: { 삼성전자: 0, 현대차: 0, SK하이닉스: 0, NAVER: 0 },
    night: "미국 반도체 대형주가 밤사이 올라 마감" },
  intraday: { label: "10월 29일 11:40", pct: { 삼성전자: -3.8, 현대차: 0.6, SK하이닉스: 10.9, NAVER: 0.4 }, shock: "삼성전자" },
  close: { label: "10월 29일 15:40", pct: { 삼성전자: 9.0, 현대차: 1.9, SK하이닉스: 10.9, NAVER: 1.8 }, filled: true },
  month: { label: "10월 31일 18:00, 월말", pct: { 삼성전자: 0.6, 현대차: 0.3, SK하이닉스: -1.1, NAVER: 0.2 } },

  // 앞으로 2주. 내 종목에 걸린 것만. 날짜는 시연용 가상 일정
  calendar: [
    { date: "10월 30일", what: "삼성전자 분기 실적 발표 예정", sym: "삼성전자", note: "지난 4번 실적일 평균 변동 ±6%. 내 돈의 66%가 이 종목" },
    { date: "11월 3일", what: "현대차 배당 기준일 예정", sym: "현대차", note: "이날까지 들고 있어야 배당. 이튿날 사면 못 받음" },
    { date: "11월 5일", what: "미국 금리 결정", sym: null, note: "지난 6번 중 4번 다음 날 코스피가 1% 넘게 움직임" },
    { date: "11월 7일", what: "SK하이닉스 기업설명회 예정", sym: "SK하이닉스", note: "관심종목. 보유는 없음" },
    { date: "11월 12일", what: "미국 소비자물가 발표", sym: null, note: "반도체 비중이 큰 계좌라 영향이 큼" },
  ],

  // 뉴스를 내 포지션 뜻으로. 뉴스 자체는 dali-data.js
  forMe: {
    "삼성전자": "내 돈의 66%. 이 종목 1%가 내 전체 0.66%",
    "현대차": "내 20주 기준 1%에 59,400원",
    "SK하이닉스": "관심종목, 보유 없음. 급등 당일 매수는 지난 5번 평균 -2.1%였던 자리",
    "NAVER": "관심종목. 이번 달 -6.3%로 판 종목",
  },
};

// 매매일지와 오늘 탭이 같은 거래 목록을 보도록: 10월에 팔아서 끝낸 매매에서 실현 손익과 건수를 계산하고,
// 매매일지의 완료 카드도 이 목록으로 만든다 (보유 중 카드 t8, t3은 dali-data.js 그대로)
(function () {
  const C = DALI_CUSTOMER;
  const oct = C.trades.filter(t => t.sell && t.sell.startsWith("10/"));
  const pnl = t => Math.round(t.qty * t.price * t.pct / 100 / 100) * 100;
  C.month.realized = oct.reduce((a, t) => a + pnl(t), 0);
  C.month.trades = oct.length;
  if (typeof DALI_TRADES === "undefined") return;
  for (let i = DALI_TRADES.length - 1; i >= 0; i--) if (DALI_TRADES[i].app === "stock" && DALI_TRADES[i].sell) DALI_TRADES.splice(i, 1);
  const at = DALI_TRADES.findIndex(t => t.app !== "stock");
  const cards = oct.slice().reverse().map(t => ({
    id: `c${t.id}`, app: "stock", sym: t.sym, qty: `${t.qty}주`,
    buy: { date: t.buy, news: t.ctx[0], mood: t.ctx[1] }, sell: { date: t.sell, news: t.ctx[2], mood: t.ctx[3] },
    pnl: pnl(t), pct: t.pct, memo: "",
  }));
  DALI_TRADES.splice(at < 0 ? DALI_TRADES.length : at, 0, ...cards);
})();
