/* ---------- 달이 이벤트 데이터: 내 종목에 걸린 이벤트와 지난 8번 (시연용 가상) ----------
   이벤트 하나에 지난 8번의 "발표 직전 상황"과 "그 뒤 열흘"을 둔다. 값은 전부 가상이고 실제 회사의 실적 내용은 적지 않는다.
   직전 상황은 다섯 축: pre5(발표 전 5일 등락 %), kospi(시장 흐름), sector(업종 흐름), volume(거래량), vol(변동폭).
   next는 발표 다음 날 등락 %, path는 발표 전 종가를 0으로 둔 열흘 등락 %. tag는 그때 특징뉴스의 한 단어(지금과 같은 이야기인지 볼 때 씀).
   res는 그때 결과(실적은 서프라이즈, 쇼크, 부합. 금리는 동결, 인하, 인상)와 색.
   now는 이번 발표 직전 상황. implied는 옵션 가격에서 읽은 이번 예상 폭(±%).
   art는 오늘 탭 맨 위 그림: logo는 종목 로고, 그 밖은 img/ 아래 파일 이름(png가 있으면 png, 없으면 svg). bg는 띠 색. dali-event.js가 읽는다. */
const DALI_EVENTS = {
  "삼성전자": {
    app: "stock", kind: "실적 발표", when: "오늘 09:30", short: "실적", art: "logo", bg: ["#0A6270", "#004652"],
    axes: [["pre5", "발표 전 5일"], ["kospi", "코스피"], ["sector", "반도체 업종"], ["volume", "거래량"], ["vol", "변동"]],
    implied: 6.0,
    now: { pre5: 8.0, kospi: "up", sector: "up", volume: "high", vol: "wild", tag: "외국인 순매수", news: "발표 앞두고 외국인 사흘째 순매수, 어제 9% 급등" },
    past: [
      { at: "24년 10월", pre5: 7.4, kospi: "up", sector: "up", volume: "normal", vol: "wild", tag: "차익 실현 경계", news: "반도체주 발표 전 급등, 차익 실현 경계", res: ["어닝 쇼크", "down"], next: -2.4, path: [-2.4, -4.0, -5.5, -6.8, -8.1, -7.5, -7.9, -6.6, -7.0, -6.2] },
      { at: "25년 1월", pre5: -2.0, kospi: "down", sector: "flat", volume: "normal", vol: "calm", tag: "관망", news: "연초 관망세, 반도체주 보합", res: ["어닝 서프라이즈", "up"], next: 5.9, path: [5.9, 6.4, 5.8, 7.1, 7.6, 8.0, 7.4, 8.8, 9.1, 9.5] },
      { at: "25년 4월", pre5: 1.5, kospi: "flat", sector: "up", volume: "low", vol: "calm", tag: "거래 한산", news: "거래 한산한 가운데 발표 대기", res: ["예상 부합", "flat"], next: -2.2, path: [-2.2, -1.5, -0.8, 0.2, 0.6, 1.1, 0.9, 1.4, 1.2, 1.8] },
      { at: "25년 7월", pre5: 8.1, kospi: "up", sector: "up", volume: "high", vol: "wild", tag: "외국인 순매수", news: "발표 앞두고 외국인 나흘째 순매수, 반도체주 강세", res: ["어닝 서프라이즈", "up"], next: -3.1, path: [-3.1, -2.0, -0.6, 0.5, 1.4, 0.9, 1.8, 2.6, 2.2, 2.9] },
      { at: "25년 10월", pre5: -6.3, kospi: "down", sector: "down", volume: "high", vol: "wild", tag: "급락 뒤 반등 기대", news: "발표 전 급락, 반등 기대 속 거래 급증", res: ["어닝 서프라이즈", "up"], next: 7.3, path: [7.3, 6.1, 8.2, 9.0, 8.4, 9.6, 10.2, 9.8, 10.5, 11.0] },
      { at: "26년 1월", pre5: 0.8, kospi: "up", sector: "flat", volume: "normal", vol: "calm", tag: "완만한 상승", news: "코스피 완만한 상승, 반도체주 보합", res: ["어닝 서프라이즈", "up"], next: 3.6, path: [3.6, 3.1, 3.9, 4.4, 4.0, 4.8, 5.1, 4.6, 5.3, 5.5] },
      { at: "26년 4월", pre5: 3.1, kospi: "flat", sector: "up", volume: "normal", vol: "calm", tag: "업종 강세", news: "반도체 업종 강세, 시장은 보합", res: ["예상 부합", "flat"], next: 2.6, path: [2.6, 1.9, 2.8, 3.3, 2.7, 3.5, 3.9, 3.4, 4.1, 4.4] },
      { at: "26년 7월", pre5: -1.2, kospi: "down", sector: "down", volume: "normal", vol: "wild", tag: "업종 약세", news: "반도체 업종 약세 속 발표 대기", res: ["어닝 쇼크", "down"], next: -6.5, path: [-6.5, -7.2, -6.0, -5.1, -5.8, -4.9, -4.2, -4.6, -3.8, -3.3] },
    ],
    // 시연 장면별 이번 결과: 발표 뒤 등락 %(발표 전 종가 기준). 없으면 아직 발표 전
    result: { intraday: { val: -3.8, label: "지금" }, close: { val: -0.8, label: "마감" }, month: { val: -0.8, label: "발표 다음 날" } },
    // 장면별 상태 라벨
    state: { morning: "wait", intraday: "live", close: "done", month: "done" },
  },
  "나스닥 100": {
    app: "fut", kind: "미국 금리 결정 (FOMC)", when: "내일 새벽 3시", short: "FOMC", art: "ev-fomc.svg", bg: ["#0A6270", "#004652"],
    axes: [["pre5", "발표 전 5일"], ["kospi", "S&P 흐름"], ["sector", "기술주 흐름"], ["volume", "거래량"], ["vol", "변동성"]],
    implied: 1.8,
    now: { pre5: 2.5, kospi: "up", sector: "up", volume: "normal", vol: "calm", tag: "동결 예상", news: "금리 동결 예상 속 기술주 닷새째 상승" },
    past: [
      { at: "25년 10월", pre5: 1.1, kospi: "up", sector: "flat", volume: "normal", vol: "calm", tag: "동결 예상", news: "동결 예상, 시장 조용한 대기", res: ["동결", "flat"], next: 1.2, path: [1.2, 1.5, 1.1, 1.8, 2.0, 1.7, 2.2, 2.4, 2.1, 2.6] },
      { at: "25년 12월", pre5: 2.9, kospi: "up", sector: "up", volume: "high", vol: "calm", tag: "인하 기대", news: "인하 기대로 기술주 랠리 뒤 발표 대기", res: ["인하", "up"], next: -2.8, path: [-2.8, -3.5, -4.1, -3.6, -4.4, -4.0, -4.8, -4.3, -4.6, -4.1] },
      { at: "26년 1월", pre5: -0.8, kospi: "flat", sector: "down", volume: "normal", vol: "wild", tag: "관망", news: "연초 관망, 변동성 커진 채 대기", res: ["동결", "flat"], next: 0.9, path: [0.9, 0.4, 1.2, 1.6, 1.1, 1.8, 2.0, 1.5, 2.1, 2.3] },
      { at: "26년 3월", pre5: 3.2, kospi: "up", sector: "up", volume: "normal", vol: "calm", tag: "동결 예상", news: "동결 예상, 기술주 나흘째 올라 발표 맞음", res: ["동결", "flat"], next: -1.6, path: [-1.6, -0.9, -0.2, 0.6, 1.0, 0.7, 1.4, 1.9, 1.6, 2.2] },
      { at: "26년 4월", pre5: -2.4, kospi: "down", sector: "down", volume: "high", vol: "wild", tag: "급락 뒤 대기", news: "발표 전 급락, 거래 급증", res: ["인하", "up"], next: 2.4, path: [2.4, 1.8, 2.9, 3.4, 3.0, 3.8, 4.1, 3.7, 4.3, 4.6] },
      { at: "26년 6월", pre5: 0.4, kospi: "flat", sector: "flat", volume: "low", vol: "calm", tag: "거래 한산", news: "거래 한산, 보합권 대기", res: ["동결", "flat"], next: -0.7, path: [-0.7, -0.3, 0.2, -0.1, 0.4, 0.8, 0.5, 0.9, 1.1, 0.7] },
      { at: "26년 7월", pre5: 1.8, kospi: "up", sector: "up", volume: "normal", vol: "wild", tag: "인상 우려", news: "인상 우려 속에도 기술주 상승", res: ["동결", "flat"], next: 1.8, path: [1.8, 2.3, 2.0, 2.6, 3.1, 2.8, 3.4, 3.0, 3.6, 3.9] },
      { at: "26년 9월", pre5: -1.5, kospi: "down", sector: "flat", volume: "normal", vol: "wild", tag: "관망", news: "발표 전 관망, 변동성 큰 채 대기", res: ["인상", "down"], next: -2.1, path: [-2.1, -2.6, -1.9, -1.2, -1.6, -0.9, -0.4, -0.8, -0.2, 0.3] },
    ],
    result: { close: { val: 0.3, label: "아침" }, month: { val: 0.3, label: "발표 다음 날" } },
    state: { morning: "wait", intraday: "wait", close: "done", month: "done" },
  },
};
