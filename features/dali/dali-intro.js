/* ---------- 앱을 처음 켰을 때 달이 인사 팝업 (dali.js 위에 얹음) ----------
   한 번 보면 다시 안 뜬다. 발표자 버튼 "처음으로"나 "첫 인사 다시 보기"로 다시 볼 수 있다.
   닫으면 카드가 오른쪽 아래 달이 자리로 쏙 들어간다.
   되돌리려면 각 페이지에서 이 파일과 dali-intro.css를 불러오는 줄을 지우면 된다. */
(function () {
  const phone = document.querySelector(".phone");
  const fab = phone && phone.querySelector(".dali-fab");
  if (!fab || !window.dali) return;

  const KEY = "dali-intro-seen";
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const seen = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
  const mark = v => { try { v ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } };

  const pop = document.createElement("div");
  pop.className = "dali-intro";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "달이 인사");
  pop.innerHTML = `
    <div class="dali-intro-card">
      <div class="dali-intro-sea">
        <div class="dali-intro-otter">
          <img class="dali-intro-body" src="${BASE}dali-body.png" alt="달이">
        </div>
        <div class="dali-intro-water"></div>
      </div>
      <h2>안녕하세요, 저는 달이예요</h2>
      <p class="dali-intro-sub">앱을 닫은 사이에도 홍길동님 종목을 봐 둘게요</p>
      <ul>
        <li><span>다시 열면 달라진 것부터 말씀드려요</span></li>
        <li><span>지금 할 일이 있는지 먼저 답해요</span></li>
        <li><span>매매일지는 제가 알아서 적어요</span></li>
      </ul>
      <button type="button" class="dali-intro-go">시작하기</button>
      <p class="dali-intro-foot">평소엔 오른쪽 아래에 있어요</p>
    </div>`;
  phone.appendChild(pop);
  const card = pop.querySelector(".dali-intro-card");

  function show() {
    pop.classList.remove("leave");
    pop.classList.add("show");
  }
  // 카드가 달이 버튼 자리로 줄어들며 들어감
  function hide() {
    mark(true);
    const c = card.getBoundingClientRect(), f = fab.getBoundingClientRect();
    card.style.setProperty("--tx", `${f.left + f.width / 2 - (c.left + c.width / 2)}px`);
    card.style.setProperty("--ty", `${f.top + f.height / 2 - (c.top + c.height / 2)}px`);
    pop.classList.add("leave");
    setTimeout(() => {
      pop.classList.remove("show", "leave");
      fab.classList.add("pulse");
      setTimeout(() => fab.classList.remove("pulse"), 1200);
    }, 520);
  }

  pop.querySelector(".dali-intro-go").addEventListener("click", hide);
  pop.addEventListener("click", e => { if (e.target === pop) hide(); });

  // 발표자 버튼: 처음으로 누르면 인사도 다시, 따로 다시 보기 버튼도
  const demo = document.querySelector(".dali-demo");
  if (demo) {
    demo.querySelector('[data-demo="reset"]')?.addEventListener("click", () => mark(false), true);
    const again = document.createElement("button");
    again.type = "button";
    again.className = "ghost";
    again.textContent = "첫 인사 다시 보기";
    again.addEventListener("click", show);
    demo.querySelector('[data-demo="reset"]')?.before(again);
  }

  if (!seen()) setTimeout(show, 300);
})();
