import re
import unicodedata


SOURCE_NAME_ALIASES = {
    "아마기(항공모함)": "아마기(항모)",
}


def normalize_growth_source_name(name):
    normalized = unicodedata.normalize("NFKC", str(name or ""))
    normalized = re.sub(r"\(\s*콜\s*\)", "(콜라보)", normalized)
    normalized = re.sub(
        r"\s+\(\s*(항모|항공모함|전함|μ장비)\s*\)",
        r"(\1)",
        normalized,
    )
    return SOURCE_NAME_ALIASES.get(normalized, normalized)


def uses_unique_equipment(name):
    normalized = unicodedata.normalize("NFKC", str(name or ""))
    return bool(re.search(r"\(\s*전장\s*\)", normalized))
