# CLAUDE.md

이 저장소는 여러 명이 함께 작업합니다. 아래 규칙은 모든 팀원의 Claude가 똑같이 따릅니다.

## 프로젝트

- 모바일 증권 앱 "전체메뉴" 화면을 재현한 시연용 가상 화면입니다. 빌드 도구 없이 HTML + CSS + 바닐라 JS로 만듭니다.
- 진입점은 `index.html`이고, 스타일은 `src/css/`, 스크립트는 `src/js/`에 있습니다.
- `src/js/`는 일반 `<script>`로 config → data → icons → screen → main 순서로 불러옵니다. `type="module"`로 바꾸지 마세요. 서버 없이 파일을 바로 열 수 있어야 합니다.
- 신규 기능은 `features/<기능이름>/`에서 작업합니다. 새로 만들 때는 `features/_template/`을 복사합니다.
- 자세한 폴더 설명은 `README.md`, 사람용 협업 규칙은 `CONTRIBUTING.md`에 있습니다.

## 시연 규칙 (어기면 안 됨)

- 실제 고객 정보, 계좌·거래 정보, 사내 시스템 화면, 내부 문서, 사내 메일 내용을 넣지 않습니다. 데이터는 모두 가상으로 만듭니다. 사용자 이름은 "홍길동"입니다.
- 실제 종목 추천, 수익 보장 등 투자 권유로 읽힐 수 있는 표현을 쓰지 않습니다.
- 시세, 호가, 손익, 수익률 숫자는 가상 데이터로만 넣고, 그 화면에 가상임을 표시합니다.
- 실제 종목명은 쓸 수 있습니다. 다만 실제 회사의 공시나 실적 같은 사건은 지어내지 않고, 시장 흐름 수준의 가상 뉴스만 씁니다.
- 새 화면도 맨 위에 「시연용 가상 화면」 띠를 표시합니다.
- 실명이 찍힌 캡처나 영상은 커밋하지 않습니다.

## Git 규칙

### 시작할 때

1. `git config core.hooksPath`가 `.githooks`인지 확인합니다. 아니면 `git config core.hooksPath .githooks`를 실행합니다. (`.claude/settings.json`의 SessionStart 훅이 자동으로 설정하지만, 한 번 더 확인합니다.)
2. 커밋 작성자(`git config user.name`, `user.email`)가 비어 있으면 사용자에게 물어봅니다. 임의로 정하지 않습니다.

### 작업 순서

1. 최신 main에서 브랜치를 만듭니다.
   ```
   git switch main
   git pull origin main
   git switch -c feature/<짧은-영문-이름>
   ```
2. 작업 브랜치에서만 커밋합니다. **main에 직접 커밋하거나 푸시하지 않습니다.**
3. 작업 중에 main이 바뀌었으면 rebase 대신 merge로 가져옵니다.
   ```
   git fetch origin
   git merge origin/main
   ```
4. 작업 브랜치를 푸시합니다: `git push -u origin <브랜치>`
5. PR을 만듭니다.
   - `gh` 명령이 있으면 `gh pr create --base main`으로 만들고, 본문은 `.github/pull_request_template.md` 형식을 따릅니다.
   - 없으면 사용자에게 이 주소를 알려 줍니다: `https://github.com/eugene12-ctrl/joonjoon/compare/main...<브랜치>?expand=1`
6. main에 합치는 일(merge)은 GitHub에서 리뷰를 받은 뒤 사람이 합니다. Claude가 로컬에서 main에 merge하지 않습니다.

### 브랜치 이름

`<종류>/<짧은-영문-이름>`: 영문 소문자, 숫자, `-`, `.`, `_`만 씁니다.

| 종류 | 쓰는 경우 | 예 |
|---|---|---|
| feature | 기능 추가 | `feature/new-feature-page` |
| fix | 버그 수정 | `fix/tab-scroll` |
| style | 화면 모양만 변경 | `style/banner-spacing` |
| refactor | 동작은 같고 코드 정리 | `refactor/split-screen-js` |
| docs | 문서 | `docs/readme-setup` |
| chore | 설정, 폴더 정리 | `chore/gitignore` |

### 커밋 메시지

- 첫 줄은 `<종류>: <한국어 요약>` 형식입니다. 종류는 feat, fix, style, refactor, docs, chore, test 중 하나입니다.
  - 예: `feat: 신규 기능 페이지 기본 레이아웃 추가`
- 한 커밋에는 한 가지 변경만 담습니다.
- 커밋은 사용자가 요청했을 때만 만듭니다.

### 하지 않는 것

- main 직접 커밋·푸시, `--force` 푸시, `--no-verify`로 훅 건너뛰기
- `git reset --hard`, `git clean -fd` 등으로 다른 사람 작업이나 커밋하지 않은 변경을 지우는 일 (꼭 필요하면 먼저 사용자에게 묻습니다)
- 다른 사람의 브랜치에 푸시하기 (요청받은 경우만)
- 훅이 막으면 우회하지 말고, 막힌 이유를 사용자에게 설명합니다.
