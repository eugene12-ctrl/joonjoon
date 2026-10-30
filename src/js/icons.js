/* ---------- 아이콘 ---------- */
const GLYPH = {
  star: '<path d="M24 18.5l2.3 4.6 5.1.7-3.7 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.7-3.6 5.1-.7Z" fill="#15505C" stroke="none"/>',
  won: '<path d="M17 21.5l2.6 9 4.4-7.5 4.4 7.5 2.6-9M16 26h16"/>',
  order: '<path d="M17 22.5h13m-3-3 3 3-3 3M31 30.5H18m3-3-3 3 3 3"/>',
  chart: '<path d="M18 33v-5M22.7 33v-9M27.3 33v-6M32 33V20"/>',
  wallet: '<rect x="16" y="20.5" width="16" height="12" rx="2.5"/><path d="M26.5 26.5h5.5"/>',
  moon: '<path d="M28.5 19.5a7 7 0 1 0 3.5 12 6.2 6.2 0 0 1-3.5-12Z"/>',
  globe: '<circle cx="24" cy="26.5" r="7"/><path d="M17 26.5h14M24 19.5c3 3 3 11 0 14M24 19.5c-3 3-3 11 0 14"/>',
  news: '<path d="M18 21h12M18 25.5h12M18 30h8"/>',
  search: '<circle cx="23" cy="25.5" r="5"/><path d="m26.8 29.3 4.2 4.2"/>',
  building: '<path d="M19 33.5V20h10v13.5M17 33.5h14M22.5 23.5h.1M25.5 23.5h.1M22.5 27.5h.1M25.5 27.5h.1"/>',
  rank: '<path d="M17 33v-6h5M22 33V20.5h5V33M27 24h5v9M16 33.5h17"/>',
  trend: '<path d="m17 31 5-5 4 3 6-7.5m-4.5 0h4.5v4.5"/>',
  bank: '<path d="m16 24 8-5 8 5M18.5 25v6.5M22.5 25v6.5M25.5 25v6.5M29.5 25v6.5M16 33h16"/>',
  shield: '<path d="M24 18.5l7 2.8v5c0 4-3 6.5-7 8-4-1.5-7-4-7-8v-5Z"/><path d="m21 26.5 2 2 4-4"/>',
  bell: '<path d="M19 29.5v-5a5 5 0 0 1 10 0v5l1.5 2h-13Z"/><path d="M22.5 33.8h3"/>',
  user: '<circle cx="24" cy="23" r="3.5"/><path d="M17.5 33.5c1-4 3.5-5.5 6.5-5.5s5.5 1.5 6.5 5.5"/>',
  coin: '<ellipse cx="24" cy="21.5" rx="7" ry="2.8"/><path d="M17 21.5v4c0 1.6 3 2.8 7 2.8s7-1.2 7-2.8v-4M17 25.5v4c0 1.6 3 2.8 7 2.8s7-1.2 7-2.8v-4"/>',
  gift: '<rect x="17" y="24" width="14" height="9.5" rx="1.5"/><path d="M16 21h16v3H16ZM24 21v12.5M24 21c-2-4-6-3-4 0M24 21c2-4 6-3 4 0"/>',
  gear: '<circle cx="24" cy="26.5" r="3"/><path d="M24 19v2.5M24 31.5V34M16.5 26.5H19M29 26.5h2.5M18.7 21.2l1.8 1.8M27.5 30l1.8 1.8M29.3 21.2 27.5 23M20.5 30l-1.8 1.8"/>',
  doc: '<path d="M19 19h7l4 4v10.5H19Z"/><path d="M26 19v4h4M21.5 27h6M21.5 30.5h4"/>',
  sparkle: '<path d="M24 17.5c1 5 3 7 8 8.5-5 1.5-7 3.5-8 8.5-1-5-3-7-8-8.5 5-1.5 7-3.5 8-8.5Z" fill="#0E8FB0" stroke="none"/>',
};
const GLYPH_RULES = [
  [["관심"], "star"], [["야간"], "moon"], [["현재가", "시세"], "won"], [["주문"], "order"], [["차트"], "chart"],
  [["잔고", "계좌", "자산", "증거금", "손익"], "wallet"],
  [["리서치", "검색", "찾기"], "search"], [["뉴스", "공시", "리포트", "DART"], "news"],
  [["순위", "랭킹", "스코어"], "rank"], [["기업", "종목정보", "특징주", "가능종목", "종목분석"], "building"],
  [["업종", "테마", "섹터", "수급", "트렌드", "분석", "시장"], "trend"],
  [["환전", "이체", "대체", "뱅킹"], "bank"], [["인증", "OTP", "보안"], "shield"], [["알림"], "bell"],
  [["개인정보", "고객센터", "PB"], "user"], [["이벤트", "혜택"], "gift"], [["API", "서비스", "설정"], "gear"],
  [["펀드", "연금", "채권", "ELS", "RP", "신탁", "랩", "ISA", "분배금", "소수점", "AI투자", "레버리지", "신용", "분할"], "coin"],
  [["해외"], "globe"],
];
function glyphFor(label) {
  for (const [keys, g] of GLYPH_RULES) if (keys.some(k => label.includes(k))) return g;
  return "doc";
}
const ACCENTS = ["gTeal", "gBlue", "gPurple", "gOrange"];
function iconSVG(label, accent, variant, isNew) {
  const a = `url(#${accent})`;
  const backs = [
    `<circle cx="15" cy="14" r="8.5" fill="${a}"/>`,
    `<rect x="27" y="7" width="13" height="16" rx="4" fill="${a}"/>`,
    `<rect x="14" y="6" width="20" height="11" rx="4" fill="${a}"/>`,
    `<rect x="6" y="11" width="11" height="20" rx="3.5" fill="${a}" transform="rotate(-10 11 21)"/>`,
  ];
  const g = isNew ? "sparkle" : glyphFor(label);
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${backs[variant]}`
    + `<rect x="9" y="13" width="30" height="27" rx="7" fill="url(#glass)" stroke="#fff" stroke-opacity=".7"/>`
    + `<rect x="12" y="15" width="24" height="6" rx="3" fill="#fff" opacity=".3"/>`
    + `<g fill="none" stroke="#15505C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPH[g]}</g></svg>`;
}
const wbr = s => s.replace(/\//g, "/<wbr>");

// 유진투자선물 진입 배너 로고: 보라 둥근 네모 안 흰 고리 (시연용 가상 로고)
const FUT_BANNER_LOGO = `<svg class="fut-logo" viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="gFutLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6D5DFF"/><stop offset="1" stop-color="#4A3BEA"/></linearGradient></defs><rect x="2" y="2" width="52" height="52" rx="14" fill="url(#gFutLogo)"/><circle cx="28" cy="28" r="12.5" fill="none" stroke="#fff" stroke-width="6"/><circle cx="28" cy="28" r="5" fill="#fff" opacity=".18"/></svg>`;


