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
  // soldIn24h: 손실 난 지 하루 안에 팜. days: 보유일
  // 산 순간과 판 순간의 사진(buySnap, sellSnap)은 아래 DALI_SNAP에서 붙인다. 판 뒤 2주 변화는 sellSnap.later
  // ctx 문자열은 예전 매매일지용으로 남겨 두지만 화면에선 더 이상 쓰지 않는다
  trades: [
    { id: 1, sym: "SK하이닉스", qty: 5, buy: "08/04", sell: "08/05", buyChg: 6.1, pct: -3.1, days: 1, soldIn24h: true },
    { id: 2, sym: "삼성전자", qty: 30, buy: "08/07", sell: "08/26", buyChg: 0.3, pct: 4.2, days: 19 },
    { id: 3, sym: "현대차", qty: 10, buy: "08/11", sell: "08/19", buyChg: 0.4, pct: -1.8, days: 8 },
    { id: 4, sym: "NAVER", qty: 15, buy: "08/13", sell: "08/14", buyChg: 5.4, pct: -2.6, days: 1, soldIn24h: true },
    { id: 5, sym: "삼성전자", qty: 20, buy: "08/18", sell: "09/02", buyChg: 0.8, waited: true, pct: 2.2, days: 15 },
    { id: 6, sym: "SK하이닉스", qty: 3, buy: "08/21", sell: "08/28", buyChg: 7.2, pct: -1.4, days: 7 },
    { id: 7, sym: "현대차", qty: 10, buy: "09/01", sell: "09/11", buyChg: 0.4, pct: 3.9, days: 10 },
    { id: 8, sym: "NAVER", qty: 10, buy: "09/03", sell: "09/04", buyChg: -2.1, pct: -4.0, days: 1, soldIn24h: true },
    { id: 9, sym: "삼성전자", qty: 20, buy: "09/08", sell: "09/18", buyChg: 1.2, waited: true, pct: 1.1, days: 10 },
    { id: 10, sym: "SK하이닉스", qty: 4, buy: "09/10", sell: "09/24", buyChg: 5.5, pct: -0.9, days: 14 },
    { id: 11, sym: "현대차", qty: 10, buy: "09/15", sell: "09/16", buyChg: -1.6, pct: -3.3, days: 1, soldIn24h: true },
    { id: 12, sym: "삼성전자", qty: 30, buy: "09/22", sell: null, buyChg: 0.6, pct: 9.5, days: 37 },
    { id: 13, sym: "NAVER", qty: 10, price: 236000, buy: "09/23", sell: "10/02", buyChg: 0.9, waited: true, pct: 0.9, days: 9,
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
    { id: 20, sym: "NAVER", qty: 5, price: 228000, buy: "10/23", sell: "10/23", buyChg: 5.0, pct: -2.0, days: 0.3,
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

// 달이 3.0: 시연 시각마다 보유 종목의 "지금" 사진. 비교 축 다섯 개와 펼쳤을 때 쓰는 기록 값만.
// 삼성전자는 네 장면 내내 산 순간과 같음 (장중 -3.8%여도 지지선 위, 추세와 업종 그대로)
// 현대차는 마감에 업종이 5일째 내림으로 바뀜. sectorRun: 업종이 같은 방향으로 간 날 수
(function () {
  const sam = { trend: "up", support: true, volume: "normal", sector: "up", vol: "calm", ma20: 228500, ma60: 215000, lo20: 212000, hi20: 245000, volRatio: 1.1 };
  const hy = { trend: "up", support: true, volume: "normal", sector: "up", vol: "calm", ma20: 292000, ma60: 284000, lo20: 285000, hi20: 301000, volRatio: 0.9 };
  const hyDown = { ...hy, sector: "down", sectorRun: 5 };
  DALI_MARKET.morning.nowSnap = { 삼성전자: { ...sam }, 현대차: { ...hy } };
  DALI_MARKET.intraday.nowSnap = { 삼성전자: { ...sam, volRatio: 1.3 }, 현대차: { ...hy } };
  DALI_MARKET.close.nowSnap = { 삼성전자: { ...sam, volRatio: 1.4 }, 현대차: hyDown };
  DALI_MARKET.month.nowSnap = { 삼성전자: { ...sam }, 현대차: { ...hyDown } };
})();
// 종목의 업종. 사진의 sector 축과 근거 문장에 씀
const DALI_SECTOR = { 삼성전자: "반도체", SK하이닉스: "반도체", 현대차: "자동차", NAVER: "플랫폼" };

// ---------- 달이 3.0: 산 순간과 판 순간의 사진 ----------
// 매매마다 그 순간의 상황을 사진처럼 남긴다. 이유는 적지 않고 상황만. 값은 전부 시연용 가상.
// 비교 축은 다섯 개뿐: trend 20일선 기울기, support 최근 20일 저점 위, volume 거래량(20일 평균 대비),
// sector 업종 5일 흐름, vol 최근 20일 변동폭. 가격은 비교 축이 아니다 (표시용).
// 축은 한 글자씩 "추세 지지 거래량 업종 변동" 순서로 적는다: u/f/d, 1/0, h/n/l, u/f/d, c/w
// 기록용 값(이평선, 저점과 고점, 거래량 배수)은 그 순간 가격과 축에서 한 가지 방식으로 만든다
const DALI_SNAP = (function () {
  const AX = { u: "up", f: "flat", d: "down", h: "high", n: "normal", l: "low", c: "calm", w: "wild" };
  const tick = p => (p >= 500000 ? 1000 : p >= 200000 ? 500 : 100);
  const r = p => Math.round(p / tick(p)) * tick(p);
  // at: "08/04 09:12", p: 가격, ax: 축 다섯 글자, o: 그날 코스피, 미국 지수, 수급, 일정, 뉴스 톤
  function S(at, p, ax, o) {
    const [t, s, v, se, vo] = ax.split("");
    const slot = +at.slice(6, 8) < 10 ? "장초" : +at.slice(6, 8) >= 14 ? "마감" : "장중";
    return {
      at, price: r(p),
      trend: AX[t], support: s === "1", volume: AX[v], sector: AX[se], vol: AX[vo],
      ma20: r(p * (t === "u" ? 0.975 : t === "f" ? 1 : 1.025)), ma60: r(p * (t === "u" ? 0.94 : t === "f" ? 0.99 : 1.06)),
      lo20: r(p * (s === "1" ? 0.95 : 1.02)), hi20: r(p * 1.04),
      volRatio: v === "h" ? 2.1 : v === "n" ? 1.0 : 0.4,
      dayChg: o.chg, kospi: o.kospi, usRef: o.us, flow5: o.flow, event: o.event || { kind: null, dday: null },
      newsTone: o.tone, mine: { orderType: o.order || "지정가", slot },
    };
  }
  const US = { 반도체: "미국 반도체", 자동차: "미국 자동차", 플랫폼: "미국 기술주" };
  const us = (sym, chg) => ({ name: US[DALI_SECTOR[sym]], chg });
  const F = (foreign, inst) => ({ foreign, inst });
  // 매매 id → [산 순간, 판 순간]. 판 순간의 later는 판 뒤 2주 가격 변화 %. 2주가 아직 안 지났으면 null
  return {
    1: [S("08/04 09:12", 1180000, "u1huw", { chg: 6.1, kospi: 1.2, us: us("SK하이닉스", 2.4), flow: F("buy", "buy"), tone: "pos", order: "시장가" }),
        S("08/05 10:05", 1143400, "u1nuw", { chg: -3.1, kospi: -0.6, us: us("SK하이닉스", -0.8), flow: F("buy", "flat"), tone: "neu", order: "시장가" })],
    2: [S("08/07 13:20", 198000, "f1nfc", { chg: 0.3, kospi: 0.1, us: us("삼성전자", 0.2), flow: F("flat", "flat"), tone: "neu" }),
        S("08/26 11:40", 206300, "u1huc", { chg: 1.6, kospi: 0.8, us: us("삼성전자", 1.1), flow: F("buy", "buy"), tone: "pos" })],
    3: [S("08/11 10:30", 268000, "u1nuc", { chg: 0.4, kospi: 0.3, us: us("현대차", 0.5), flow: F("buy", "flat"), tone: "neu" }),
        S("08/19 14:10", 263200, "f0nfc", { chg: -0.9, kospi: -0.4, us: us("현대차", -0.3), flow: F("sell", "flat"), tone: "neu" })],
    4: [S("08/13 09:20", 214000, "u1huw", { chg: 5.4, kospi: 0.9, us: us("NAVER", 1.9), flow: F("buy", "sell"), tone: "pos", order: "시장가" }),
        S("08/14 10:40", 208400, "u1nuw", { chg: -2.6, kospi: -0.2, us: us("NAVER", -0.5), flow: F("flat", "sell"), tone: "neu", order: "시장가" })],
    5: [S("08/18 11:00", 205000, "u1nuc", { chg: 0.8, kospi: 0.4, us: us("삼성전자", 0.6), flow: F("buy", "buy"), tone: "neu" }),
        S("09/02 13:30", 209500, "u1luc", { chg: 0.2, kospi: 0.1, us: us("삼성전자", 0.3), flow: F("buy", "flat"), tone: "neu" })],
    6: [S("08/21 09:15", 1240000, "u1huw", { chg: 7.2, kospi: 1.4, us: us("SK하이닉스", 3.1), flow: F("buy", "buy"), tone: "pos", order: "시장가" }),
        S("08/28 14:20", 1222600, "f1nfw", { chg: -0.6, kospi: -0.3, us: us("SK하이닉스", -1.0), flow: F("flat", "sell"), tone: "neu" })],
    7: [S("09/01 10:50", 272000, "f1nfc", { chg: 0.4, kospi: 0.2, us: us("현대차", 0.1), flow: F("flat", "flat"), tone: "neu" }),
        S("09/11 11:30", 282600, "u1nuc", { chg: 1.1, kospi: 0.5, us: us("현대차", 0.7), flow: F("buy", "buy"), tone: "pos" })],
    8: [S("09/03 11:10", 226000, "d1nfc", { chg: -2.1, kospi: -0.5, us: us("NAVER", -0.9), flow: F("sell", "flat"), tone: "neu" }),
        S("09/04 14:40", 217000, "d0hdw", { chg: -3.6, kospi: -1.1, us: us("NAVER", -1.7), flow: F("sell", "sell"), tone: "neg", order: "시장가" })],
    9: [S("09/08 10:20", 212000, "u1nuc", { chg: 1.2, kospi: 0.6, us: us("삼성전자", 0.9), flow: F("buy", "buy"), tone: "neu" }),
        S("09/18 13:50", 214300, "u1nuc", { chg: 0.4, kospi: 0.2, us: us("삼성전자", 0.4), flow: F("buy", "flat"), tone: "neu" })],
    10: [S("09/10 09:25", 1265000, "u1huw", { chg: 5.5, kospi: 1.0, us: us("SK하이닉스", 2.2), flow: F("buy", "flat"), tone: "pos", order: "시장가" }),
         S("09/24 11:20", 1253600, "f1lfw", { chg: -0.4, kospi: -0.1, us: us("SK하이닉스", -0.2), flow: F("flat", "flat"), tone: "neu" })],
    11: [S("09/15 10:40", 282000, "f1nfc", { chg: -1.6, kospi: -0.3, us: us("현대차", -0.4), flow: F("flat", "flat"), tone: "neu" }),
         S("09/16 09:50", 272700, "f1nfc", { chg: -3.3, kospi: -0.7, us: us("현대차", -0.6), flow: F("flat", "sell"), tone: "neu", order: "시장가" })],
    12: [S("09/22 11:15", 232000, "u1nuc", { chg: 0.6, kospi: 0.3, us: us("삼성전자", 0.8), flow: F("buy", "buy"), tone: "neu", event: { kind: "실적", dday: 38 } })],
    13: [S("09/23 13:10", 236000, "f1nfc", { chg: 0.9, kospi: 0.2, us: us("NAVER", 0.3), flow: F("flat", "flat"), tone: "neu" }),
         S("10/02 10:30", 238100, "f1lfc", { chg: 0.1, kospi: 0.0, us: us("NAVER", 0.2), flow: F("flat", "flat"), tone: "neu" })],
    14: [S("09/30 10:05", 214400, "u1nuc", { chg: 0.2, kospi: 0.1, us: us("삼성전자", 0.5), flow: F("buy", "buy"), tone: "neu", event: { kind: "실적", dday: 30 } })],
    15: [S("10/02 09:10", 1290000, "u1huw", { chg: 6.3, kospi: 1.1, us: us("SK하이닉스", 2.6), flow: F("buy", "buy"), tone: "pos", order: "시장가" }),
         S("10/06 14:30", 1257800, "f1nfw", { chg: -1.2, kospi: -0.4, us: us("SK하이닉스", -1.3), flow: F("flat", "sell"), tone: "neg" })],
    16: [S("10/08 11:40", 291000, "u1nuc", { chg: 0.3, kospi: 0.2, us: us("현대차", 0.4), flow: F("buy", "flat"), tone: "neu", event: { kind: "배당락", dday: 26 } })],
    17: [S("10/13 13:40", 239000, "f1nfc", { chg: 1.0, kospi: 0.3, us: us("NAVER", 0.4), flow: F("flat", "flat"), tone: "neu" }),
         S("10/21 14:50", 223900, "d0hdw", { chg: -2.8, kospi: -0.9, us: us("NAVER", -1.4), flow: F("sell", "sell"), tone: "neg", order: "시장가" })],
    18: [S("10/16 11:05", 1350000, "f1nfc", { chg: -0.8, kospi: -0.2, us: us("SK하이닉스", -0.3), flow: F("flat", "flat"), tone: "neu" }),
         S("10/20 10:15", 1395900, "u1huc", { chg: 2.9, kospi: 0.9, us: us("SK하이닉스", 1.8), flow: F("buy", "buy"), tone: "pos" })],
    19: [S("10/21 10:42", 224000, "u1huc", { chg: 1.4, kospi: 0.6, us: us("삼성전자", 1.8), flow: F("buy", "buy"), tone: "pos", event: { kind: "실적", dday: 9 } }),
         S("10/27 13:25", 228000, "u1nuc", { chg: 0.5, kospi: 0.2, us: us("삼성전자", 0.6), flow: F("buy", "flat"), tone: "neu", event: { kind: "실적", dday: 3 } })],
    20: [S("10/23 09:30", 228000, "u1huw", { chg: 5.0, kospi: 0.8, us: us("NAVER", 1.5), flow: F("buy", "sell"), tone: "pos", order: "시장가" }),
         S("10/23 14:35", 223400, "u1nuw", { chg: 3.0, kospi: 0.5, us: us("NAVER", 1.5), flow: F("flat", "sell"), tone: "neu" })],
  };
})();
// 판 뒤 2주 가격 변화 %. 10월 20일 이후에 판 것은 아직 2주가 안 됨
const DALI_LATER = { 1: 7.1, 2: -1.5, 3: -2.4, 4: 3.9, 5: 3.0, 6: 4.2, 7: 1.1, 8: -1.2, 9: 2.6, 10: -3.0, 11: 5.6, 13: -0.8, 15: 5.0, 17: null, 18: null, 19: null, 20: null };

// 매매일지와 오늘 탭이 같은 거래 목록을 보도록: 10월에 팔아서 끝낸 매매에서 실현 손익과 건수를 계산하고,
// 매매일지의 완료 카드도 이 목록으로 만든다 (보유 중 카드 t8, t3은 dali-data.js 그대로)
(function () {
  const C = DALI_CUSTOMER;
  const seen = {}, held = {}, TOTAL = 29500000;
  C.trades.forEach(t => {
    const [b, sl] = DALI_SNAP[t.id];
    seen[t.sym] = (seen[t.sym] || 0) + 1;
    const h = held[t.sym];
    t.buySnap = { ...b, mine: { ...b.mine, nth: seen[t.sym], share: Math.round(t.qty * b.price / TOTAL * 100), avgGap: h ? +((b.price / h.avg - 1) * 100).toFixed(1) : 0 } };
    if (!t.sell) {
      const q = (h ? h.qty : 0) + t.qty;
      held[t.sym] = { qty: q, avg: ((h ? h.qty * h.avg : 0) + t.qty * b.price) / q };
      return;
    }
    t.sellSnap = { ...sl, later: DALI_LATER[t.id], mine: { ...sl.mine, nth: seen[t.sym], share: 0, avgGap: +((sl.price / b.price - 1) * 100).toFixed(1) } };
  });
  const oct = C.trades.filter(t => t.sell && t.sell.startsWith("10/"));
  const pnl = t => Math.round(t.qty * t.price * t.pct / 100 / 100) * 100;
  C.month.realized = oct.reduce((a, t) => a + pnl(t), 0);
  C.month.trades = oct.length;
  if (typeof DALI_TRADES === "undefined") return;
  for (let i = DALI_TRADES.length - 1; i >= 0; i--) if (DALI_TRADES[i].app === "stock" && DALI_TRADES[i].sell) DALI_TRADES.splice(i, 1);
  const at = DALI_TRADES.findIndex(t => t.app !== "stock");
  const cards = oct.slice().reverse().map(t => ({
    id: `c${t.id}`, tid: t.id, app: "stock", sym: t.sym, qty: `${t.qty}주`,
    buy: { date: t.buy, news: t.ctx[0], mood: t.ctx[1] }, sell: { date: t.sell, news: t.ctx[2], mood: t.ctx[3] },
    pnl: pnl(t), pct: t.pct, memo: "",
  }));
  DALI_TRADES.splice(at < 0 ? DALI_TRADES.length : at, 0, ...cards);
})();
