# MTS 전체메뉴 신규 기능 (시연용 가상 화면)

모바일 증권 앱 "전체메뉴" 화면을 재현하고, 쏙쏙클럽 카테고리의 **신규 기능** 타일에서 새 기능 페이지로 연결하는 시연용 프로젝트입니다.
모든 화면과 데이터는 가상이며, 투자 권유 목적이 아닙니다.

## 실행

빌드 도구 없이 `index.html`을 브라우저로 열면 됩니다.
VS Code를 쓴다면 Live Server 확장으로 열면 저장할 때마다 새로고침됩니다.

## 폴더 구조

```
ai_project/
├─ index.html              전체메뉴 화면 (진입점)
├─ src/
│  ├─ css/                 공통 스타일
│  ├─ js/                  공통 스크립트
│  └─ assets/icons/        SVG 아이콘
├─ features/               신규 기능 페이지. 기능 하나당 폴더 하나
│  └─ _template/           새 기능 폴더를 만들 때 복사할 틀
├─ data/mock/              가상 데이터 (JSON)
├─ docs/
│  ├─ requirements/        요구사항, 기획서
│  ├─ design/              목업, 디자인 기준
│  └─ meeting-notes/       회의록
├─ ref/                    참고 자료 (이미지, 이전 목업, 인수인계 문서)
└─ .github/                PR 템플릿
```

협업 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 보세요.
