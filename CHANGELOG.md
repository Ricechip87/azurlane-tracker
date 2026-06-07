# Change Log

## 2026-06-07 - Enlarge Roster Guide Illustration

### Why
- The loading illustration in the roster guide panel looked too small inside its available slot.

### Changed
- Kept the roster guide panel at the same height as the simple stats card.
- Enlarged the loading illustration within that fixed-height panel by reducing the image-side padding and using a 16:9 height-based slot.
- Removed the repeated large `내 함순이 정보` heading from the roster guide text panel.
- Renamed the simple stats scope label from `전체 보유함 기준` to `현재 보유함 기준`.
- Renamed the fleet tech panel scope label from `(전체 보유함)` to `(현재 보유함)`.
- Renamed the fleet tech candidate column header from `추천 후보` to `육성 추천 후보`.
- Centered the fleet tech candidate `획득 가능 기술점수` header as an explicit two-line label.
- Narrowed the candidate ship-name column to give score columns more room.
- Reordered the first menu group to `내 함순이 정보`, `육성/편성 추천`, then `함순이 DB`.
- Added `벽청년 이상` and `벽뉴비 권장` toggles to fleet tech candidate panels, with `벽청년 이상` selected by default.
- Recalculate candidate score and ordering without Lv.120 points when `벽뉴비 권장` is selected.
- Removed the final fleet tech candidate metric column and its related sort tiebreaker.
- Split `벽뉴비 권장` candidate groups into `SSR / SR`, `UR`, and `R / N`.
- Exclude `기타` position candidates from `벽뉴비 권장` results.
- Center-aligned all fleet tech candidate table columns except the ship-name column.
- Updated the header tagline to `벽람항로 개인용 함선 육성툴`.
- Made the roster filter panel stay visible below the top menu while scrolling.
- Added a fixed bottom-right `맨위로` button on the roster page.
- Replaced the experimental faction tech cards with a full-width guide image slot below the fleet tech table.
- Removed the text header from the fleet tech guide image slot.
- Added faction-specific fleet tech guide images for USS, HMS, IJN, and KMS button selections.
- Added a small placeholder note below the fleet tech guide image.
- Clarified that the fleet tech guide image is a temporary placeholder.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Remove Unverified External-Style Wording

### Why
- The current menu structure has not been rechecked directly against the original external reference after the initial reference phase.
- Project docs should avoid claiming an externally matched structure without current verification.

### Changed
- Reworded the project direction in `PLAN.md` and `README.md` as a owned-roster growth/fleet optimization web tool.
- Replaced the completed Home item with the neutral `기능별 진입 구조`.

### Verified
- Documentation-only change.

## 2026-06-07 - Refresh Project Plan Around Current Menu

### Why
- The old phase-based plan no longer matched the current menu structure.

### Changed
- Reorganized `PLAN.md` around Home, My Roster, Recommendation, In-game Content, Data Operations, and Deployment.
- Updated completed and remaining work to match the current implementation.
- Clarified that bonus stat data currently matches the verified in-game scope, with revalidation needed for future updates.

### Verified
- Documentation-only change.

## 2026-06-07 - Track Candidate Sort Rule Follow-up

### Why
- The current fleet tech candidate sort rule may need to change after the growth recommendation logic is finished.

### Changed
- Added a PLAN follow-up to revisit the candidate sort rule after growth recommendation work.
- Documented the current temporary sort order for future comparison.

### Verified
- Documentation-only change.

## 2026-06-07 - Make Roster Name Scroll Loop Forward

### Why
- Long roster names should restart from the beginning after showing the end, instead of scrolling back and forth.

### Changed
- Changed the long-name animation from a ping-pong motion to a forward loop.
- Kept the start and end briefly readable before the loop restarts.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Auto Scroll Long Roster Names

### Why
- Long character names should remain fully visible without manual scrollbars or ellipsis.

### Changed
- Added automatic horizontal scrolling for overflowing roster name text.
- Kept character icons fixed while only the long name text scrolls.
- Left short names static.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Rebalance Roster Table Column Widths

### Why
- Long name cells took too much horizontal space while bonus stat columns still wrapped awkwardly.

### Changed
- Reduced the roster table name column to a fixed width.
- Kept long character names intact by allowing horizontal scrolling inside the name cell.
- Reserved more width for acquired and 120 bonus stat columns.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Align Roster Table Columns

