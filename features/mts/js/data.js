/* ---------- 가상 데이터 ----------
   숫자 값이 null이면 화면에 자리표시(0,000 / 0.00%)로 나옵니다.
   나중에 가상 숫자를 넣을 때는 null 자리에 숫자만 채우면 됩니다. (화면에 "가상 데이터" 표시 유지) */
const ACCOUNT = { no: "000-00-000000", type: "종합", owner: "홍길동" };

// dir: up(상승, 빨강) | down(하락, 파랑) | flat
const STOCKS = [
  { code: "000000", name: "가상종목A", margin: "현00 신00", nxt: "NXT불가", price: null, change: null, rate: null, volume: null, volRate: null, dir: "up" },
  { code: "000001", name: "가상종목B", margin: "현00 신00", nxt: "NXT가능", price: null, change: null, rate: null, volume: null, volRate: null, dir: "down" },
  { code: "000002", name: "가상종목C", margin: "현00 신00", nxt: "NXT가능", price: null, change: null, rate: null, volume: null, volRate: null, dir: "up" },
];

// 관심종목 하위 탭별 종목
const WATCH_GROUPS = { "보유": [], "최근": ["000000"], "관심1": ["000000", "000001", "000002"] };

// 종목상위·유진조회상위 순위 (가상종목, 숫자는 자리표시)
const RANK_ROWS = "ABCDEFGHIJKL".split("").map((c, i) => ({
  name: `가상종목${c}`, price: null, rate: null, volume: null, views: null, dir: i % 4 === 3 ? "down" : "up",
}));

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

// 호가: 매도 10단계 + 매수 10단계 (price, qty). null이면 자리표시
const ORDER_BOOK = {
  asks: Array.from({ length: 10 }, () => ({ price: null, qty: null })),
  bids: Array.from({ length: 10 }, () => ({ price: null, qty: null })),
  prevClose: null, // 호가 사이의 기준가(K) 줄
};

// 오늘 날짜 (잔고 화면 날짜 칸)
const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();
