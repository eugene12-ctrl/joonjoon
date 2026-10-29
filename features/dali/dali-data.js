/* ---------- 달이 가상 데이터 ----------
   종목명은 실제입니다. 주가는 2026년 10월 28일 종가 수준을 반영했고, 뉴스, 매매, 손익은 시연용 가상입니다.
   실제 회사의 공시나 실적을 지어내지 않고, 시장 흐름 수준의 뉴스만 씁니다. */
const DALI_APPS = {
  stock: { name: "유진투자증권", short: "증권" },
  fut: { name: "유진투자선물", short: "선물" },
};

// 관심종목(watch)과 보유(hold). 관심종목에 넣으면 달이가 자동으로 추적
const DALI_SYMS = {
  "삼성전자": { app: "stock", kind: "hold", price: 242000, chg: 9.0 },
  "SK하이닉스": { app: "stock", kind: "watch", price: 1487000, chg: 10.9 },
  "현대차": { app: "stock", kind: "hold", price: 297000, chg: 1.9 },
  "NAVER": { app: "stock", kind: "watch", price: 220500, chg: 1.8 },
  "마이크로 나스닥100 선물": { app: "fut", kind: "hold", price: 29650.25, chg: 1.2 },
  "마이크로 금 선물": { app: "fut", kind: "hold", price: 4037.3, chg: -0.6 },
  "WTI 원유 선물": { app: "fut", kind: "watch", price: 101.93, chg: 2.0 },
};

// 느낌표는 AI의 감이 아니라 객관 기준(공시, 실적, 큰 변동)일 때만
const DALI_FLAG_TYPES = ["공시", "실적", "큰 변동"];

const DALI_NEWS = [
  { id: "n1", sym: "SK하이닉스", type: "큰 변동", time: "09:12",
    why: "반도체 대형주가 나란히 크게 올랐어요" },
  { id: "n2", sym: "현대차", type: "소식", time: "08:40",
    why: "환율이 오르며 수출주에 관심이 모였어요" },
  { id: "n3", sym: "삼성전자", type: "소식", time: "08:30",
    why: "유진 리서치가 메모리 업황 점검 리포트를 냈어요" },
  { id: "n4", sym: "NAVER", type: "소식", time: "어제",
    why: "플랫폼 관련 논의가 다시 나왔어요" },
  { id: "n5", sym: "마이크로 나스닥100 선물", type: "큰 변동", time: "어젯밤",
    why: "미국 고용지표가 예상보다 강했어요" },
  { id: "n6", sym: "마이크로 금 선물", type: "소식", time: "07:50",
    why: "전날보다 조금 내렸어요" },
  { id: "n7", sym: "WTI 원유 선물", type: "소식", time: "07:20",
    why: "100달러 위에서 오름세를 이어 갔어요" },
];

// 시연 버튼으로 도착하는 의미 있는 뉴스
const DALI_ALERT_NEWS = {
  stock: { id: "a1", sym: "삼성전자", type: "큰 변동", time: "방금",
    why: "반도체 대형주와 함께 크게 올랐어요" },
  fut: { id: "a2", sym: "마이크로 나스닥100 선물", type: "큰 변동", time: "방금",
    why: "중앙은행 의장 발언에 크게 움직였어요" },
};

// 매매일지 (가상). 한 카드 = 매수부터 매도까지 한 번의 매매.
// 살 때, 팔 때 상황은 달이가 알아서 적고, memo는 고객이 원하면 남김
const DALI_TRADES = [
  { id: "t1", app: "stock", sym: "삼성전자", qty: "15주",
    buy: { date: "10/02", news: "반도체 업황 회복 기대 기사", mood: "차분한 날" },
    sell: { date: "10/20", news: "실적 발표 앞두고 기대감", mood: "거래가 많은 날" },
    pnl: 246000, pct: 8.2, memo: "업황 회복 보고 샀고, 목표만큼 오르자 팔았음" },
  { id: "t2", app: "stock", sym: "SK하이닉스", qty: "5주",
    buy: { date: "10/01", news: "AI 반도체 수요 기사", mood: "차분한 날" },
    sell: { date: "10/08", news: "미국 기술주 급락 속보", mood: "급락 1시간 안" },
    pnl: -266500, pct: -4.1, memo: "" },
  { id: "t3", app: "stock", sym: "현대차", qty: "10주",
    buy: { date: "10/21", news: "환율 상승 기사", mood: "차분한 날" },
    sell: null, pnl: 58200, pct: 2.0, memo: "" },
  { id: "t4", app: "fut", sym: "마이크로 나스닥100 선물", qty: "1계약",
    buy: { date: "10/16", news: "미국 지수 급락 속보", mood: "밤사이 크게 흔들린 날" },
    sell: { date: "10/17", news: "지수 반등 기사", mood: "반등한 날" },
    pnl: -2900000, pct: -3.4, memo: "" },
  { id: "t5", app: "fut", sym: "마이크로 금 선물", qty: "1계약",
    buy: { date: "10/23", news: "안전자산 선호 기사", mood: "거래가 많은 날" },
    sell: null, pnl: 640000, pct: 1.1, memo: "" },
];

