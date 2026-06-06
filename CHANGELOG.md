# Change Log

## 2026-06-06 - Add Fleet Tech Audit Script

### Why
- The tracker fleet tech totals can differ from in-game totals because the browser-owned data, ship tech values, or faction mapping may be wrong.
- A repeatable audit script is needed to compare exported LocalStorage data against in-game USS/HMS/IJN/KMS totals without guessing.

### Changed
- Added `scripts/audit-tech-points.mjs` to merge an exported backup with character data and print major faction tech totals.
- Added optional expected in-game totals so the script can print faction diffs and high-contribution candidate ships.
- Added faction code metadata for USS/HMS/IJN/KMS and an `npm run audit:tech` script alias.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`

## 2026-06-06 - Remove Filtered Summary From Stats Bar

### Why
- The filtered-list summary made the stats bar feel crowded and visually noisy after the full-roster UI split.
- The top stats area should focus on stable full-roster values that can be compared with in-game screens.

### Changed
- Removed the `현재 필터 기준` summary block from the stats bar.
- Simplified the stats bar props so the summary area no longer depends on filtered rows.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Stack Additional Stat Groups Vertically

### Why
- The acquired and 120 stat totals were still arranged side by side, making the full-roster stat section harder to scan.

### Changed
- Changed the additional stat totals from a left/right split to a vertical stack.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Rework Stats Bar Scope Separation

### Why
- The stats bar mixed full-roster values and filtered-list values in one compact block, making it hard to compare tracker totals with in-game fleet technology totals.
- Additional stat totals should be shown as full-roster totals, while filtered-list collection progress should stay visible as a separate reference.

### Changed
- Split the stats bar into full-roster summary, filtered-list summary, full-roster major faction tech points, and full-roster additional stat totals.
- Added `125 이상` and `서약` counts to the full-roster summary, and added `125 이상` to the filtered-list summary.
- Changed additional stat totals to use the full enriched roster instead of the currently filtered table rows.
- Renamed stat footnotes to `획득 기준` and `120 기준` to match the actual data grant timing.
- Added roster stat utility tests for collection rate, 120/125 counts, oath counts, and stat aggregation.

### Verified
- `node src/utils/rosterStats.test.mjs`
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Use Full Roster For Major Faction Tech Points

### Why
- In-game fleet technology totals are global roster values, while the tracker was summing the currently filtered table rows.
- Search or filter state could make the displayed major-faction tech points differ from the in-game fleet technology screen.

### Changed
- Changed the major-faction earned tech point summary to use the full enriched roster instead of the filtered table list.
- Clarified the stats label as `전체 보유함` so it is not confused with the filtered extra-stat summaries.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Split Earned Tech Points By Major Faction

### Why
- In-game fleet technology progress is shown separately for Eagle Union, Royal Navy, Sakura Empire, and Iron Blood.
- The tracker should make owned-data totals comparable with the in-game fleet technology screen instead of showing only one combined value.

### Changed
- Added a fleet technology utility that sums earned tech points for the four in-game major factions only.
- Updated the stats bar to display earned tech points as `유니온 (USS)`, `로열 (HMS)`, `중앵 (IJN)`, and `철혈 (KMS)`.
- Added regression coverage for faction alias handling and exclusion of non-major factions from this split display.

### Verified
- `node src/utils/fleetTech.test.mjs`
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Refresh GitHub Pages Actions Runtime

### Why
- GitHub Actions warned that Node.js 20-based actions are deprecated and will be forced to Node.js 24.
- The deployment workflow should stay close to the current GitHub-hosted runner behavior so future Pages deploys remain quiet and predictable.

### Changed
- Updated `actions/checkout` to v5 and `actions/setup-node` to v6 so the build job uses Node.js 24-ready official actions.
- Updated `actions/upload-pages-artifact` to v4 for the current Pages artifact action.
- Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` to opt remaining JavaScript actions into the upcoming Node.js 24 runtime.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Add GitHub Pages Deployment Workflow

