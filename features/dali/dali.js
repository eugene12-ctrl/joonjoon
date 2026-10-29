/* ===================================================
   달이 화면 동작
   =================================================== */
(() => {
  const $ = (s) => document.querySelector(s);
  const st = {
    ...DALI_START, done: {}, quizOk: false,
    owned: new Set(FRIENDS.filter((f) => f.owned).map((f) => f.id)),
    party: FRIENDS.filter((f) => f.owned).map((f) => f.id).slice(0, PARTY_MAX),
  };
  const friend = (id) => FRIENDS.find((f) => f.id === id);
  const pic = (f) => `<img src="${FRIEND_DIR}${f.img}" alt="">`;
  const stageOf = (lv) => STAGES.filter((s) => s.from <= lv).pop();
  let toastTimer, justJoined = null;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }

  function say(text) {
    const b = $("#bubble");
    b.classList.add("fade");
    setTimeout(() => { b.textContent = text; b.classList.remove("fade"); }, 200);
  }

  function render() {
    $("#pebbles").textContent = st.pebbles;
    $("#name").textContent = st.name;
    $("#lv").textContent = `Lv.${st.level}`;
    $("#streak").textContent = `🔥 ${st.streak}일째 만나는 중`;
    $("#stage").innerHTML = `${STAGES.indexOf(stageOf(st.level)) + 1}단계 · ${stageOf(st.level).name}<span>/ ${STAGES.length}단계</span>`;
    $("#xpbar").style.width = `${(st.xp / st.xpMax) * 100}%`;
    $("#feed").disabled = st.pebbles < 1;
    $("#otter").style.setProperty("--grow", 1 + (st.level - 3) * 0.08);
    $("#brief-done").disabled = !!st.done.brief;
    $("#missions").innerHTML = MISSIONS.map((m) => {
      const d = st.done[m.id];
      return `<li class="${d ? "done" : ""}">
        <span class="chk">${d ? "✓" : ""}</span>
        <span class="m-label">${m.label}</span>
        ${d ? `<span class="rw">+${m.reward}</span>` : `<button class="go" data-m="${m.id}">하기</button>`}
      </li>`;
    }).join("");
    renderParty();
    renderBrief();
  }

  /* 파티 */
  function renderParty() {
    const slots = [`<button class="slot leader" data-dex>
      <span class="face"><img src="${DALI_IMG}" alt=""></span>
      <b>${st.name}</b><small>리더</small></button>`];
    for (let i = 0; i < PARTY_MAX; i++) {
      const f = friend(st.party[i]);
      slots.push(f
        ? `<button class="slot" data-dex><span class="face">${pic(f)}</span><b>${f.name}</b><small>${f.concept}</small></button>`
        : `<button class="slot empty" data-dex><span class="face">＋</span><b>빈 자리</b><small>친구 넣기</small></button>`);
    }
    $("#slots").innerHTML = slots.join("");
    $("#sea-friends").innerHTML = st.party
      .map((id) => `<span class="${id === justJoined ? "new" : ""}">${pic(friend(id))}</span>`).join("");
    justJoined = null;
  }

  function renderBrief() {
    const b = st.party.includes("dolphin") ? BRIEFING_DOLPHIN : BRIEFING;
    $("#brief-tag").textContent = b.tag;
    $("#brief-text").innerHTML = b.text.replace(b.word, `<mark>${b.word}</mark>`);
  }

  function renderDex() {
    const full = st.party.length >= PARTY_MAX;
    $("#party-max").textContent = PARTY_MAX;
    $("#dex-list").innerHTML = FRIENDS.map((f) => {
      const own = st.owned.has(f.id), inParty = st.party.includes(f.id);
      const btn = !own ? "" : inParty
        ? `<button class="tog in" data-f="${f.id}">빼기</button>`
        : `<button class="tog" data-f="${f.id}" ${full ? "disabled" : ""}>${full ? "자리 없음" : "넣기"}</button>`;
      return `<li class="${own ? "" : "locked"}">
        <span class="face">${pic(f)}</span>
        <div class="info"><b>${own ? f.name : "???"}</b><span class="cpt">${f.concept}</span>
          <p>${own ? f.effect : `🔒 ${f.unlock}`}</p></div>
        ${btn}
      </li>`;
    }).join("");
  }

  function toggleParty(id) {
    if (st.party.includes(id)) st.party = st.party.filter((x) => x !== id);
    else if (st.party.length < PARTY_MAX) { st.party.push(id); justJoined = id; }
    render();
    renderDex();
    if (id === "dolphin" && st.party.includes("dolphin")) say("돌고래가 오늘 파도 소식을 물어 왔어! 브리핑을 봐 봐");
  }

  function meet(id) {
    const f = friend(id);
    st.owned.add(id);
    $("#meet-emoji").innerHTML = pic(f);
    $("#meet-title").textContent = `${f.name}를 만났어요!`;
    $("#meet-desc").innerHTML = `'${f.concept}'을 이해한 덕분이에요.<br>파티에 넣으면: ${f.effect}`;
    $("#meet-join").disabled = st.party.length >= PARTY_MAX;
    $("#meet-join").dataset.f = id;
    openSheet("#meet");
  }

  function earn(id) {
    if (st.done[id]) return;
    const m = MISSIONS.find((x) => x.id === id);
    st.done[id] = true;
    st.pebbles += m.reward;
    const pill = $(".pebble-pill");
    pill.classList.remove("bump"); void pill.offsetWidth; pill.classList.add("bump");
    render();
    toast(`조약돌 ${m.reward}개를 받았어요`);
    if (MISSIONS.every((x) => st.done[x.id])) setTimeout(() => say("오늘 미션 다 했다! 내일도 같이 공부하자 🦦"), 900);
  }

  function hearts() {
    const box = $("#hearts");
    for (let i = 0; i < 5; i++) {
      const h = document.createElement("span");
      h.textContent = i % 2 ? "💛" : "🧡";
      h.style.setProperty("--dx", `${(i - 2) * 22}px`);
      h.style.animationDelay = `${i * 70}ms`;
      box.appendChild(h);
      setTimeout(() => h.remove(), 1300);
    }
  }

  function feed() {
    if (st.pebbles < 1) return;
    st.pebbles -= 1;
    st.xp += FEED_XP;
    const o = $("#otter");
    o.classList.remove("happy"); void o.offsetWidth; o.classList.add("happy");
    hearts();
    if (st.xp >= st.xpMax) {
      const before = stageOf(st.level);
      st.xp -= st.xpMax;
      st.level += 1;
      const after = stageOf(st.level);
      if (after !== before) {
        setTimeout(() => toast(`새 단계: ${after.name}!`), 400);
        say("이제 조약돌로 조개를 깰 수 있어! 배운 걸 써먹을 줄 알게 된 거야 🪨");
      } else {
        setTimeout(() => toast(`달이가 Lv.${st.level}로 자랐어요!`), 400);
        say("나 조금 컸지? 조약돌 고마워! 🪨");
      }
    } else {
      say(["냠! 이 조약돌 반짝반짝해", "주머니에 쏙 넣어 둘게!", "고마워, 기분 최고야 🧡"][st.xp % 3]);
    }
    render();
  }

  /* 시트 */
  function openSheet(id) { const s = $(id); s.inert = false; s.classList.add("open"); }
  function closeSheet(s) { s.classList.remove("open"); s.inert = true; }
  document.querySelectorAll(".sheet").forEach((s) => {
    s.addEventListener("click", (e) => { if (e.target === s || e.target.closest("[data-close]")) closeSheet(s); });
  });

  /* 퀴즈 */
  function openQuiz() {
    $("#quiz-q").textContent = QUIZ.q;
    $("#quiz-explain").hidden = true;
    $("#quiz-opts").innerHTML = QUIZ.options.map((o, i) => `<button data-i="${i}">${o}</button>`).join("");
    openSheet("#quiz");
  }
  $("#quiz-opts").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || st.quizOk) return;
    const i = Number(b.dataset.i);
    if (i === QUIZ.answer) {
      st.quizOk = true;
      b.classList.add("right");
      $("#quiz-explain").textContent = QUIZ.explain;
      $("#quiz-explain").hidden = false;
      earn("quiz");
      say("정답! 이제 '변동성' 박사네 🎓");
      setTimeout(() => { closeSheet($("#quiz")); setTimeout(() => meet("dolphin"), 350); }, 2400);
    } else {
      b.classList.add("wrong");
      b.disabled = true;
    }
  });

  /* 대화 */
  function addMsg(text, who, guard) {
    const m = document.createElement("div");
    m.className = `msg ${who}${guard ? " guard" : ""}`;
    m.textContent = text;
    $("#msgs").appendChild(m);
    $("#msgs").scrollTop = $("#msgs").scrollHeight;
  }
  function ask(text) {
    text = text.trim();
    if (!text) return;
    addMsg(text, "me");
    const rule = CHAT_RULES.find((r) => r.keys.some((k) => text.includes(k)));
    setTimeout(() => {
      addMsg(rule ? rule.reply : CHAT_FALLBACK, "dali", rule && rule.guard);
      earn("chat");
    }, 600);
  }
  function openChat() {
    if (!$("#msgs").children.length) addMsg(`${DALI_START.user}님, 궁금한 거 있어요? 달이가 쉽게 알려 줄게요!`, "dali");
    $("#suggest").innerHTML = CHAT_SUGGEST.map((s) => `<button type="button">${s}</button>`).join("");
    openSheet("#chat");
  }
  $("#suggest").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); });
  $("#ask").addEventListener("submit", (e) => { e.preventDefault(); ask($("#ask-in").value); $("#ask-in").value = ""; });

  /* 연결 */
  $("#feed").addEventListener("click", feed);
  $("#brief-done").addEventListener("click", () => { earn("brief"); say("잘 읽었어! '변동성' 퀴즈도 풀어 볼래?"); });
  $("#missions").addEventListener("click", (e) => {
    const b = e.target.closest(".go");
    if (!b) return;
    const id = b.dataset.m;
    if (id === "quiz") openQuiz();
    else if (id === "chat") openChat();
    else if (id === "brief") $(".brief").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#otter").addEventListener("click", () => say("간지러워! 오늘 시장 이야기 들어 볼래? 아래 브리핑을 봐 줘"));
  $("#slots").addEventListener("click", (e) => { if (e.target.closest("[data-dex]")) { renderDex(); openSheet("#dex"); } });
  $("#dex-list").addEventListener("click", (e) => { const b = e.target.closest(".tog"); if (b) toggleParty(b.dataset.f); });
  $("#meet-join").addEventListener("click", (e) => { closeSheet($("#meet")); toggleParty(e.currentTarget.dataset.f); });

  $("#bubble").textContent = `${DALI_START.user}님 왔다! 오늘도 조약돌 모으러 가자 🦦`;
  render();
})();
