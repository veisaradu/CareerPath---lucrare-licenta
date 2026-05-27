import logging
import re
from .models import CV, Job, Recommendation
from .ai_service import call_groq
from users.models import UserSkillProficiency, UserProfile

logger = logging.getLogger(__name__)


def _skills_match(cv_skills: set, job_skill_name: str) -> bool:
    job_skill_lower = job_skill_name.lower()
    return any(
        cv_skill in job_skill_lower or job_skill_lower in cv_skill
        for cv_skill in cv_skills
    )


def _estimate_years_from_cv(cv) -> int:
    if not cv or not cv.extracted_experience_json:
        return 0
    total = 0
    for entry in cv.extracted_experience_json:
        duration = str(entry.get('duration', ''))
        match = re.search(r'(\d{4})\s*[-–]\s*(\d{4}|present|current)', duration, re.IGNORECASE)
        if match:
            start = int(match.group(1))
            end_str = match.group(2)
            end = 2025 if end_str.lower() in ('present', 'current') else int(end_str)
            total += max(0, end - start)
    return total


def _experience_level_from_years(years: int) -> str:
    if years >= 5:
        return Job.ExperienceLevel.SENIOR
    if years >= 2:
        return Job.ExperienceLevel.MID
    return Job.ExperienceLevel.ENTRY


def _profile_bonus(job, profile, preferred_category_ids: set, desired_role: str,
                   user_location: str, interests_keywords: set, effective_exp_years: int) -> float:
    bonus = 0.0

    if preferred_category_ids and job.category_id in preferred_category_ids:
        bonus += 5

    if desired_role and any(word in job.title.lower() for word in desired_role.split()):
        bonus += 5

    if _experience_level_from_years(effective_exp_years) == job.experience_level:
        bonus += 5

    if user_location and job.location and user_location in job.location.lower():
        bonus += 2

    if interests_keywords and job.category:
        category_lower = job.category.name.lower()
        title_lower = job.title.lower()
        if any(kw in category_lower or kw in title_lower for kw in interests_keywords):
            bonus += 2

    if profile.open_to_remote and job.is_remote:
        bonus += 1

    return bonus


def generate_recommendations(user) -> list:
    cv = CV.objects.filter(
        user=user, is_active=True, is_processed=True
    ).first()

    cv_skills = {
        s["name"].lower()
        for s in (cv.extracted_skills_json or [])
    } if cv else set()

    manual_skills = {
        usp.skill.name.lower()
        for usp in UserSkillProficiency.objects.filter(user=user).select_related("skill")
    }

    all_skills = cv_skills | manual_skills
    if not all_skills:
        logger.warning("No skills found for user %s", user)
        return []

    profile = None
    preferred_category_ids = set()
    desired_role = ''
    user_location = ''
    interests_keywords = set()
    effective_exp_years = 0

    try:
        profile = user.profile
        preferred_category_ids = set(
            profile.preferred_categories.values_list('id', flat=True)
        )
        desired_role = profile.desired_role.lower().strip()
        user_location = profile.location.lower().strip()
        interests_keywords = {
            kw.strip().lower()
            for kw in profile.interests.replace(';', ',').split(',')
            if kw.strip()
        }
        cv_exp_years = _estimate_years_from_cv(cv)
        effective_exp_years = max(profile.experience_years, cv_exp_years)
    except UserProfile.DoesNotExist:
        pass

    jobs = Job.objects.filter(is_active=True).prefetch_related(
        "required_skills", "preferred_skills"
    ).select_related("category")

    results = []
    for job in jobs:
        required_raw = list(job.required_skills.all())
        preferred_raw = list(job.preferred_skills.all())

        if not required_raw:
            continue

        matched_req = [s.name for s in required_raw if _skills_match(all_skills, s.name)]
        matched_pref = [s.name for s in preferred_raw if _skills_match(all_skills, s.name)]
        gap = [s.name for s in required_raw if not _skills_match(all_skills, s.name)]

        matched = matched_req + matched_pref
        score = round((len(matched_req) / len(required_raw)) * 100, 1) if required_raw else 0

        if score < 10:
            continue

        if profile:
            bonus = _profile_bonus(
                job, profile, preferred_category_ids, desired_role,
                user_location, interests_keywords, effective_exp_years
            )
            score = min(100.0, round(score + bonus, 1))

        explanation = _get_explanation(job, matched, gap, score, profile)

        rec, _ = Recommendation.objects.update_or_create(
            user=user,
            job=job,
            defaults={
                "cv": cv,
                "match_score": score,
                "matched_skills_json": matched,
                "skill_gap_json": gap,
                "explanation": explanation,
            },
        )
        results.append(rec)

    return sorted(results, key=lambda r: r.match_score, reverse=True)


def _get_explanation(job, matched: list, gap: list, score: float, profile=None) -> str:
    profile_context = ""
    if profile:
        parts = []
        if profile.desired_role:
            parts.append(f"desired role: {profile.desired_role}")
        if profile.location:
            parts.append(f"location preference: {profile.location}")
        if profile.open_to_remote:
            parts.append("open to remote")
        if parts:
            profile_context = "\nCandidate preferences: " + ", ".join(parts) + "."

    prompt = f"""
Job: {job.title} at {job.company_name or "a company"}
Match score: {score}%
Matched skills: {", ".join(matched) or "none"}
Missing skills: {", ".join(gap) or "none"}{profile_context}

Write a short explanation (2-3 sentences) in English of why this job
is or is not a good fit for the candidate. Be direct and concise.
"""
    try:
        return call_groq([{"role": "user", "content": prompt}])
    except Exception as e:
        logger.error("Groq explanation failed: %s", e)
        return (
            f"Match score: {score}%. "
            f"Missing skills: {', '.join(gap) or 'none'}."
        )
