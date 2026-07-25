# MOT / LDP 진영 표기 점검

- 점검일: 2026-07-26
- 인게임 순서: `HNLMS → LDP → META → MOT → 기타`
- 내부 표준명: `페드레리아`, `템페스타`
- 카드 약칭: `LDP`, `MOT`
- 필터 표기: `페드레리아 (LDP)`, `템페스타 (MOT)`

## 원천 정규화

| 원천 표기 | 앱 내부 진영 |
|---|---|
| `LDP` | 페드레리아 |
| `Liga de Pedrería` | 페드레리아 |
| `Liga de Pedreria` | 페드레리아 |
| `屠龙联盟` | 페드레리아 |
| `MOT` | 템페스타 |
| `Tempesta` | 템페스타 |

## 캐릭터 데이터 결과

- 페드레리아: 발파라이소 1명
- 템페스타: 범선 16명
- 생성된 `characters.json`에는 원천 약칭 `MOT`/`LDP`를 직접 저장하지 않고 한국어 표준명을 유지한다.

## 2026-07-26 원천 교차 검증

| 원천 | 템페스타 | 페드레리아 | gid 대조 |
|---|---:|---:|---|
| KR `AzurLaneLuaScripts` 최신 `ship_data_group.lua` | nationality 96, 16명 | nationality 12, 1명 | 기준 |
| CN `AzurLaneLuaScripts` 최신 `ship_data_group.lua` | nationality 96, 16명 | nationality 12, 1명 | KR과 일치 |
| ALtoy `ship_info_data.json` / `ship_info_lite.json` | nationality 96, 16명 | nationality 12, 1명 | KR과 일치 |
| 앱 `characters.json` | 템페스타 16명 | 페드레리아 1명 | 세 원천과 일치 |

- 일치한 gid: `960001`~`960016`, `129901`
- 인게임 화면에서 확인한 진영 약칭과 순서는 `HNLMS → LDP → META → MOT → 기타`다.
- 게임 함선 데이터의 템페스타 nationality 값은 `96`이다. 개발 임무의 `target_id` 해석에 쓰는 캠프 ID와 혼동하지 않는다.
- ALtoy의 별도 진영명 메타 파일은 신규 진영 반영이 늦을 수 있으므로, 함선 레코드의 nationality와 KR/CN 게임 원문을 우선한다.

## 화면 영향 점검

- 내 함순이 정보: 진영 필터와 진영 열
- 육성 추천: 카드와 상세 팝업의 진영 배지
- 개발함 추천: 목표 카드, 자동 추천 카드, 육성 후보 카드, 해금 조건 설명
- 진영별 기술점수 이정표: 전체 진영명과 정렬
- 데이터 생성: CSV 진영 변환 및 개발함 임무 진영 파싱

## 구조 정리

- 진영 순서, 화면명, 필터명, 카드 약칭을 `src/utils/factions.js`의 단일 정의에서 생성한다.
- 개발함 진영별 진행표도 같은 공용 순위를 사용하므로 필터와 정렬 순서가 따로 어긋나지 않는다.
- `MOT São Martinho` 같은 함선 식별 접두사는 그대로 두고, 단독으로 쓰인 `MOT`/`LDP`만 설명용 한국어 진영명으로 바꾼다.
