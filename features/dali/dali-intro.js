/* ---------- 앱을 처음 켰을 때 달이 첫 화면 (dali.js 위에 얹음) ----------
   보자마자 "이게 뭔지, 왜 있는지"가 보이게: 고객 자신의 데이터로 달이가 지금 찾은 것 세 가지를 먼저 보여 준다.
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

  // 고객 데이터에서 바로 뽑은 세 줄. 데이터가 없으면 일반 문장으로
  function finds() {
    const C = typeof DALI_CUSTOMER !== "undefined" ? DALI_CUSTOMER : null, R = typeof DaliRules !== "undefined" ? DaliRules : null;
    const won = n => n.toLocaleString("ko-KR");
    const order = C && C.pending
      ? `어제 걸어 둔 ${C.pending.sym} ${C.pending.qty}주 ${won(C.pending.price)}원 매수, 아직 안 됐어요`
      : "걸어 둔 주문이 체결됐는지 먼저 알려 드려요";
    let habit = "급하게 판 날의 결과를 내 기록으로 보여 드려요";
    try { const q = R.habits().quick; if (q.n) habit = `손실 난 날 바로 판 ${q.n}번 중 ${q.up}번은 2주 뒤 더 올랐어요`; } catch (e) { /* 일반 문장 */ }
    return [
      { tag: "잊고 있던 것", text: order },
      { tag: "내 기록", text: habit },
      { tag: "체결된 뒤", text: "그날 뉴스와 분위기까지 매매일지에 제가 적어 둬요" },
    ];
  }

  const pop = document.createElement("div");
  pop.className = "dali-intro";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "달이 소개");
  phone.appendChild(pop);

  function paint() {
    const name = (typeof DALI_CUSTOMER !== "undefined" && DALI_CUSTOMER.name) || "고객";
    pop.innerHTML = `
      <div class="dali-intro-card">
        <div class="dali-intro-hero">
        <div class="dali-intro-top"><img src="${BASE}dali-face.png" alt=""><span>유진 달이</span></div>
        <p class="dali-intro-eyebrow">지금까지 앱은 사는 데까지만 도와줬어요</p>
        <h2>사고 난 다음은<br>달이가 볼게요</h2>
        <p class="dali-intro-sub">앱을 닫아도 ${name}님 주문과 종목을 지켜보다가, 할 일이 생기면 먼저 알려 드려요.</p>
        </div>
        <p class="dali-intro-label">지금 달이가 찾은 것</p>
        <ol class="dali-intro-finds">
          ${finds().map((f, i) => `<li style="--i:${i}"><span><small>${f.tag}</small><b>${f.text}</b></span></li>`).join("")}
        </ol>
        <button type="button" class="dali-intro-go">지금 확인하기</button>
        <p class="dali-intro-foot">묻지 않아도 돼요. 평소엔 오른쪽 아래에 있어요</p>
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
    const c = card.getBoundingClientRect(), f = fab.getBoundingClientRect();
    card.style.setProperty("--tx", `${f.left + f.width / 2 - (c.left + c.width / 2)}px`);
    card.style.setProperty("--ty", `${f.top + f.height / 2 - (c.top + c.height / 2)}px`);
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
