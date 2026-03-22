import json
import re
from pathlib import Path

_SKILLS_PATH = Path(__file__).parent / "data" / "skills.json"
with open(_SKILLS_PATH, "r", encoding="utf-8") as f:
    _SKILLS_DATA: dict[str, list[str]] = json.load(f)

_ALL_SKILLS: list[tuple[str, str]] = []
for category, skills in _SKILLS_DATA.items():
    for skill in skills:
        _ALL_SKILLS.append((skill, category))


def match_skills(text: str) -> list[dict]:
    """
    Returns list of matched skills:
    [{"name": "Python", "category": "programming_languages"}]
    """
    text_lower = text.lower()
    matched = []
    seen = set()

    for skill_name, category in _ALL_SKILLS:
        pattern = r"\b" + re.escape(skill_name.lower()) + r"\b"
        if re.search(pattern, text_lower):
            if skill_name not in seen:
                seen.add(skill_name)
                matched.append({
                    "name": skill_name,
                    "category": category,
                })

    return matched