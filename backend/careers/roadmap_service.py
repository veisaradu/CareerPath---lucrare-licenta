import json
import logging
from .models import Recommendation, Roadmap
from .ai_service import call_groq

logger = logging.getLogger(__name__)


def generate_roadmap(user, recommendation: Recommendation) -> Roadmap | None:
    gap = recommendation.skill_gap_json
    if not gap:
        logger.warning("No skill gap for recommendation %s", recommendation.id)
        return None

    steps = _get_steps(recommendation, gap)
    total_hours = sum(s.get("estimated_hours", 0) for s in steps)

    Roadmap.objects.filter(
        user=user, target_job=recommendation.job, is_active=True
    ).update(is_active=False)

    roadmap = Roadmap.objects.create(
        user=user,
        target_job=recommendation.job,
        recommendation=recommendation,
        steps_json=steps,
        estimated_total_hours=total_hours,
        is_active=True,
    )
    return roadmap


def _get_steps(recommendation: Recommendation, gap: list) -> list:
    prompt = f"""
Target job: {recommendation.job.title}
Skills the candidate needs to learn: {", ".join(gap)}

Generate a structured learning plan. Return ONLY valid JSON,
no extra text, no markdown, no ```, just the JSON array:
[
  {{
    "order": 1,
    "skill": "SkillName",
    "action": "Concrete action the candidate should take",
    "resource_url": "https://...",
    "estimated_hours": 20,
    "priority": "high"
  }}
]
Rules:
- priority must be one of: high, medium, low
- maximum 8 steps
- resource_url must be a real and relevant link
- estimated_hours must be realistic
"""
    try:
        raw = call_groq([{"role": "user", "content": prompt}], temperature=0.2)
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON array found in response")
        steps = json.loads(raw[start:end])
        return steps
    except Exception as e:
        logger.error("Groq roadmap generation failed: %s", e)
        return [
            {
                "order": i + 1,
                "skill": skill,
                "action": f"Learn {skill} through online courses and practice projects",
                "resource_url": f"https://www.google.com/search?q={skill}+tutorial",
                "estimated_hours": 10,
                "priority": "high",
            }
            for i, skill in enumerate(gap[:8])
        ]