/* ---------- 휴대폰 화면 만들기 ---------- */
function screenHTML() {
  const tabs = CATS.map((c, i) =>
    `<button type="button" class="cat" data-i="${i}" style="grid-row:${c.pos[0]};grid-column:${c.pos[1]}">${c.name}</button>`).join("");
  const pages = CATS.map((c, ci) => {
    const list = c.tiles.split(",").map(t => t === "★" ? { label: NEW_FEATURE_LABEL, isNew: true } : { label: t });
    if (c.extra) list.push({ label: c.extra, extra: true });
    const tiles = list.map((t, ti) => {
      const accent = t.isNew ? "gTeal" : ACCENTS[(ti + ci) % 4];
      const variant = (ti * 3 + ci) % 4;
      const cls = ["tile", t.isNew ? "new" : "", t.extra ? "extra" : ""].join(" ").trim();
      return `<button type="button" class="${cls}" data-t="${ti}">${iconSVG(t.label, accent, variant, t.isNew)}`
        + (t.isNew ? `<span class="badge">NEW</span>` : "")
        + `<span class="lbl">${wbr(t.label)}</span></button>`;
    }).join("");
    return `<div class="page" data-c="${ci}" aria-label="${c.name} 메뉴">${tiles}</div>`;
  }).join("");

  return `
  <div class="menu">
    <div class="demo-band">시연용 가상 화면</div>
    <header class="app-head">
      <div class="who"><strong>홍길동님</strong>
        <div class="mode" role="group" aria-label="화면 모드"><button type="button" class="on">기본</button><button type="button">간편</button></div>
      </div>
      <div class="head-icons">
        <button type="button" aria-label="이벤트"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7h18v3H3ZM12 7v13M12 7c-2-4-6-3.5-4.5-.5M12 7c2-4 6-3.5 4.5-.5"/></svg></button>
        <button type="button" aria-label="검색"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></button>
        <button type="button" aria-label="알림"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4.2L4.3 16a.8.8 0 0 0 .7 1.2h14a.8.8 0 0 0 .7-1.2L18 13.2V9a6 6 0 0 0-6-6Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0Z"/></svg></button>
        <button type="button" aria-label="설정"><svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.3 2.5h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.8c.1.6.1 1.3 0 1.9l2 1.8-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.8a6 6 0 0 1 0-1.9l-2-1.8 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9l.5-2.6ZM12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/></svg></button>
      </div>
    </header>
    <div class="body">
      <nav class="cats" aria-label="카테고리">
        <span class="edge l off" aria-hidden="true">◂</span>
        <div class="cats-vp"><div class="cats-grid">${tabs}</div></div>
        <span class="edge r" aria-hidden="true">▸</span>
      </nav>
      <section class="panel">
        <button type="button" class="nav prev" aria-label="이전 카테고리"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1 1 7l6 6"/></svg></button>
        <button type="button" class="nav next" aria-label="다음 카테고리"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m1 1 6 6-6 6"/></svg></button>
        <div class="vp"><div class="track">${pages}</div></div>
        <button type="button" class="expand" aria-expanded="false"><span class="exp-l">펼쳐보기</span>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m2.5 4.5 3.5 3.5 3.5-3.5"/></svg></button>
      </section>
      <div class="banners">
        <button type="button" class="banner"><span><span class="chip">디지털</span><span class="btext"></span></span>${BANNER_ILLU[0]}</button>
        <button type="button" class="banner"><span><span class="chip">디지털</span><span class="btext"></span></span>${BANNER_ILLU[1]}</button>
      </div>
    </div>
    <nav class="bottom" aria-label="하단 메뉴">
      <button type="button" class="x" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg></button>
      <button type="button">계좌개설</button>
      <button type="button">고객센터</button>
      <button type="button">로그아웃</button>
    </nav>
  </div>
  <section class="sub" aria-label="${NEW_FEATURE_TITLE}" inert>
    <div class="demo-band">시연용 가상 화면</div>
    <header class="sub-head">
      <button type="button" class="back" aria-label="뒤로가기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      <h1>${NEW_FEATURE_TITLE}</h1>
    </header>
    <div class="sub-body">${newFeatureHTML()}</div>
  </section>
  <div class="toast" role="status" aria-live="polite"></div>`;
}

