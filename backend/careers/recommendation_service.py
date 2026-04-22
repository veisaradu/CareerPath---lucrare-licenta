import logging
from .models import CV, Job, Recommendation
from .ai_service import call_groq

logger = logging.getLogger(__name__)


def _skills_match(cv_skills: set, job_skill_name: str) -> bool:
    job_skill_lower = job_skill_name.lower()
    return any(
        cv_skill in job_skill_lower or job_skill_lower in cv_skill
        for cv_skill in cv_skills
    )


def generate_recommendations(user) -> list:
    cv = CV.objects.filter(
        user=user, is_active=True, is_processed=True
    ).first()
    if not cv:
        logger.warning("No active processed CV for user %s", user)
        return []

    cv_skills = {
        s["name"].lower()
        for s in (cv.extracted_skills_json or [])
    }
    if not cv_skills:
        logger.warning("No skills extracted for user %s", user)
        return []

    jobs = Job.objects.filter(is_active=True).prefetch_related(
        "required_skills", "preferred_skills"
    )

    results = []
    for job in jobs:
        required_raw = list(job.required_skills.all())
        preferred_raw = list(job.preferred_skills.all())

        if not required_raw:
            continue

        matched_req = [s.name for s in required_raw if _skills_match(cv_skills, s.name)]
        matched_pref = [s.name for s in preferred_raw if _skills_match(cv_skills, s.name)]
        gap = [s.name for s in required_raw if not _skills_match(cv_skills, s.name)]

        matched = matched_req + matched_pref
        score = round((len(matched_req) / len(required_raw)) * 100, 1) if required_raw else 0

        if score < 10:
            continue

        explanation = _get_explanation(job, matched, gap, score)

        rec, _ = Recommendation.objects.update_or_create(
            user=user,
            job=job,
            cv=cv,
            defaults={
                "match_score": score,
                "matched_skills_json": matched,
                "skill_gap_json": gap,
                "explanation": explanation,
            },
        )
        results.append(rec)

    return sorted(results, key=lambda r: r.match_score, reverse=True)


def _get_explanation(job, matched: list, gap: list, score: float) -> str:
    prompt = f"""
Job: {job.title} la {job.company_name or "o companie"}
Scor potrivire: {score}%
Skilluri potrivite: {", ".join(matched) or "niciunul"}
Skilluri lipsa: {", ".join(gap) or "niciunul"}

Scrie o explicatie scurta (2-3 propozitii) in romana de ce acest job
este sau nu potrivit pentru candidat. Fii direct si concis.
"""
    try:
        return call_groq([{"role": "user", "content": prompt}])
    except Exception as e:
        logger.error("Groq explanation failed: %s", e)
        return (
            f"Scor de potrivire: {score}%. "
            f"Skilluri lipsa: {', '.join(gap) or 'niciunul'}."
        )