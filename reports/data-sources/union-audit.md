# 이글 유니온 / 노스 유니온 진영 점검

- 점검일: 2026-07-19
- 내부 정규화 값: `유니온` = 이글 유니온(USS), `노스유니온` = 노스 유니온(SN)
- 화면 표기 원칙: 내부 값과 관계없이 각각 `이글 유니온`, `노스 유니온`으로 표시

## 캐릭터 데이터

`src/data/characters.json`을 CN `sharecfgdata/ship_data_statistics.json`의 `nationality`와 gid로 대조했다.

| 구분 | 앱 건수 | CN 기준 | 불일치 |
|---|---:|---:|---:|
| 이글 유니온 | 159 | nationality 1 | 0 |
| 노스 유니온 | 38 | nationality 7 | 0 |
| 합계 | 197 | 197건 매칭 | 0 |

누락된 gid는 0건이다.

## 파생 데이터

캐릭터 이름 또는 gid를 기준으로 앱 캐릭터 진영과 대조했다.

| 파일 | 대조 건수 | 누락 | 불일치 |
|---|---:|---:|---:|
| `growthRecommendations.json` | 195 | 0 | 0 |
| `shipObtainability.json` | 197 | 0 | 0 |
| `researchRecommendations.json` | 9 | 0 | 0 |

## 개발함 기술점수 조건

KR 해금 원문과 정규화된 기술점수 조건을 대조했다.

- 이글 유니온 조건: 10건
- 노스 유니온 조건: 3건
- 불일치: 0건
- 치칼로프: 이글 유니온 760 + 사르데냐 300

치칼로프의 소속 진영은 노스 유니온이지만, 개발 해금에 요구되는 첫 번째 기술점수 진영은 이글 유니온이다.

## 참고 사항

KR `sharecfgdata/ship_data_statistics.json`은 로컬 사본의 한글 문자열 인코딩 손상으로 JSON 파싱이 불가능해 캐릭터 nationality 대조에는 유효한 CN 원본을 사용했다. 연구함 해금 조건은 KR blueprint 원문을 사용했다.