function createScreen(host) {
  const root = document.createElement("div");
  root.className = "phone";
  root.innerHTML = screenHTML();
  host.appendChild(root);

  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const catsVp = $(".cats-vp"), catsGrid = $(".cats-grid"), vp = $(".vp"), track = $(".track"), panel = $(".panel"), toast = $(".toast");
  const menu = $(".menu"), sub = $(".sub");
  const tabs = $$(".cat"), pages = $$(".page"), btexts = $$(".btext");
  const edgeL = $(".edge.l"), edgeR = $(".edge.r");
  const state = { cur: 0, sel: CATS.map(() => 0), expanded: false, subOpen: false };
  let toastTimer = null, suppressClick = false;

  const baseX = () => `translateX(${-state.cur * 100}%)`;

  function sizeTabs() { root.style.setProperty("--colw", (catsVp.clientWidth / 4) + "px"); }
  function updateEdges() {
    const max = catsVp.scrollWidth - catsVp.clientWidth;
    edgeL.classList.toggle("off", catsVp.scrollLeft <= 2);
    edgeR.classList.toggle("off", catsVp.scrollLeft >= max - 2);
  }
  function revealTab(animate) {
    const t = tabs[state.cur], x0 = t.offsetLeft - catsGrid.offsetLeft;
    const l = x0 - 3, r = x0 + t.offsetWidth + 3;
    let target = null;
    if (l < catsVp.scrollLeft) target = l;
    else if (r > catsVp.scrollLeft + catsVp.clientWidth) target = r - catsVp.clientWidth;
    if (target !== null) catsVp.scrollTo({ left: target, behavior: animate ? "smooth" : "auto" });
    updateEdges();
  }
  function fitHeight(animate) {
    vp.style.transition = animate ? "height .3s ease" : "none";
    vp.style.height = (pages[state.cur].offsetHeight + 10) + "px";
  }
  function setBanners(animate) {
    const name = CATS[state.cur].name;
    const texts = [`${name} 가상 이벤트 배너 A`, `${name} 가상 이벤트 배너 B`];
    if (!animate) { btexts.forEach((b, i) => b.textContent = texts[i]); return; }
    btexts.forEach(b => b.classList.add("fade"));
    setTimeout(() => btexts.forEach((b, i) => { b.textContent = texts[i]; b.classList.remove("fade"); }), 150);
  }
  function paintSel(ci) {
    pages[ci].querySelectorAll(".tile").forEach(t => t.classList.toggle("on", +t.dataset.t === state.sel[ci]));
  }
  function bounce(dir) {
    track.animate([
      { transform: baseX() },
      { transform: `translateX(calc(${-state.cur * 100}% + ${dir * 26}px))` },
      { transform: baseX() },
    ], { duration: 320, easing: "ease-out" });
  }
  function go(i, animate = true) {
    if (i < 0) { bounce(1); return; }
    if (i > LAST) { bounce(-1); return; }
    state.cur = i;
    track.style.transition = animate ? "transform .3s ease" : "none";
    track.style.transform = baseX();
    tabs.forEach(t => {
      const on = +t.dataset.i === i;
      t.classList.toggle("on", on);
      t.setAttribute("aria-current", on ? "true" : "false");
    });
    revealTab(animate);
    setBanners(animate);
    fitHeight(animate);
  }
  function select(ci, ti) { state.sel[ci] = ti; paintSel(ci); }
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), TOAST_MS);
  }
  function setExpanded(on) {
    state.expanded = on;
    panel.classList.toggle("expanded", on);
    $(".exp-l").textContent = on ? "접기" : "펼쳐보기";
    $(".expand").setAttribute("aria-expanded", String(on));
    fitHeight(true);
  }

  // 신규 기능 페이지 열기/닫기 (브라우저·휴대폰 뒤로가기도 지원)
  function setSub(on) {
    state.subOpen = on;
    sub.classList.toggle("open", on);
    sub.inert = !on;
    menu.inert = on;
    if (on) $(".back").focus({ preventScroll: true });
    else $(".page[data-c='6'] .tile.new")?.focus({ preventScroll: true });
  }
  function openSub() {
    if (state.subOpen) return;
    history.pushState({ sub: true }, "");
    setSub(true);
  }
  function closeSub() {
    if (!state.subOpen) return;
    if (history.state && history.state.sub) history.back();
    else setSub(false);
  }
  window.addEventListener("popstate", () => { if (state.subOpen) setSub(false); });

  const api = { root, go, select, showToast, setExpanded, openSub, closeSub, q: $, qa: $$, state };

  sizeTabs();
  CATS.forEach((_, ci) => paintSel(ci));
  go(0, false);

  /* --- 이벤트 연결 --- */
  catsVp.addEventListener("scroll", updateEdges, { passive: true });
  new ResizeObserver(() => { sizeTabs(); fitHeight(false); revealTab(false); }).observe(catsVp);

  // 탭 터치
  tabs.forEach(t => t.addEventListener("click", () => { if (!suppressClick) go(+t.dataset.i); }));

  // 탭 줄: 마우스로 끌어서 밀기 (터치는 기본 스크롤)
  let td = null;
  catsVp.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") td = { x: e.clientX, s: catsVp.scrollLeft, moved: false }; });
  catsVp.addEventListener("pointermove", e => {
    if (!td) return;
    const dx = e.clientX - td.x;
    if (!td.moved && Math.abs(dx) > 5) { td.moved = true; catsVp.setPointerCapture(e.pointerId); }
    if (td.moved) catsVp.scrollLeft = td.s - dx;
  });
  const endTabDrag = () => { if (td && td.moved) { suppressClick = true; setTimeout(() => suppressClick = false, 0); } td = null; };
  catsVp.addEventListener("pointerup", endTabDrag);
  catsVp.addEventListener("pointercancel", endTabDrag);

  // 그리드 스와이프 (터치 + 마우스)
  let gd = null;
  vp.addEventListener("pointerdown", e => { gd = { x: e.clientX, y: e.clientY, w: vp.clientWidth, dx: 0, drag: false }; });
  vp.addEventListener("pointermove", e => {
    if (!gd) return;
    const dx = e.clientX - gd.x, dy = e.clientY - gd.y;
    if (!gd.drag) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        gd.drag = true; vp.setPointerCapture(e.pointerId); track.style.transition = "none";
      } else if (Math.abs(dy) > 10) { gd = null; return; }
      else return;
    }
    const atEdge = (state.cur === 0 && dx > 0) || (state.cur === LAST && dx < 0);
    gd.dx = atEdge ? dx * 0.3 : dx;
    track.style.transform = `translateX(calc(${-state.cur * 100}% + ${gd.dx}px))`;
  });
  function endGridDrag() {
    if (!gd) return;
    if (gd.drag) {
      suppressClick = true; setTimeout(() => suppressClick = false, 0);
      const th = gd.w * 0.18;
      if (gd.dx < -th && state.cur < LAST) go(state.cur + 1);
      else if (gd.dx > th && state.cur > 0) go(state.cur - 1);
      else { // 제자리로 튕겨 돌아오기
        track.style.transition = "transform .35s cubic-bezier(.3,1.5,.5,1)";
        track.style.transform = baseX();
      }
    }
    gd = null;
  }
  vp.addEventListener("pointerup", endGridDrag);
  vp.addEventListener("pointercancel", endGridDrag);

  // ‹ › 화살표
  $(".nav.prev").addEventListener("click", () => go(state.cur - 1));
  $(".nav.next").addEventListener("click", () => go(state.cur + 1));

  // 타일 터치: 선택 강조만 (카테고리마다 기억)
  track.addEventListener("click", e => {
    const tile = e.target.closest(".tile");
    if (!tile || suppressClick) return;
    const ci = +tile.closest(".page").dataset.c;
    select(ci, +tile.dataset.t);
    if (tile.classList.contains("new")) openNewFeature(api);
    else openTileLink(ci, tile.querySelector(".lbl").textContent);
  });

  // 펼쳐보기 / 접기
  $(".expand").addEventListener("click", () => setExpanded(!state.expanded));

  // 신규 기능 페이지 뒤로가기
  $(".back").addEventListener("click", closeSub);

  // 기본|간편, 하단 바: 선택 표시만
  $$(".mode button").forEach(b => b.addEventListener("click", () => {
    $$(".mode button").forEach(x => x.classList.toggle("on", x === b));
  }));
  $$(".bottom button").forEach(b => b.addEventListener("click", () => {
    $$(".bottom button").forEach(x => x.classList.toggle("on", x === b));
  }));

  return api;
}

