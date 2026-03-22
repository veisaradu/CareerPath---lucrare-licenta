import re


_EXPERIENCE_KEYWORDS = [
    "experience", "work", "employment", "career", "job",
    "position", "role", "intern", "developer", "engineer",
    "analyst", "manager", "consultant",
]

_DURATION_PATTERN = re.compile(
    r"(\b\d{4}\b[\s\-–]+(?:\b\d{4}\b|present|current|now))",
    re.IGNORECASE,
)


def parse_experience(text: str) -> list[dict]:
    """
    Returns a list of experience entries (best effort):
    [{"role": "...", "company": "...", "duration": "..."}]
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    entries = []
    current_entry: dict | None = None

    for i, line in enumerate(lines):
        duration_match = _DURATION_PATTERN.search(line)

        if duration_match:
            if current_entry:
                entries.append(current_entry)
            current_entry = {
                "role": lines[i - 1] if i > 0 else "",
                "company": "",
                "duration": duration_match.group(0).strip(),
            }
        elif current_entry and not current_entry["company"] and line:
            current_entry["company"] = line

    if current_entry:
        entries.append(current_entry)

    return entries[:10]  