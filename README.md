# AzurLane Growth Optimizer

내 보유함 기반 성장/편성 최적화에 특화된 벽람항로 팬 도구입니다.

현재는 Google Sheets로 관리하던 함선 데이터를 웹 앱으로 옮겨 보유, 육성, 스킬, 호감, 메모, 기술점수를 관리하는 트래커 기능을 중심으로 개발 중입니다. 장기적으로는 보유함 상태를 기준으로 성장 우선순위와 스테이지별 편성을 추천하는 정적 웹 도구를 목표로 합니다.

## 방향

- 필수 목표: 보유함 기반 성장/편성 최적화
- 핵심 기능: 함선 트래커, 기술점수 계산, 성장 추천, 편성 추천
- 확장 목표: 스킨, 일러스트, 로딩 이미지 등 감상형 모듈
- 실행 환경: React + Vite, LocalStorage, GitHub Pages

## 개발 명령

```bash
npm.cmd run dev
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

## GitHub Pages 배포

이 프로젝트는 공개 GitHub Pages 배포를 기준으로 `vite.config.js`의 base path를 `/azurlane-tracker/`로 설정합니다.

GitHub 공개 저장소를 `azurlane-tracker` 이름으로 만들고 이 저장소를 push한 뒤, GitHub 저장소의 `Settings > Pages`에서 Source를 `GitHub Actions`로 설정하면 `master` 또는 `main` 브랜치 push 때 자동으로 빌드/배포됩니다.

예상 접속 주소:

```text
https://<github-username>.github.io/azurlane-tracker/
```

브라우저에 입력한 보유함 데이터는 LocalStorage에 저장되므로, 로컬 개발 주소와 GitHub Pages 주소 간에는 `입력 데이터`의 내보내기/가져오기로 옮깁니다.

## 로컬 참고 자료

`참고용/` 폴더는 CSV, 원본 에셋, 임시 참고 자료를 보관하는 로컬 전용 폴더입니다. Git에는 포함하지 않습니다.
