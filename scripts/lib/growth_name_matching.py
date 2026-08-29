import re
import unicodedata


SOURCE_NAME_ALIASES = {
    "아마기(항공모함)": "아마기(항모)",
    "쿠니베르티 (용골)": "비토리오 쿠니베르티 (용골)",
}

IDENTITY_QUALIFIER_ALIASES = {
    "\ucf5c": "\ucf5c\ub77c\ubcf4",
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


def build_name_keys(value):
    normalized = normalize_growth_source_name(value).strip()
    normalized = re.sub(
        r"\(([^)]*)\)",
        lambda match: "(" + ",".join(
            IDENTITY_QUALIFIER_ALIASES.get(token.strip(), token.strip())
            for token in re.split(r"[,/]", match.group(1))
            if token.strip()
        ) + ")",
        normalized,
    )
    compact_qualified = re.sub(r"[^0-9A-Za-z\uac00-\ud7a3\u03bc]", "", normalized)
    without_parentheses = re.sub(r"\s*\([^)]*\)\s*", "", normalized).strip()
    compact_base = (
        without_parentheses.replace(" ", "")
        .replace("\u2161", "II")
        .replace("\u2162", "III")
        .replace("\u2163", "IV")
        .replace("\u2164", "V")
    )
    return list(dict.fromkeys(
        key for key in [normalized, compact_qualified, without_parentheses, compact_base] if key
    ))


def uses_unique_equipment(name):
    normalized = unicodedata.normalize("NFKC", str(name or ""))
    return any(
        token.strip() == "\uc804\uc7a5"
        for group in re.findall(r"\(([^)]*)\)", normalized)
        for token in re.split(r"[,/]", group)
    )
