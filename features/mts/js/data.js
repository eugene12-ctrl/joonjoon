/* ---------- 시연 데이터 ----------
   종목은 실제 이름, 가격은 2026년 10월 28일 종가 수준(달이 데이터와 같은 숫자).
   거래량, 호가 잔량, 조회수는 시연용 숫자입니다. 값이 null이면 자리표시(0,000)로 나옵니다. */
const ACCOUNT = { no: "000-00-000000", type: "종합", owner: "홍길동" };

// dir: up(상승, 빨강) | down(하락, 파랑) | flat
const STOCKS = [
  { code: "005930", name: "삼성전자", margin: "현20 신45", nxt: "NXT가능", price: 242000, change: 20000, rate: 9.01, volume: 38215400, volRate: 212.4, dir: "up" },
  { code: "000660", name: "SK하이닉스", margin: "현20 신45", nxt: "NXT가능", price: 1487000, change: 146000, rate: 10.89, volume: 6120300, volRate: 248.1, dir: "up" },
  { code: "005380", name: "현대차", margin: "현20 신45", nxt: "NXT가능", price: 297000, change: 5500, rate: 1.89, volume: 1032800, volRate: 96.3, dir: "up" },
  { code: "035420", name: "NAVER", margin: "현20 신45", nxt: "NXT가능", price: 220500, change: 4000, rate: 1.85, volume: 815400, volRate: 88.7, dir: "up" },
  // 아직 관심에 없는 종목: 종목 고르기에서 들어가 별을 누르면 관심1과 달이에 같이 담김 (달이 쪽 이름 키와 같은 이름)
  { code: "001200", name: "유진투자증권", margin: "현40 신50", nxt: "NXT가능", price: 3850, change: 35, rate: 0.92, volume: 1386200, volRate: 118.4, dir: "up" },
  { code: "373220", name: "LG에너지솔루션", margin: "현20 신45", nxt: "NXT가능", price: 412000, change: -2900, rate: -0.70, volume: 284600, volRate: 74.1, dir: "down" },
];

// 관심종목 하위 탭별 종목
const WATCH_GROUPS = { "보유": ["005930", "005380"], "최근": ["000660"], "관심1": ["005930", "000660", "005380", "035420"] };
// 별로 더한 종목은 이 브라우저에 남김 (처음으로 누르면 달이 쪽과 함께 비워짐)
try { (JSON.parse(localStorage.getItem("mts-watch") || "[]")).forEach(c => { if (!WATCH_GROUPS["관심1"].includes(c)) WATCH_GROUPS["관심1"].push(c); }); } catch (e) { /* 저장 못 읽으면 기본 관심만 */ }

// 종목상위·유진조회상위 순위 (가격은 위 종목과 같은 숫자, 조회수는 시연용)
const RANK_ROWS = STOCKS.slice(0, 4).map((s, i) => ({ name: s.name, price: s.price, rate: s.rate, volume: s.volume, views: [48210, 39550, 12840, 9930][i], dir: s.dir }));

// 쏙쏙섹터 미리보기 (서비스 신청 전이라 아래쪽은 흐리게)
const SECTORS = [
  { name: "가상섹터 1", rows: ["가상종목M", "가상종목N", "가상종목O"] },
  { name: "가상섹터 2", rows: ["가상종목P", "가상종목Q", "가상종목R"] },
];

// 하단 지수 띠 (몇 초마다 바뀜)
const INDICES = [
  { name: "코스피", value: null, change: null, rate: null, dir: "down", status: "장 중" },
  { name: "코스닥", value: null, change: null, rate: null, dir: "down", status: "장 중" },
  { name: "다우존스", value: null, change: null, rate: null, dir: "up", status: "" },
  { name: "중국상해종합", value: null, change: null, rate: null, dir: "down", status: "" },
];

// 차트 화면 위 뉴스 띠
const NEWS_TICKER = [
  { src: "인포스탁", text: "가상 뉴스 한 줄이 이 자리에 흐릅니다" },
];

// 호가: 지금 보고 있는 종목 기준으로 매도 10단계 + 매수 10단계 (한국거래소 호가 단위)
const tickOf = p => (p >= 500000 ? 1000 : p >= 200000 ? 500 : p >= 50000 ? 100 : p >= 20000 ? 50 : 10);
const BOOK_QTY = [1204, 845, 2310, 978, 1650, 532, 3120, 760, 1488, 2045];
const ORDER_BOOK = {
  get stock() { return STOCKS.find(s => s.code === (typeof App !== "undefined" ? App.code : STOCKS[0].code)) || STOCKS[0]; },
  get asks() { const s = this.stock, t = tickOf(s.price); return BOOK_QTY.map((q, i) => ({ price: s.price + (9 - i) * t, qty: q })); },
  get bids() { const s = this.stock, t = tickOf(s.price); return BOOK_QTY.map((q, i) => ({ price: s.price - (i + 1) * t, qty: BOOK_QTY[9 - i] })); },
  get prevClose() { return this.stock.price - this.stock.change; }, // 호가 사이의 기준가(K) 줄
};

// 오늘 날짜 (잔고 화면 날짜 칸)
const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();
