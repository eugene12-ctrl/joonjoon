// tools/og.html을 1200×630 PNG로 찍어 og.png를 만든다.
// 쓰는 법 (Node 22+, Chrome 설치 필요):
//   1) chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<빈 폴더> about:blank
//   2) node tools/og-render.mjs [출력 경로=og.png] [배율=1]
// 글꼴(Noto Sans KR)은 구글 폰트에서 받으므로 인터넷이 필요하다. 없으면 시스템 한글 글꼴로 찍힌다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || path.join(here, "..", "og.png"));
const scale = +(process.argv[3] || 1);
const PORT = 9333;
const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = list.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false }); // 배율은 캡처(clip.scale)에서만 곱한다
await send("Page.navigate", { url: "file:///" + path.join(here, "og.html").replace(/\\/g, "/") });
await sleep(1200);
await evaluate("Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))]).then(() => 1)");
await sleep(400);
console.log("fonts:", await evaluate("[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).join(', ') || 'none loaded (system font)'"));
const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1200, height: 630, scale } });
fs.writeFileSync(out, Buffer.from(r.result.data, "base64"));
console.log("saved", out, fs.statSync(out).size, "bytes");
ws.close();
