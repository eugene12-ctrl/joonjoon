/* ---------- 달이 가상 데이터 ----------
   종목명은 실제입니다. 주가는 2026년 10월 28일 종가 수준을 반영했고, 뉴스, 매매, 손익은 시연용 가상입니다.
   실제 회사의 공시나 실적을 지어내지 않고, 시장 흐름 수준의 뉴스만 씁니다. */
const DALI_APPS = {
  stock: { name: "유진투자증권", short: "증권" },
  fut: { name: "유진투자선물", short: "선물" },
};

// 관심종목(watch)과 보유(hold). 관심종목에 넣으면 달이가 자동으로 추적
// icon: 선물 종목 그림 (features/futures/img/<icon>.png, 해외선물 화면과 같은 Fluent 3D). 국내주식은 code로 img/logo-<code>.png
const DALI_SYMS = {
  // code: 종목 화면 공시 탭이 실제 공시(DART)를 찾을 때 쓰는 6자리 종목코드
  "삼성전자": { app: "stock", kind: "hold", price: 242000, chg: 9.0, code: "005930" },
  "SK하이닉스": { app: "stock", kind: "watch", price: 1487000, chg: 10.9, code: "000660" },
  "현대차": { app: "stock", kind: "hold", price: 297000, chg: 1.9, code: "005380" },
  "NAVER": { app: "stock", kind: "watch", price: 220500, chg: 1.8, code: "035420" },
  "유진투자증권": { app: "stock", kind: "watch", price: 4820, chg: 1.15, code: "001200" },
  // 유진투자선물 앱(futures.html): CME 해외선물. 주식은 증권 앱에서 따라가므로 여기선 선물만.
  // 이름은 futures.html FUTS의 ko와 같게 (종목을 누르면 그 선물 화면으로 감). 마이크로 계약은 원 계약 이름으로 묶음
  // name: 화면에 보이는 이름(선물 코드 병기). 키는 그대로 두고 DALI_NAME(sym)으로 꺼내 쓴다
  "크루드 오일": { app: "fut", kind: "hold", price: 61.84, chg: -1.12, dec: 2, icon: "oil", name: "크루드 오일 CL" },
  "금": { app: "fut", kind: "hold", price: 4128.4, chg: 0.46, dec: 1, icon: "gold", name: "금 GC" },
  "S&P 500": { app: "fut", kind: "watch", price: 7768.25, chg: 0.31, dec: 2, icon: "sp500", name: "S&P500 선물 ES" },
  "나스닥 100": { app: "fut", kind: "watch", price: 29512.5, chg: 0.62, dec: 2, icon: "nasdaq100", name: "나스닥 선물 NQ" },
};

// 느낌표는 AI의 감이 아니라 객관 기준(공시, 실적, 큰 변동)일 때만
// 선물은 만기(최종거래일)와 증거금이 객관 기준이라 느낌표를 붙임
const DALI_FLAG_TYPES = ["공시", "실적", "큰 변동", "만기", "증거금"];

const DALI_NEWS = [
  { id: "n1", sym: "SK하이닉스", type: "큰 변동", time: "09:12",
    why: "반도체 대형주 나란히 급등" },
  { id: "n2", sym: "현대차", type: "소식", time: "08:40",
    why: "환율 오르며 수출주에 관심" },
  { id: "n3", sym: "삼성전자", type: "소식", time: "08:30",
    why: "유진 리서치, 메모리 업황 점검" },
  { id: "n4", sym: "NAVER", type: "소식", time: "어제",
    why: "플랫폼 관련 논의 다시 부상" },
  { id: "n5", sym: "크루드 오일", type: "소식", time: "오늘 새벽",
    why: "미국 금리 결정 앞두고 관망세" },
  { id: "n6", sym: "크루드 오일", type: "소식", time: "어젯밤",
    why: "미국 원유 재고 늘며 하락" },
  { id: "n7", sym: "금", type: "소식", time: "06:10",
    why: "달러 약세에 소폭 상승" },
  { id: "n8", sym: "나스닥 100", type: "소식", time: "06:05",
    why: "기술주 강세 이어져" },
  { id: "n9", sym: "S&P 500", type: "소식", time: "06:05",
    why: "지수 소폭 올라 마감" },
  { id: "n10", sym: "나스닥 100", type: "소식", time: "어젯밤",
    why: "반도체 업종 강세에 지수 선물 상승" },
  { id: "n11", sym: "금", type: "소식", time: "어제",
    why: "금리 결정 앞두고 거래 줄어" },
  // 관심에 넣어야 보이는 종목(DALI_CATALOG)의 소식. 실제로 있는 일만 적고 공시나 실적은 지어내지 않는다
  { id: "n12", sym: "유진투자증권", type: "소식", time: "오늘",
    why: "유진 AX 고객경험 해커톤 진행 중" },
];