// 관리 탭 미션. 거래에는 조약돌을 주지 않음
const DALI_MISSIONS = [
  { id: "m-alert", group: "오늘", title: "느낌표 뉴스 하나 확인하기", reward: 1, auto: true },
  { id: "m-remind", group: "오늘", title: "지난 매매 하나 다시 보기", reward: 1, auto: true },
  { id: "m-comment", group: "오늘", title: "일지에 메모 남기기 (안 해도 괜찮아요)", reward: 1, auto: true },
  { id: "m-quiz", group: "배우기", title: "해외선물 증거금, 한 문제", reward: 2, quiz: {
    q: "해외선물에서 증거금이란?",
    options: ["거래를 위해 맡겨 두는 담보", "매달 내는 수수료", "수익을 보장해 주는 돈"], answer: 0,
    after: "맞아요. 가격이 반대로 움직이면 증거금이 더 필요할 수 있어요. 해외파생 사전교육과 이어지는 내용이에요." } },
  { id: "m-walk", group: "유진과 함께", title: "가치걸음 시즌, 오늘 걸음 보태기", reward: 1, note: "오늘 6,200보 (가상). 모두의 걸음이 자립준비청년 기부로 이어져요" },
  { id: "m-tennis", group: "유진과 함께", title: "서울오픈 예측 퀴즈", reward: 2, quiz: {
    q: "테니스에서 0점을 부르는 말은?",
    options: ["러브", "제로", "니트"], answer: 0,
    after: "맞아요, 러브! 서울오픈 기간엔 매일 한 문제씩 나와요. 맞히면 관람권 추첨에도 들어가요 (가상)." } },
];

// 성장 단계. 시연에서 미션만으로 끝까지 볼 수 있게 시작 7개, 미션 합계 8개에 맞춤
// icon은 features/dali/img/ 안의 Fluent 3D 이미지
const DALI_STAGES = [
  { min: 0, name: "아기 달이", note: "물에 둥둥 떠서 세상 구경 중이에요", icon: "baby_bottle", scale: .74 },
  { min: 8, name: "헤엄치는 달이", note: "조약돌 고르는 법을 배우는 중이에요", icon: "bubbles", scale: .86 },
  { min: 11, name: "조개 여는 달이", note: "모은 조약돌로 조개를 열 수 있어요", icon: "oyster", scale: .96 },
  { min: 14, name: "꾸준한 달이", note: "매일 조금씩, 바다 친구들이 따라 배워요", icon: "glowing_star", scale: 1.04 },
];

// 옷장. stage 단계가 되면 열림. 한 번에 하나만 입음
const DALI_WEARS = [
  { id: "ribbon", name: "빨간 리본", stage: 0 },
  { id: "hibiscus", name: "바다 꽃", stage: 1 },
  { id: "glasses", name: "뉴스 안경", stage: 2 },
  { id: "graduation_cap", name: "학사모", stage: 3 },
];

// 뉴스 읽기 화면에 나오는 제목과 본문 (가상)
const DALI_NEWS_TEXT = {
  n1: { title: "반도체 대형주 나란히 급등 (가상 요약)", body: "반도체 대형주가 나란히 크게 오르며 거래대금 상위에 올랐다. 검색 관심이 실제 거래로 이어졌다는 분석이 나왔다." },
  n2: { title: "원달러 환율 상승, 수출주 관심", body: "원달러 환율이 오르며 수출 비중이 큰 기업에 관심이 모였다. 자동차 업종이 대표적으로 거론됐다." },
  n3: { title: "메모리 업황 점검 리포트 (가상)", body: "메모리 반도체 업황 흐름을 점검한 리포트가 나왔다. 재고와 수요 흐름을 함께 짚었다." },
  n4: { title: "국내 플랫폼 관련 논의 재개", body: "국내 플랫폼 기업 관련 정책 논의가 다시 이어졌다. 구체적인 일정은 아직 정해지지 않았다." },
  n5: { title: "미국 고용지표 예상 상회, 지수선물 급변", body: "미국 고용지표가 시장 예상보다 강하게 나왔다. 금리 인하 기대가 줄며 지수선물이 크게 움직였다." },
  n6: { title: "금값 숨 고르기", body: "금 선물이 전날보다 소폭 내리며 숨을 골랐다." },
  n7: { title: "유가 100달러 위 오름세", body: "WTI 원유 선물이 배럴당 100달러 위에서 오름세를 이어 갔다." },
  a1: { title: "반도체 대형주 강세 이어져 (가상 요약)", body: "반도체 대형주가 함께 크게 오르며 장을 이끌었다. 개별 회사의 새 공시는 없었다." },
  a2: { title: "미국 중앙은행 의장 발언, 지수선물 급변", body: "의장 발언 직후 금리 전망이 바뀌며 지수선물이 크게 움직였다." },
};
