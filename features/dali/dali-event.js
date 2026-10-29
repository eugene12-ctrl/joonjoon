/* ---------- 달이 이벤트: 내 종목 이벤트 대기와 "지난 결과는?" (dali.js 위에 얹음) ----------
   보유 종목(선물은 관심 종목)에 이벤트가 걸리면 오늘 탭 맨 위 한 장이 "실적 대기 > 지난 결과는?"이 된다.
   누르면 읽기 화면: 지난 8번 점 띠, 지금과 닮은 때 두 번(다섯 축으로 고름), 그때와 지금 두 칸, 그 뒤 열흘 경로, 내 수량으로 바꾼 금액, 옵션 시장 예상 폭.
   발표 뒤 장면에서는 이번 결과가 9번째 점으로 찍힌다. 사라고도 팔라고도 하지 않고 지난 사실과 시장 가격에 담긴 숫자만 보여 준다.
   닮은 때 고르기(축 일치 수)는 규칙이고, 그때 뉴스가 지금과 같은 이야기인지 한 줄은 달이가 쓴다(DaliAI.write, 없으면 바로 글).
   데이터는 dali-events.js. 증권과 선물 두 앱에서 같은 화면. dali.js 다음, dali-pro.js와 dali-pro-fut.js 앞에 불러온다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  if (!sheet || !window.dali || typeof DALI_EVENTS === "undefined") return;

  const app = window.DALI_PAGE_APP === "fut" ? "fut" : "stock";
  const pageEl = sheet.querySelector(".dali-page");
  const tabs = sheet.querySelector(".dali-tabs");
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const won = n => `${Math.round(n).toLocaleString("ko-KR")}원`;
  const WORD = { up: "오름", flat: "보합", down: "내림", high: "많음", normal: "보통", low: "적음", calm: "차분", wild: "큼" };
  const short = at => String(at).replace("년 ", ".").replace("월", "");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 이 앱에 걸린 이벤트 하나 (보유 종목 먼저, 없으면 관심 종목)
  const events = () => Object.entries(DALI_EVENTS).filter(([, e]) => e.app === app).map(([sym, e]) => ({ sym, ...e }));
  const current = () => events()[0] || null;
  const sc = () => (window.daliPro && window.daliPro.sc) || "morning";

  /* --- 규칙: 지금과 닮은 때 --- */
  // 발표 전 5일 등락은 셋으로 묶음(+5% 넘게, -5% 넘게, 그 사이). 나머지 축은 같은 값이면 같음
  const bucket = v => (v > 5 ? "up" : v < -5 ? "down" : "flat");
  const sameAxis = (k, a, b) => (k === "pre5" ? bucket(a) === bucket(b) : a === b);
  function analogs(e) {
    const keys = e.axes.map(([k]) => k);
    return e.past.map((p, i) => {
      const same = keys.filter(k => sameAxis(k, p[k], e.now[k]));
      return { ...p, i, same, score: same.length * 100 - Math.abs(p.pre5 - e.now.pre5) };
    }).sort((a, b) => b.score - a.score).slice(0, 2);
  }
  const avgAbs = e => e.past.reduce((a, p) => a + Math.abs(p.next), 0) / e.past.length;
  const result = (e, s) => (e.result && e.result[s]) || null;
  // 내 수량: 증권은 보유 주식, 선물은 1계약 기준(관심 종목이라 보유가 없음)
  function mine(e) {
    if (app === "stock" && typeof DaliRules !== "undefined") {
      const p = DaliRules.money(sc()).pos.find(x => x.sym === e.sym);
      if (p) return { qty: `내 ${p.qty}주`, per: p.qty * p.now / 100, fmt: n => `${n < 0 ? "-" : "+"}${won(Math.abs(n))}` };
    }
    if (app === "fut" && typeof DALI_CUSTOMER_FUT !== "undefined") {
      const mult = DALI_CUSTOMER_FUT.mult[e.sym] || 1, price = DALI_SYMS[e.sym].price;
      return { qty: "1계약이면", per: mult * price / 100, fmt: n => `${n < 0 ? "-" : "+"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}` };
    }
    return null;
  }

  /* --- 오늘 탭 맨 위 한 장 (dali-rules.state, dali-pro-fut.action이 가져감) --- */
  function card(s) {
    const e = current();
    if (!e) return null;
    const st = e.state[s], an = analogs(e), r = result(e, s);
    const two = an.map(a => pct(a.next)).join(", ");
    const nowP = typeof DaliRules !== "undefined" && app === "stock" ? DaliRules.nowPrice(e.sym, s) : null;
    const m = mine(e);
    const feat = typeof DaliRules !== "undefined" && DaliRules.feat ? DaliRules.feat(e.sym, s) : "";
    const btn = [["event", e.sym, app === "fut" ? "나스닥 지난 결과는?" : "지난 결과는?"]];
    const who = app === "fut" ? e.short : `${e.sym} ${e.short}`;
    if (st === "wait") return { k: "event", score: 99, top: `${who} 대기`, big: `닮은 때 ${an.length}번`,
      title: `${e.when} ${e.kind}. ${app === "fut" ? `${e.sym}이 ` : ""}지난 ${e.past.length}번 중 지금처럼 발표 전 5일 ${pct(e.now.pre5)}였던 때예요`, sym: e.sym, btns: btn, line: `${e.sym} ${e.short} ${e.when}` };
    if (st === "live" && r) return { k: "event", score: 99, top: `${who} 발표 뒤`, big: pct(r.val),
      title: `${nowP ? `${won(nowP)}, ` : ""}${m ? m.qty : ""}. 닮은 때 ${two}와 같은 방향이에요`, feat, sym: e.sym, btns: btn, line: `${e.sym} 발표 뒤 ${pct(r.val)}` };
    if (st === "done" && r) return { k: "event", score: 92, top: `${who} 뒤 ${r.label}`, big: pct(r.val),
      title: `${e.past.length + 1}번째 결과로 남았어요. 닮은 때 ${two}와 ${Math.sign(r.val) === Math.sign(an[0].next) ? "같은" : "다른"} 방향이에요`, sym: e.sym, btns: btn, line: `${e.sym} 발표 뒤 ${pct(r.val)}` };
    return null;
  }

  /* --- 읽기 화면 --- */
  // 지난 8번 점 띠: 발표 다음 날 등락. 닮은 때는 테두리, 이번 결과는 9번째 점
  function dotsSVG(e, an, r) {
    const all = e.past.map(p => ({ v: p.next, at: p.at, pick: an.some(a => a.i === p.i) }));
    if (r) all.push({ v: r.val, at: r.label, now: true });
    const W = 340, H = 104, top = 26, bot = 78, n = all.length, gap = W / n;
    const lim = Math.max(8, ...all.map(d => Math.abs(d.v)));
    const y = v => (top + bot) / 2 - v / lim * (bot - top) / 2;
    const dots = all.map((d, i) => {
      const cx = gap * i + gap / 2, cy = y(d.v), c = d.v > 0 ? "#E5484D" : "#3E7BFA", below = d.v < 0 && cy + 24 < H - 14;
      return `<g class="${d.pick ? "pick" : ""}${d.now ? " now" : ""}">
        ${d.pick ? `<circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#1B5F6B" stroke-width="2"/>` : ""}
        <circle cx="${cx}" cy="${cy}" r="${d.now ? 6 : 5}" fill="${d.now ? "#1B5F6B" : c}"/>
        <text x="${cx}" y="${below ? cy + 19 : cy - 14}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${d.now ? "#1B5F6B" : c}">${pct(d.v)}</text>
        <text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="9.5" fill="${d.now ? "#1B5F6B" : "#8B95A1"}" font-weight="${d.now ? 800 : 500}">${esc(d.now ? d.at : short(d.at))}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="dali-ev-dots" aria-label="지난 ${e.past.length}번 발표 다음 날 등락">
      <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="#E5E8EB" stroke-dasharray="3 3"/>${dots}</svg>`;
  }
  // 그 뒤 열흘 경로: 닮은 때 둘(실선, 점선)과 이번(굵게, 지금까지만)
  function pathSVG(e, an, r) {
    const W = 340, H = 120, L = 28, Rr = 8, T = 10, B = 22, n = 10;
    const vals = [0, ...an.flatMap(a => a.path), ...(r ? [r.val] : [])];
    const lo = Math.min(...vals) - 1, hi = Math.max(...vals) + 1;
    const x = i => L + (W - L - Rr) * i / n, y = v => T + (H - T - B) * (hi - v) / (hi - lo);
    const line = (p, cls) => `<polyline class="${cls}" points="${[0, ...p].map((v, i) => `${x(i)},${y(v)}`).join(" ")}" fill="none"/>`;
    const ticks = [hi - 1, 0, lo + 1].map(v => `<text x="${L - 4}" y="${y(v) + 3.5}" text-anchor="end" font-size="9.5" fill="#8B95A1">${v > 0 ? "+" : ""}${Math.round(v)}%</text>`).join("");
    const days = [1, 5, 10].map(d => `<text x="${x(d)}" y="${H - 6}" text-anchor="middle" font-size="9.5" fill="#8B95A1">${d}일</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="dali-ev-path" aria-label="발표 뒤 열흘 경로">
      <line x1="${L}" x2="${W - Rr}" y1="${y(0)}" y2="${y(0)}" stroke="#E5E8EB"/>${ticks}${days}
      ${an.map((a, k) => line(a.path, `a${k}`)).join("")}
      ${r ? `${line([r.val], "now")}<circle cx="${x(1)}" cy="${y(r.val)}" r="4.5" fill="#1B5F6B"/>` : ""}</svg>`;
  }
  // 그때와 지금 두 칸. 같은 축은 진하게
  function compare(e, a) {
    const rows = e.axes.map(([k, label]) => {
      const same = sameAxis(k, a[k], e.now[k]), f = v => (k === "pre5" ? pct(v) : WORD[v] || v);
      return `<li class="${same ? "same" : ""}"><span>${label}</span><b>${f(e.now[k])}</b><b>${f(a[k])}</b></li>`;
    }).join("");
    return `<ul class="dali-ev-rows"><li class="head"><span></span><b>지금</b><b>${esc(a.at)}</b></li>${rows}
      <li class="news"><span>특징뉴스</span><em>${esc(e.now.news)}</em><em>${esc(a.news)}</em></li></ul>`;
  }
  function page(e, pick) {
    const s = sc(), st = e.state[s], an = analogs(e), a = an[pick] || an[0], r = result(e, s), m = mine(e);
    const two = an.map(x => pct(x.next)).join(", ");
    const head = st === "wait"
      ? `<small>${esc(e.when)} ${esc(e.kind)} · 지난 ${e.past.length}번</small><h2>지금과 닮은 때 <b>${an.length}번</b></h2>
         <p>발표 전 5일 ${pct(e.now.pre5)} 오른 상태로 발표를 맞은 때예요. 그때 다음 날은 ${two}였어요.</p>`
      : `<small>${esc(e.kind)} 뒤 ${esc(r.label)} · ${e.past.length + 1}번째</small><h2>이번 결과 <b class="${tone(r.val)}">${pct(r.val)}</b></h2>
         <p>지금과 닮은 때 ${an.length}번(${two})와 ${Math.sign(r.val) === Math.sign(an[0].next) ? "같은" : "다른"} 방향이에요.</p>`;
    const range = m ? an.map(x => m.per * x.next) : null;
    const money = m ? `<p class="dali-ev-money"><b>${m.qty}</b> 닮은 때처럼 움직이면 <b class="${tone(Math.min(...range))}">${m.fmt(Math.min(...range))} ~ ${m.fmt(Math.max(...range))}</b></p>` : "";
    return `
      <header class="dali-page-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button><strong>${esc(e.sym)} ${esc(e.kind)}</strong></header>
      <div class="dali-page-body dali-ev">
        <section class="dali-ev-top">${head}</section>
        <section class="dali-ev-sec"><p class="dali-ev-label">지난 ${e.past.length}번, 발표 다음 날</p>${dotsSVG(e, an, r)}
          <p class="dali-ev-note">평균 ±${avgAbs(e).toFixed(1)}%. 옵션 시장은 이번에 <b>±${e.implied.toFixed(1)}%</b>를 봐요</p></section>
        <section class="dali-ev-sec"><p class="dali-ev-label">왜 닮았나 <span class="dali-ev-pick">${an.map((x, k) => `<button type="button" class="${k === (an[pick] ? pick : 0) ? "on" : ""}" data-ev="pick" data-k="${k}">${esc(x.at)}</button>`).join("")}</span></p>
          ${compare(e, a)}
          <p class="dali-ev-same">${e.axes.length}개 중 ${a.same.length}개가 같아요</p>
          <div class="dali-ev-ai" data-k="${an.indexOf(a)}"></div></section>
        <section class="dali-ev-sec"><p class="dali-ev-label">그 뒤 열흘</p>${pathSVG(e, an, r)}
          <p class="dali-ev-legend">${an.map((x, k) => `<span class="a${k}">${esc(x.at)} ${pct(x.path[x.path.length - 1])}</span>`).join("")}${r ? `<span class="now">이번 ${pct(r.val)}</span>` : ""}</p>
          ${money}</section>
        <div class="dali-ev-btns"><button type="button" data-ev="order" data-sym="${esc(e.sym)}">${esc(e.sym)} 주문</button></div>
      </div>`;
  }
  // 달이가 쓰는 한 줄: 그때 뉴스가 지금과 같은 이야기인지
  function aiLine(e, a) {
    const same = a.tag === e.now.tag;
    const text = same ? `그때도 발표 전에 "${a.tag}" 뉴스가 있었어요. 지금과 같은 이야기예요.`
      : `그때는 "${a.tag}" 뉴스가 있었어요. 지금 "${e.now.tag}"와는 결이 달라요.`;
    return { key: `ev-${e.sym}-${a.i}-${sc()}`, steps: [`${a.at} 발표 직전 상황과 뉴스 읽는 중`, "지금 뉴스와 같은 이야기인지 보는 중"], text,
      basis: `${a.at} 발표 직전 다섯 축과 그때 특징뉴스를 지금과 견줘 보고 썼어요.` };
  }
  function paint(e, pick) {
    pageEl.innerHTML = page(e, pick);
    pageEl.dataset.id = "event";
    pageEl.hidden = false;
    const ai = pageEl.querySelector(".dali-ev-ai"), a = analogs(e)[+ai.dataset.k];
    const o = aiLine(e, a);
    if (window.DaliAI) window.DaliAI.write(ai, o);
    else ai.innerHTML = `<p class="dali-ai-text">${esc(o.text)}</p>`;
  }
  function open(sym) {
    const e = events().find(x => x.sym === sym) || current();
    if (!e) return;
    open.sym = e.sym;
    paint(e, 0);
  }

  // 화면 안 누르기: 닮은 때 고르기, 뒤로, 주문. 뒤로는 여기서 닫고 dali.js까지 가지 않게 (오늘 탭이 지워지지 않도록)
  pageEl.addEventListener("click", ev => {
    if (pageEl.dataset.id !== "event" || pageEl.hidden) return;
    const b = ev.target.closest("[data-ev], [data-act='back']");
    if (!b) return;
    ev.stopPropagation();
    const e = events().find(x => x.sym === open.sym);
    if (b.dataset.act === "back") { pageEl.hidden = true; return; }
    if (b.dataset.ev === "pick") paint(e, +b.dataset.k);
    else if (b.dataset.ev === "order") { pageEl.hidden = true; window.dali.openOrder(b.dataset.sym); }
  }, true);
  // 탭을 누르면 닫힘 (dali-news2의 탭 처리가 뒤로를 누름). 장면이 바뀌면 열려 있던 화면을 그 장면으로 다시
  document.querySelector(".dali-demo")?.addEventListener("click", ev => {
    if (!ev.target.closest("[data-scene]") || pageEl.hidden || pageEl.dataset.id !== "event") return;
    setTimeout(() => { const e = events().find(x => x.sym === open.sym); if (e) paint(e, 0); }, 0);
  });

  window.DaliEvent = { card, open, analogs, current };
})();
