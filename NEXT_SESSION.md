# 다음 세션 작업 인계

이 문서는 다음 개발 세션에서 현재 구조와 남은 작업을 빠르게 파악하기 위한 인계 문서다. 사용자 화면이나 데이터 원천으로 사용하지 않는다.

## 현재 상태

- 핵심 데이터는 KR에 노출된 함선 877척 기준이다.
- 보유 정보는 브라우저 `localStorage`의 `azurlane-userdata`에 저장하며, JSON 백업 스키마는 v3이다.
- 호감도는 `기타`, `호감 61+`, `기쁨 81+`, `사랑 100`, `서약 100+`, `서약 200`의 여섯 단계다.
- 함순이 DB 기초 화면, 상세 능력치/스킬/입수처와 육성·개발함·기술점수·추가 스탯작 추천은 동작한다.
- 편성 추천은 시험 구현이며 화면에 `만드는 중`을 표시한다.

## 남은 핵심 개발

1. 함순이 DB 기능 다듬기
   - 카드/상세 정보의 최종 정보 밀도와 모바일 UX 정리
   - 스킬 원천의 미확정 수치 처리 및 최신 원천 동기화 검토
   - 개장 완료 기준 보너스와 단계별 능력치 설명 최종 검수
2. 편성 추천 기능 다듬기
   - 보유함 기반 최초 공략/안전해역 주회 전체 출격 구성 완성
   - 일반 장비 +10과 하이엔드 장비 +10 프리셋 확정
   - 스테이지 요구치 +10% 안전 여유, 함대 간 함선 중복 금지, 자동전투·안정 클리어 우선 검증
   - 연구함은 레벨 100 이상 개발 레벨 30, 미만은 개발 레벨 1로 계산

## 애플리케이션 구조

- `src/App.jsx`: 최상위 페이지 상태, 사용자 데이터 결합, 전역 맨위로 버튼
- `src/config/navigation.js`: 상단 메뉴 정의
- `src/components/pages/AppPages.jsx`: 홈·내 함순이 정보·공사중 페이지
- `src/components/RecommendationPage.jsx`: 다섯 추천 탭 전환
- `src/components/ShipDatabasePage.jsx`: 함순이 DB 목록과 상세 화면
- `src/hooks/useUserDataStorage.js`: localStorage 저장과 스키마 마이그레이션
- `src/utils/userDataSchema.js`: 사용자 데이터 정규화/스키마 버전
- `src/utils/affection.js`: 호감도 단계와 능력치 배율의 단일 원천
- `src/data/*.json`: 빌드에 포함되는 앱 데이터

페이지 라우터는 사용하지 않고 `App.jsx`의 상태로 메뉴를 전환한다. 함순이 DB와 편성 추천은 번들 크기를 줄이기 위해 lazy import한다.

## 데이터 갱신 구조

- `npm run refresh:data`: 원격 참고 자료와 누락 이미지를 동기화한 뒤 앱 JSON을 재생성하고 로컬 감사를 수행한다.
- `npm run audit:data-sources`: 최신 원격 원천을 임시 작업공간에서 검증하고 관리 대상 참고 자료를 교체한 뒤 전체 원천 감사를 수행한다.
- `npm run audit:data-sources:local`: 네트워크 없이 현재 참고 자료와 앱 데이터를 비교한다.
- `npm run audit:idempotency`: 동일 원천으로 재생성했을 때 의미 있는 데이터가 바뀌지 않는지 검사한다.

주요 원천은 AzurLaneTools/AzurLaneData, AzurLane Lua, Fernando2603/AzurLane, ALtoy, 육성 추천 Google Sheet, 기술점수 Google Sheet다. `참고용/`은 일반 작업에서 읽기 전용이며 동기화 스크립트만 관리 대상 경로를 교체한다. 이미지는 기존 파일을 보존하고 누락분만 채운다.

이벤트 종료일은 KST 날짜 기준이다. 생성기와 브라우저 모두 `src/utils/kstDate.js`를 사용한다. 현재 이벤트를 특정 날짜 이후에도 고정 기대하는 테스트를 다시 만들지 않는다.

## 검증 명령

변경 후 최소한 아래 순서로 확인한다.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run audit:idempotency
git diff --check
```

원격 데이터 자체를 갱신한 작업이면 추가로 `npm run audit:data-sources`를 실행한다. GitHub Pages 배포 워크플로도 lint, test, build, idempotency 검사를 통과해야 배포한다.

## 작업 원칙

- 함선 목록은 CN 세부 데이터를 활용하되 KR/ALtoy에 확인된 KR 노출 범위만 웹에 표시한다.
- `참고용/`의 사용자 수동 자료나 이미지 전체를 임의 삭제하지 않는다.
- 추천 카드와 팝업의 함선 식별은 gid 우선, 이름 보조 매칭을 유지한다.
- 같은 이름의 별도 함선(항모 아마기, 전함 카가, META, μ장비, 콜라보)을 합치지 않는다.
- 변경을 커밋하기 전에 `CHANGELOG.md`에 변경 이유와 검증 결과를 남긴다.
