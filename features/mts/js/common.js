/* ---------- 공용: 숫자 표시, 아이콘, 화면 틀(헤더·하단 바·지수 띠), 팝업, 토스트 ---------- */
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

// 숫자가 null이면 자리표시
const num = (v, holder = "0,000") => v == null ? holder : v.toLocaleString("ko-KR");
const rate = v => v == null ? "0.00%" : `${v.toFixed(2)}%`;
const arrow = dir => dir === "up" ? "▲" : dir === "down" ? "▼" : "";
const stockBy = code => STOCKS.find(s => s.code === code);

const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  refresh: '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4v4h-4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v6M12 16.5v.1"/>',
  star: '<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/>',
  kebab: '<path d="M12 5.5v.1M12 12v.1M12 18.5v.1" stroke-width="3"/>',
  list: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M4 14.5h16"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4.5 4.5"/>',
  cal: '<rect x="4.5" y="5.5" width="15" height="14" rx="1.5"/><path d="M4.5 9.5h15M8.5 4v3M15.5 4v3"/>',
  down: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v8M8.5 12.5 12 16l3.5-3.5"/>',
  cross: '<path d="M12 4v16M4 12h16"/>',
  erase: '<path d="m5 15 8-8 6 6-6 6H9Z"/><path d="m9 11 6 6"/>',
  menu: '<path d="M5 7h14M5 12h14M5 17h14"/>',
  wallet: '<rect x="4" y="6" width="16" height="13" rx="3"/><path d="M4 10h16M8 14.5h.1M12 14.5h.1M16 14.5h.1" stroke-width="2.4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  undo: '<path d="M7 7a7 7 0 1 1-2 5"/><path d="M7 3v4H3"/>',
  backspace: '<path d="M9 6h10v12H9l-5-6Z"/><path d="m12 10 4 4M16 10l-4 4"/>',
  gift: '<rect x="4.5" y="10" width="15" height="9.5" rx="1"/><path d="M3.5 7.5h17v3h-17ZM12 7.5v12M12 7.5c-1.5-3.5-5-3.5-4 0M12 7.5c1.5-3.5 5-3.5 4 0"/>',
};
const icon = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

/* ---------- 작은 부품 ---------- */
const pill = (label, opts = "") => `<button type="button" class="pill" ${opts}>${label}</button>`;
const dropPill = label => `<button type="button" class="pill drop">${label}<i class="drop-mark"></i></button>`;
const iconBtn = (name, label) => `<button type="button" class="icon-btn" aria-label="${label}">${icon(name)}</button>`;
const select = (label, cls = "") => `<button type="button" class="select ${cls}">${label}<i class="corner"></i></button>`;
const dateBox = (d = TODAY, disabled = false) => `<span class="date ${disabled ? "off" : ""}">${d}${icon("cal")}</span>`;
const check = (label, on = true) => `<label class="check"><input type="checkbox" ${on ? "checked" : ""}><span>${label}</span></label>`;
const collapseBar = () => `<button type="button" class="collapse" aria-label="접기"><i></i></button>`;
const accountRow = () => `
  <div class="account-row">
    <button type="button" class="account">${ACCOUNT.no} [${ACCOUNT.type}] ${ACCOUNT.owner}<i class="chev"></i></button>
    <span class="pw-box" aria-label="비밀번호"></span>
  </div>`;
// 두 줄 머리글: rows = [["종목명","보유수량",...], ["구분",...]]
const colHead = (rows, more = true) => `
  <div class="col-head" style="--n:${rows[0].length}">
    ${rows.map(r => `<div class="col-row">${r.map(c => `<span>${c}</span>`).join("")}</div>`).join("")}
    ${more ? `<i class="more">›</i>` : ""}
  </div>`;

/* ---------- 화면 틀 ---------- */
const NAV = [["watch", "관심종목"], ["quote", "현재가"], ["order", "주문"], ["chart", "차트"], ["balance", "잔고"], ["market", "시장정보"]];
const Screens = {};

