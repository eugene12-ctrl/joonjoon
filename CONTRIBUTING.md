# 협업 규칙

Claude Code를 쓰는 팀원의 Claude도 같은 규칙을 따릅니다 ([CLAUDE.md](CLAUDE.md)).

## 처음 한 번 (클론 직후)

```
git clone https://github.com/eugene12-ctrl/joonjoon.git
cd joonjoon
git config core.hooksPath .githooks
git config user.name "<GitHub 아이디>"
git config user.email "<지급받은 계정 이메일>"
```

`core.hooksPath` 설정은 아래 규칙을 자동으로 검사하는 Git 훅을 켭니다. Claude Code를 이 폴더에서 실행하면 자동으로 설정되지만, 직접 한 번 실행해 두면 확실합니다.

## 작업 순서

```
# 1. 최신 main에서 브랜치 만들기
git switch main
git pull origin main
git switch -c feature/<짧은-영문-이름>

# 2. 작업하고 커밋
git add <파일>
git commit -m "feat: 신규 기능 페이지 기본 레이아웃 추가"

# 3. 중간에 main이 바뀌었으면 merge로 가져오기 (rebase 대신)
git fetch origin
git merge origin/main

# 4. 내 브랜치 푸시
git push -u origin feature/<짧은-영문-이름>
```

5. GitHub에서 PR을 엽니다 (`main` ← 내 브랜치). PR 본문은 템플릿 체크리스트를 채웁니다.
6. 한 명 이상 확인(Approve)하면 **Squash and merge**로 합치고, 브랜치는 삭제합니다.
7. 합친 뒤에는 각자 `git switch main` → `git pull origin main`으로 최신 상태를 받습니다.

## 브랜치 이름

`<종류>/<영문-소문자-이름>`

| 종류 | 쓰는 경우 | 예 |
|---|---|---|
| feature | 기능 추가 | `feature/new-feature-page` |
| fix | 버그 수정 | `fix/tab-scroll` |
| style | 화면 모양만 변경 | `style/banner-spacing` |
| refactor | 동작은 같고 코드 정리 | `refactor/split-screen-js` |
| docs | 문서 | `docs/readme-setup` |
| chore | 설정, 폴더 정리 | `chore/gitignore` |

## 커밋 메시지

첫 줄은 `<종류>: <요약>` 형식입니다. 종류는 feat, fix, style, refactor, docs, chore, test 중 하나입니다.

예: `feat: 신규 기능 페이지 기본 레이아웃 추가`, `fix: 탭 자동 스크롤 위치 수정`

## 자동으로 막히는 것 (Git 훅)

| 훅 | 막는 것 |
|---|---|
| `pre-commit` | main에 직접 커밋, 규칙에 안 맞는 브랜치 이름 |
| `commit-msg` | 형식에 안 맞는 커밋 메시지 |
| `pre-push` | 원격 main에 직접 푸시 |

막히면 메시지에 나온 방법대로 고치세요. `--no-verify`로 건너뛰지 않습니다.

## 작업 위치

- 신규 기능은 `features/<기능이름>/` 폴더 안에서 작업합니다. `features/_template/`을 복사해서 시작하세요.
- `index.html`과 `src/` 공통 파일은 여러 사람이 같이 고치면 충돌이 나기 쉽습니다. 고치기 전에 팀에 알려 주세요.
- 가상 데이터는 `data/mock/`에 JSON으로 둡니다.

## 시연 규칙 (반드시 지킬 것)

- 실제 고객 정보, 계좌·거래 정보, 사내 시스템 화면, 내부 문서는 넣지 않습니다.
- 데이터는 모두 가상 데이터를 씁니다. 사용자 이름은 "홍길동"입니다.
- 실제 종목 추천, 수익 보장 등 투자 권유로 읽힐 수 있는 표현은 쓰지 않습니다.
- 모든 화면 맨 위에 「시연용 가상 화면」 띠를 표시합니다.
- 실명이 찍힌 캡처나 영상은 저장소에 올리지 않습니다.

## 저장소 관리자 설정 (GitHub에서 한 번)

1. **Settings → Collaborators**: 팀원 GitHub 계정을 초대합니다.
2. **Settings → Branches → Add branch ruleset** (또는 Branch protection rule), 대상 `main`:
   - Require a pull request before merging (Approvals 1)
   - Block force pushes
3. **Settings → General → Pull Requests**: "Allow squash merging"만 켜고, "Automatically delete head branches"를 켭니다.
