/* ---------- 달이 이벤트: 내 종목 이벤트 대기와 "지난 결과는?" (dali.js 위에 얹음) ----------
   보유 종목(선물은 관심 종목)에 이벤트가 걸리면 오늘 탭 맨 위 한 장이 "실적 대기 > 지난 결과는?"이 된다.
   누르면 읽기 화면: 지난 8번 중 지금과 닮은 4번(다섯 축으로 고름)을 2×2 작은 차트로, 발표 순간 앞뒤 흐름과 다음 날 등락, 그때 특징뉴스. 아래에 내 수량으로 바꾼 금액과 옵션 시장 예상 폭.
   발표 뒤 장면에서는 이번 결과가 9번째 점으로 찍힌다. 사라고도 팔라고도 하지 않고 지난 사실과 시장 가격에 담긴 숫자만 보여 준다.
   닮은 때 고르기(축 일치 수)는 규칙이고, 그때 뉴스가 지금과 같은 이야기인지 한 줄은 달이가 쓴다(DaliAI.write, 없으면 바로 글).
   데이터는 dali-events.js. 증권과 선물 두 앱에서 같은 화면. dali.js 다음, dali-pro.js와 dali-pro-fut.js 앞에 불러온다. */
(function () {
  const phone = document.querySelector(".phone");
  const sheet = phone && phone.querySelector(".dali-sheet");
  if (!sheet || !window.dali || typeof DALI_EVENTS === "undefined") return;

  const app = window.DALI_PAGE_APP === "fut" ? "fut" : "stock";
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  // 맨 위 그림: 종목 로고(흰 동그라미)나 이벤트 그림(img/<이름>.png, 없으면 .svg)
  const art = e => e.art === "logo" && DALI_SYMS[e.sym].code
    ? { cls: "logo", img: `${BASE}img/logo-${DALI_SYMS[e.sym].code}.png` }
    : e.art ? { cls: "pic", img: `${BASE}img/${e.art}.png`, alt: `${BASE}img/${e.art}.svg` } : null;
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
    }).sort((a, b) => b.score - a.score).slice(0, 4);
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
    const share = app === "stock" && typeof DaliRules !== "undefined" ? Math.round(DaliRules.money(s).pos.find(p => p.sym === e.sym).value / DaliRules.money(s).total * 100) : 0;
    const look = { art: art(e), bg: e.bg };
    if (st === "wait") return { k: "event", score: 99, ...look, top: app === "fut" ? "내 관심 종목에 영향 줄 이벤트" : "내 종목에 영향 줄 이벤트", big: app === "fut" ? e.kind.replace(/ \(.*\)/, "") : `${e.sym} ${e.kind}`,
      title: `${e.when}, ${share ? `내 돈의 ${share}%가 걸린 일` : `${e.sym}에 걸린 일`}`, sym: e.sym, btns: btn, line: `${e.sym} ${e.short} ${e.when}` };
    if (st === "live" && r) return { k: "event", score: 99, ...look, top: `${who} 발표 뒤`, big: pct(r.val),
      title: nowP && m ? `${won(nowP)}, ${m.qty}` : e.sym, feat, sym: e.sym, btns: btn, line: `${e.sym} 발표 뒤 ${pct(r.val)}` };
    if (st === "done" && r) return { k: "event", score: 92, ...look, top: `${who} 뒤 ${r.label}`, big: pct(r.val),
      title: nowP && m ? `${won(nowP)}, ${m.qty}` : e.sym, sym: e.sym, btns: btn, line: `${e.sym} 발표 뒤 ${pct(r.val)}` };
    return null;
  }

  /* --- 읽기 화면 --- */
  // 작은 차트 하나: 발표 전 5일과 뒤 열흘. 발표 순간에 세로 점선, 다음 날 점. 전 5일은 pre5에서 거꾸로 그린 가상 흐름
  function miniSVG(p) {
    const W = 170, H = 92, L = 4, Rr = 4, T = 14, B = 16;
    const pre = [0, 1, 2, 3, 4].map(i => -p.pre5 * (1 - i / 5) + (i % 2 ? 0.4 : -0.3) * Math.sign(p.pre5 || 1));
    const all = [...pre, 0, ...p.path], n = all.length - 1;
    const lo = Math.min(...all) - 0.8, hi = Math.max(...all) + 0.8;
    const x = i => L + (W - L - Rr) * i / n, y = v => T + (H - T - B) * (hi - v) / (hi - lo);
    const seg = (from, to, cls) => `<polyline class="${cls}" points="${all.slice(from, to + 1).map((v, i) => `${x(from + i)},${y(v)}`).join(" ")}" fill="none"/>`;
    const i0 = 5, i1 = 6, c = p.next > 0 ? "#E5484D" : "#3E7BFA";
    return `<svg viewBox="0 0 ${W} ${H}" class="dali-ev-mini" aria-label="${p.at} 발표 앞뒤 흐름">
      <line x1="${L}" x2="${W - Rr}" y1="${y(0)}" y2="${y(0)}" stroke="#EEF1F3"/>
      <line x1="${x(i0)}" x2="${x(i0)}" y1="${T - 6}" y2="${H - B + 4}" stroke="#8B95A1" stroke-dasharray="3 3"/>
      <text x="${x(i0)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#8B95A1">발표</text>
      ${seg(0, i0, "pre")}${seg(i0, n, p.next > 0 ? "up" : "down")}
      <circle cx="${x(i1)}" cy="${y(p.next)}" r="3.5" fill="${c}"/>
      <text x="${x(i1) + 6}" y="${y(p.next) + (p.next > 0 ? -5 : 11)}" font-size="10.5" font-weight="800" fill="${c}">${pct(p.next)}</text></svg>`;
  }
  function page(e) {
    const s = sc(), st = e.state[s], an = analogs(e), r = result(e, s), m = mine(e);
    const nums = an.map(x => pct(x.next)).join(", ");
    const head = st === "wait"
      ? `<small>${esc(e.sym)} ${esc(e.kind)} · ${esc(e.when)}</small><h2>지난 ${e.past.length}번 중 지금과 닮은 <b>${an.length}번</b></h2>
         <p>그때 결과와 발표 순간 앞뒤 흐름이에요.</p>`
      : `<small>${esc(e.sym)} ${esc(e.kind)} 뒤 ${esc(r.label)}</small><h2>이번 결과 <b class="${tone(r.val)}">${pct(r.val)}</b></h2>
         <p>지금과 닮은 ${an.length}번은 다음 날 ${nums}였어요. 이번은 가장 닮은 때와 ${Math.sign(r.val) === Math.sign(an[0].next) ? "같은" : "다른"} 방향이에요.</p>`;
    const grid = `<div class="dali-ev-grid">${an.map(p => `<figure class="dali-ev-card">
        <figcaption><b>${esc(p.at)}</b><i class="${p.res[1]}">${esc(p.res[0])}</i></figcaption>
        ${miniSVG(p)}</figure>`).join("")}</div>`;
    const range = m ? an.map(x => m.per * x.next) : null;
    const money = m ? `<p class="dali-ev-money"><b>${m.qty}</b> 닮은 ${an.length}번처럼 움직이면 <b class="${tone(Math.min(...range))}">${m.fmt(Math.min(...range))}</b> ~ <b class="${tone(Math.max(...range))}">${m.fmt(Math.max(...range))}</b></p>` : "";
    return `
      <header class="dali-page-head"><button type="button" class="dali-back" data-act="back" aria-label="뒤로">‹</button><strong>${esc(e.sym)} ${esc(e.kind)}</strong></header>
      <div class="dali-page-body dali-ev">
        <section class="dali-ev-top">${head}</section>
        <section class="dali-ev-sec">${grid}
          <div class="dali-ev-ai" data-k="0"></div>
          ${money}</section>
        <div class="dali-ev-btns"><button type="button" data-ev="order" data-sym="${esc(e.sym)}">${esc(e.sym)} 주문</button></div>
      </div>`;
  }
  // 달이가 쓰는 한 줄: 그때 뉴스가 지금과 같은 이야기인지
  function aiLine(e, an) {
    const hit = an.filter(a => a.tag === e.now.tag);
    const text = hit.length ? `${hit.map(a => a.at).join(", ")}에도 발표 전에 "${e.now.tag}" 뉴스가 있었어요. 지금과 같은 이야기예요.`
      : `닮은 ${an.length}번 중 지금 "${e.now.tag}" 뉴스와 같은 이야기였던 때는 없어요.`;
    return { key: `ev-${e.sym}-${sc()}`, steps: [`닮은 ${an.length}번 발표 직전 뉴스 읽는 중`, "지금 뉴스와 같은 이야기인지 보는 중"], text,
      basis: `닮은 ${an.length}번 발표 직전 다섯 축과 그때 특징뉴스를 지금과 견줘 보고 썼어요.` };
  }
  function paint(e) {
    pageEl.innerHTML = page(e);
    pageEl.dataset.id = "event";
    pageEl.hidden = false;
    const ai = pageEl.querySelector(".dali-ev-ai");
    const o = aiLine(e, analogs(e));
    if (window.DaliAI) window.DaliAI.write(ai, o);
    else ai.innerHTML = `<p class="dali-ai-text">${esc(o.text)}</p>`;
  }
  function open(sym) {
    const e = events().find(x => x.sym === sym) || current();
    if (!e) return;
    open.sym = e.sym;
    paint(e);
  }

  // 화면 안 누르기: 닮은 때 고르기, 뒤로, 주문. 뒤로는 여기서 닫고 dali.js까지 가지 않게 (오늘 탭이 지워지지 않도록)
  pageEl.addEventListener("click", ev => {
    if (pageEl.dataset.id !== "event" || pageEl.hidden) return;
    const b = ev.target.closest("[data-ev], [data-act='back']");
    if (!b) return;
    ev.stopPropagation();
    const e = events().find(x => x.sym === open.sym);
    if (b.dataset.act === "back") { pageEl.hidden = true; return; }
    if (b.dataset.ev === "order") { pageEl.hidden = true; window.dali.openOrder(b.dataset.sym); }
  }, true);
  // 탭을 누르면 닫힘 (dali-news2의 탭 처리가 뒤로를 누름). 장면이 바뀌면 열려 있던 화면을 그 장면으로 다시
  document.querySelector(".dali-demo")?.addEventListener("click", ev => {
    if (!ev.target.closest("[data-scene]") || pageEl.hidden || pageEl.dataset.id !== "event") return;
    setTimeout(() => { const e = events().find(x => x.sym === open.sym); if (e) paint(e); }, 0);
  });

  window.DaliEvent = { card, open, analogs, current };
})();
