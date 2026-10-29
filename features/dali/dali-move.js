/* ---------- 달이 옮기기 ----------
   떠 있는 달이를 끌어서 화면 안 어디든 놓을 수 있음 (가장자리에 붙이지 않음).
   오른쪽으로 밀어 넘기면 화면 밖으로 살짝 숨고, 가장자리의 < 버튼을 누르면 오른쪽 벽에 붙어 다시 나옴 (높이는 숨기 전 그대로).
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

  // 위치: x, y는 달이 왼쪽 위 모서리, tucked는 숨김 (숨긴 동안 x, y는 꺼낼 때 나올 자리 = 오른쪽 벽, 숨기 전 높이)
  let pos = load();
  const size = () => fab.offsetWidth || 62;
  const W = () => phone.clientWidth, H = () => phone.clientHeight;
  const clampY = y => Math.max(TOP, Math.min(H() - size() - BOTTOM, y));
  const clampX = x => Math.max(6, Math.min(W() - size() - 6, x));
  const restX = () => clampX(pos.x ?? W() - size() - GAP);
  const wallX = () => clampX(W()); // 꺼낼 때 붙는 오른쪽 벽 자리 (clampX의 오른쪽 끝)

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
    // 스르륵 옮기는 동안은 offsetLeft가 아직 옛 자리라, 전환이 끝난 뒤 한 번 더 붙임
    placeBubble();
    if (animate) setTimeout(placeBubble, 320);
  }
  // 말풍선은 달이 옆, 화면이 더 넓게 남은 쪽으로.
  // 자리는 저장된 값이 아니라 지금 그려진 달이 자리(offsetLeft, offsetTop)에서 읽는다.
  // 그래야 달이를 옮기기 전(기본 자리)이든, 다른 코드가 달이를 옮겼든 말풍선이 늘 달이 옆에 붙는다
  function placeBubble() {
    if (!bubble || (pos && pos.tucked)) return;
    const x = fab.offsetLeft, y = fab.offsetTop, onLeft = x + size() / 2 < W() / 2;
    bubble.style.bottom = (H() - y - size() + 18) + "px";
    if (onLeft) { bubble.style.left = (x + size() + 8) + "px"; bubble.style.right = "auto"; }
    else { bubble.style.right = (W() - x + 8) + "px"; bubble.style.left = "auto"; }
    bubble.classList.toggle("dali-bubble-left", onLeft);
  }
  // 말풍선이 뜰 때마다(인사, 체결 알림) 그 순간의 달이 자리에 다시 붙임
  if (bubble) new MutationObserver(() => { if (bubble.classList.contains("show")) placeBubble(); })
    .observe(bubble, { attributes: true, attributeFilter: ["class"] });

  // 끌기. 6px 넘게 움직여야 끌기로 보고, 그보다 짧으면 그냥 누른 것(시트 열기)
  let drag = null, justDragged = false;
  fab.addEventListener("pointerdown", e => {
    // x0, y0는 끌기 전 자리. 놓인 자리를 알고 있으면 그 값을 쓰고(애니메이션 중 offsetLeft 오차 방지), 없으면 지금 그려진 자리
    const settled = pos && !pos.tucked;
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: settled ? clampX(pos.x) : fab.offsetLeft, y0: settled ? clampY(pos.y) : fab.offsetTop, t: performance.now(), moved: false, trail: [] };
  });
  window.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    // 휴대폰이 확대돼 있으면(src/js/fit.js) 화면 좌표 차이를 휴대폰 안 좌표로 나눔
    const z = (window.phoneZoom ? window.phoneZoom() : 1), dx = (e.clientX - drag.sx) / z, dy = (e.clientY - drag.sy) / z;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) { drag.moved = true; fab.setPointerCapture?.(e.pointerId); bubble && bubble.classList.remove("show"); }
    fab.classList.add("dali-moving");
    fab.style.right = "auto"; fab.style.bottom = "auto";
    fab.style.left = Math.max(GAP / 2, drag.x0 + dx) + "px";
    fab.style.top = clampY(drag.y0 + dy) + "px";
    drag.dx = dx; drag.x = drag.x0 + dx; drag.y = drag.y0 + dy;
    // 최근 120ms 움직임만 남겨 둠 (던지는 속도는 전체 평균이 아니라 놓기 직전 속도로 봄)
    const now = performance.now();
    drag.trail.push({ t: now, x: dx });
    while (drag.trail.length > 1 && now - drag.trail[0].t > 120) drag.trail.shift();
  });
  window.addEventListener("pointerup", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    justDragged = true; setTimeout(() => (justDragged = false), 0);
    // 놓기 직전 속도 (px/ms). 잡고 잠깐 멈췄다가 던져도 던진 것으로 봄
    const first = d.trail[0], last = d.trail[d.trail.length - 1];
    const speed = first && last !== first ? (last.x - first.x) / Math.max(1, last.t - first.t) : 0;
    // 오른쪽 끝을 넘기거나 오른쪽으로 빠르게 밀면 숨김
    const tuck = d.x + size() > W() - 4 || (d.dx > 60 && speed > 0.6);
    // 숨기면 꺼낼 때 오른쪽 벽에 붙어 나옴 (높이는 끌기 전 그대로). 아니면 놓은 자리 그대로
    pos = tuck ? { x: wallX(), y: clampY(d.y0), tucked: true } : { x: clampX(d.x), y: clampY(d.y), tucked: false };
    save(pos);
    requestAnimationFrame(() => place(true));
  });
  // 끌고 난 직후의 click은 시트를 열지 않게 막음 (dali.js의 click보다 먼저 받음)
  fab.addEventListener("click", e => { if (justDragged) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // 꺼내면 오른쪽 벽, 높이는 숨기기 전 그대로. (예전에 저장된 자리가 있어도 오른쪽 벽으로)
  tab.addEventListener("click", () => {
    pos = { ...(pos || { y: fab.offsetTop }), x: wallX(), tucked: false };
    save(pos);
    place(true);
  });

  // 느낌표가 생기면 숨어 있을 때도 < 버튼에 빨간 점
  new MutationObserver(() => tab.classList.toggle("has-alert", fab.classList.contains("has-alert")))
    .observe(fab, { attributes: true, attributeFilter: ["class"] });
  tab.classList.toggle("has-alert", fab.classList.contains("has-alert"));

  window.addEventListener("resize", () => (pos ? place(false) : placeBubble()));
  if (pos) place(false); else placeBubble();
})();
