/* ===================================================
   달이 가상 데이터 (시연용)
   - 시세·금리·수익률 숫자, 종목명은 넣지 않습니다.
   - file:// 로 바로 열 수 있도록 JSON 대신 JS로 둡니다.
   =================================================== */
const DALI_START = {
  user: "홍길동",
  name: "달이",
  pebbles: 12,
  level: 3,
  xp: 60,
  xpMax: 100,
  streak: 6,
};

const FEED_XP = 20;

/* 성장 단계: 실제 해달의 일생을 따라갑니다 (레벨 → 단계) */
const STAGES = [
  { from: 1, name: "엄마 배 위의 아기" },
  { from: 3, name: "첫 수영" },
  { from: 4, name: "돌로 조개 깨기" },
  { from: 6, name: "손잡는 뗏목 리더" },
];

/* 바다 친구: 개념 하나를 이해하면 만나고, 파티에 넣으면 효과가 생깁니다 */
const PARTY_MAX = 2;
const DALI_IMG = "../../assets/otter/otter-fluent-3d-original.png";
const FRIEND_DIR = "../../assets/sea-friends/";
const FRIENDS = [
  { id: "turtle", img: "turtle_3d.png", name: "거북이", concept: "꾸준함", effect: "연속 출석 보너스 조약돌 +1", owned: true },
  { id: "dolphin", img: "dolphin_3d.png", name: "돌고래", concept: "변동성", effect: "출렁임이 큰 날 브리핑에서 먼저 알려 줘요", unlock: "오늘의 퀴즈를 맞히면 만나요" },
  { id: "octo", img: "octopus_3d.png", name: "문어", concept: "분산", effect: "퀴즈 힌트를 한 번 줘요", unlock: "'분산' 개념을 이해하면 만나요" },
  { id: "puffer", img: "blowfish_3d.png", name: "복어", concept: "레버리지", effect: "위험 개념 카드를 먼저 보여 줘요", unlock: "'레버리지' 개념을 이해하면 만나요" },
];

/* AI 시장 브리핑 예시 (실제로는 공개 시장 데이터로 매일 생성) */
const BRIEFING = {
  tag: "오늘의 한 줄",
  text: "오늘 밤 미국에서 경제지표 발표가 있어요. 발표 앞뒤로는 가격이 크게 출렁일 수 있대요. 이럴 때 쓰는 말이 바로 '변동성'이에요.",
  word: "변동성",
};

/* 돌고래가 파티에 있으면 AI가 브리핑을 이렇게 바꿉니다 (시연용 예시) */
const BRIEFING_DOLPHIN = {
  tag: "돌고래의 파도 주의",
  text: "돌고래가 파도를 타고 와서 알려 줘요! 오늘 밤 경제지표 발표 전후로 '변동성'이 커질 수 있어요. 출렁임이 클 때는 손실도 커질 수 있다는 걸 기억해요.",
  word: "변동성",
};

/* 오늘의 미션: 매매와 무관한 이해·습관만 보상합니다 */
const MISSIONS = [
  { id: "brief", label: "달이 브리핑 읽기", reward: 1 },
  { id: "quiz", label: "오늘의 퀴즈 풀기", reward: 3 },
  { id: "chat", label: "달이에게 하나 물어보기", reward: 1 },
];

const QUIZ = {
  q: "'변동성이 크다'는 말에 가장 가까운 것은?",
  options: [
    "가격이 짧은 시간에 크게 오르내린다",
    "가격이 반드시 오른다",
    "거래가 일시적으로 멈춘다",
    "수수료가 비싸진다",
  ],
  answer: 0,
  explain: "변동성은 가격이 움직이는 폭이에요. 오를지 내릴지가 아니라 '얼마나 출렁이는지'를 말해요.",
};

/* 달이 대화 (시연용 고정 응답). 실제로는 가드레일을 둔 AI가 답합니다. */
const CHAT_SUGGEST = ["변동성이 뭐야?", "선물은 주식이랑 뭐가 달라?", "지금 뭐 사면 돼?"];
const CHAT_RULES = [
  {
    keys: ["사면", "살까", "팔까", "추천", "종목", "오를까", "매수", "매도"],
    guard: true,
    reply: "그건 달이가 알려 줄 수 없어요. 무엇을 사고팔지는 꼭 스스로 정해야 하거든요. 대신 판단에 도움 되는 개념을 같이 공부해요! 🪨",
  },
  {
    keys: ["변동성"],
    reply: "변동성은 가격이 출렁이는 폭이에요. 파도가 높은 날이면 해달도 조개를 꼭 붙잡고 있어야 하죠. 변동성이 클수록 손실도 커질 수 있다는 걸 기억해요.",
  },
  {
    keys: ["선물", "주식"],
    reply: "주식은 회사의 한 조각을 사는 거고, 선물은 '정해진 날에 정해진 가격으로 사고팔기로 한 약속'이에요. 선물은 증거금만으로 거래해서 손익이 더 크게 움직여요.",
  },
];
const CHAT_FALLBACK = "음… 그건 달이도 공부해 볼게요! 오늘은 '변동성'이나 '선물' 이야기를 해 볼까요?";
