SOURCE_NAME_ALIASES = {
    "아마기(항공모함)": "아마기(항모)",
}


def normalize_growth_source_name(name):
    return SOURCE_NAME_ALIASES.get(name, name)
