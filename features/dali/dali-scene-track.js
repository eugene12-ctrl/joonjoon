/* ---------- 장면 트랙: 오늘 탭 맨 위 히어로를 장면 네 장으로 옆으로 넘김 ----------
   dali-pro.js(증권)와 dali-pro-fut.js(선물)가 히어로를 그릴 때 html()로 틀을 만들고, 그린 뒤 mount()를 부른다.
   - 발표자 상자의 장면 버튼을 누르면 직전 장면 자리에서 그 장으로 미끄러진다.
   - 손가락이나 마우스로 넘겨 멈추면 멈춘 장의 장면으로 바뀐다(onChange). 아래 목록 숫자도 그 장면으로 다시 그려진다.
   - 점은 뉴스 띠(dali-n2-dots)와 같은 모양. 점을 누르면 그 장으로.
   dali-news2.js 다음, dali-event.js 앞에 불러온다. 되돌리려면 두 pro 파일에서 sceneTrack() 대신 actHTML(action(), pro.sc)을 쓰면 된다. */
window.DaliSceneTrack = (function () {
  // 트랙 틀: 장 HTML 배열과 지금 장면 번호
  const html = (slides, idx) => `<div class="dali-sc"><div class="dali-sc-track">${slides.join("")}</div>
    <div class="dali-n2-dots dali-sc-dots">${slides.map((_, i) => `<i class="${i === idx ? "on" : ""}" aria-hidden="true"></i>`).join("")}</div></div>`;

  // root 안의 트랙을 움직이게 함. cur: 지금 장면, prev: 직전 장면(있으면 거기서 미끄러짐), onChange(k): 넘겨서 장면이 바뀜
  function mount(root, scenes, cur, prev, onChange) {
    const track = root.querySelector(".dali-sc-track");
    if (!track) return;
    const dots = [...root.querySelectorAll(".dali-sc-dots i")], n = scenes.length;
    const indexOf = k => Math.max(0, scenes.findIndex(([s]) => s === k));
    const idx = indexOf(cur);
    const w = () => track.clientWidth || 1;
    const at = () => Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / w())));
    const paintDots = i => dots.forEach((d, k) => d.classList.toggle("on", k === i));
    const go = (i, smooth = true) => track.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * w(), behavior: smooth ? "smooth" : "auto" });

    const from = prev == null ? idx : indexOf(prev);
    track.scrollLeft = from * w();
    paintDots(idx);
    if (from !== idx) requestAnimationFrame(() => go(idx));

    // 넘기다 멈추면 그 장의 장면으로. 스크롤이 150ms 잠잠하면 멈춘 것으로 봄
    let settle = null;
    track.addEventListener("scroll", () => {
      paintDots(at());
      clearTimeout(settle);
      settle = setTimeout(() => { const i = at(); if (scenes[i] && scenes[i][0] !== cur) onChange(scenes[i][0]); }, 150);
    }, { passive: true });
    dots.forEach((d, k) => d.addEventListener("click", () => go(k)));

    // 마우스로 끌기 (dali-news2와 같은 방식). 끌다 놓은 게 버튼 위면 누른 걸로 치지 않음
    let drag = null;
    track.addEventListener("pointerdown", e => { track._x0 = e.clientX; if (e.pointerType === "touch") return; drag = { x: e.clientX, left: track.scrollLeft }; });
    track.addEventListener("pointermove", e => { if (!drag) return; track.scrollLeft = drag.left - (e.clientX - drag.x); });
    const end = e => {
      if (!drag) return;
      const dx = e.clientX - drag.x; drag = null;
      if (Math.abs(dx) > w() / 5) go(dx < 0 ? Math.floor(track.scrollLeft / w()) + 1 : Math.ceil(track.scrollLeft / w()) - 1);
      else go(at());
    };
    ["pointerup", "pointercancel", "pointerleave"].forEach(t => track.addEventListener(t, end));
    track.addEventListener("pointerup", e => { if (Math.abs(e.clientX - (track._x0 ?? e.clientX)) > 4) track.dataset.dragged = "1"; }, true);
    track.addEventListener("click", e => { if (e.target.closest("button") && track.dataset.dragged) { e.stopPropagation(); e.preventDefault(); } delete track.dataset.dragged; }, true);
  }
  return { html, mount };
})();
