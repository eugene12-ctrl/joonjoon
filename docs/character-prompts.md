# 달이(아기 해달) AI 이미지 생성 프롬프트

이미지 생성 도구에 그대로 붙여 넣으면 됩니다. 영어 프롬프트가 결과가 더 안정적입니다.

- 결과물은 `assets/otter/ai/`에 저장하고, 쓴 도구와 프롬프트를 아래 "생성 기록"에 남겨 주세요. 발표의 "AI 활용"과 "시행착오" 근거가 됩니다.
- 실제 유진 로고나 기존 사내 캐릭터는 넣지 않습니다. 캐릭터는 자연스러운 해달 색으로 두고, 유진 금융계열 레드는 조약돌·소품·배경 같은 포인트로만 씁니다.
- 화면에 쓸 때는 "시연용 가상 화면" 표시를 붙입니다.

## 0. 공통 스타일 (모든 프롬프트 앞에 붙이기)

```
A super cute baby sea otter mascot character, chibi proportions (big round head, tiny body),
glossy soft 3D render like a premium vinyl toy, smooth rounded shapes, no fur texture noise,
soft milk-brown fur body, creamy white face patch and belly,
small round ears, big shiny black eyes with white highlights, tiny dark-brown nose, rosy cheeks,
holding a small smooth glossy red pebble (#E0303A), friendly and huggable,
soft studio lighting, subtle rim light, clean background,
```

**공통 금지어(negative prompt, 지원하는 도구만):**

```
realistic fur, scary, sharp teeth, human body, suit, text, letters, logo, watermark,
extra limbs, deformed paws, dark gloomy lighting
```

## 1. 메인 캐릭터 시트 (가장 먼저)

```
[공통 스타일] character turnaround sheet: front view, 3/4 view, side view, back view,
same character consistent across all views, plain warm off-white background (#FFF7F2),
full body, centered
```

## 2. 기본 포즈 (앱 메인 화면)

```
[공통 스타일] floating on its back in calm water, hugging a pebble on its tummy,
eyes happily closed, gentle ripples, deep burgundy-to-red gradient background (#7A1A10 → #A81820),
square composition, character fills 70% of frame
```

## 3. 감정 4종 (말풍선 옆 아바타)

같은 시드와 캐릭터 참조 이미지를 쓰면 일관성이 좋아집니다.

| 상황 | 추가 프롬프트 |
|---|---|
| 아침 인사 | `waving one paw, big smile, morning sunlight, sparkles` |
| 퀴즈 정답 | `jumping with joy, both paws up, confetti, sparkling eyes` |
| 아쉬움 | `slightly pouting, small teardrop, still cute not sad, holding pebble tight` |
| 공부 중 | `wearing tiny round glasses, reading a small book, curious face` |

## 4. 성장 단계 3종 (게임 진행도)

| 단계 | 추가 프롬프트 |
|---|---|
| 1단계 아기 | `newborn, extra round and tiny, sleepy eyes, one tiny pebble` |
| 2단계 어린이 | `a bit bigger, playful, juggling three pebbles` |
| 3단계 어른 | `confident gentle smile, sitting on a pile of shiny colorful pebbles, small deep-red scarf (#A81820)` |

## 5. 유진다움 장면 (발표 슬라이드용)

증권 앱과 선물 앱을 잇는 장면입니다. 실제 해달이 손을 잡고 자는 습성에서 착안했습니다.

```
[공통 스타일] two baby sea otters floating on their backs, holding paws while sleeping,
one with a tiny red scarf, one with a tiny burgundy scarf,
calm night sea with stars, warm and heartwarming mood, wide 16:9 composition
```

## 6. 재화 아이콘: 조약돌

```
A single small smooth pebble icon, glossy soft 3D, warm coral-to-deep-red gradient with a tiny
white sparkle, rounded, game currency style, transparent background, centered
```

## 생성 기록

| 날짜 | 도구 | 프롬프트 번호 | 결과 파일 | 메모 |
|---|---|---|---|---|
| | | | | |
