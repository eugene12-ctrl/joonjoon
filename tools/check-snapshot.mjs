/* 달이 3.0 완료 기준(지시서 9절)을 헤드리스 크롬으로 자동 확인한다.
   - 발표자 상자 네 장면을 차례로 눌러 첫 화면을 찍는다
   - morning과 intraday 첫 화면이 픽셀 단위로 같은지 (펼치기 전)
   - 첫 화면에 날짜 외 숫자가 없는지
   - DaliRules.word, alive, why, report가 네 장면에서 예외 없이 도는지
   - 20건 전부 buySnap, 판 건 전부 sellSnap이 있는지
   - 첫 화면 글에 권유 글자가 없는지
   쓰는 법: node tools/check-snapshot.mjs [저장소 경로] [결과 폴더]
   크롬은 C:/Program Files/Google/Chrome/Application/chrome.exe 를 쓴다. 종료 코드: 실패가 있으면 1 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const out = path.resolve(process.argv[3] || path.join(root, "tools", "out"));
fs.mkdirSync(out, { recursive: true });
const url = "file:///" + path.join(root, "index.html").replace(/\\/g, "/");
const PORT = 9381;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", `--remote-debugging-port=${PORT}`, "--user-data-dir=" + path.join(out, "prof"), "about:blank"]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40 && !ws; i++) {
  try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = t.find(x => x.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch (e) { /* 아직 안 뜸 */ }
  if (!ws) await sleep(250);
}
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = {}; const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) return { __err: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value; };

const results = [];
const check = (name, ok, note = "") => { results.push({ name, ok, note }); console.log(`${ok ? "통과" : "실패"}  ${name}${note ? "  " + note : ""}`); };

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url }); await sleep(1500);
await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('dali-intro-seen','1'); location.reload()`); await sleep(2000);

// 데이터: 사진이 다 있는지
const snaps = await ev(`(() => { const T = DALI_CUSTOMER.trades; return { n: T.length, buy: T.filter(t => t.buySnap).length, sold: T.filter(t => t.sell).length, sellSnap: T.filter(t => t.sell && t.sellSnap).length }; })()`);
check("매매 20건 전부 buySnap", snaps && snaps.buy === snaps.n && snaps.n === 20, JSON.stringify(snaps));
check("판 건 전부 sellSnap", snaps && snaps.sellSnap === snaps.sold, JSON.stringify(snaps));

// 규칙 함수가 네 장면에서 도는지
const SC = ["morning", "intraday", "close", "month"];
for (const sc of SC) {
  const r = await ev(`(() => { const R = DaliRules, out = {}; const syms = DALI_CUSTOMER.positions.map(p => p.sym);
    out.word = R.word("${sc}"); out.alive = syms.map(s => R.alive(s, "${sc}")); out.why = syms.map(s => R.why(s, "${sc}")); out.report = R.report("10");
    return { word: out.word, aliveN: out.alive.length, whyLines: out.why.map(w => w.length), reportN: Array.isArray(out.report) ? out.report.length : Object.keys(out.report || {}).length }; })()`);
  check(`DaliRules 네 함수 (${sc})`, r && !r.__err, r && r.__err ? r.__err.split("\n")[0] : JSON.stringify(r));
}

// 장면별 첫 화면: 글과 그림
const shots = {};
const texts = {};
const heroRect = async () => JSON.parse(await ev(`JSON.stringify((document.querySelector('.dali-body')||document.body).getBoundingClientRect())`));
for (const sc of SC) {
  await ev(`window.daliPro.scene('${sc}')`); await sleep(300);
  await ev(`window.dali.open("today")`); await sleep(2500);
  const b = await heroRect();
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: b.x, y: b.y, width: b.width, height: b.height, scale: 1 } });
  shots[sc] = Buffer.from(r.result.data, "base64"); fs.writeFileSync(path.join(out, `${sc}.png`), shots[sc]);
  texts[sc] = (await ev(`(document.querySelector('.dali-body')||document.body).innerText`)) || "";
  await ev(`window.dali.close()`); await sleep(300);
}
check("morning과 intraday 첫 화면이 픽셀 단위로 같음", shots.morning.equals(shots.intraday), shots.morning.equals(shots.intraday) ? "" : `${out}\\morning.png 와 intraday.png 비교`);

// 첫 화면에 숫자가 없는지 (날짜는 허용: 9월 22일, 10/08, 22일)
const stripDates = t => t.replace(/\d{1,2}월 \d{1,2}일/g, "").replace(/\d{1,2}\/\d{1,2}/g, "").replace(/\d{1,2}일/g, "").replace(/\d{1,2}:\d{2}/g, "");
for (const sc of ["morning", "intraday", "close"]) {
  const left = stripDates(texts[sc]).match(/\d+/g) || [];
  check(`첫 화면에 날짜 외 숫자 없음 (${sc})`, left.length === 0, left.length ? `남은 숫자: ${left.slice(0, 6).join(", ")}` : "");
}

// 권유 글자
const BAD = [/사(세요|요|라|자)/, /팔(아요|아라|자|아야)/, /오를/, /내릴/, /기다(려|리세요)/, /좋은 (타점|자리|때)/, /타점/];
for (const sc of SC) {
  let t = texts[sc]; for (const a of ["샀을 때", "판 매매", "살 때", "팔 때"]) t = t.split(a).join("□");
  const hit = BAD.find(r => r.test(t));
  check(`첫 화면 글에 권유 글자 없음 (${sc})`, !hit, hit ? hit.source : "");
}

check("콘솔 예외 없음", errs.length === 0, errs.slice(0, 2).map(e => String(e).split("\n")[0]).join(" | "));
fs.writeFileSync(path.join(out, "texts.json"), JSON.stringify(texts, null, 2));
const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length}개 중 실패 ${fails}. 캡처와 글: ${out}`);
chrome.kill();
process.exit(fails ? 1 : 0);
