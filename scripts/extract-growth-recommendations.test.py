import sys

sys.dont_write_bytecode = True

from lib.growth_name_matching import (
    build_name_keys,
    normalize_growth_source_name,
    uses_unique_equipment,
)
from lib.growth_sheet_selection import find_sheet


class Worksheet:
    def __init__(self, title):
        self.title = title


class Workbook:
    def __init__(self, titles):
        self.worksheets = [Worksheet(title) for title in titles]


workbook = Workbook([
    "앞에 추가된 시트",
    "   인식각성 추천표(메인해역)",
    "인식각성 추천표(대작전)",
    "맨땅뉴비 추천 함순이표",
])

assert find_sheet(workbook, "인식각성 추천표(메인해역)").title == "   인식각성 추천표(메인해역)"
assert find_sheet(workbook, "인식각성 추천표(대작전)").title == "인식각성 추천표(대작전)"
assert find_sheet(workbook, "맨땅뉴비 추천 함순이표").title == "맨땅뉴비 추천 함순이표"

try:
    find_sheet(workbook, "없는 시트")
except KeyError as error:
    assert "없는 시트" in str(error)
else:
    raise AssertionError("없는 시트 이름은 실패해야 합니다.")

assert normalize_growth_source_name("아마기") == "아마기"
assert normalize_growth_source_name("아마기(항모)") == "아마기(항모)"
assert normalize_growth_source_name("아마기(항공모함)") == "아마기(항모)"
assert normalize_growth_source_name("카가") == "카가"
assert normalize_growth_source_name("카가(전함)") == "카가(전함)"
assert normalize_growth_source_name("카가 (전함)") == "카가(전함)"
assert normalize_growth_source_name("론") == "론"
assert normalize_growth_source_name("론(μ장비)") == "론(μ장비)"
assert normalize_growth_source_name("론 (μ장비)") == "론(μ장비)"
assert normalize_growth_source_name("가스코뉴 (µ장비)") == "가스코뉴(μ장비)"
assert normalize_growth_source_name("카스미 (콜)") == "카스미 (콜라보)"
assert normalize_growth_source_name("호무라(콜)") == "호무라(콜라보)"
assert normalize_growth_source_name("유미아 (콜라보)") == "유미아 (콜라보)"
assert normalize_growth_source_name("쿠니베르티 (용골)") == "비토리오 쿠니베르티 (용골)"
assert uses_unique_equipment("유키카제 (전장)") is True
assert uses_unique_equipment("포미더블（전장）") is True
assert uses_unique_equipment("유키카제") is False
assert uses_unique_equipment("론(μ장비)") is False
assert uses_unique_equipment("전장 지원") is False

assert uses_unique_equipment("\ud6c4\ubd80\ud0a4 (\uc804\uc7a5, \uad6c\ucd95)") is True
assert build_name_keys("\uce74\uc2a4\ubbf8(\ucf5c)")[0] == "\uce74\uc2a4\ubbf8(\ucf5c\ub77c\ubcf4)"
assert build_name_keys("\uce74\uc640\uce74\uc81c (META)")[1] == "\uce74\uc640\uce74\uc81cMETA"

import importlib.util
from pathlib import Path
import openpyxl

spec = importlib.util.spec_from_file_location("growth_extractor", Path(__file__).with_name("extract-growth-recommendations.py"))
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)
fixture = openpyxl.Workbook()
ws = fixture.active
ws.title = "인식각성 추천표(메인해역)"
ws.append(["최신화 날짜: 2026/10/11"])
ws.append(["메인\n밀기용", "후열 기함", "후열 힐러", "전열 선봉", "전열 나머지 2자리\n딜러 / 대공", "잠수함", "지원 항모"])
ws.append(["SS 급", None, None, None, None, None, "지원항모 편성 예시\n새 원본의 안내문은 임의의 등급을 부여하지 않고 원문 그대로 보존해야 합니다."])
ws.append([None, "무사시", "미출시함", "라피 II", "타이거", "이404"])
ws.append([None, "후열 보호", None, "탱킹", "딜러", "지원"])
ws.append(["메인\n쫄작용", "후열 기함", "후열 힐러", "전열 선봉", "잠수함"])
ws.append(["S 급"])
ws.append([None, "무사시"])
ws.append([None, "후열 보호"])
ws.append(["추천편성\n예시"])
ws.append([None, "무사시", "타이거"])
characters = {name: {"id": index, "name": name, "rarity": "UR", "faction": "test", "shipType": "전함"} for index, name in enumerate(["무사시", "라피Ⅱ", "타이거", "이404"], 1)}
for character in list(characters.values()):
    for key in build_name_keys(character["name"]):
        characters.setdefault(key, character)
result = extractor.extract_source(fixture, extractor.SOURCES[0], characters)
assert result["updatedAt"] == "2026-10-11"
assert len(result["recommendations"]) == 5, result["recommendations"]
assert result["recommendations"][0]["sheetGroup"] == "후열 기함"
assert result["recommendations"][0]["sheetSection"] == "메인 밀기용"
assert result["recommendations"][-1]["sheetSection"] == "메인 쫄작용"
assert result["recommendations"][-1]["tier"] == "S"
assert result["excludedFromRow"] == 10
assert not any(item["name"] == "미출시함" for item in result["recommendations"])
assert any(item["name"] == "미출시함" for item in result["unmatched"])
assert result["sourceGuidance"][0]["sheetGroup"] == "지원 항모"
assert result["sourceGuidance"][0]["text"].startswith("지원항모 편성 예시")
assert extractor.find_tier({(3, 1): "SS 급"}, 7, minimum_row=6) == "", "새 섹션에 이전 섹션의 등급이 흘러들면 안 됩니다."
assert extractor.NAME_ALIASES["다빈치"] == "레오나르도 다 빈치"
assert extractor.match_character("카스미(콜)", {"카스미(콜라보)": {"id": "Z063"}})["id"] == "Z063"

print("growth recommendation sheet selection and role section tests passed")