### Why
- Roster table headers and values wrapped or sat unevenly after status controls became wider.

### Changed
- Centered and middle-aligned every roster table column except the name column.
- Prevented roster table headers from wrapping.
- Kept the name column left-aligned for readability.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Remove Roster Table Memo Column

### Why
- The roster table needs more room for status controls, and memo editing will move to another area later.

### Changed
- Removed the memo header and memo input cells from the roster table.
- Kept existing saved `comment` data untouched for future reuse.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Prevent Status Dropdown Label Wrapping

### Why
- Long Korean status labels wrapped after replacing native selects with custom dropdown buttons.

### Changed
- Prevented status dropdown button labels and menu options from wrapping.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Replace Status Dropdown Native Options

### Why
- Firefox keeps native selected option highlighting in status dropdowns even when option colors are overridden.

### Changed
- Replaced table status dropdowns with a small custom dropdown menu.
- Kept the collapsed status control color-coded while rendering opened option rows with neutral dark list colors.
- Applied the change to all table status dropdowns: remodel, keel, acquisition, skill, affection, and equipment.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add First Roster Loading Illustration

### Why
- The roster info image panel needs an initial fixed illustration asset.

### Changed
- Copied `painting.png` from the reference AzurLane skin folder into the app loading illustration assets as `100021-painting.png`.
- Left the original reference folder untouched.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Fixed Roster Input Guidance

### Why
- The roster info panel needs fixed system guidance text that users cannot edit.

### Changed
- Replaced the placeholder panel copy with fixed roster input guidance.
- Kept the guidance outside of user-editable/exported data.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Rotating Loading Illustration Slot

### Why
- The fixed roster info image panel should be able to rotate through site-owned loading illustrations.
- This image area is system-controlled and not part of user editable/exported data.

### Changed
- Added build-time loading illustration discovery under `src/assets/loading-illustrations`.
- Rotate available loading illustrations in the `내 함순이 정보` image panel every 8 seconds.
- Keep a placeholder when no loading illustration images are present.
- Added a folder README documenting supported image extensions.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Roster Info Image Text Panel

### Why
- The roster info page needs a large separate section beside the simple stats card for a future image and message.

### Changed
- Added a wide image/text panel next to the simple stats card on `내 함순이 정보`.
- Added a placeholder image slot and temporary text that can be replaced later.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Equalize Tech Recommendation Detail Height

### Why
- The right detail panel changed height between level effects and candidate lists.

### Changed
- Fixed the recommendation detail panel height to match the level effect view.
- Made level effect and candidate detail contents scroll inside the fixed panel.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Simplify My Roster Info Page

### Why
- Fleet tech and bonus stat sections now belong to the recommendation page, not the personal roster input page.
- The page title should use `내 함순이 정보`.

### Changed
- Removed fleet tech and bonus stat panels from the roster info page summary area.
- Kept only the compact simple summary card on the roster info page.
- Renamed `함순이 내 정보` to `내 함순이 정보` in the menu and page header.
- Removed unused bonus stat rendering code from the stats component.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Center Tech Recommendation Cells Vertically

### Why
- Inline tech recommendation headers and values were visually top-aligned.
- The long next-level header wrapped awkwardly at the final character.

### Changed
- Vertically and horizontally centered inline tech recommendation header/value cells.
- Split `다음 레벨까지 남은 점수` into two explicit lines.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Align Tech Recommendation Columns

### Why
- The inline tech recommendation table showed an unnecessary horizontal scrollbar.
- Header labels and row values should be centered within the same columns.

### Changed
- Removed the forced minimum width that caused the horizontal scrollbar.
- Switched inline tech recommendation columns to fractional widths.
- Center-aligned inline table headers and row values.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Split Tech Recommendation Details

### Why
- The tech recommendation table headers and row values were not visually aligned well enough.
- The recommendation page is wide enough to show selected details beside the table instead of below it.

### Changed
- Use fixed columns for the inline tech recommendation table so headers and values line up.
- Split the tech recommendation tab into a left table and a right detail panel.
- Show level effects or candidate details in the right panel, with only one detail view active at a time.
- Kept the compact roster info tech panel on its existing popover-style layout.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Refine Tech Recommendation Table

### Why
- The recommendation page should focus on the tech point table instead of low-value summary tiles.
- Fleet tech rows need explicit column labels for easier scanning.

