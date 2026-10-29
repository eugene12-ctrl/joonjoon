/* ---------- 달이 옮기기 ----------
   떠 있는 달이를 끌어서 화면 안 어디든 놓을 수 있음 (가장자리에 붙이지 않음).
   오른쪽으로 밀어 넘기면 화면 밖으로 살짝 숨고, 가장자리의 < 버튼을 누르면 다시 나옴.
   위치는 보는 사람 브라우저에만 저장 (페이지를 옮겨 다녀도 같은 자리). */
(function () {
  const phone = document.querySelector(".phone");
  const fab = phone && phone.querySelector(".dali-fab");
  const bubble = phone && phone.querySelector(".dali-bubble");
  if (!fab) return;

  const KEY = "dali-pos", GAP = 12, TOP = 56, BOTTOM = 84;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* 저장 못 해도 동작은 같음 */ } };

  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "dali-tab";
  tab.setAttribute("aria-label", "달이 다시 꺼내기");
  tab.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="dali-tab-dot" aria-hidden="true"></span>`;
  phone.append(tab);

  // 위치: x, y는 달이 왼쪽 위 모서리, tucked는 숨김 (숨겨도 x, y는 숨기 전 자리를 기억)
  let pos = load();
  const size = () => fab.offsetWidth || 62;
  const W = () => phone.clientWidth, H = () => phone.clientHeight;
  const clampY = y => Math.max(TOP, Math.min(H() - size() - BOTTOM, y));
  const clampX = x => Math.max(6, Math.min(W() - size() - 6, x));
  const restX = () => clampX(pos.x ?? W() - size() - GAP);

  function place(animate) {
    if (!pos) return;
    fab.classList.toggle("dali-moving", !animate);
    const y = clampY(pos.y);
    fab.style.top = y + "px";
    fab.style.bottom = "auto";
    fab.style.right = "auto";
    fab.style.left = (pos.tucked ? W() + 8 : restX()) + "px";
    fab.classList.toggle("dali-tucked", !!pos.tucked);
    phone.classList.toggle("dali-is-tucked", !!pos.tucked);
    tab.style.top = (y + size() / 2 - 26) + "px";
    placeBubble(y);
  }
  // 말풍선은 달이 옆, 화면이 더 넓게 남은 쪽으로
  function placeBubble(y) {
    if (!bubble) return;
    const x = restX(), onLeft = x + size() / 2 < W() / 2;
    bubble.style.bottom = (H() - y - size() + 18) + "px";
    if (onLeft) { bubble.style.left = (x + size() + 8) + "px"; bubble.style.right = "auto"; }
    else { bubble.style.right = (W() - x + 8) + "px"; bubble.style.left = "auto"; }
    bubble.classList.toggle("dali-bubble-left", onLeft);
  }

  // 끌기. 6px 넘게 움직여야 끌기로 보고, 그보다 짧으면 그냥 누른 것(시트 열기)
  let drag = null, justDragged = false;
  fab.addEventListener("pointerdown", e => {
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: fab.offsetLeft, y0: fab.offsetTop, t: performance.now(), moved: false };
  });
  window.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) { drag.moved = true; fab.setPointerCapture?.(e.pointerId); bubble && bubble.classList.remove("show"); }
    fab.classList.add("dali-moving");
    fab.style.right = "auto"; fab.style.bottom = "auto";
    fab.style.left = Math.max(GAP / 2, drag.x0 + dx) + "px";
    fab.style.top = clampY(drag.y0 + dy) + "px";
    drag.dx = dx; drag.x = drag.x0 + dx; drag.y = drag.y0 + dy;
  });
  window.addEventListener("pointerup", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    justDragged = true; setTimeout(() => (justDragged = false), 0);
    const speed = d.dx / Math.max(1, performance.now() - d.t);
    // 오른쪽 끝을 넘기거나 오른쪽으로 빠르게 밀면 숨김
    const tuck = d.x + size() > W() - 4 || (d.dx > 60 && speed > 0.6);
    // 숨길 때는 끌기 전 자리를 기억해 두고, 꺼내면 거기로 돌아옴. 아니면 놓은 자리 그대로
    pos = tuck ? { x: clampX(d.x0), y: clampY(d.y0), tucked: true } : { x: clampX(d.x), y: clampY(d.y), tucked: false };
    save(pos);
    requestAnimationFrame(() => place(true));
  });
  // 끌고 난 직후의 click은 시트를 열지 않게 막음 (dali.js의 click보다 먼저 받음)
  fab.addEventListener("click", e => { if (justDragged) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  tab.addEventListener("click", () => {
    pos = { ...(pos || { y: fab.offsetTop }), tucked: false };
    save(pos);
    place(true);
  });

  // 느낌표가 생기면 숨어 있을 때도 < 버튼에 빨간 점
  new MutationObserver(() => tab.classList.toggle("has-alert", fab.classList.contains("has-alert")))
    .observe(fab, { attributes: true, attributeFilter: ["class"] });
  tab.classList.toggle("has-alert", fab.classList.contains("has-alert"));

  window.addEventListener("resize", () => place(false));
  if (pos) place(false);
})();