const App = {
  code: STOCKS[0].code, // 차트·주문 화면이 보여 줄 종목

  init(host) {
    host.innerHTML = `
      <div class="phone mts">
        <div class="mts-screen"></div>
        <div class="index-bar" aria-live="off"></div>
        <nav class="mts-nav" aria-label="하단 메뉴">
          <button type="button" class="nav-menu">${icon("menu")}<span>메뉴</span></button>
          <div class="nav-items">${NAV.map(([k, l]) => `<button type="button" data-go="${k}">${l}</button>`).join("")}</div>
          <button type="button" class="nav-wallet" aria-label="빠른 메뉴">${icon("wallet")}</button>
        </nav>
        <div class="toast" role="status" aria-live="polite"></div>
        <div class="modal-layer" hidden></div>
      </div>`;
    this.root = host.firstElementChild;
    this.screen = this.root.querySelector(".mts-screen");
    this.indexBar = this.root.querySelector(".index-bar");
    this.layer = this.root.querySelector(".modal-layer");
    this.root.querySelector(".nav-menu").onclick = () => { window.goPage ? window.goPage("../../index.html", "back") : (location.href = "../../index.html"); };
    this.root.querySelector(".nav-wallet").onclick = () => this.toast("빠른 메뉴는 준비 중이에요");
    this.root.querySelectorAll("[data-go]").forEach(b => b.onclick = () => {
      if (Screens[b.dataset.go]) this.go(b.dataset.go);
      else this.toast(`${b.textContent} 화면은 준비 중이에요`);
    });
    startIndexBar(this.indexBar);
    window.addEventListener("hashchange", () => this.route());
  },
  go(name, sub) { location.hash = sub ? `${name}/${sub}` : name; },
  route() {
    const [name, sub] = location.hash.slice(1).split("/");
    this.current = Screens[name] ? name : "watch";
    this.params = { sub: sub ? decodeURIComponent(sub) : undefined };
    // 주소에 종목코드가 붙어 오면(#order/005930) 그 종목으로. 달이에서 주문으로 넘어올 때 씀
    if (sub && stockBy(sub) && sub !== this.code) { this.code = sub; if (Screens.order) Object.assign(Screens.order, { qty: 1, price: null }); }
    this.render();
  },
  render() {
    const s = Screens[this.current];
    const moved = this.shown && this.shown !== this.current;
    this.shown = this.current;
    this.screen.innerHTML = s.render(this.params);
    if (moved && this.screen.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      this.screen.animate([{ opacity: 0, transform: "translateX(16px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2, .8, .2, 1)" });
    this.screen.querySelector(".back")?.addEventListener("click", () => { window.goPage ? window.goPage("../../index.html", "back") : (location.href = "../../index.html"); });
    if (s.mount) s.mount(this.screen, this.params);
    this.root.querySelectorAll("[data-go]").forEach(b => b.classList.toggle("on", b.dataset.go === this.current));
    revealInRow(this.root.querySelector(`[data-go="${this.current}"]`));
  },
  toast(msg, ms = 1600) {
    const t = this.root.querySelector(".toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  },
  modal(html, cls = "") {
    this.layer.hidden = false;
    this.layer.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
    this.screen.inert = true;
    return this.layer.firstElementChild;
  },
  closeModal() {
    this.layer.hidden = true;
    this.layer.innerHTML = "";
    this.screen.inert = false;
  },
};

// 화면 위쪽 공통 헤더: "< 제목" + 오른쪽 버튼들
function header(title, right = "") {
  return `<header class="mts-head">
    <button type="button" class="back" aria-label="전체메뉴로">${icon("back")}</button>
    <h1>${title}</h1><div class="head-right">${right}</div>
  </header>`;
}
// 청록색 탭 줄 (가로 스크롤)
function topTabs(list, on, attr = "data-tab") {
  return `<nav class="top-tabs"><div class="top-tabs-in">${list.map(t => `<button type="button" ${attr}="${t}" class="${t === on ? "on" : ""}">${t}</button>`).join("")}</div></nav>`;
}
// 흰 바탕 밑줄 탭
function subTabs(list, on, attr = "data-subtab") {
  return `<div class="sub-tabs">${list.map(t => `<button type="button" ${attr}="${t}" class="${t === on ? "on" : ""}">${t}</button>`).join("")}</div>`;
}
function bindTabs(el, attr, fn) {
  el.querySelectorAll(`[${attr}]`).forEach(b => b.onclick = () => fn(b.getAttribute(attr)));
  revealInRow(el.querySelector(`[${attr}].on`));
}

// 차트·주문 화면 위쪽 종목 정보 두 줄
function stockInfo(s) {
  return `<div class="stock-info">
      <span>${s.code} ${s.margin}</span><span class="nxt">${s.nxt}</span>
      <span class="sv">${num(s.volume, "000,000")} <em>(${rate(s.volRate)})</em></span>
    </div>
    <div class="stock-line">
      <button type="button" class="stock-name" data-act="pick">${esc(s.name)}${icon("search")}</button>
      <span class="big ${s.dir}">${num(s.price)}</span>
      <span class="chg ${s.dir}"><span><em>${arrow(s.dir)}</em> ${num(s.change, "00")}</span><small>${rate(s.rate)}</small></span>
    </div>`;
}
// 종목 이름 칸을 누르면 가상 종목 고르기
function bindStockPick(el) {
  el.querySelector("[data-act=pick]").onclick = () => {
    const m = App.modal(`<h2 class="modal-title">종목 선택</h2>
      <div class="pick-list">${STOCKS.map(s => `<button type="button" data-code="${s.code}">${esc(s.name)}<small>${s.code}</small></button>`).join("")}</div>
      <button type="button" class="btn gray wide" data-act="close">닫기</button>`);
    m.querySelectorAll("[data-code]").forEach(b => b.onclick = () => { App.code = b.dataset.code; App.closeModal(); App.render(); });
    m.querySelector("[data-act=close]").onclick = () => App.closeModal();
  };
}

/* ---------- 하단 지수 띠 ---------- */
function startIndexBar(bar) {
  let i = 0;
  const paint = () => {
    const x = INDICES[i % INDICES.length];
    bar.innerHTML = `<span class="ix-name">${x.name}</span>
      <span class="ix-val ${x.dir}">${num(x.value, "0,000.00")}</span>
      <span class="ix-chg ${x.dir}">${arrow(x.dir)} ${num(x.change, "00.00")} (${rate(x.rate)})</span>
      ${x.status ? `<span class="ix-status">${x.status}</span>` : ""}`;
    i++;
  };
  paint();
  setInterval(paint, 3500);
}

// 가로로 넘기는 줄 안에서만 버튼이 보이게 밀기 (scrollIntoView는 휴대폰 틀까지 밀어 버림)
function revealInRow(btn) {
  if (!btn) return;
  const row = btn.parentElement.scrollWidth > btn.parentElement.clientWidth ? btn.parentElement : btn.parentElement.parentElement;
  const z = (window.phoneZoom ? window.phoneZoom() : 1); // 확대된 휴대폰(src/js/fit.js)이면 화면 좌표를 안쪽 좌표로
  const left = (btn.getBoundingClientRect().left - row.getBoundingClientRect().left) / z + row.scrollLeft;
  row.scrollLeft = left - (row.clientWidth - btn.offsetWidth) / 2;
}
