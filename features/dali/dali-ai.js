/* ---------- 달이가 그 자리에서 쓰는 글 (연출) ----------
   숫자는 DaliRules 같은 규칙이 뽑고, 달이는 문장만 쓴다. 시연에선 실제 AI 대신 미리 쓴 문장을
   "읽는 중 → 비교 중 → 쓰는 중" 단계와 함께 한 글자씩 보여 준다. 문장 아래엔 근거를 붙인다.
   쓰는 법: DaliAI.write(el, { key, steps, text, basis })
     key: 같은 글을 다시 그릴 때 연출을 반복하지 않게 하는 이름
     steps: 읽고 비교한 것 (짧게 2~3개)
     text: 달이가 쓸 문장
     basis: 근거 한 줄 */
(function () {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const written = new Set();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function shell(o) {
    return `
      <p class="dali-ai-head"><span class="dali-ai-dot"></span><b>달이가 지금 쓴 글</b></p>
      <ol class="dali-ai-steps">${(o.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      <p class="dali-ai-text"></p>
      ${o.after ? `<div class="dali-ai-after">${o.after}</div>` : ""}
      ${o.basis ? `<p class="dali-ai-basis">${esc(o.basis)}</p>` : ""}`;
  }

  // 달이 2.0 "그동안 달라진 것"이 부르는 형태: { facts: DaliRules.diff(sc), fallback: 원래 HTML }
  // 숫자(facts)로 첫 문장을 쓰고, 다 쓰면 원래 목록(fallback)을 펼친다
  function fromFacts(o) {
    const f = o.facts || {}, n = (f.lines || []).length, todo = f.todo || [];
    // 할 일 문장 자체를 달이가 쓴다. 제목("지금 할 일 없어요")과 겹치는 말은 넣지 않는다
    const text = todo.length ? todo.map(x => x.t).join(" ") : f.noTodo || `그 사이 달라진 게 ${n}가지 있고, 지금 손댈 건 없어요.`;
    const month = (f.lines || []).some(l => l.k === "month"); // 월말 장면은 읽은 것이 다름
    return {
      key: o.key || `facts-${f.since}-${f.hours}-${n}`,
      steps: month ? ["석 달 매매 20건과 이번 달 비용 읽는 중", "달라진 습관 찾는 중"] : [`${f.since || "마지막 접속"} 이후 내 종목과 주문 읽는 중`, "지금 할 일 있는지 보는 중"],
      text,
      basis: month ? "석 달 매매 20건과 이번 달 비용을 보고 썼어요." : `${f.since || "마지막 접속"} 이후 시세와 걸어 둔 주문, 다가오는 일정을 보고 썼어요.`,
    };
  }

  function write(el, o) {
    if (!el) return Promise.resolve();
    if (o.facts) o = fromFacts(o);
    el.classList.add("dali-ai");
    el.innerHTML = shell(o);
    const textEl = el.querySelector(".dali-ai-text");
    const steps = [...el.querySelectorAll(".dali-ai-steps li")];
    if (calm || written.has(o.key)) {
      steps.forEach(li => li.classList.add("done"));
      textEl.textContent = o.text;
      el.classList.add("done");
      return Promise.resolve();
    }
    written.add(o.key);
    return new Promise(resolve => {
      let i = 0;
      // 단계마다 0.45초: 읽는 중 표시가 체크로 바뀜
      (function nextStep() {
        if (!el.isConnected) return resolve();
        if (i > 0) steps[i - 1].classList.replace("now", "done");
        if (i < steps.length) { steps[i].classList.add("now"); i++; setTimeout(nextStep, 250); return; }
        // 한 글자씩. 문장부호에서 조금 쉬어 사람이 쓰는 속도처럼
        const chars = [...o.text];
        let n = 0;
        textEl.classList.add("typing");
        (function type() {
          if (!el.isConnected) return resolve();
          textEl.textContent = chars.slice(0, ++n).join("");
          // 발표에서 기다리지 않게 전체 2초 안에 끝냄 (단계 0.5초 + 글 60자 1.2초)
          if (n < chars.length) setTimeout(type, /[.,?!]/.test(chars[n - 1]) ? 70 : 14);
          else { textEl.classList.remove("typing"); el.classList.add("done"); resolve(); }
        })();
      })();
    });
  }

  // 다시 보여 주기 (발표자가 같은 장면을 한 번 더 보여 줄 때)
  function reset(key) { key ? written.delete(key) : written.clear(); }

  window.DaliAI = { write, reset };
})();