### Changed
- Removed the three summary metric tiles from the tech recommendation tab.
- Added column labels for faction, current level, level effect, current points, points to next level, and candidates.
- Split the current level into its own column and shortened the effect button label.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Show Tech Recommendation Details Inline

### Why
- The growth recommendation page has enough room to show selected details below the tech point list instead of using popovers.
- Candidate and level-effect details should not be open at the same time.

### Changed
- Added an inline detail mode to the fleet tech panel.
- Show `후보 보기` and `LV.n 달성 효과` results in a lower detail section on the recommendation page.
- Kept the existing popover mode for the compact roster information page.
- Added small summary metrics to reduce the empty feel of the recommendation page.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Growth Recommendation Page

### Why
- Growth and fleet recommendation tools need their own page instead of staying mixed into roster input.
- The roster page's simple summary block should keep its current compact size and role.

### Changed
- Added a `육성/편성 추천` page with tabs for `기술점수 추천`, `추가 스탯 추천`, `개발함 추천`, `120 육성 추천`, and `편성 추천`.
- Connected the existing fleet tech points, level effect, and candidate popover features to the `기술점수 추천` tab.
- Added placeholder states for the remaining recommendation tabs.
- Extracted the fleet tech panel for reuse while preserving the existing simple summary layout in `함순이 내 정보`.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Stabilize Fleet Tech Popover Hover

### Why
- Fleet tech popovers closed too quickly while moving the pointer from a button into the opened popover.

### Changed
- Added a short delayed close for fleet tech candidate and level effect popovers.
- Cancel the delayed close when the pointer enters the opened popover.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Close Fleet Tech Popovers On Mouse Leave

### Why
- Fleet tech candidate and level effect popovers should dismiss like the top menu dropdowns when the pointer leaves their area.

### Changed
- Close the level effect popover when the pointer leaves the effect button/popover area.
- Close the candidate popover when the pointer leaves the candidate button/popover area.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Fleet Tech Level Effect Popover

### Why
- Fleet tech rows should show the current level's achieved effect, not only the level number.

### Changed
- Replaced the plain `LV.n` text with an `LV.n 달성 효과` button.
- Added a popover that lists the current level's ship type/stat bonuses for the selected major faction.
- Keep the level effect popover and candidate popover mutually exclusive.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Fix Top Menu Dropdown Closing

### Why
- Top menu dropdowns stayed open after the pointer left the menu area or after a submenu item was clicked.

### Changed
- Replaced CSS-only hover/focus dropdown visibility with controlled menu state.
- Close the open dropdown when selecting a menu item, clicking home, leaving the menu area, or blurring out of the menu.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Main Menu Shell

### Why
- The app needs a menu-based shell instead of placing every tool on one page.
- The existing tracker screen is closer to a personal roster input page and should live under its own menu item.

### Changed
- Added a top menu bar with `함순이 DB/육성/편성` and `인게임 콘텐츠` dropdown groups.
- Added a home page with a single hero image section.
- Moved the existing roster input/tracker screen under `함순이 내 정보`.
- Routed unfinished menu items to a centered `공사중` placeholder screen.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Align Filter Action Buttons

### Why
- The favorite, research-only, and reset controls in the filter panel used different visual treatments.

### Changed
- Converted the favorite-only checkbox into a button-style toggle.
- Matched the height, border, padding, and hover treatment for favorite-only, research-only, and filter reset controls.
- Preserved active color cues for favorite-only and research-only filters.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Filter Dropdown Group Dividers

### Why
- Classification and faction dropdowns need separators after the default option and again before detailed/collab groups.

### Changed
- Added a disabled divider after `전체`, then another divider between `후열` and detailed ship type options.
- Added a disabled divider after `모든 진영`, then another divider between base factions/`기타` and collab factions.
- Kept divider rows non-selectable in both dropdowns.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Move Filter Dropdown Dividers

### Why
- Dropdown divider rows should separate the default `전체`/`모든 진영` options from selectable category groups.

### Changed
- Moved the `분류` divider directly under `전체`.
- Moved the `진영` divider directly under `모든 진영`.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Refine Filter Panel Grouping

### Why
- Broad classification and collab faction options should be visually separated from detailed options in the filter dropdowns.
- Research ships need a quick one-click filter separate from general rarity/faction filters.