### Why
- Local Vite dev server startup can be inconvenient under sandboxed or permission-restricted sessions.
- The tracker is intended to become a publicly reachable static web app, so deployment should be repeatable from Git history.

### Changed
- Added a GitHub Actions workflow that tests, builds, uploads, and deploys the Vite app to GitHub Pages.
- Documented the public GitHub Pages setup flow and expected `/azurlane-tracker/` URL.
- Clarified that LocalStorage user data must be moved between local and deployed origins with export/import.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Sync Ship Icons From Local Data

### Why
- Ship icons should be served from local public assets instead of relying on remote GitHub raw URLs at runtime.
- Utawarerumono collaboration icons were missing from the local `AzurLane` image data and needed an ALtoy-compatible fallback source.

### Changed
- Added a local icon sync script that copies ship icons from `참고용/AzurLane` into `public/ship-icons`.
- Added fixed skin-ID handling for `Z031` through `Z036` using ALtoy's `JforPlay/data_for_toy` icon source.
- Updated character data icon URLs to use local public assets.
- Added a missing icon report for ships that do not exist in the local reference data.
- Added `npm run sync:icons` for repeatable icon refreshes.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Update Acquisition Status Levels

### Why
- The owned-state cycle should track practical level milestones instead of the previous broad growth labels.

### Changed
- Changed acquisition status cycle to `미획득 -> 획득 -> 100 -> 120 -> 125`.
- Updated filters, table colors, stats, and tech point calculation to use the new statuses.
- Preserved compatibility with old saved values by mapping `육성중` to `100` and `육성 완료` to `120`.
- Added status utility tests.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Clarify Header Backup Label

### Why
- Header backup controls needed a visible label so users know the buttons apply to entered tracker data.

### Changed
- Added an `입력 데이터` label before the compact backup controls.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Move Backup Controls To Header

### Why
- Backup controls should stay available while leaving more vertical room for the tracker table.

### Changed
- Added a compact backup control layout for the page header.
- Moved backup export/import controls next to the page title.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Add User Data Backup

### Why
- Owned-ship status, notes, favorites, and growth state are stored in LocalStorage and need a safe backup path before the tracker becomes a daily-use tool.

### Changed
- Added a versioned JSON backup format for user data.
- Added backup export and import controls to the main tracker screen.
- Added lightweight Node assertions for backup parsing and validation.
- Updated project docs to include the new test command and mark backup/restore as complete.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Define Product Direction

### Why
- The project direction was clarified as an ALtoy-style tool specialized for owned-ship growth and fleet optimization.
- Optional visual archive features should be distinguished from the core tracker/recommendation goals.

### Changed
- Rewrote `README.md` to describe the project identity, goals, and local commands.
- Expanded `PLAN.md` with required goals, optional goals, and a staged roadmap.

### Verified
- Documentation-only change.

## 2026-06-04 - Update Script Source Paths

### Why
- The app was moved to the repository root while source CSV files are kept locally under `참고용/`.
- Data conversion scripts needed to resolve input files from the new root project structure.

### Changed
- Updated `scripts/convert-csv.js` to read the main CSV from `참고용/`.
- Updated `scripts/add-tech-points.js` to read the tech-point CSV from `참고용/`.

### Verified
- Confirmed both referenced CSV paths exist locally.
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-04 - Flatten AzurLane Tracker Project

### Why
- `5. AzurLane` was intended to be the project root.
- The generated `azurlane-tracker` subfolder created an unnecessary nested project and nested Git repository.
- `참고용/` is a local reference-material folder and should not be tracked by Git.

### Changed
- Moved the React/Vite app files from `azurlane-tracker/` to the repository root.
- Removed the nested `azurlane-tracker` project structure from Git tracking.
- Updated `.gitignore` for root-level app artifacts and ignored `참고용/`.
- Removed the root-level source CSV from Git tracking after it was moved into `참고용/`.
- Added `PLAN.md` for development planning.
- Split `calcTechPoints` into `src/utils/techPoints.js` to satisfy React Fast Refresh lint rules.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`