// 시연 버튼으로 도착하는 의미 있는 뉴스
const DALI_ALERT_NEWS = {
  stock: { id: "a1", sym: "삼성전자", type: "큰 변동", time: "방금",
    why: "반도체 대형주와 함께 급등" },
  fut: { id: "a2", sym: "크루드 오일", type: "증거금", time: "방금",
    why: "급락에 증거금 여유 줄어" },
};

// 매매일지 (가상). 한 카드 = 매수부터 매도까지 한 번의 매매.
// 살 때, 팔 때 상황은 달이가 알아서 적고, memo는 고객이 원하면 남김
const DALI_TRADES = [
  // buys: 나눠 산 기록. 평단보다 낮게 더 사면 물타기, 높게 더 사면 불타기 (화면은 사실만 적음)
  // 보유 종목은 dali-customer.js 보유(삼성전자 80주 평단 221,000원, 현대차 20주 291,000원)와 같은 숫자
  { id: "t8", app: "stock", sym: "삼성전자", qty: "80주",
    buy: { date: "09/22", news: "반도체 업황 회복 기대가 나온 날", mood: "차분한 날" },
    buys: [{ date: "09/22", qty: 30, price: 232000 }, { date: "09/30", qty: 50, price: 214400 }],
    sell: null, pnl: 1680000, pct: 9.5, memo: "" },
  { id: "t1", app: "stock", sym: "삼성전자", qty: "15주",
    buy: { date: "10/02", news: "반도체 업황 회복 기대 기사", mood: "차분한 날" },
    sell: { date: "10/20", news: "실적 발표 앞두고 기대감", mood: "거래가 많은 날" },
    pnl: 246000, pct: 8.2, memo: "업황 회복 보고 샀고, 목표만큼 오르자 팔았음" },
  { id: "t2", app: "stock", sym: "SK하이닉스", qty: "5주",
    buy: { date: "10/01", news: "AI 반도체 수요 기사", mood: "차분한 날" },
    sell: { date: "10/08", news: "미국 기술주 급락 속보", mood: "급락 1시간 안" },
    pnl: -266500, pct: -4.1, memo: "" },
  { id: "t3", app: "stock", sym: "현대차", qty: "20주",
    buy: { date: "10/08", news: "환율이 올라 수출주가 주목받은 날", mood: "차분한 날" },
    buys: [{ date: "10/08", qty: 10, price: 287000 }, { date: "10/21", qty: 10, price: 295000 }],
    sell: null, pnl: 120000, pct: 2.1, memo: "" },
  // 선물 앱은 달러 손익, pct는 가격 등락률. qty에 계약 코드를 함께 적음 (futures.html 보유와 같은 숫자)
  { id: "t4", app: "fut", sym: "나스닥 100", qty: "MNQ 2계약 매수",
    buy: { date: "10/14", news: "기술주 반등 기사", mood: "차분한 날" },
    sell: { date: "10/22", news: "기술주 강세 이어져", mood: "거래가 많은 날" },
    pnl: 1180, pct: 1.0, memo: "목표 구간이 와서 정리" },
  { id: "t5", app: "fut", sym: "S&P 500", qty: "MES 1계약 매수",
    buy: { date: "10/15", news: "미국 지수 급락 속보", mood: "밤사이 크게 흔들린 날" },
    sell: { date: "10/16", news: "지수 반등", mood: "반등한 날" },
    pnl: -240, pct: -0.6, memo: "" },
  { id: "t6", app: "fut", sym: "크루드 오일", qty: "CL 1계약 매수",
    buy: { date: "10/27", news: "원유 재고 발표 앞둔 날", mood: "차분한 날" },
    sell: null, pnl: -310, pct: -0.5, memo: "" },
  { id: "t7", app: "fut", sym: "금", qty: "MGC 2계약 매수",
    buy: { date: "10/23", news: "달러가 약했던 날", mood: "차분한 날" },
    sell: null, pnl: 540, pct: 0.7, memo: "" },
];