### Changed
- Added a disabled divider in the `분류` dropdown between `후열` and detailed ship type categories.
- Added a disabled divider in the `진영` dropdown between `기타` and collab factions.
- Added a `연구함만` filter toggle for SP/research ships.
- Renamed the reset action from `초기화` to `필터 초기화`.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Frontline Backline Classification Filter

### Why
- The ship classification filter should support broad frontline/backline views using the same grouping shown in fleet tech candidate rows.

### Changed
- Added `전열` and `후열` options to the `분류` filter.
- Matched `전열` against `구축`, `경순`, `중순`, `대형순`, and `운송`.
- Matched `후열` against `순전`, `전함`, `경항모`, `항모`, `항전`, `공작`, and `모니터`.
- Shared the same position classification helper with the fleet tech candidate popup.
- Kept the existing detailed classification options and their behavior intact.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Convert Row Status Buttons To Dropdowns

### Why
- Repeated cycle buttons in the character table made status editing less direct and harder to scan.
- Status fields should allow selecting the intended value without stepping through intermediate states.

### Changed
- Replaced row status cycle buttons with compact dropdown controls.
- Applied the dropdown control to remodel, keel, acquisition/growth, skill, affection, and equipment status fields.
- Preserved the existing color coding for each selected status value.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Fleet Tech Candidate Position Column

### Why
- Candidate rows should show whether a ship belongs to the frontline, backline, or other category before choosing a growth target.

### Changed
- Added a `구분` column after `등급` in the fleet tech candidate popup.
- Classified `구축`, `경순`, `중순`, `대형순`, and `운송` as `전열`.
- Classified `순전`, `전함`, `경항모`, `항모`, `항전`, `공작`, and `모니터` as `후열`.
- Classified `잠수`, `잠항모`, and `범선` as `기타`.
- Added regression coverage for candidate position classification.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Compact Fleet Tech Candidate Popup

### Why
- The candidate preview panel occupied too much vertical space for the amount of information it showed.
- Candidate rows should appear near the clicked `후보 보기` button and keep UR/SSR and SR/R/N columns aligned.

### Changed
- Replaced the full-width inline candidate panel with a compact popup anchored below the clicked `후보 보기` button.
- Merged UR/SSR and SR/R/N candidate groups into one fixed-layout table with group divider rows.
- Limited the popup height with internal scrolling so it does not push the rest of the stats area down.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Fleet Tech Candidate Preview

### Why
- The next-level progress panel should connect directly to actionable ship candidates.
- Candidate ordering needs to prioritize high tech point recovery without pretending that unavailable ships can be acquired immediately.

### Changed
- Added a `후보 보기` button for each USS/HMS/IJN/KMS tech point row.
- Added an inline candidate panel showing `함선`, `등급`, `현재 상태`, `획득`, `풀돌`, `120`, and `획득 가능 기술점수`.
- Calculated remaining obtainable tech points from unfinished milestones.
- Sorted candidates by rarity group first (`UR/SSR` before `SR/R/N`), then remaining tech points, fewer remaining stages, rarity, and name.
- Added regression coverage for faction matching, candidate exclusion, grouping, and sorting.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Add Fleet Tech Next Level Progress

### Why
- The major faction tech panel should help decide which faction is close to its next fleet tech level, not just show the current point total.
- Users need to see the current level and remaining points together while planning growth.

### Changed
- Added fleet tech progress calculation with current level, next level, remaining points, and max-level detection.
- Updated the acquired tech point panel to show `진영 | Lv | 점수 | 다음` for USS/HMS/IJN/KMS.
- Added regression tests for next-level and max-level progress calculation.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Show Carrier ASW And Fleet Tech Levels

### Why
- Carrier ASW does not appear on the in-game effect screen, but it is still real fleet tech stat data and should remain visible in the tracker.
- The major faction tech point panel should show the current fleet tech level reached by each faction's owned tech points.

### Changed
- Restored `항모` `대잠` aggregation in additional stat totals.
- Preserved CSV-provided `정규항모` ASW targets when the official source only lists `경항모`, so hidden carrier ASW still appears in the tracker.
- Added current fleet tech level calculation for USS/HMS/IJN/KMS tech point totals.
- Displayed each major faction's current `Lv.` between the faction label and acquired tech point total.
- Updated stat diagnostics and regression tests to keep carrier ASW visible.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-07 - Reconcile In-Game Additional Stat Totals

