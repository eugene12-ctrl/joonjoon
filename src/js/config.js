/* ===================================================
   이름 바꾸기: 아래 상수만 고치면 됩니다
   =================================================== */
const NEW_FEATURE_LABEL = "신규 기능";
const NEW_FEATURE_TITLE = "신규 기능";
const NEW_FEATURE_PLACEHOLDER = "기능 내용이 정해지면 이 화면을 채웁니다.";
const TOAST_MS = 1500;

/* ===================================================
   새 페이지 연결: 신규 기능 타일을 누르면 호출됩니다.
   달이(features/dali)가 있으면 달이를 엽니다.
   =================================================== */
function openNewFeature(screen) {
  if (window.dali) window.dali.open("today");
  else screen.openSub();
}

/* 신규 기능 페이지 본문. 기능이 정해지면 이 함수 안쪽을 바꾸면 됩니다. */
function newFeatureHTML() {
  return `
    <div class="placeholder">
      ${iconSVG(NEW_FEATURE_LABEL, "gTeal", 0, true)}
      <h2>${NEW_FEATURE_TITLE} 화면 준비 중</h2>
      <p>${NEW_FEATURE_PLACEHOLDER}</p>
    </div>`;
}

