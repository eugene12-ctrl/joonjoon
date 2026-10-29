/* ---------- 달이 움직임 더하기 (dali.js 위에 얹음) ----------
   dali.js를 고치지 않고 화면 요소만 보고 움직임을 더한다.
   되돌리려면 각 페이지에서 이 파일과 dali-plus.css를 불러오는 줄을 지우면 된다.
   1) 해달이 버튼에서 시트 머리로 날아가고, 닫으면 돌아옴
   2) 시트를 끌어내려 닫기
   3) 탭 표시가 미끄러지고, 좌우로 밀어 탭 바꾸기
   4) 손익 숫자 세기 (손실은 조용히 그대로)
   5) 조약돌이 개수 칸으로 날아감
   6) 달이 버튼을 꾹 누르면 3초 요약 */
(function () {
  const phone = document.querySelector(".phone");
  const fab = phone && phone.querySelector(".dali-fab");
  const sheet = phone && phone.querySelector(".dali-sheet");
  if (!fab || !sheet || !window.dali) return;

  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const dim = phone.querySelector(".dali-dim");
  const head = sheet.querySelector(".dali-sheet-head");
  const headImg = head.querySelector("img");
  const fabImg = fab.querySelector("img");
  const tabs = sheet.querySelector(".dali-tabs");
  const body = sheet.querySelector(".dali-body");
  const EASE_OUT = "cubic-bezier(.2, .8, .2, 1)";

  // phone 기준 좌표 (transform은 무시한 최종 자리)
  const offsetIn = (el, root) => {
    let x = 0, y = 0;
    for (let n = el; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  const rectIn = el => {
    const r = el.getBoundingClientRect(), p = phone.getBoundingClientRect(), z = (window.phoneZoom ? window.phoneZoom() : 1); // 확대된 휴대폰이면 안쪽 좌표로
    return { x: (r.left - p.left) / z, y: (r.top - p.top) / z, w: r.width / z, h: r.height / z };
  };
  // a에서 b로 위로 솟는 곡선 (조약돌, 해달 비행)
  function arc(img, a, b, ms, lift = 60) {
    const fly = document.createElement("img");
    fly.src = img; fly.alt = ""; fly.className = "dali-flyer";
    Object.assign(fly.style, { left: a.x + "px", top: a.y + "px", width: a.w + "px", height: a.h + "px" });
    phone.appendChild(fly);
    const frames = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, s = b.w / a.w; // .dali-flyer는 왼쪽 위 기준으로 커지고 작아짐
      const dx = (b.x - a.x) * t;
      const dy = (b.y - a.y) * t - Math.sin(Math.PI * t) * lift;
      frames.push({ transform: `translate(${dx}px, ${dy}px) scale(${1 + (s - 1) * t})`, offset: t });
    }
    const anim = fly.animate(frames, { duration: ms, easing: EASE_OUT, fill: "forwards" });
    anim.finished.then(() => fly.remove(), () => fly.remove());
    return anim;
  }

  /* 1. 해달 비행: 버튼 -> 시트 머리, 닫으면 반대로 */
  let wasOpen = sheet.classList.contains("open");
  new MutationObserver(() => {
    const isOpen = sheet.classList.contains("open");
    if (isOpen === wasOpen) return;
    wasOpen = isOpen;
    phone.classList.toggle("dali-sheet-on", isOpen);
    if (isOpen) onOpen(); else onClose();
  }).observe(sheet, { attributes: true, attributeFilter: ["class"] });

  function onOpen() {
    placePill(false);
    if (activeTab() === "journal") tick();
    if (calm) return;
    const a = rectIn(fabImg);
    const s = offsetIn(sheet, phone), h = offsetIn(headImg, sheet);
    const b = { x: s.x + h.x, y: s.y + h.y, w: h.w, h: h.h };
    headImg.style.visibility = "hidden";
    fabImg.style.visibility = "hidden";
    arc(fabImg.src, a, b, 560, 90).finished.then(() => { headImg.style.visibility = ""; });
  }
  function onClose() {
    if (calm) { fabImg.style.visibility = ""; return; }
    const a = rectIn(headImg), b = rectIn(fabImg);
    headImg.style.visibility = "hidden";
    arc(fabImg.src, a, b, 480, 50).finished.then(() => {
      fabImg.style.visibility = "";
      headImg.style.visibility = "";
      fab.animate([{ transform: "scale(.9)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 320, easing: EASE_OUT });
    });
  }

  /* 2. 끌어내려 닫기: 손잡이와 머리 부분 */
  const grab = document.createElement("div");
  grab.className = "dali-grab";
  grab.setAttribute("aria-hidden", "true");
  sheet.prepend(grab);
  let drag = null;
  function dragStart(e) {
    if (e.target.closest(".dali-close, .dali-pebbles") || !sheet.classList.contains("open")) return;
    drag = { y: e.clientY, t: performance.now(), dy: 0, v: 0, id: e.pointerId };
    sheet.setPointerCapture(e.pointerId);
    sheet.style.transition = "none";
  }
  sheet.addEventListener("pointerdown", e => { if (e.target.closest(".dali-grab, .dali-sheet-head")) dragStart(e); });
  sheet.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now(), dy = Math.max(0, (e.clientY - drag.y) / (window.phoneZoom ? window.phoneZoom() : 1));
    drag.v = (dy - drag.dy) / Math.max(1, now - drag.t);
    drag.dy = dy; drag.t = now;
    sheet.style.transform = `translateY(${dy}px)`;
    if (dim) dim.style.opacity = String(Math.max(0, 1 - dy / 400));
  });
  function dragEnd(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { dy, v } = drag;
    drag = null;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (dim) dim.style.opacity = "";
    if (dy > 110 || v > 0.6) window.dali.close();
  }
  sheet.addEventListener("pointerup", dragEnd);
  sheet.addEventListener("pointercancel", dragEnd);

  /* 3. 미끄러지는 탭 표시 + 좌우로 밀어 탭 바꾸기 */
  const pill = document.createElement("span");
  pill.className = "dali-tabpill";
  tabs.prepend(pill);
  const tabBtns = () => [...tabs.querySelectorAll("[data-tab]")];
  const activeTab = () => (tabs.querySelector("[data-tab].on") || {}).dataset?.tab;
  function placePill(animate = true) {
    const on = tabs.querySelector("[data-tab].on");
    if (!on) return;
    if (!animate) pill.style.transition = "none";
    pill.style.width = on.offsetWidth + "px";
    pill.style.height = on.offsetHeight + "px";
    pill.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
    if (!animate) { void pill.offsetWidth; pill.style.transition = ""; }
  }
  let lastTab = activeTab();
  new MutationObserver(() => {
    const now = activeTab();
    if (!now || now === lastTab) return;
    const keys = tabBtns().map(b => b.dataset.tab);
    const dir = Math.sign(keys.indexOf(now) - keys.indexOf(lastTab));
    lastTab = now;
    placePill(true);
    if (!calm) body.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: "none" }], { duration: 280, easing: EASE_OUT });
    if (now === "journal") tick();
  }).observe(tabs, { attributes: true, subtree: true, attributeFilter: ["class"] });
  placePill(false);
  addEventListener("resize", () => placePill(false));

  // 밀기 직후 브라우저가 만드는 클릭만 버린다. 터치는 밀면 클릭이 안 생기므로
  // 깃발 방식이면 다음 정상 터치까지 삼켜 버린다. 그래서 시각으로 제한한다.
  let swipe = null, swallowUntil = 0;
  body.addEventListener("pointerdown", e => {
    if (e.target.closest("textarea, input, .dali-chart")) return;
    swipe = { x: e.clientX, y: e.clientY };
  });
  body.addEventListener("pointerup", e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
    const btns = tabBtns(), i = btns.findIndex(b => b.classList.contains("on"));
    const next = btns[i + (dx < 0 ? 1 : -1)];
    if (!next) return;
    swallowUntil = performance.now() + 350;
    next.click();
  });
  body.addEventListener("click", e => {
    if (performance.now() < swallowUntil) { swallowUntil = 0; e.stopPropagation(); e.preventDefault(); }
  }, true);

  /* 4. 손익 숫자 세기: 이익만 0부터 올라감. 손실은 그대로 조용히 */
  function tick() {
    if (calm) return;
    const targets = body.querySelectorAll(".dali-sum b, .dali-pnl");
    targets.forEach(el => {
      const node = [...el.childNodes].find(n => n.nodeType === 3 && /[+]\$?[\d,]+/.test(n.textContent));
      if (!node) return;
      const m = node.textContent.match(/^(\s*\+\$?)([\d,]+(?:\.\d+)?)(.*)$/s);
      if (!m) return;
      const [, pre, num, post] = m;
      const end = parseFloat(num.replace(/,/g, "")), dec = (num.split(".")[1] || "").length;
      const fmt = v => v.toLocaleString(pre.includes("$") ? "en-US" : "ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      const t0 = performance.now(), ms = 900;
      (function step(now) {
        const p = Math.max(0, Math.min(1, (now - t0) / ms)), k = 1 - Math.pow(1 - p, 3);
        node.textContent = pre + fmt(end * k) + post;
        if (p < 1 && node.isConnected) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* 5. 조약돌이 개수 칸으로 날아감 */
  const counter = sheet.querySelector(".dali-pebbles");
  const count = () => +(counter.textContent.match(/\d+/) || [0])[0];
  let lastCount = count();
  new MutationObserver(() => {
    const n = count();
    const gained = n - lastCount;
    lastCount = n;
    if (gained <= 0 || calm || !sheet.classList.contains("open")) return;
    setTimeout(() => {
      const from = body.querySelector(".dali-float") || body.querySelector(".dali-sea") || body;
      const f = rectIn(from), c = rectIn(counter);
      const a = { x: f.x + f.w / 2 - 14, y: f.y + f.h / 2 - 14, w: 28, h: 28 };
      const b = { x: c.x + 2, y: c.y + c.h / 2 - 9, w: 18, h: 18 };
      for (let i = 0; i < Math.min(gained, 4); i++) {
        setTimeout(() => arc(`${BASE}img/rock.png`, a, b, 700, 70 + i * 14).finished.then(() => {
          counter.animate([{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(1)" }], { duration: 300, easing: EASE_OUT });
        }), i * 110);
      }
    }, 650);
  }).observe(counter, { childList: true, characterData: true, subtree: true });

  /* 6. 꾹 눌러 3초 요약: 시트를 열지 않고 지금 상황만 */
  const app = window.DALI_PAGE_APP || "stock";
  let alerted = false;
  document.addEventListener("click", e => { if (e.target.closest("[data-demo=alert]")) alerted = true; });
  const peek = document.createElement("div");
  peek.className = "dali-peek";
  peek.setAttribute("role", "status");
  phone.appendChild(peek);
  function peekHTML() {
    const syms = Object.keys(DALI_SYMS).filter(s => DALI_SYMS[s].app === app);
    const list = (alerted && DALI_ALERT_NEWS[app] ? [DALI_ALERT_NEWS[app]] : []).concat(DALI_NEWS.filter(n => DALI_SYMS[n.sym]?.app === app));
    const top = list.find(n => DALI_FLAG_TYPES.includes(n.type)) || list[0];
    const chg = top && DALI_SYMS[top.sym].chg;
    const flags = list.filter(n => DALI_FLAG_TYPES.includes(n.type)).length;
    return `
      <p class="dali-peek-top"><b>3초 요약</b><span>${DALI_APPS[app].name}</span></p>
      <p class="dali-peek-line">따라가는 종목 ${syms.length}개, 확인할 소식 ${flags}개</p>
      ${top ? `<button type="button" class="dali-peek-news" data-peek="open"><span><b>${top.sym}</b> <i class="${chg > 0 ? "up" : chg < 0 ? "down" : "flat"}">${chg > 0 ? "+" : ""}${chg.toFixed(1)}%</i></span><small>${top.why}</small></button>` : ""}
      <p class="dali-peek-foot">${counter.textContent || ""}</p>`;
  }
  let holdTimer = null, held = false, hideTimer = null;
  const hidePeek = () => peek.classList.remove("show");
  function showPeek() {
    if (sheet.classList.contains("open")) window.dali.close();
    peek.innerHTML = peekHTML();
    peek.classList.add("show");
    phone.querySelector(".dali-bubble")?.classList.remove("show");
    fab.animate([{ transform: "scale(1)" }, { transform: "scale(.92)" }, { transform: "scale(1)" }], { duration: 260 });
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hidePeek, 3200);
  }
  fab.addEventListener("pointerdown", () => {
    held = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { held = true; showPeek(); }, 450);
  });
  // 발표자용 버튼: 꾹 누르기를 화면 밖에서도 보여 줌
  const demoAlert = document.querySelector(".dali-demo [data-demo=alert]");
  if (demoAlert) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "3초 요약 (달이 꾹 누르기)";
    b.addEventListener("click", showPeek);
    demoAlert.after(b);
  }
  ["pointerup", "pointerleave", "pointercancel"].forEach(t => fab.addEventListener(t, () => clearTimeout(holdTimer)));
  fab.addEventListener("click", e => { if (held) { held = false; e.stopImmediatePropagation(); } }, true);
  fab.addEventListener("contextmenu", e => e.preventDefault());
  peek.addEventListener("click", e => {
    if (e.target.closest("[data-peek=open]")) { hidePeek(); window.dali.open("news"); }
  });
  sheet.addEventListener("transitionstart", () => { if (sheet.classList.contains("open")) hidePeek(); });
})();

/* ---------- 색 비교 페이지(팔레트 실험실)에서 보내는 색을 받아 입힘 ----------
   다른 페이지가 이 앱을 iframe으로 띄우고 postMessage로 { type: "dali-palette", css, scene } 를 보냄.
   평소 화면에는 영향 없음 */
window.addEventListener("message", e => {
  const d = e.data;
  if (!d || d.type !== "dali-palette") return;
  let s = document.getElementById("dali-palette");
  if (!s) { s = document.createElement("style"); s.id = "dali-palette"; document.head.appendChild(s); }
  s.textContent = d.css || "";
  try { localStorage.setItem("dali-intro-seen", "1"); } catch (err) { /* 무시 */ }
  document.querySelector(".dali-intro.show .dali-intro-go")?.click();
  if (d.scene && window.daliPro) window.daliPro.scene(d.scene);
  if (window.dali && !document.querySelector(".dali-sheet.open")) window.dali.open("today");
});