// 관리 탭 미션. 거래에는 조약돌을 주지 않음
// 유진의 캠페인은 달이와 하는 일 안에 녹임. 캠페인 이름은 tag(작은 칩)로만 보이고 달이가 홍보하지 않음
// 출처와 숫자는 docs/research-eugene-ever.md
// 화면엔 짧게: 오늘 할 일은 3줄, quiz가 있는 건 "이번 주 한 문제"에 하나씩. hidden은 줄 없이 조약돌만
const DALI_MISSIONS = [
  { id: "m-alert", icon: "newspaper", title: "느낌표 뉴스 보기", reward: 1, auto: true, hidden: true },
  { id: "m-read", icon: "open_book", title: "리포트 3줄 같이 읽기", reward: 1, tag: "독서클럽", btn: "읽기", pop: "read",
    doneSay: "끝까지 읽었어요! 달이 책장에 한 칸 쌓였어요." },
  { id: "m-walk", icon: "footprints", title: "달이랑 산책 6,200보", reward: 1, forest: 10, tag: "가치걸음", btn: "보태기",
    doneSay: "같이 걸었어요. 달이네 숲에 나무가 한 그루 자랐어요." },
  { id: "m-remind", icon: "memo", title: "지난 매매 돌아보기", reward: 1, auto: true },
  { id: "m-comment", icon: "memo", title: "일지에 한 줄", reward: 1, auto: true, hidden: true },
  { id: "m-tennis", icon: "tennis", title: "테니스", reward: 2, tag: "서울오픈", quiz: {
    q: "테니스에서 0점을 부르는 말은?",
    options: ["러브", "제로", "니트"], answer: 0,
    after: "맞아요, 러브! 이번 주엔 매일 한 문제씩 나와요." } },
  { id: "m-quiz", icon: "light_bulb", title: "해외선물 증거금", reward: 2, quiz: {
    q: "해외선물에서 증거금이란?",
    options: ["거래를 위해 맡겨 두는 담보", "매달 내는 수수료", "수익을 보장해 주는 돈"], answer: 0,
    after: "맞아요. 가격이 반대로 가면 증거금이 더 필요할 수 있어요." } },
  { id: "m-pledge", icon: "seedling", title: "내년 다짐 (선택)", reward: 1, quiz: {
    q: "연말에 같이 돌아봐요. 하나만 골라요.",
    options: ["뉴스 한 줄은 읽고 사기", "한 종목에 몰지 않기", "급한 날엔 하루 쉬어 가기"], pick: true,
    after: "좋아요. 지켰는지 따지지 않고 연말에 같이 돌아보기만 해요." } },
];

// 성장 단계. 시연에서 미션만으로 끝까지 볼 수 있게 시작 7개, 미션 합계 8개에 맞춤
// icon은 features/dali/img/ 안의 Fluent 3D 이미지
// gift: 이 단계가 되면 달이가 새로 해 주는 일 (키우는 이유). preview는 열었을 때 보이는 예시, 숫자는 가상
const DALI_STAGES = [
  { min: 0, name: "아기 달이", note: "물에 둥둥 떠서 세상 구경 중이에요", icon: "baby_bottle", scale: .74,
    gift: "아침마다 내 종목 소식 한 줄", preview: "지금 받고 있어요. 매일 아침 8시, 관심종목과 보유 종목 소식을 한 줄로 알려 줘요." },
  { min: 8, name: "헤엄치는 달이", note: "조약돌 고르는 법을 배우는 중이에요", icon: "bubbles", scale: .86,
    gift: "주간 돌아보기 카드", preview: "이번 주 매매 2건. 2건 모두 살 때 관련 뉴스를 읽었어요. 크게 오른 날 바로 산 건 0건이에요." },
  { min: 11, name: "조개 여는 달이", note: "모은 조약돌로 조개를 열 수 있어요", icon: "oyster", scale: .96,
    gift: "한 달 습관 리포트", preview: "10월엔 리포트를 12번 읽었고, 급한 날 하루 기다린 적이 1번 있어요. 한 종목 비중은 가장 클 때 38%였어요." },
  // 마지막 단계는 오래 함께한 고객의 목표. 시연 중에는 조개 여는 달이까지 보고, 여기는 발표자 상자의 조약돌 버튼으로만 닿는다
  { min: 100, name: "꾸준한 달이", note: "매일 조금씩, 바다 친구들이 따라 배워요", icon: "glowing_star", scale: 1.04,
    gift: "내 이름으로 진짜 나무 한 그루", preview: "노을공원에 홍길동님 이름으로 나무 한 그루를 심어요." },
];

