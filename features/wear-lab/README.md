# 달이 옷장 맞추기 (wear-lab)

달이 위에 액세서리를 끌어 놓고 크기, 기울기, 앞뒤를 맞춘 뒤 CSS와 JSON으로 복사하는 작업용 페이지입니다. 시연 화면에는 쓰지 않습니다.

- 담당자: 달이 팀
- 하는 일: 옷장 아이템의 위치 값을 눈으로 맞추고, 쓸 아이템과 뺄 아이템을 정한다.
- 진입 경로: `features/wear-lab/index.html`을 브라우저로 바로 연다. 서버 없이 됨.

## 쓰는 법

1. 오른쪽 목록에서 아이템을 고른다. 「쓰기」를 끄면 내보내기에서 빠진다.
2. 왼쪽 무대에서 끌어 옮긴다. 방향키는 1%씩(Shift는 5%), 휠은 크기, Shift+휠은 기울기.
3. 「달이 뒤로」를 켜면 달이 그림 뒤에 놓여 모자 챙이 머리 뒤로 숨는다. 「좌우 뒤집기」도 있다.
4. 아래 두 미리보기가 실제 크기(관리 탭 바다 120px, 달이 키우기 84px)다.
   맨 위 「얼굴」을 누르면 얼굴 무대로 바뀐다. 시트 머리(32px)와 플로팅 버튼(62px 원 안 얼굴 50px)에 보이는 자리를 따로 맞추고, 버튼은 얼굴 값을 비율로 환산해 같이 맞춰진다. 「얼굴 자리에 보이기」를 끄면 그 자리엔 안 나온다 (손에 든 건 기본으로 꺼짐).
5. 「+ 이미지 추가」로 PNG를 넣어 볼 수 있다. 실제로 쓰려면 `features/dali/img/<id>.png`로 저장해야 한다.
6. 다 맞추면 「JSON 파일로 저장」해서 넘기거나, CSS·JSON을 복사한다.

값은 달이 상자(`.dali-otterbox`, `.dali-gotter`) 기준 퍼센트라 두 화면에 그대로 쓴다. 상태는 브라우저 localStorage(`dali-wear-lab`)에 자동 저장된다.

## 이미지

`features/dali/img/`의 Microsoft Fluent UI Emoji 3D (MIT). 새로 받은 것: crown, top_hat, sunglasses, scarf, necktie, headphone, spiral_shell, ring_buoy, womans_hat, gem_stone, billed_cap.
