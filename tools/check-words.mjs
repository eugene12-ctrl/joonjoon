/* 달이 3.0 완료 기준: 권유로 읽히는 말 검사 (화면 문자열만, 주석은 안 봄)
   (가) 실패: 권유로 읽히는 말. 사세요, 사라, 사 두, 살까, 파세요, 팔아, 팔까, 오를, 내릴, 기다리, 기다려, 좋은, 타점
   (나) 참고: "사", "팔" 글자가 든 화면 문장 전부. 허용 예외(샀을 때, 판 매매, 살 때, 팔 때, 산 순간, 판 순간, 판 뒤)는 뺀다.
       (나)는 실패가 아니라 지시서 해석을 물을 때 쓰는 목록이다.
   쓰는 법: node check-words.mjs [저장소 경로]   (features/dali/*.js를 본다)
   종료 코드: (가)가 하나라도 있으면 1 */
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || ".";
const dir = path.join(root, "features", "dali");

const ALLOW = ["샀을 때", "판 매매", "살 때", "팔 때", "산 순간", "판 순간", "판 뒤"];
const FAIL = [
  ["사세요", /사세요/], ["사라", /사라(?![지진])/], ["사 두", /사 두/], ["살까", /살까/],
  ["파세요", /파세요/], ["팔아", /팔아/], ["팔까", /팔까/],
  ["오를", /오를/], ["내릴", /내릴/], ["기다리", /기다리/], ["기다려", /기다려/],
  ["좋은", /좋은/], ["타점", /타점/],
];

// 주석을 지우고 문자열 리터럴만 모은다 ("...", '...', `...`). 템플릿 안의 ${...}는 비운다
function strings(src) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " ")).replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
  const out = [];
  const re = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
  let m;
  while ((m = re.exec(noComments))) {
    let t = m[0].slice(1, -1);
    if (m[0][0] === "`") t = t.replace(/\$\{[^}]*\}/g, " ");
    if (/[가-힣]/.test(t)) out.push({ text: t, line: noComments.slice(0, m.index).split("\n").length });
  }
  return out;
}

let fails = 0, refs = 0;
const lines = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".js")).sort()) {
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  for (const s of strings(src)) {
    let t = s.text;
    for (const a of ALLOW) t = t.split(a).join("□");
    const hit = FAIL.find(([, r]) => r.test(t));
    if (hit) { fails++; lines.push(`실패  ${f}:${s.line}  [${hit[0]}]  ${s.text.replace(/\s+/g, " ").slice(0, 90)}`); continue; }
    if (/[사팔]/.test(t)) { refs++; lines.push(`참고  ${f}:${s.line}  ${s.text.replace(/\s+/g, " ").slice(0, 90)}`); }
  }
}
console.log(lines.filter(l => l.startsWith("실패")).join("\n") || "(가) 실패 없음");
console.log("\n--- (나) 참고: 사/팔 글자가 든 화면 문장 ---");
console.log(lines.filter(l => l.startsWith("참고")).join("\n") || "없음");
console.log(`\n실패 ${fails}, 참고 ${refs}`);
process.exit(fails ? 1 : 0);
