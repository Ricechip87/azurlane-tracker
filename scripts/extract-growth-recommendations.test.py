import sys

sys.dont_write_bytecode = True

from lib.growth_name_matching import (
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
assert uses_unique_equipment("유키카제 (전장)") is True
assert uses_unique_equipment("포미더블（전장）") is True
assert uses_unique_equipment("유키카제") is False
assert uses_unique_equipment("론(μ장비)") is False
assert uses_unique_equipment("전장 지원") is False

print("growth recommendation sheet selection tests passed")
