/* ---------- 주문 ----------
   계좌번호나 비밀번호는 묻지 않고 바로 호가와 주문 입력.
   주문하면 바로 체결되고, 달이가 있으면 매매일지에 적습니다. */
const ORDER_TABS = ["일반주문", "차트주문", "호가주문", "자동주문", "쾌속주문"];
const SIDES = ["매수", "매도", "정정/취소", "체결/미체결"];

// 헤더의 달이 버튼: 주문 화면에선 달이가 숨으니, 보던 달이 화면으로 한 번에 돌아가는 길
const daliJump = () => `<button type="button" class="dali-jump" data-act="dali" aria-label="달이로 돌아가기"><img src="../dali/dali-face.png" alt="">달이</button>`;

Screens.order = {
  tab: "일반주문", side: "매수", credit: false, market: false, auto: true, qty: 1, price: null,
  render() {
    const s = stockBy(App.code);
    if (this.price == null || this.priceOf !== s.code) { this.price = s.price; this.priceOf = s.code; } // 처음엔 현재가
    if (this.tab !== "일반주문") {
      return header("주문", `${daliJump()}${select("KRX", "krx")}${starBtn()}${iconBtn("gear", "주문 설정")}`)
        + topTabs(ORDER_TABS, this.tab) + `<div class="mts-body"><p class="empty">${this.tab}은 준비 중이에요</p></div>`;
    }
    const buy = this.side === "매수", sell = this.side === "매도";
    const askRows = ORDER_BOOK.asks.map((r, i) => `<button type="button" class="hoga ask" data-hoga="a${i}"><b>${num(r.price)}</b><span>${num(r.qty, "000")}</span></button>`);
    const bidRows = ORDER_BOOK.bids.map((r, i) => `<button type="button" class="hoga bid" data-hoga="b${i}"><b>${num(r.price)}</b><span>${num(r.qty, "000")}</span></button>`);
    // 매도 마지막 칸 = 현재가 자리(테두리), 그 아래 기준가(K) 줄
    askRows[askRows.length - 1] = askRows[askRows.length - 1].replace('class="hoga ask"', 'class="hoga ask now"');
    const form = (buy || sell) ? `
      <div class="ord-form">
        <div class="seg2"><span class="krx-off">KRX</span>
          <button type="button" data-credit="0" class="${!this.credit ? "on" : ""}">현금</button>
          <button type="button" data-credit="1" class="${this.credit ? "on" : ""}">신용</button></div>
        <div class="ord-line">${select("지정가", "ord-type")}${check("시장가", this.market)}</div>
        <div class="stepper"><span class="lbl">가격</span><b>${this.market ? "시장가" : `${num(this.price)}원`}</b>
          <button type="button" data-step="price:-1">−</button><button type="button" data-step="price:1">+</button></div>
        <div class="quick">${["100%", "미100%", "100만"].map(q => `<button type="button" data-quick="${q}">${q}</button>`).join("")}</div>
        <div class="stepper qty"><span class="lbl">수량</span><b>${this.qty ? `${this.qty.toLocaleString("ko-KR")}주` : ""}</b>
          <button type="button" data-step="qty:-1">−</button><button type="button" data-step="qty:1">+</button></div>
        <div class="ord-line">${check("자동(가능수량 100%)", this.auto)}${iconBtn("info", "자동 수량 안내")}</div>
        <div class="ord-line end"><button type="button" class="mini" data-act="able">주문가능금액</button></div>
        <div class="ord-amount"><span>주문금액</span><b>${this.qty ? `${this.price == null ? "0,000" : (this.price * this.qty).toLocaleString("ko-KR")} 원` : ""}</b></div>
        <div class="ord-btns"><button type="button" class="btn dark" data-act="reset" aria-label="초기화">${icon("undo")}</button>
          <button type="button" class="btn ${buy ? "red" : "blue"}" data-act="submit">${this.credit ? "신용" : "현금"}${this.side}</button></div>
      </div>` : `<div class="ord-form"><p class="empty small">${this.side} 내역이 없어요</p></div>`;
    return header("주문", `${daliJump()}${select("KRX", "krx")}${starBtn()}${iconBtn("gear", "주문 설정")}`)
      + topTabs(ORDER_TABS, this.tab)
      + `<div class="order-top">${stockInfo(s)}</div>`
      + subTabs(SIDES, this.side, "data-side").replace('class="sub-tabs"', 'class="sub-tabs side-tabs"')
      + `<div class="order-main">
          <div class="ladder">${askRows.join("")}<div class="base-line"><i>K</i>${num(ORDER_BOOK.prevClose)}</div>${bidRows.join("")}</div>
          ${form}
        </div>`;
  },
  mount(el) {
    bindTabs(el, "data-tab", t => { this.tab = t; App.render(); });
    if (this.tab !== "일반주문") return;
    bindStockPick(el);
    el.querySelectorAll("[data-side]").forEach(b => b.onclick = () => { this.side = b.dataset.side; App.render(); });
    el.querySelectorAll("[data-credit]").forEach(b => b.onclick = () => { this.credit = b.dataset.credit === "1"; App.render(); });
    el.querySelectorAll(".check input").forEach(c => c.onchange = () => {
      const label = c.nextElementSibling.textContent;
      if (label === "시장가") this.market = c.checked;
      else this.auto = c.checked;
      App.render();
    });
    el.querySelectorAll("[data-step]").forEach(b => b.onclick = () => {
      const [k, d] = b.dataset.step.split(":");
      if (k === "qty") this.qty = Math.max(0, this.qty + +d);
      else if (this.price != null) this.price = Math.max(0, this.price + +d * tickOf(this.price));
      App.render();
    });
    el.querySelectorAll("[data-hoga]").forEach(b => b.onclick = () => {
      const [side, i] = [b.dataset.hoga[0], +b.dataset.hoga.slice(1)];
      this.price = (side === "a" ? ORDER_BOOK.asks : ORDER_BOOK.bids)[i].price;
      this.market = false;
      App.render();
    });
    el.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => { this.qty = 10; App.render(); });
    el.querySelector("[data-act=able]")?.addEventListener("click", () => App.toast("주문가능금액: 10,000,000원"));
    el.querySelector("[data-act=dali]")?.addEventListener("click", () => {
      if (!window.dali) return;
      // 달이에서 왔으면 보던 뉴스로, 아니면 오늘 탭으로
      let back = null;
      try { back = sessionStorage.getItem("dali-back"); } catch (e) { /* 없으면 오늘 탭 */ }
      window.dali.open(back ? "news" : null);
      if (back) window.dali.openNews(back);
    });
    el.querySelector("[data-act=reset]")?.addEventListener("click", () => { this.qty = 1; this.price = null; this.market = false; App.render(); });
    el.querySelector("[data-act=submit]")?.addEventListener("click", () => this.submit());
    // 현재가 줄이 보이도록 호가를 가운데로
    const ladder = el.querySelector(".ladder"), now = el.querySelector(".hoga.now");
    if (ladder && now) ladder.scrollTop = now.offsetTop - ladder.clientHeight / 2 + now.offsetHeight;
  },
  submit() {
    const s = stockBy(App.code), label = `${this.credit ? "신용" : "현금"}${this.side}`;
    const qty = Math.max(1, this.qty);
    App.toast(`${s.name} ${qty.toLocaleString("ko-KR")}주 ${label} 체결됐어요`, 2000);
    if (window.dali && typeof DALI_SYMS !== "undefined" && DALI_SYMS[s.name]) window.dali.record(s.name, `${qty}주`, this.side);
  },
};
