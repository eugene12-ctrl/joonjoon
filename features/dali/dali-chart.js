/* ---------- 달이 차트 ----------
   상승은 빨강, 하락은 파랑. 색만으로 구분하지 않도록 값과 라벨을 함께 씁니다.
   dali-data.js 다음, dali.js 앞에 불러옵니다. */
const DaliChart = (function () {
  const COL = { up: "#C8202C", down: "#2F5BD3", flat: "#8A7670", grid: "#D9CEC4" };
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const won = n => `${n > 0 ? "+" : ""}${Math.round(n).toLocaleString("ko-KR")}원`;

  // 같은 종목은 늘 같은 모양이 나오도록 이름으로 씨앗을 만든 가상 흐름
  function walk(seed, n, start, end) {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296) - 0.5;
    const noise = [0];
    for (let i = 1; i < n; i++) noise.push(noise[i - 1] + rnd());
    const last = noise[n - 1], amp = Math.abs(end - start) * 0.45 + Math.abs(start) * 0.006;
    return noise.map((v, i) => start + (end - start) * i / (n - 1) + (v - last * i / (n - 1)) * amp / 3);
  }
  function pathOf(vals, w, h, pad, lo, hi) {
    const x = i => pad + i * (w - pad * 2) / (vals.length - 1);
    const y = v => pad + (hi - v) * (h - pad * 2) / ((hi - lo) || 1);
    return { x, y, d: vals.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("") };
  }
  function daySeries(sym, n) {
    const s = DALI_SYMS[sym], prev = s.price / (1 + s.chg / 100);
    return { prev, vals: walk(sym, n, prev, s.price) };
  }

  // 뉴스 줄 오른쪽의 작은 하루 흐름
  function spark(sym) {
    const { prev, vals } = daySeries(sym, 26), c = COL[tone(DALI_SYMS[sym].chg)];
    const lo = Math.min(prev, ...vals), hi = Math.max(prev, ...vals), p = pathOf(vals, 80, 40, 4, lo, hi);
    return `<svg class="dali-spark" viewBox="0 0 80 40" aria-label="${sym} 하루 흐름 ${pct(DALI_SYMS[sym].chg)}">
      <line x1="4" x2="76" y1="${p.y(prev)}" y2="${p.y(prev)}" stroke="${COL.grid}" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${p.x(vals.length - 1)}" cy="${p.y(vals[vals.length - 1])}" r="3" fill="${c}"/></svg>`;
  }

  // 뉴스 읽기 화면의 하루 차트. 올린 위치의 가격을 보여 줌
  function day(sym, fmt) {
    const s = DALI_SYMS[sym], { prev, vals } = daySeries(sym, 40), c = COL[tone(s.chg)];
    const W = 330, H = 140, lo = Math.min(prev, ...vals), hi = Math.max(prev, ...vals), p = pathOf(vals, W, H, 14, lo, hi);
    const labels = s.app === "fut" ? ["어제 밤", "지금"] : ["09:00", "15:30"];
    const pts = vals.map((v, i) => [+p.x(i).toFixed(1), +p.y(v).toFixed(1), fmt(sym, v)]);
    const area = `${p.d}L${p.x(vals.length - 1)} ${H - 14}L${p.x(0)} ${H - 14}Z`;
    return `<div class="dali-chartbox"><svg class="dali-chart" viewBox="0 0 ${W} ${H}" data-pts='${JSON.stringify(pts)}' aria-label="${sym} 하루 가격 흐름 ${pct(s.chg)}">
      <path d="${area}" fill="${c}" opacity=".08"/>
      <line x1="14" x2="${W - 14}" y1="${p.y(prev)}" y2="${p.y(prev)}" stroke="${COL.grid}" stroke-dasharray="3 4"/>
      <text x="16" y="${p.y(prev) - 6}" class="dali-axis">전일 ${fmt(sym, prev)}</text>
      <path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${p.x(vals.length - 1)}" cy="${p.y(s.price)}" r="4" fill="${c}" stroke="#fff" stroke-width="2"/>
      <g class="dali-hover" visibility="hidden"><line y1="10" y2="${H - 10}" stroke="#5A4A45" stroke-width="1"/><circle r="4.5" fill="${c}" stroke="#fff" stroke-width="2"/>
        <rect rx="6" height="22" fill="#2A1416"/><text class="dali-tip" fill="#fff"></text></g>
    </svg><div class="dali-axisrow"><span>${labels[0]}</span><span>${labels[1]}</span></div></div>`;
  }
  function hover(e) {
    const svg = e.target.closest && e.target.closest("svg.dali-chart");
    if (!svg) return;
    const pts = JSON.parse(svg.dataset.pts), box = svg.getBoundingClientRect();
    const vx = (e.clientX - box.left) / box.width * 330;
    let i = pts.findIndex(q => q[0] >= vx);
    if (i < 0) i = pts.length - 1;
    const [x, y, v] = pts[i], g = svg.querySelector(".dali-hover"), ln = g.querySelector("line");
    g.setAttribute("visibility", "visible");
    ln.setAttribute("x1", x); ln.setAttribute("x2", x);
    g.querySelector("circle").setAttribute("cx", x); g.querySelector("circle").setAttribute("cy", y);
    const tip = g.querySelector("text"), rect = g.querySelector("rect"), w = v.length * 7.5 + 16;
    const tx = Math.min(Math.max(x - w / 2, 2), 328 - w);
    rect.setAttribute("x", tx); rect.setAttribute("y", 2); rect.setAttribute("width", w);
    tip.setAttribute("x", tx + 8); tip.setAttribute("y", 17); tip.textContent = v;
  }
  function unhover(root) {
    root.querySelectorAll(".dali-hover").forEach(g => g.setAttribute("visibility", "hidden"));
  }

  // 매매 한 번: 살 때부터 팔 때(또는 지금)까지
  // 나눠 산 매매: 첫 매수가를 100으로 두고 산 날마다 그 가격을 지나는 흐름. 점선은 평단
  const dayNo = d => { const [m, dd] = d.split("/").map(Number); return m * 31 + dd; };
  function tradeSplit(t) {
    const N = 32, W = 300, H = 70, b0 = t.buys[0], now = DALI_SYMS[t.sym].price, c = COL[tone(t.pnl)];
    const d0 = dayNo(b0.date), span = dayNo("10/29") - d0;
    const anchors = [...t.buys.map(b => ({ x: (dayNo(b.date) - d0) / span, v: b.price / b0.price * 100 })), { x: 1, v: now / b0.price * 100 }];
    const raw = walk(t.id + t.sym, N, 0, 10), noise = raw.map((v, i) => v - 10 * i / (N - 1));
    const vals = Array.from({ length: N }, (_, i) => {
      const x = i / (N - 1), k = anchors.findIndex((a, j) => j && a.x >= x), a = anchors[k - 1], b = anchors[k];
      const f = (x - a.x) / ((b.x - a.x) || 1), near = Math.min(Math.abs(x - a.x), Math.abs(b.x - x)) * (N - 1);
      return a.v + (b.v - a.v) * f + noise[i] * Math.min(1, near / 2) * 0.35;
    });
    const qty = t.buys.reduce((s, b) => s + b.qty, 0), avg = t.buys.reduce((s, b) => s + b.qty * b.price, 0) / qty / b0.price * 100;
    const lo = Math.min(...vals, avg), hi = Math.max(...vals, avg), p = pathOf(vals, W, H, 14, lo, hi);
    const X = x => p.x(x * (N - 1)), ay = p.y(avg), ex = X(1), ey = p.y(vals[N - 1]);
    const marks = anchors.slice(0, -1).map((a, i) => {
      const x = X(a.x), y = p.y(a.v);
      return `<path d="M${x} ${y + 2}l6 10h-12z" fill="${COL.up}" stroke="#fff" stroke-width="1.5"/>
        <text x="${x + (i ? 0 : 8)}" y="${y > H / 2 ? y - 6 : y + 24}" text-anchor="${i ? "middle" : "start"}" class="dali-axis">${i ? "+" : ""}${t.buys[i].qty}주</text>`;
    }).join("");
    return `<svg class="dali-tchart" viewBox="0 0 ${W} ${H}" aria-label="${t.sym} ${t.buys.length}번 나눠 산 뒤 지금 평단 대비 ${pct(t.pct)}">
      <line x1="14" x2="${W - 14}" y1="${ay}" y2="${ay}" stroke="${COL.grid}" stroke-dasharray="3 4"/>
      <text x="${W - 14}" y="${ay < H / 2 ? ay + 13 : ay - 5}" text-anchor="end" class="dali-axis">평단</text>
      <path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      ${marks}
      <circle cx="${ex}" cy="${ey}" r="5" fill="#fff" stroke="${c}" stroke-width="2.5"/>
      <text x="${ex - 10}" y="${ey < H / 2 ? ey + 4 : ey - 9}" text-anchor="end" class="dali-axis">평단 대비 ${pct(t.pct)}</text>
    </svg>`;
  }
  function trade(t) {
    if (t.buys && t.buys.length > 1) return tradeSplit(t);
    const end = 100 * (1 + t.pct / 100), vals = walk(t.id + t.sym, 24, 100, end), c = COL[tone(t.pnl)];
    const W = 300, H = 70, lo = Math.min(...vals), hi = Math.max(...vals), p = pathOf(vals, W, H, 14, lo, hi);
    const ex = p.x(vals.length - 1), ey = p.y(end), by = p.y(100), bx = p.x(0);
    const endMark = t.sell
      ? `<path d="M${ex} ${ey + 8}l6 -10h-12z" fill="${COL.down}" stroke="#fff" stroke-width="1.5"/>`
      : `<circle cx="${ex}" cy="${ey}" r="5" fill="#fff" stroke="${c}" stroke-width="2.5"/>`;
    return `<svg class="dali-tchart" viewBox="0 0 ${W} ${H}" aria-label="${t.sym} 매수부터 ${t.sell ? "매도" : "지금"}까지 ${pct(t.pct)}">
      <path d="${p.d}L${ex} ${by}L${bx} ${by}Z" fill="${c}" opacity=".1"/>
      <line x1="14" x2="${W - 14}" y1="${by}" y2="${by}" stroke="${COL.grid}" stroke-dasharray="3 4"/>
      <path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${bx} ${by - 8}l6 10h-12z" fill="${COL.up}" stroke="#fff" stroke-width="1.5"/>
      <text x="${bx + 9}" y="${by < H / 2 ? by + 16 : by - 8}" class="dali-axis">살 때</text>
      ${endMark}
      <text x="${ex - 10}" y="${ey < H / 2 ? ey + 18 : ey - 9}" text-anchor="end" class="dali-axis">${t.sell ? "팔 때" : "지금"} ${pct(t.pct)}</text>
    </svg>`;
  }

  // 손익 막대: 0을 가운데 두고 이익은 오른쪽, 손실은 왼쪽
  function pnlBars(list, money = won) {
    const max = Math.max(1, ...list.map(t => Math.abs(t.pnl)));
    return `<div class="dali-bars">${list.map(t => {
      const w = Math.max(1.5, Math.abs(t.pnl) / max * 50);
      const side = t.pnl >= 0 ? "left:50%" : "right:50%";
      return `<div class="dali-barrow"><span class="lbl">${t.sym}${t.sell ? "" : " (평가)"}</span>
        <span class="track"><span class="zero"></span><span class="bar ${tone(t.pnl)}" style="${side};width:${w}%"></span></span>
        <span class="val">${money(t.pnl, t.app)}</span></div>`;
    }).join("")}</div>`;
  }

  return { spark, day, hover, unhover, trade, pnlBars };
})();