// 옷장. slot: head 머리, face 얼굴, hand 손. 부위마다 하나씩 겹쳐 입음
// pos는 전신 상자 기준 [left%, top%, width%, 기울기deg], face는 얼굴 그림(시트 머리 32px) 기준 같은 꼴. null이면 얼굴 자리엔 안 보임
// 플로팅 버튼(62px 원 안 얼굴 50px)은 face 값을 비율로 환산. flip은 좌우 뒤집기. 모두 features/wear-lab에서 맞춘 값
// stage가 있으면 그 단계에 받고, rarity가 있으면 조개 열기에서 나옴 (c 흔함, u 드묾, s 반짝). 그림은 img/의 Fluent 3D
const DALI_WEARS = [
  { id: "ribbon", name: "빨간 리본", slot: "head", stage: 0, pos: [28, -4, 23, -14], face: [4, 0, 36, -16] },
  { id: "hibiscus", name: "바다 꽃", slot: "head", stage: 1, pos: [70, 1, 21, 16], face: [62, 2, 32, 14] },
  { id: "graduation_cap", name: "학사모", slot: "head", stage: 3, pos: [47.9, -11, 34, 12], face: [26, -12, 48, 6] },
  { id: "womans_hat", name: "밀짚모자", slot: "head", rarity: "c", pos: [50, -17.3, 38, 18], face: [16, -33.3, 68, 0] },
  { id: "billed_cap", name: "야구모자", slot: "head", rarity: "c", pos: [36.3, -21.7, 55, 18], face: [7.5, -26.9, 77, 0] },
  { id: "top_hat", name: "실크 모자", slot: "head", rarity: "u", pos: [56.2, -11.1, 26, 17], face: [29.1, -15.8, 44, 0] },
  { id: "crown", name: "왕관", slot: "head", rarity: "s", pos: [57, -15.3, 29, 25], face: [28.7, -23.3, 44, 0] },
  { id: "glasses", name: "안경", slot: "face", rarity: "c", pos: [33.5, 3.1, 42, 14], face: [13.3, 10.6, 72, 0] },
  { id: "sunglasses", name: "선글라스", slot: "face", rarity: "u", pos: [34.6, 2, 42, 15], face: [14.2, 8.7, 72, 0] },
  { id: "spiral_shell", name: "소라", slot: "hand", rarity: "c", pos: [28.2, 34.2, 28, 20], face: null, flip: true },
  { id: "gem_stone", name: "보석", slot: "hand", rarity: "s", pos: [26.7, 33.7, 32, 15], face: null },
];
const DALI_SLOTS = [["head", "머리"], ["face", "얼굴"], ["hand", "손"]];
// 조개 열기: 미션으로 모은 조약돌을 씀 (거래엔 조약돌을 안 주는 규칙 그대로). 하루 perDay번, 한 번에 cost개. 같은 게 나오면 refund개 돌려줌
const DALI_SHELL = { cost: 3, perDay: 3, refund: 1, odds: { c: 60, u: 30, s: 10 }, names: { c: "흔함", u: "드묾", s: "반짝" },
  say: { c: "오늘도 바다에서 주웠어요.", u: "오, 이건 잘 안 나오는 건데!", s: "반짝반짝! 달이가 제일 아끼는 거예요." } };

// 관리 탭 "리포트 3줄 같이 읽기"의 읽기 버튼을 누르면 뜨는 시황 요약 (가상).
// 시장 흐름 수준의 문장만 쓰고, 특정 종목이나 실제 회사의 실적·공시 같은 사건은 넣지 않는다. 앱마다 다른 글
const DALI_READ = {
  stock: {
    title: "오늘 아침 시황, 세 줄로",
    lines: [
      "밤사이 미국 증시는 기술주가 이끌며 소폭 올랐고, 국채 금리는 한 주 만에 내려왔어요.",
      "국내는 반도체 업종으로 거래대금이 몰리며 외국인 순매수가 사흘째 이어지고 있어요.",
      "오늘 밤 미국 물가 지표 발표를 앞두고 오후에는 관망세가 짙어질 수 있어요.",
    ],
    note: "달이가 아침 리포트에서 세 줄만 골랐어요. 흐름만 보고, 결정은 천천히.",
  },
  fut: {
    title: "오늘 아침 해외선물, 세 줄로",
    lines: [
      "유가는 재고 증가 소식에 밤사이 1%대 내렸고, 금은 달러 약세에 소폭 올랐어요.",
      "S&P 500과 나스닥 선물은 기술주 흐름을 따라 보합권에서 위로 움직였어요.",
      "오늘 밤 미국 물가 지표 발표 전후로 지수 선물 변동폭이 커질 수 있어요.",
    ],
    note: "달이가 아침 리포트에서 세 줄만 골랐어요. 흐름만 보고, 결정은 천천히.",
  },
};

