import sys

sys.dont_write_bytecode = True

from lib.growth_name_matching import normalize_growth_source_name
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

print("growth recommendation sheet selection tests passed")
