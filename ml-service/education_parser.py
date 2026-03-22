import re

_DEGREE_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate", "associate",
    "diploma", "licență", "masterat", "doctorat", "inginer",
    "bsc", "msc", "mba", "b.sc", "m.sc",
]

_DURATION_PATTERN = re.compile(
    r"(\b\d{4}\b[\s\-–]+(?:\b\d{4}\b|present|current))",
    re.IGNORECASE,
)


def parse_education(text: str) -> list[dict]:
    """
    Returns a list of education entries:
    [{"degree": "...", "institution": "...", "duration": "..."}]
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    entries = []

    for i, line in enumerate(lines):
        line_lower = line.lower()
        is_degree_line = any(kw in line_lower for kw in _DEGREE_KEYWORDS)

        if is_degree_line:
            duration = ""
            institution = ""

            for j in range(i + 1, min(i + 4, len(lines))):
                dur_match = _DURATION_PATTERN.search(lines[j])
                if dur_match and not duration:
                    duration = dur_match.group(0).strip()
                elif not institution and lines[j]:
                    institution = lines[j]

            entries.append({
                "degree": line,
                "institution": institution,
                "duration": duration,
            })

    return entries[:5] 