// 뉴스 읽기 화면에 나오는 제목과 본문 (가상)
const DALI_NEWS_TEXT = {
  n1: { title: "반도체 대형주 나란히 급등", body: "반도체 대형주가 나란히 크게 오르며 거래대금 상위에 올랐다. 검색 관심이 실제 거래로 이어졌다는 분석이 나왔다." },
  n2: { title: "원달러 환율 상승, 수출주 관심", body: "원달러 환율이 오르며 수출 비중이 큰 기업에 관심이 모였다. 자동차 업종이 대표적으로 거론됐다." },
  n3: { title: "메모리 업황 점검 리포트", body: "메모리 반도체 업황 흐름을 점검한 리포트가 나왔다. 재고와 수요 흐름을 함께 짚었다." },
  n4: { title: "국내 플랫폼 관련 논의 재개", body: "국내 플랫폼 기업 관련 정책 논의가 다시 이어졌다. 구체적인 일정은 아직 정해지지 않았다." },
  n5: { title: "금리 결정 앞둔 원유 선물, 관망세", body: "내일 새벽 미국 금리 결정을 앞두고 WTI 선물 거래가 줄며 좁은 폭에서 움직였다. 금리 결정은 달러 흐름을 거쳐 원유 값에 영향을 주는 일이 많다." },
  n6: { title: "미국 원유 재고 증가 발표", body: "간밤 발표된 미국 주간 원유 재고가 늘어난 것으로 나오며 WTI 선물이 내렸다. 재고 발표는 매주 수요일 밤(한국시간)에 나온다." },
  n7: { title: "달러 약세에 금 강보합", body: "달러가 약해지며 금 선물이 소폭 올랐다. 금은 달러로 값을 매겨 달러 흐름과 반대로 움직일 때가 많다." },
  n8: { title: "기술주 강세 이어져", body: "나스닥 대형 기술주 중심으로 강세가 이어지며 나스닥 100 선물도 함께 올랐다." },
  n9: { title: "S&P 500 선물 소폭 상승", body: "S&P 500 선물이 소폭 올랐다. 시장은 다음 주 지표 발표를 앞둔 분위기다." },
  n10: { title: "반도체 업종 강세에 나스닥 100 선물 상승", body: "어젯밤 미국 장에서 반도체 업종이 강세를 보이며 나스닥 100 선물이 올랐다. 지수 선물은 대형 기술주 비중이 커서 반도체 흐름을 따라가는 날이 많다." },
  n12: { title: "유진 AX 고객경험 해커톤 진행 중", body: "유진금융부문이 고객경험을 AI로 바꾸는 해커톤을 진행하고 있다. 리테일 현장과 스마트채널의 직원들이 고객 인터뷰에서 출발한 아이디어를 이틀 동안 시연 화면으로 만든다. 시연 화면과 수치는 가상이다." },
  n11: { title: "금리 결정 앞두고 금 선물 거래 줄어", body: "미국 금리 결정을 앞두고 금 선물 거래량이 줄었다. 금은 금리와 달러 흐름에 따라 움직이는 날이 많아, 결정 뒤에 움직임이 커지는 일이 잦다." },
  a1: { title: "반도체 대형주 강세 이어져", body: "반도체 대형주가 함께 크게 오르며 장을 이끌었다. 개별 회사의 새 공시는 없었다." },
  a2: { title: "WTI 선물 짧은 시간에 급락", body: "원유 선물이 짧은 시간에 크게 내렸다. 갖고 계신 CL 1계약은 평가손실이 커지며 증거금 여유가 줄었다. 여유가 바닥나면 추가 증거금이 필요할 수 있다. 달이는 여기까지만 알려 드리고, 판단은 고객님이 해요." },
};
// 화면에 보이는 종목 이름 (선물은 코드 병기)
const DALI_NAME = sym => (DALI_SYMS[sym] && DALI_SYMS[sym].name) || sym;
