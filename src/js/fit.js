/* ---------- 휴대폰 화면을 창 높이에 맞춤 (모든 페이지 공용) ----------
   브라우저 확대 배율이 몇이든 휴대폰이 창 높이에 꽉 차서, 발표장에서 누가 열어도 같은 크기로 보인다.
   휴대폰(.phone)만 CSS zoom으로 키우고 발표자 상자는 그대로 둔다. 폭 480px 이하(실제 폰)에서는 하지 않는다.
   휴대폰 안에서 마우스 좌표(clientX/Y)와 요소 위치(style left/top)를 섞는 코드는 window.phoneZoom()으로 나눠 쓴다.
   각 페이지 <head>의 다른 스크립트보다 먼저 불러온다. */
(function () {
  const BASE_W = 375, BASE_H = 780, GAP = 40;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 맞추기 전에는 휴대폰을 숨겨서 원래 크기로 한 번 그려졌다가 툭 바뀌는 게 안 보이게
  const css = document.createElement("style");
  css.textContent = "html:not(.fit-ready) .phone{opacity:0}";
  document.head.appendChild(css);
  // 페이지가 바뀔 때는 스르륵 없이 바로 바뀜 (실제 앱처럼 딱딱 움직이게. 특히 주문 화면으로 갈 때)
  function enter() { document.documentElement.classList.add("fit-ready"); }
  // 다른 페이지로 갈 때. dir(forward, back)은 부르는 쪽 호환용이고 지금은 쓰지 않음
  window.goPage = (url, dir = "forward") => { location.href = url; };
  window.phoneZoom = () => {
    const p = document.querySelector(".phone");
    return (p && parseFloat(p.style.zoom)) || 1;
  };
  function fit() {
    const p = document.querySelector(".phone");
    if (!p) return;
    if (innerWidth <= 480) { p.style.zoom = ""; p.style.height = ""; if (!document.documentElement.classList.contains("fit-ready")) enter(p); return; }
    p.style.height = BASE_H + "px";
    p.style.minHeight = "0";
    const z = Math.min((innerHeight - GAP) / BASE_H, (innerWidth - 40) / BASE_W);
    p.style.zoom = String(Math.max(0.5, Math.round(z * 1000) / 1000));
    if (!document.documentElement.classList.contains("fit-ready")) enter(p);
  }
  // 스크립트가 어딘가에서 멈춰도 휴대폰이 숨은 채로 남지 않게
  setTimeout(() => document.documentElement.classList.add("fit-ready"), 1500);
  addEventListener("resize", fit);
  // 휴대폰은 페이지 스크립트가 만들 수도 있어서 DOM이 준비된 뒤와 다 불러온 뒤 두 번 맞춤
  document.addEventListener("DOMContentLoaded", fit);
  addEventListener("load", fit);
})();
