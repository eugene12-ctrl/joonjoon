/* ---------- 달이 3.0 산 순간 사진 그리기 (규칙은 dali-rules.js, 여기선 그리기만) ----------
   오늘 탭(dali-pro.js)의 월말 리포트와 매매일지(dali.js)가 같은 모양을 쓰도록 한 곳에 둔다.
   사진 두 칸: 다섯 축을 단어로 보여 주고, 두 칸에서 다른 축만 진하게. 해석은 쓰지 않는다.
   dali-rules.js 다음, dali.js 앞에 불러온다. */
(function () {
  if (typeof DaliRules === "undefined") return;
  const R = DaliRules;
  const BASE = document.currentScript.src.replace(/[^/]*$/, "");
  const logo = sym => {
    const s = DALI_SYMS[sym];
    return `<i class="dali-snap-logo">${sym[0]}${s && s.code ? `<img src="${BASE}img/logo-${s.code}.png" alt="" onerror="this.remove()">` : ""}</i>`;
  };
  const man = n => `${n < 0 ? "-" : n > 0 ? "+" : ""}${Math.round(Math.abs(n) / 10000).toLocaleString("ko-KR")}만 원`;
  const tone = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const pct = n => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
  const day = at => { const [m, d] = at.slice(0, 5).split("/").map(Number); return `${m}월 ${d}일`; };

  function col(title, snap, diff) {
    return `<div class="dali-snap-col"><p>${title}<small>${day(snap.at)}</small></p>
      <ul>${R.axes(snap).map(a => `<li class="${diff.includes(a.k) ? "diff" : ""}"><span>${a.label}</span><b>${a.word}</b></li>`).join("")}</ul></div>`;
  }
  // 두 칸. b가 없으면(보유 중) 지금 사진과 비교
  function cells(a, b, diff, lb) {
    return `<div class="dali-snap-cells">${col("살 때", a, diff)}${col(lb || "팔 때", b, diff)}</div>`;
  }
  const laterLine = l => `<p class="dali-snap-later">${l == null ? "판 뒤 2주는 아직 안 지났어요" : `판 뒤 2주 <b class="${tone(l)}">${pct(l)}</b>`}</p>`;

  // 10월 리포트: 매매 목록 하나. 줄을 누르면 두 칸 사진과 판 뒤 2주 한 줄
  // o.act, o.id(t): 누르기 동작 이름과 그 줄의 id (오늘 탭과 매매일지가 서로 다르게 씀), o.open: 펼친 id
  function report(o) {
    const rep = R.report(o.month || "10");
    return `<ul class="dali-snap-rep">${rep.list.map(t => {
      const id = o.id(t), open = o.open === id;
      return `<li class="${open ? "open" : ""}">
        <button type="button" class="dali-snap-line" data-act="${o.act}" data-id="${id}" aria-expanded="${open}">
          <span class="dt">${t.sell}</span>${logo(t.sym)}<span class="nm">${t.sym}</span><b class="${tone(t.pnl)}">${man(t.pnl)}</b>
        </button>
        ${open ? `<div class="dali-snap-more">${cells(t.buySnap, t.sellSnap, t.diff)}${laterLine(t.later)}</div>` : ""}
      </li>`;
    }).join("")}</ul>`;
  }

  window.DaliSnap = { cells, report, laterLine, logo, man };
})();
