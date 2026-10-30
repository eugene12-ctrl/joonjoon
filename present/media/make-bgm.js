// 달이 시연 영상용 잔잔한 배경음 합성 (원곡, 저작권 없음). 결과: dali-bgm.wav (44.1kHz 스테레오 16bit)
// 느낌: 따뜻한 패드 + 부드러운 아르페지오 + 종소리 + 멀리서 파도. C장조, 72 BPM
const fs = require("fs");
const SR = 44100, DUR = +process.argv[2] || 118, N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 72, BEAT = 60 / BPM, BAR = BEAT * 4;
const f = midi => 440 * Math.pow(2, (midi - 69) / 12);

// 코드 진행 (4마디씩): Cmaj7 - Am7 - Fmaj7 - G6, 두 번째 바퀴는 Em7 - Am7 - Dm7 - G
const PROG = [
  [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]],
  [[52, 55, 59, 62], [57, 60, 64, 67], [50, 53, 57, 60], [55, 59, 62, 67]],
];
function addTone(buf, t0, dur, freq, amp, { a = .02, d = .3, s = .6, r = .6, harm = [1, .35, .12], det = 0, pan = 0 } = {}) {
  const n0 = Math.floor(t0 * SR), n1 = Math.min(N, Math.floor((t0 + dur + r) * SR));
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let n = n0; n < n1; n++) {
    const t = (n - n0) / SR;
    let env;
    if (t < a) env = t / a;
    else if (t < a + d) env = 1 - (1 - s) * (t - a) / d;
    else if (t < dur) env = s;
    else env = s * Math.max(0, 1 - (t - dur) / r);
    let v = 0;
    for (let h = 0; h < harm.length; h++) v += harm[h] * Math.sin(2 * Math.PI * freq * (h + 1) * (1 + det * (h ? 0 : 1)) * t);
    v *= env * amp;
    L[n] += v * gl; R[n] += v * gr;
  }
}
// 패드: 코드 음을 길게, 살짝 디튠한 두 겹
function pad(t0, chord, dur) {
  chord.forEach((m, i) => {
    addTone(L, t0, dur, f(m - 12 * (i === 0 ? 1 : 0)), .05, { a: 1.2, d: 1, s: .9, r: 1.5, harm: [1, .2, .05], det: .0015, pan: -.3 + i * .2 });
    addTone(L, t0, dur, f(m), .035, { a: 1.5, d: 1, s: .9, r: 1.5, harm: [1, .15], det: -.0015, pan: .3 - i * .2 });
  });
}
// 아르페지오: 8분음표로 코드 음을 오르내림, 부드러운 플럭
function arp(t0, chord, bars) {
  const notes = [...chord, chord[2], chord[1]].map(m => m + 12);
  const step = BEAT / 2, count = Math.floor(bars * BAR / step);
  for (let k = 0; k < count; k++) {
    if (k % 8 === 7) continue; // 숨 쉬는 자리
    const m = notes[k % notes.length];
    addTone(L, t0 + k * step, step * .9, f(m), .07, { a: .005, d: .25, s: .25, r: .35, harm: [1, .4, .1, .05], pan: (k % 2 ? .35 : -.35) });
  }
}
// 종소리: 마디 첫 박에 가끔
function bell(t0, m) { addTone(L, t0, 1.2, f(m), .05, { a: .003, d: .8, s: .15, r: 1.6, harm: [1, .5, .25, .12, .06], pan: .1 }); }

let t = 0, bar = 0;
while (t < DUR - 1) {
  const prog = PROG[Math.floor(bar / 4) % 2];
  const chord = prog[bar % 4];
  pad(t, chord, BAR);
  if (bar >= 2) arp(t, chord, 1);
  if (bar >= 4 && bar % 2 === 0) bell(t, chord[Math.floor(bar / 2) % chord.length] + 24);
  t += BAR; bar++;
}
// 파도: 저역 필터 걸린 잡음이 천천히 밀려왔다 빠짐
let lp = 0, lp2 = 0;
for (let n = 0; n < N; n++) {
  const tt = n / SR, swell = .5 + .5 * Math.sin(2 * Math.PI * tt / 9 - 1.2);
  const w = Math.random() * 2 - 1;
  lp += .02 * (w - lp); lp2 += .02 * (lp - lp2);
  const v = lp2 * 1.8 * (0.015 + .03 * swell * swell);
  L[n] += v * (1 + .2 * Math.sin(2 * Math.PI * tt / 7)); R[n] += v * (1 - .2 * Math.sin(2 * Math.PI * tt / 7));
}
// 공간감: 짧은 딜레이 두 개
function delay(buf, ms, fb, mix) { const d = Math.floor(SR * ms / 1000); for (let n = d; n < N; n++) buf[n] += buf[n - d] * fb * mix; }
delay(L, 311, .35, .5); delay(R, 377, .35, .5);
// 페이드와 리미터
let peak = 0;
for (let n = 0; n < N; n++) {
  const tt = n / SR, fade = Math.min(1, tt / 3, (DUR - tt) / 4);
  L[n] *= fade; R[n] *= fade;
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const g = .6 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8); out.write("fmt ", 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  const l = Math.max(-1, Math.min(1, L[n] * g)), r = Math.max(-1, Math.min(1, R[n] * g));
  out.writeInt16LE(Math.round(l * 32767), 44 + n * 4); out.writeInt16LE(Math.round(r * 32767), 46 + n * 4);
}
fs.writeFileSync(process.argv[3] || "dali-bgm.wav", out);
console.log("ok", DUR + "s", "bars", bar);