### Why
- The additional stat totals needed to match the in-game fleet tech effect screen exactly.
- Several imported CSV stat rows differed from the raw KR `AzurLaneData` fleet tech source.
- Fleet tech level bonus rows can include multiple internal ship type ids that collapse to one displayed ship type, which could overcount after label normalization.

### Changed
- Updated the tech data import script to prefer `AzurLaneData/KR/ShareCfg/fleet_tech_ship_template.json` for ship tech points and additional stat grants when a `gid` match exists.
- Re-imported character tech data from the official source, leaving CSV as a fallback for unmatched rows.
- Deduplicated normalized fleet tech level bonuses per faction level so internal aliases like missile destroyer ids do not double-count under `구축`.
- Normalized `공작함` to the in-game stat label `공작`.
- Excluded carrier `대잠` from the displayed `항모` total to match the in-game effect screen behavior.
- Added diagnostic scripts for comparing app data against the official fleet tech source and the current in-game stat totals.

### Verified
- `node scripts/diagnose-tech-source.mjs`
- `node scripts/diagnose-stat-mismatch.mjs 참고용/검산용.json`
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Match In-Game Fleet Tech Stat Totals

### Why
- The in-game fleet tech effect screen includes major faction fleet tech level bonuses in addition to ship acquisition and Lv.120 bonuses.
- The app previously showed only ship acquisition/Lv.120 totals, so displayed stat totals were lower than in-game values.
- Some CSV records contain quoted newlines, which caused ships such as `소비에츠카야 벨로루시아` to miss tech point/stat data during import.

### Changed
- Added fleet tech level bonus data derived from the KR `fleet_tech_template` reference.
- Updated the stat summary to show the in-game style total: acquisition + Lv.120 + fleet tech level.
- Fixed the tech CSV importer to keep quoted multiline records intact.
- Re-ran tech data import so `소비에츠카야 벨로루시아` receives its missing tech point/stat data.

### Verified
- `npm.cmd run test`
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Clarify Firefox Backup Export Fallback

### Why
- Firefox does not support `showSaveFilePicker`, so the app cannot directly open a folder/name save dialog there.
- The backup export message should explain why Firefox still uses the browser download flow.

### Changed
- Updated the Firefox/unsupported-browser fallback message to point users to the browser download setting that asks where to save files.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Add Save-As Backup Export

### Why
- Browser downloads do not reliably show where a backup file was saved.
- Users should be able to choose the backup folder and JSON filename when the browser supports the File System Access API.

### Changed
- Updated backup export to use the browser save dialog when `showSaveFilePicker` is available.
- Kept the existing automatic download behavior as a fallback for unsupported browsers.
- Added cancel handling so closing the save dialog does not create a fallback duplicate download.

### Verified
- `npm.cmd run lint`
- `npm.cmd run build`

## 2026-06-06 - Normalize Additional Stat Ship Type Labels

### Why
- Additional stat totals were keyed by CSV source labels such as `정규항모`, so selecting the in-game label `항모` could show no data.
- The additional stat dropdown should follow the in-game effect screen labels and order instead of the raw CSV labels.

### Changed
- Updated the additional stat ship type dropdown to the in-game order: `구축`, `경순`, `중순`, `대형순`, `순전`, `전함`, `경항모`, `항모`, `잠수`, `항전`, `공작`, `모니터`, `잠항모`, `운송`, `범선`.
- Added stat-target label normalization such as `정규항모 -> 항모`, `초순/대순 -> 대형순`, `잠수항모/잠순 -> 잠항모`, and `운송함/보급 -> 운송`.
- Added regression coverage so multi-target stat entries are deduplicated after label normalization.

### Verified
- `node src/utils/rosterStats.test.mjs`
- `npm.cmd run lint`
- `npm.cmd run build`

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
- Utawarerumono collaboration icons were missing from the local `AzurLane` image data and needed a compatible fallback source.

### Changed
- Added a local icon sync script that copies ship icons from `참고용/AzurLane` into `public/ship-icons`.
- Added fixed skin-ID handling for `Z031` through `Z036` using the `JforPlay/data_for_toy` icon source.
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
- The project direction was clarified as a tool specialized for owned-ship growth and fleet optimization.
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
