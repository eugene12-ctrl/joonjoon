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
  const IMG = n => `${BASE}img/${n}.png`;
  const seen = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
  const mark = v => { try { v ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } };

  const pop = document.createElement("div");
  pop.className = "dali-intro";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "달이 인사");
  pop.innerHTML = `
    <div class="dali-intro-card">
      <div class="dali-intro-sea">
        <img class="dali-intro-spark s1" src="${IMG("sparkles")}" alt="">
        <img class="dali-intro-spark s2" src="${IMG("sparkles")}" alt="">
        <div class="dali-intro-otter">
          <img class="dali-intro-body" src="${BASE}dali-body.png" alt="달이">
          <img class="dali-intro-ribbon" src="${IMG("ribbon")}" alt="">
          <img class="dali-intro-hand" src="${IMG("waving_hand")}" alt="">
        </div>
        <img class="dali-intro-heart" src="${IMG("red_heart")}" alt="">
        <div class="dali-intro-water"></div>
      </div>
      <h2>안녕하세요, 저는 달이예요!</h2>
      <p class="dali-intro-sub">홍길동님 옆에서 조용히 도와줄게요</p>
      <ul>
        <li><img src="${IMG("newspaper")}" alt=""><span>아침마다 내 종목 소식을 한 줄로</span></li>
        <li><img src="${IMG("memo")}" alt=""><span>매매일지는 제가 알아서 적어요</span></li>
        <li><img src="${IMG("tree")}" alt=""><span>같이 읽고 걸으면 제가 자라요</span></li>
      </ul>
      <button type="button" class="dali-intro-go">달이랑 시작하기</button>
      <p class="dali-intro-foot">평소엔 오른쪽 아래에 조용히 있을게요</p>
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
