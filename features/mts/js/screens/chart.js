/* ---------- 차트 ----------
   캔들 모양은 정해진 씨앗값으로 만든 가상 흐름이고, 축·가격 글자는 자리표시입니다. */
const CHART_TABS = ["종목차트", "재무차트", "멀티차트", "비교차트", "지수차트"];
const PERIODS = { "일": { seed: 11, n: 60 }, "주": { seed: 23, n: 60 }, "월": { seed: 37, n: 44 }, "분": { seed: 41, n: 70 }, "틱": { seed: 53, n: 70 } };
const MA = [[5, "#F08A3C"], [20, "#B04FD6"], [60, "#4A5FA8"], [120, "#3DB46D"]];

// 씨앗값이 같으면 늘 같은 모양이 나오는 난수
function seeded(seed) {
  let t = seed;
  return () => { t = (t + 0x6D2B79F5) | 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
function makeSeries(seed, total) {
  const rnd = seeded(seed), out = [];
  let c = 100, drift = 0;
  for (let i = 0; i < total; i++) {
    drift = drift * 0.9 + (rnd() - 0.52) * 0.8;
    const o = c, close = Math.max(20, o + drift + (rnd() - 0.5) * 3);
    out.push({ o, c: close, h: Math.max(o, close) + rnd() * 2, l: Math.min(o, close) - rnd() * 2, v: 0.2 + rnd() ** 3 * (rnd() < 0.08 ? 4 : 1) });
    c = close;
  }
  return out;
}
function chartSVG(period) {
  const { seed, n } = PERIODS[period];
  const all = makeSeries(seed, n + 120), data = all.slice(-n), off = all.length - n;
  const W = 312, PT = 14, PB = 252, VT = 272, VB = 338;
  const hi = Math.max(...data.map(d => d.h)), lo = Math.min(...data.map(d => d.l));
  const y = p => PT + (hi - p) / (hi - lo) * (PB - PT);
  const step = W / n, bw = Math.max(1.6, step * 0.62);
  const vmax = Math.max(...data.map(d => d.v));
  const candles = data.map((d, i) => {
    const x = i * step + step / 2, up = d.c >= d.o, col = up ? "#E8333C" : "#1C6FD8";
    return `<line x1="${x}" x2="${x}" y1="${y(d.h)}" y2="${y(d.l)}" stroke="${col}"/>`
      + `<rect x="${x - bw / 2}" y="${y(Math.max(d.o, d.c))}" width="${bw}" height="${Math.max(1, Math.abs(y(d.o) - y(d.c)))}" fill="${col}"/>`
      + `<rect x="${x - bw / 2}" y="${VB - d.v / vmax * (VB - VT - 8)}" width="${bw}" height="${d.v / vmax * (VB - VT - 8)}" fill="${col}"/>`;
  }).join("");
  const lines = MA.map(([len, col]) => {
    const pts = data.map((_, i) => {
      const k = off + i, from = Math.max(0, k - len + 1), seg = all.slice(from, k + 1);
      const avg = seg.reduce((a, d) => a + d.c, 0) / seg.length;
      return `${(i * step + step / 2).toFixed(1)},${Math.max(PT, Math.min(PB, y(avg))).toFixed(1)}`;
    }).join(" ");
    return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.1"/>`;
  }).join("");
  const hiI = data.findIndex(d => d.h === hi), loI = data.findIndex(d => d.l === lo), last = data[data.length - 1];
  const mark = (i, yy, up) => {
    const x = i * step + step / 2, left = i > n * 0.6;
    return `<text x="${left ? x - 4 : x + 4}" y="${yy + (up ? -2 : 9)}" font-size="7.5" fill="${up ? "#E8333C" : "#1C6FD8"}" text-anchor="${left ? "end" : "start"}">${left ? "" : "→ "}0,000(0.00%, 00/00)${left ? " ←" : ""}</text>`;
  };
  const ticks = [0, 1, 2, 3, 4].map(k => {
    const yy = PT + 20 + k * (PB - PT - 30) / 4;
    return `<text x="${W + 6}" y="${yy + 3}" font-size="7.5" fill="#666">0,000</text><line x1="${W}" x2="${W + 3}" y1="${yy}" y2="${yy}" stroke="#999"/>`;
  }).join("");
  const dates = [0.12, 0.38, 0.62, 0.86].map(f => `<text x="${f * W}" y="${VB + 10}" font-size="7.5" fill="#666" text-anchor="middle">00-00</text>`).join("");
  return `<svg class="chart-svg" viewBox="0 0 360 352" preserveAspectRatio="none" aria-label="가상 캔들 차트">
    <rect x="0" y="0" width="${W}" height="${PB + 6}" fill="#fff"/>
    <line x1="${W}" x2="${W}" y1="0" y2="${VB}" stroke="#D8DDE0"/>
    <line x1="0" x2="360" y1="${PB + 8}" y2="${PB + 8}" stroke="#C9CFD3"/>
    ${lines}${candles}${mark(hiI, y(hi), true)}${mark(loI, y(lo), false)}${ticks}
    <rect x="${W}" y="${y(last.c) - 9}" width="44" height="18" fill="#E8333C"/>
    <text x="${W + 22}" y="${y(last.c) - 1}" font-size="7.5" fill="#fff" text-anchor="middle">0,000</text>
    <text x="${W + 22}" y="${y(last.c) + 7}" font-size="7.5" fill="#fff" text-anchor="middle">0.00%</text>
    <text x="4" y="${VT - 4}" font-size="8" fill="#E8333C">—</text><text x="14" y="${VT - 4}" font-size="8" fill="#333">거래량</text>
    <text x="${W + 6}" y="${VT + 14}" font-size="7.5" fill="#666">000,000</text>
    <rect x="${W}" y="${VB - 26}" width="44" height="18" fill="#1C6FD8"/>
    <text x="${W + 22}" y="${VB - 18}" font-size="7" fill="#fff" text-anchor="middle">000,000</text>
    <text x="${W + 22}" y="${VB - 10}" font-size="7" fill="#fff" text-anchor="middle">0.00%</text>
    ${dates}<text x="4" y="${VB + 10}" font-size="7.5" fill="#666">00-00-00</text>
  </svg>`;
}

Screens.chart = {
  tab: "종목차트", period: "일",
  render() {
    const s = stockBy(App.code);
    const body = this.tab === "종목차트" ? `
      ${stockInfo(s)}
      <div class="chart-tools">
        ${Object.keys(PERIODS).map(p => `<button type="button" data-period="${p}" class="${p === this.period ? "on" : ""}">${p}</button>`).join("")}
        ${check("매매", true)}
        ${iconBtn("cross", "십자선")}${iconBtn("gear", "차트 설정")}${iconBtn("erase", "그리기 지우기")}
      </div>
      <div class="chart-area">
        <div class="ma-legend">${MA.map(([l, c]) => `<span style="--c:${c}">${l}</span>`).join("")}<span class="cnt">${PERIODS[this.period].n}</span></div>
        ${chartSVG(this.period)}
        <span class="chart-handle">‹</span>
        <button type="button" class="vol-close" aria-label="거래량 닫기">${icon("close")}</button>
      </div>
      <div class="news-ticker"><b>${NEWS_TICKER[0].src}</b><span>${esc(NEWS_TICKER[0].text)}</span></div>`
      : `<div class="mts-body"><p class="empty">${this.tab}는 준비 중이에요</p></div>`;
    return header("차트", `${select("KRX", "krx")}${iconBtn("star", "관심 등록")}${iconBtn("kebab", "더보기")}`)
      + topTabs(CHART_TABS, this.tab) + `<div class="mts-body chart-body">${body}</div>`;
  },
  mount(el) {
    bindTabs(el, "data-tab", t => { this.tab = t; App.render(); });
    el.querySelectorAll("[data-period]").forEach(b => b.onclick = () => { this.period = b.dataset.period; App.render(); });
    if (this.tab === "종목차트") bindStockPick(el);
  },
};
