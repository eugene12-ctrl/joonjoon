/* ---------- 주문 ----------
   처음 들어오면 계좌 비밀번호(가상, 아무 숫자 4자리 이상) → 호가와 주문 입력.
   주문은 실제로 나가지 않고, 가상 계좌라 "증거금 부족"으로 끝납니다. */
const ORDER_TABS = ["일반주문", "차트주문", "호가주문", "자동주문", "쾌속주문"];
const SIDES = ["매수", "매도", "정정/취소", "체결/미체결"];

Screens.order = {
  tab: "일반주문", side: "매수", credit: false, market: false, auto: true, qty: 0, price: null, pwOk: false,
  render() {
    const s = stockBy(App.code);
    if (this.tab !== "일반주문") {
      return header("주문", `${select("KRX", "krx")}${iconBtn("star", "관심 등록")}${iconBtn("gear", "주문 설정")}`)
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
    return header("주문", `${select("KRX", "krx")}${iconBtn("star", "관심 등록")}${iconBtn("gear", "주문 설정")}`)
      + topTabs(ORDER_TABS, this.tab)
      + `<div class="order-top">${stockInfo(s)}${accountRow()}</div>`
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
      else if (this.price != null) this.price = Math.max(0, this.price + +d * 5);
      App.render();
    });
    el.querySelectorAll("[data-hoga]").forEach(b => b.onclick = () => {
      const [side, i] = [b.dataset.hoga[0], +b.dataset.hoga.slice(1)];
      this.price = (side === "a" ? ORDER_BOOK.asks : ORDER_BOOK.bids)[i].price;
      this.market = false;
      App.render();
    });
    el.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => App.toast("가상 계좌라 주문가능수량이 없어요"));
    el.querySelector("[data-act=able]")?.addEventListener("click", () => App.toast("주문가능금액: 0원 (가상 계좌)"));
    el.querySelector("[data-act=reset]")?.addEventListener("click", () => { this.qty = 0; this.price = null; this.market = false; App.render(); });
    el.querySelector("[data-act=submit]")?.addEventListener("click", () => this.submit());
    // 현재가 줄이 보이도록 호가를 가운데로
    const ladder = el.querySelector(".ladder"), now = el.querySelector(".hoga.now");
    if (ladder && now) ladder.scrollTop = now.offsetTop - ladder.clientHeight / 2 + now.offsetHeight;
    if (!this.pwOk) this.askPassword();
  },
  askPassword() {
    const keys = [...Array(10).keys()].sort(() => Math.random() - 0.5);
    let pw = "";
    const m = App.modal(`
      <div class="sheet-head"><h2>계좌 비밀번호</h2><button type="button" class="icon-btn" data-act="x" aria-label="닫기">${icon("close")}</button></div>
      <div class="pw-line"><span class="pw-dots"></span><button type="button" class="btn teal" data-act="ok">확인</button></div>
      <p class="pw-help">· 해당 계좌 비밀번호 <em>4자리 ~ 8자리</em>를 꼭 확인해주세요!</p>
      <div class="keypad">${keys.slice(0, 9).map(k => `<button type="button" data-k="${k}">${k}</button>`).join("")}
        <button type="button" data-k="shuffle" aria-label="재배열">${icon("undo")}</button><button type="button" data-k="${keys[9]}">${keys[9]}</button>
        <button type="button" data-k="del" aria-label="지우기">${icon("backspace")}</button></div>`, "sheet");
    const dots = m.querySelector(".pw-dots");
    const paint = () => dots.innerHTML = "<i></i>".repeat(pw.length);
    m.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      if (k === "del") pw = pw.slice(0, -1);
      else if (k === "shuffle") return this.askPassword();
      else if (pw.length < 8) pw += k;
      paint();
    });
    m.querySelector("[data-act=ok]").onclick = () => {
      if (pw.length < 4) return App.toast("비밀번호 4자리 이상을 눌러 주세요");
      this.pwOk = true;
      App.closeModal();
    };
    m.querySelector("[data-act=x]").onclick = () => { App.closeModal(); App.go("watch"); };
  },
  submit() {
    if (!this.qty) {
      const m = App.modal(`<div class="sheet-head"><h2>안내</h2><button type="button" class="icon-btn" data-act="x" aria-label="닫기">${icon("close")}</button></div>
        <p class="modal-msg">수량이 입력되지 않았습니다.</p><button type="button" class="btn teal wide" data-act="x">닫기</button>`);
      m.querySelectorAll("[data-act=x]").forEach(b => b.onclick = () => App.closeModal());
      return;
    }
    const s = stockBy(App.code), label = `${this.credit ? "신용" : "현금"}${this.side}`, buy = this.side === "매수";
    const rows = [["계좌번호", `${ACCOUNT.no}`], ["종 목 명", s.name], ["거 래 소", "KRX"], ["매매구분", this.market ? "시장가" : "지정가"],
      ["주문단가", this.market ? "시장가" : `<b>${num(this.price)} 원</b>`], ["주문수량", `<b>${this.qty.toLocaleString("ko-KR")} 주</b>`]];
    const m = App.modal(`<div class="sheet-head"><h2><span class="${buy ? "up" : "down"}">${label}</span> 주문확인</h2>
        <button type="button" class="icon-btn" data-act="x" aria-label="닫기">${icon("close")}</button></div>
      <dl class="confirm">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      <p class="modal-note">주문 내용을 확인하신 후 ${label} 버튼을 눌러주세요.</p>
      <div class="row2"><button type="button" class="btn gray" data-act="x">취소</button><button type="button" class="btn ${buy ? "red" : "blue"}" data-act="go">${label}</button></div>`);
    m.querySelectorAll("[data-act=x]").forEach(b => b.onclick = () => App.closeModal());
    m.querySelector("[data-act=go]").onclick = () => { App.closeModal(); App.toast("[00000]증거금이 부족합니다. (가상 계좌)", 2200); };
  },
};
