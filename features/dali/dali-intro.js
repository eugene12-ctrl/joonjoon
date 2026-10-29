/* ---------- 앱을 처음 켰을 때 달이 첫 화면 (dali.js 위에 얹음) ----------
   보자마자 알게: 약속 한 줄과, 이 고객에게 지금 실제로 있는 일 한 줄. 그 외 설명은 없다.
   버튼을 누르면 바로 달이 오늘 탭이 열린다. 한 번 보면 다시 안 뜬다.
   발표자 버튼 "처음으로"나 "첫 인사 다시 보기"로 다시 볼 수 있다.
   되돌리려면 각 페이지에서 이 파일과 dali-intro.css를 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const fab = phone && phone.querySelector(".dali-fab");
  if (!fab || !window.dali) return;

  const KEY = "dali-intro-seen";
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const seen = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
  const mark = v => { try { v ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } };

  // 고객 데이터에서 뽑은 한 줄. 지금 이 고객에게 실제로 있는 일
  function find() {
    const C = typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null;
    return C && C.pending
      ? `어제 걸어 둔 ${C.pending.sym} ${C.pending.qty}주, 아직 안 됐어요`
      : "걸어 둔 주문이 있으면 먼저 알려 드려요";
  }

  const pop = document.createElement("div");
  pop.className = "dali-intro";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "달이 소개");
  phone.appendChild(pop);

  function paint() {
    pop.innerHTML = `
      <div class="dali-intro-card">
        <img class="dali-intro-otter" src="${BASE}dali-body.png" alt="달이">
        <h2>사고 난 다음은<br>달이가 볼게요</h2>
        <p class="dali-intro-find">${find()}</p>
        <button type="button" class="dali-intro-go">확인하기</button>
      </div>`;
    pop.querySelector(".dali-intro-go").addEventListener("click", () => hide(true));
  }

  function show() {
    paint();
    pop.classList.remove("leave");
    pop.classList.add("show");
  }
  // 닫으면 카드가 달이 버튼 자리로 줄어들며 들어가고, 버튼으로 닫았으면 오늘 탭을 연다
  function hide(openToday) {
    mark(true);
    const card = pop.querySelector(".dali-intro-card");
    const c = card.getBoundingClientRect(), f = fab.getBoundingClientRect(), z = (window.phoneZoom ? window.phoneZoom() : 1); // 확대된 휴대폰이면 안쪽 좌표로
    card.style.setProperty("--tx", `${(f.left + f.width / 2 - (c.left + c.width / 2)) / z}px`);
    card.style.setProperty("--ty", `${(f.top + f.height / 2 - (c.top + c.height / 2)) / z}px`);
    pop.classList.add("leave");
    setTimeout(() => {
      pop.classList.remove("show", "leave");
      if (openToday) window.dali.open();
      else { fab.classList.add("pulse"); setTimeout(() => fab.classList.remove("pulse"), 1200); }
    }, 480);
  }
  pop.addEventListener("click", e => { if (e.target === pop) hide(false); });

  // 발표자 버튼: 처음으로 누르면 첫 화면도 다시, 따로 다시 보기 버튼도
  const demo = document.querySelector(".dali-demo");
  if (demo) {
    demo.querySelector('[data-demo="reset"]')?.addEventListener("click", () => mark(false), true);
    const again = document.createElement("button");
    again.type = "button";
    again.className = "ghost";
    again.textContent = "첫 화면 다시 보기";
    again.addEventListener("click", show);
    demo.querySelector('[data-demo="reset"]')?.before(again);
  }

  if (!seen()) setTimeout(show, 300);
})();
