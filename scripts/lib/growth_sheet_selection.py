def clean_sheet_name(value):
    return str(value or "").strip()


def find_sheet(workbook, sheet_name):
    expected = clean_sheet_name(sheet_name)
    for worksheet in workbook.worksheets:
        if clean_sheet_name(worksheet.title) == expected:
            return worksheet
    available = ", ".join(
        repr(clean_sheet_name(worksheet.title))
        for worksheet in workbook.worksheets
    )
    raise KeyError(
        f"추천표 시트를 찾지 못했습니다: {sheet_name!r} (현재 시트: {available})"
    )
